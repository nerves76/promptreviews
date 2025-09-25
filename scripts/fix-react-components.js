#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix a single file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix escaped quotes in metadata description
  content = content.replace(/description: '(.*)\\'/g, (match, p1) => {
    return `description: '${p1.replace(/'/g, '')}'`;
  });

  // Fix escaped quotes in title attribute
  content = content.replace(/title="([^"]*)\\"/g, (match, p1) => {
    return `title="${p1.replace(/"/g, '')}"`;
  });

  // Fix description attribute in PageHeader
  content = content.replace(/description="([^"]*)\\"/g, (match, p1) => {
    return `description="${p1.replace(/"/g, '')}"`;
  });

  // Remove any remaining backslashes before quotes in JSX
  content = content.replace(/\\"([^"]*)\\/g, '"$1');
  content = content.replace(/\\'([^']*)\\/g, "'$1");

  // Fix single quotes in text that should be apostrophes
  content = content.replace(/isn\\'t/g, "isn't");
  content = content.replace(/doesn\\'t/g, "doesn't");
  content = content.replace(/won\\'t/g, "won't");
  content = content.replace(/can\\'t/g, "can't");
  content = content.replace(/it\\'s/g, "it's");

  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${path.basename(path.dirname(filePath))}`);
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

files.forEach(file => {
  const fullPath = path.join(docsDir, file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  }
});

console.log('\n✨ All files fixed!');