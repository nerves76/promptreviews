/**
 * Migrate Static Documentation Pages to CMS
 *
 * This script reads all static .tsx documentation pages and imports them
 * into the articles database table for the CMS system.
 *
 * Usage:
 *   npx ts-node scripts/migrate-static-docs-to-cms.ts
 *
 * Requirements:
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 * - Static docs must be in docs-promptreviews/docs-site/src/app/
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { glob as globSync } from 'glob';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// TYPES
// ============================================================================

interface ArticleMetadata {
  title?: string;
  description?: string;
  keywords?: string | string[];
  category?: string;
  available_plans?: string[];
}

interface ExtractedArticle {
  slug: string;
  title: string;
  content: string;
  metadata: ArticleMetadata;
  status: 'published' | 'draft';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract metadata from Next.js metadata export
 */
function extractMetadata(fileContent: string): ArticleMetadata {
  const metadata: ArticleMetadata = {};

  // Extract title
  const titleMatch = fileContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
  if (titleMatch) {
    metadata.title = titleMatch[1].replace(/\s*\|.*$/, '').trim(); // Remove " | Prompt Reviews" suffix
  }

  // Extract description
  const descMatch = fileContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
  if (descMatch) {
    metadata.description = descMatch[1];
  }

  // Extract keywords (can be string or array)
  const keywordsMatch = fileContent.match(/keywords:\s*(\[[\s\S]*?\]|['"`][^'"`]+['"`])/);
  if (keywordsMatch) {
    const keywordsStr = keywordsMatch[1];
    if (keywordsStr.startsWith('[')) {
      // Array format
      const arrayMatch = keywordsStr.match(/['"`]([^'"`]+)['"`]/g);
      if (arrayMatch) {
        metadata.keywords = arrayMatch.map(k => k.replace(/['"`]/g, ''));
      }
    } else {
      // String format
      metadata.keywords = keywordsStr.replace(/['"`]/g, '');
    }
  }

  return metadata;
}

/**
 * Convert JSX content to markdown
 * This is a basic converter - handles common patterns
 */
function jsxToMarkdown(jsx: string): string {
  let markdown = jsx;

  // Remove JSX className attributes
  markdown = markdown.replace(/className="[^"]*"/g, '');
  markdown = markdown.replace(/className={[^}]*}/g, '');

  // Convert h1 tags
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1');

  // Convert h2 tags
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/g, '\n## $1\n');

  // Convert h3 tags
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/g, '\n### $1\n');

  // Convert h4 tags
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/g, '\n#### $1\n');

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '\n$1\n');

  // Convert strong/bold
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**');

  // Convert links
  markdown = markdown.replace(/<Link[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/Link>/g, '[$2]($1)');
  markdown = markdown.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g, '[$2]($1)');

  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/g);
    if (items) {
      return items.map((item: string) => {
        const text = item.replace(/<li[^>]*>(.*?)<\/li>/, '$1').trim();
        return `- ${text}`;
      }).join('\n');
    }
    return match;
  });

  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
    const items = content.match(/<li[^>]*>(.*?)<\/li>/g);
    if (items) {
      return items.map((item: string, index: number) => {
        const text = item.replace(/<li[^>]*>(.*?)<\/li>/, '$1').trim();
        return `${index + 1}. ${text}`;
      }).join('\n');
    }
    return match;
  });

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Clean up multiple newlines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Decode HTML entities
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  return markdown.trim();
}

/**
 * Extract main content from page component
 */
function extractContent(fileContent: string): string {
  // Try to find the return statement with JSX
  const returnMatch = fileContent.match(/return\s*\(([\s\S]*?)\);?\s*}/);

  if (!returnMatch) {
    return '';
  }

  let jsx = returnMatch[1];

  // Remove outer div/DocsLayout wrapper
  jsx = jsx.replace(/<DocsLayout[^>]*>/g, '');
  jsx = jsx.replace(/<\/DocsLayout>/g, '');
  jsx = jsx.replace(/^<div[^>]*>/, '');
  jsx = jsx.replace(/<\/div>\s*$/, '');

  // Remove breadcrumbs section
  jsx = jsx.replace(/{\/\*\s*Breadcrumb\s*\*\/}[\s\S]*?<\/div>/g, '');
  jsx = jsx.replace(/\/\*\s*Breadcrumb\s*\*\/[\s\S]*?<\/div>/g, '');

  // Remove "Related Features" or similar footer sections
  jsx = jsx.replace(/{\/\*\s*Related.*?\*\/}[\s\S]*$/g, '');

  // Convert to markdown
  return jsxToMarkdown(jsx);
}

/**
 * Generate slug from file path
 */
function getSlugFromPath(filePath: string): string {
  // Remove the base path and page.tsx
  const relativePath = filePath
    .replace(/.*docs-site\/src\/app\//, '')
    .replace(/\/page\.tsx$/, '');

  // Root page becomes 'home'
  if (relativePath === '' || relativePath === 'page') {
    return 'home';
  }

  return relativePath;
}

/**
 * Parse a single static page file
 */
function parseStaticPage(filePath: string): ExtractedArticle | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const slug = getSlugFromPath(filePath);
    const metadata = extractMetadata(fileContent);
    const content = extractContent(fileContent);

    if (!metadata.title) {
      console.warn(`⚠️  No title found for ${slug}, skipping...`);
      return null;
    }

    if (!content || content.length < 50) {
      console.warn(`⚠️  Insufficient content for ${slug}, skipping...`);
      return null;
    }

    return {
      slug,
      title: metadata.title,
      content,
      metadata,
      status: 'published'
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function migrateStaticDocs() {
  console.log('🚀 Starting static docs migration to CMS...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Check .env.local file.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find all static page files
  const docsBasePath = path.resolve(process.cwd(), 'docs-promptreviews/docs-site/src/app');

  console.log(`📁 Scanning for static pages in: ${docsBasePath}\n`);

  const pattern = path.join(docsBasePath, '**/page.tsx');
  const files = globSync(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/docs/[slug]/**', // Ignore the dynamic route
    ]
  });

  console.log(`📄 Found ${files.length} static page files\n`);

  // Stats
  let importCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let updateCount = 0;

  // Process each file
  for (const filePath of files) {
    const article = parseStaticPage(filePath);

    if (!article) {
      skipCount++;
      continue;
    }

    console.log(`\n📝 Processing: ${article.slug}`);
    console.log(`   Title: ${article.title}`);
    console.log(`   Content length: ${article.content.length} chars`);

    // Check if article already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id, slug')
      .eq('slug', article.slug)
      .single();

    if (existing) {
      // Update existing article
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   🔄 Updated existing article`);
        updateCount++;
      }
    } else {
      // Insert new article
      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          slug: article.slug,
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          published_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`   ❌ Error inserting: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Created new article`);
        importCount++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Articles created: ${importCount}`);
  console.log(`🔄 Articles updated: ${updateCount}`);
  console.log(`⏭️  Articles skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (importCount > 0 || updateCount > 0) {
    console.log('🎉 Migration completed successfully!');
    console.log('\n📍 Next steps:');
    console.log('   1. Run: npx ts-node scripts/import-context-mappings.ts');
    console.log('   2. This will create route-to-article mappings for the help modal');
    console.log('   3. Test the help modal on various dashboard pages\n');
  } else {
    console.log('⚠️  No articles were migrated. Check the logs above for details.');
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

// Run the migration
migrateStaticDocs()
  .then(() => {
    console.log('\n✨ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed with error:');
    console.error(error);
    process.exit(1);
  });

export { migrateStaticDocs };
