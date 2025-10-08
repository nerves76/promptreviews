#!/usr/bin/env node

/**
 * Script to update article content in the CMS
 *
 * This fixes articles that were created with placeholder content by
 * extracting the real content from page.tsx files and updating the database.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/update-article-content.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltneloufqjktdplodvao.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/update-article-content.mjs');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Extract the actual content from a page.tsx file
 */
async function extractPageMarkdown(pagePath) {
  const fullPath = path.join(__dirname, '..', 'src', 'app', pagePath, 'page.tsx');

  try {
    const content = await fs.readFile(fullPath, 'utf-8');

    // Try to find MarkdownRenderer content prop or overviewContent
    let markdown = '';

    // First try to find content passed to MarkdownRenderer
    const markdownMatch = content.match(/content=\{`([\s\S]*?)`\}/);
    if (markdownMatch) {
      markdown = markdownMatch[1].trim();
    }

    // Try to find overviewContent variable
    if (!markdown) {
      const overviewMatch = content.match(/const overviewContent = \(([\s\S]*?)\);/);
      if (overviewMatch) {
        markdown = convertJSXToMarkdown(overviewMatch[1]);
      }
    }

    // Try to find markdown content in the return statement
    if (!markdown) {
      const returnMatch = content.match(/<MarkdownRenderer[\s\S]*?content=\{`([\s\S]*?)`\}/);
      if (returnMatch) {
        markdown = returnMatch[1].trim();
      }
    }

    return markdown || null;
  } catch (error) {
    console.error(`Error reading ${fullPath}:`, error.message);
    return null;
  }
}

/**
 * Convert simple JSX to markdown
 */
function convertJSXToMarkdown(jsx) {
  let markdown = jsx
    .replace(/<>\s*/g, '')
    .replace(/<\/>\s*/g, '')
    .replace(/<p className="[^"]*">/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<h1[^>]*>/g, '# ')
    .replace(/<\/h1>/g, '\n\n')
    .replace(/<h2[^>]*>/g, '## ')
    .replace(/<\/h2>/g, '\n\n')
    .replace(/<h3[^>]*>/g, '### ')
    .replace(/<\/h3>/g, '\n\n')
    .replace(/<h4[^>]*>/g, '#### ')
    .replace(/<\/h4>/g, '\n\n')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .replace(/<code[^>]*>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<pre[^>]*>/g, '\n```\n')
    .replace(/<\/pre>/g, '\n```\n')
    .replace(/<ul[^>]*>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<li[^>]*>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/<strong[^>]*>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em[^>]*>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/\{`([^`]+)`\}/g, '$1')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return markdown;
}

/**
 * Update article content via Supabase
 */
async function updateArticleContent(slug, pagePath) {
  console.log(`\nProcessing: ${slug}`);

  // Extract content from page.tsx
  const markdown = await extractPageMarkdown(pagePath);

  if (!markdown) {
    console.log(`  ⚠️  No content found in page.tsx, skipping`);
    return false;
  }

  console.log(`  ✓ Extracted ${markdown.length} characters of markdown`);

  // Update via Supabase
  try {
    const { error } = await supabase
      .from('articles')
      .update({ content: markdown })
      .eq('slug', slug);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`  ✅ Updated successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error updating '${slug}':`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting article content update...\n');

  // Fetch all articles from Supabase
  console.log('Fetching articles from CMS...');
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('slug, title, status')
    .order('slug', { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch articles: ${fetchError.message}`);
  }

  console.log(`Found ${articles.length} articles to process\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of articles) {
    // Convert slug to page path
    // e.g., "prompt-pages/features/emoji-sentiment" → "prompt-pages/features/emoji-sentiment"
    // e.g., "getting-started" → "getting-started"
    const pagePath = article.slug;

    const result = await updateArticleContent(article.slug, pagePath);

    if (result === true) {
      updated++;
    } else if (result === false) {
      skipped++;
    } else {
      failed++;
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⚠️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
