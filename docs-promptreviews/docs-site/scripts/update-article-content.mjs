#!/usr/bin/env node

/**
 * Script to update article content in the CMS
 *
 * This fixes articles that were created with placeholder content by
 * extracting the real content from page.tsx files and updating the database.
 *
 * Usage: ADMIN_API_KEY=your_key node scripts/update-article-content.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://app.promptreviews.app';
const API_KEY = process.env.ADMIN_API_KEY;

if (!API_KEY) {
  console.error('Error: ADMIN_API_KEY environment variable is required');
  console.error('Usage: ADMIN_API_KEY=your_key node scripts/update-article-content.mjs');
  process.exit(1);
}

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
 * Update article content via API
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

  // Update via API
  const url = `${MAIN_APP_URL}/api/admin/help-content/${slug}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        content: markdown,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error || response.statusText}`);
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

  // Fetch all articles from the API
  console.log('Fetching articles from CMS...');
  const listResponse = await fetch(`${MAIN_APP_URL}/api/admin/help-content`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error('Failed to fetch articles');
  }

  const { articles } = await listResponse.json();
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
