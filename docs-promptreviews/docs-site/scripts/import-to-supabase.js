#!/usr/bin/env node

/**
 * Import Extracted Articles to Supabase
 *
 * Loads extracted Markdown + JSON metadata into the articles table.
 *
 * Usage:
 *   node scripts/import-to-supabase.js [article-slug]
 *   node scripts/import-to-supabase.js getting-started
 *   node scripts/import-to-supabase.js --all  # Import all extracted articles
 *
 * Prerequisites:
 *   - Supabase local dev running: npx supabase start
 *   - Schema migration applied: npx supabase db reset
 *   - Articles extracted: node scripts/batch-extract.js critical
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const EXTRACTED_DIR = path.join(__dirname, '../extracted');

// Initialize Supabase client with service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

// ============================================================================
// ARTICLE IMPORT
// ============================================================================

async function importArticle(slug) {
  log(`Importing article: ${slug}`, 'info');

  const slugSafe = slug.replace(/\//g, '-');

  // Read files
  const mdPath = path.join(EXTRACTED_DIR, `${slugSafe}.md`);
  const metaPath = path.join(EXTRACTED_DIR, `${slugSafe}.meta.json`);

  if (!fs.existsSync(mdPath)) {
    log(`Markdown file not found: ${mdPath}`, 'error');
    return { success: false, error: 'Markdown file not found' };
  }

  if (!fs.existsSync(metaPath)) {
    log(`Metadata file not found: ${metaPath}`, 'error');
    return { success: false, error: 'Metadata file not found' };
  }

  const markdown = fs.readFileSync(mdPath, 'utf8');
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  // Extract frontmatter from markdown
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  let title = metadata.title || slug;
  let content = markdown;
  let status = 'draft';

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    content = frontmatterMatch[2].trim();

    // Extract title from frontmatter
    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
    if (titleMatch) title = titleMatch[1];

    // Extract status from frontmatter
    const statusMatch = frontmatter.match(/status:\s*"([^"]+)"/);
    if (statusMatch) status = statusMatch[1];
  }

  // Prepare article record
  const article = {
    slug,
    title,
    content,
    metadata,
    status, // Use status from frontmatter
    published_at: status === 'published' ? new Date().toISOString() : null
  };

  log(`  Title: ${title}`, 'info');
  log(`  Slug: ${slug}`, 'info');
  log(`  Status: ${status}`, 'info');
  log(`  Content length: ${content.length} chars`, 'info');

  // Check if article already exists
  const { data: existing, error: checkError } = await supabase
    .from('articles')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine
    log(`Error checking for existing article: ${checkError.message}`, 'error');
    return { success: false, error: checkError.message };
  }

  let result;

  if (existing) {
    // Update existing article
    log(`  Article exists, updating...`, 'info');
    const { data, error } = await supabase
      .from('articles')
      .update(article)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      log(`Error updating article: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }

    result = { success: true, action: 'updated', data };
    log(`Successfully updated article: ${slug}`, 'success');
  } else {
    // Insert new article
    log(`  Creating new article...`, 'info');
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();

    if (error) {
      log(`Error inserting article: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }

    result = { success: true, action: 'created', data };
    log(`Successfully created article: ${slug}`, 'success');
  }

  return result;
}

// ============================================================================
// BATCH IMPORT
// ============================================================================

async function importAll() {
  log('\n' + '='.repeat(60), 'info');
  log('IMPORTING ALL EXTRACTED ARTICLES', 'info');
  log('='.repeat(60) + '\n', 'info');

  // Find all .md files in extracted directory
  const files = fs.readdirSync(EXTRACTED_DIR)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'));

  // Read slug from frontmatter instead of converting filename
  const slugs = files.map(f => {
    const content = fs.readFileSync(path.join(EXTRACTED_DIR, f), 'utf8');
    const match = content.match(/slug:\s*"([^"]+)"/);
    return match ? match[1] : f.replace(/\.md$/, '');
  });

  log(`Found ${files.length} articles to import\n`, 'info');

  const results = {
    total: files.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    console.log(`\n[${i + 1}/${slugs.length}] ${slug}`);
    console.log('-'.repeat(40));

    const result = await importArticle(slug);

    if (result.success) {
      if (result.action === 'created') {
        results.created++;
      } else {
        results.updated++;
      }
    } else {
      results.failed++;
      results.errors.push({ slug, error: result.error });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('IMPORT COMPLETE', 'success');
  console.log('='.repeat(60));
  console.log(`Total articles: ${results.total}`);
  console.log(`✅ Created: ${results.created}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.slug}: ${err.error}`);
    });
  }

  return results;
}

// ============================================================================
// VERIFY IMPORT
// ============================================================================

async function verifyImport() {
  log('\nVerifying import...', 'info');

  // Count articles
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    log(`Error counting articles: ${error.message}`, 'error');
    return;
  }

  log(`Total articles in database: ${count}`, 'success');

  // Get sample articles
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('slug, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (fetchError) {
    log(`Error fetching articles: ${fetchError.message}`, 'error');
    return;
  }

  console.log('\nRecent articles:');
  articles.forEach((article, i) => {
    console.log(`  ${i + 1}. ${article.slug} - ${article.title} (${article.status})`);
  });
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length === 0 || args[0] === '--all') {
      await importAll();
      await verifyImport();
    } else {
      const slug = args[0];
      const result = await importArticle(slug);

      if (!result.success) {
        process.exit(1);
      }

      await verifyImport();
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { importArticle, importAll };
