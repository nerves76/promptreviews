#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix a single file by removing metadata export from client components
function fixMetadata(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has 'use client'
  if (content.startsWith("'use client'")) {
    // Remove the metadata export
    content = content.replace(/export const metadata: Metadata = \{[\s\S]*?\}\n\n/g, '');

    // Also remove the Metadata type import if not used elsewhere
    content = content.replace(/import type \{ Metadata \} from 'next'\n/g, '');

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed metadata in: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    return true;
  }
  return false;
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

console.log("Fixing metadata exports in client components...\n");

let fixedCount = 0;
files.forEach(file => {
  const fullPath = path.join(docsDir, file);
  if (fs.existsSync(fullPath)) {
    if (fixMetadata(fullPath)) {
      fixedCount++;
    }
  }
});

console.log(`\n✨ Fixed ${fixedCount} files!`);