#!/usr/bin/env node

/**
 * Batch Article Extraction
 *
 * Extracts multiple articles at once based on priority batches.
 *
 * Usage:
 *   node scripts/batch-extract.js [batch-name]
 *   node scripts/batch-extract.js pilot
 *   node scripts/batch-extract.js all
 *
 * Batches:
 *   - pilot: 2 critical articles for initial testing
 *   - critical: 13 high-priority articles
 *   - all: All 54 articles
 */

const fs = require('fs');
const path = require('path');
const { extractArticle } = require('./extract-article');

// ============================================================================
// BATCH DEFINITIONS
// ============================================================================

const BATCHES = {
  pilot: [
    'src/app/getting-started/page.tsx',
    'src/app/prompt-pages/page.tsx'
  ],

  critical: [
    'src/app/getting-started/page.tsx',
    'src/app/getting-started/account-setup/page.tsx',
    'src/app/getting-started/first-prompt-page/page.tsx',
    'src/app/getting-started/first-review-request/page.tsx',
    'src/app/getting-started/review-widget/page.tsx',
    'src/app/prompt-pages/page.tsx',
    'src/app/prompt-pages/types/page.tsx',
    'src/app/prompt-pages/types/service/page.tsx',
    'src/app/prompt-pages/types/universal/page.tsx',
    'src/app/widgets/page.tsx',
    'src/app/contacts/page.tsx',
    'src/app/google-business/page.tsx',
    'src/app/reviews/page.tsx'
  ]
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
  };
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function findAllPages() {
  const docsRoot = path.join(__dirname, '../src/app');
  const pages = [];

  function walk(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip components, utils, api directories
        if (!['components', 'utils', 'api'].includes(file)) {
          walk(fullPath);
        }
      } else if (file === 'page.tsx') {
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
        pages.push(relativePath);
      }
    }
  }

  walk(docsRoot);
  return pages;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

function processBatch(batchName) {
  log(`\n${'='.repeat(60)}`, 'info');
  log(`Starting batch: ${batchName}`, 'info');
  log('='.repeat(60), 'info');

  let pages;

  if (batchName === 'all') {
    pages = findAllPages();
    log(`Found ${pages.length} total pages`, 'info');
  } else if (BATCHES[batchName]) {
    pages = BATCHES[batchName];
    log(`Processing ${pages.length} pages in ${batchName} batch`, 'info');
  } else {
    log(`Unknown batch: ${batchName}`, 'error');
    log(`Available batches: ${Object.keys(BATCHES).join(', ')}, all`, 'info');
    process.exit(1);
  }

  const results = {
    total: pages.length,
    success: 0,
    failed: 0,
    warnings: 0,
    errors: []
  };

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;

    console.log('\n' + '-'.repeat(60));
    log(`[${pageNum}/${pages.length}] ${page}`, 'info');
    console.log('-'.repeat(60));

    try {
      const filePath = path.join(__dirname, '..', page);
      const { report } = extractArticle(filePath);

      results.success++;

      if (report.warnings.length > 0) {
        results.warnings += report.warnings.length;
      }

    } catch (error) {
      log(`Failed to extract: ${error.message}`, 'error');
      results.failed++;
      results.errors.push({
        page,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('BATCH EXTRACTION COMPLETE', 'success');
  console.log('='.repeat(60));
  console.log(`Total pages: ${results.total}`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Total warnings: ${results.warnings}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.page}: ${err.error}`);
    });
  }

  // Save summary
  const summaryPath = path.join(__dirname, '../extracted', `_batch_${batchName}_summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  log(`Summary saved to: ${summaryPath}`, 'info');

  return results;
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const batchName = args[0] || 'pilot';

  processBatch(batchName);
}

module.exports = { processBatch };
