#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix a single file
function addUseClient(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if 'use client' is already at the top
  if (!content.startsWith("'use client'")) {
    // Add 'use client' at the very beginning
    content = "'use client'\n\n" + content;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Added 'use client' to: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`✓ Already has 'use client': ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    return false;
  }
}

// Find all page.tsx files
const docsDir = '/Users/chris/promptreviews/docs-promptreviews/docs-site/src/app/google-biz-optimizer';

const files = [
  'metrics/average-rating/page.tsx',
  'metrics/review-trends/page.tsx',
  'metrics/monthly-patterns/page.tsx',
  'optimization/seo-score/page.tsx',
  'optimization/categories/page.tsx',
  'optimization/services/page.tsx',
  'optimization/photos/page.tsx',
  'optimization/quick-wins/page.tsx',
  'engagement/review-responses/page.tsx',
  'engagement/questions-answers/page.tsx',
  'engagement/posts/page.tsx',
  'performance/customer-actions/page.tsx'
];

console.log("Adding 'use client' directive to all Google Biz Optimizer pages...\n");

let addedCount = 0;
files.forEach(file => {
  const fullPath = path.join(docsDir, file);
  if (fs.existsSync(fullPath)) {
    if (addUseClient(fullPath)) {
      addedCount++;
    }
  }
});

console.log(`\n✨ Added 'use client' to ${addedCount} files!`);