#!/usr/bin/env node
/**
 * Remove ISR revalidation exports - switching to no-cache strategy
 */

const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src/app -name "page.tsx" -type f', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} page files\n`);

let removed = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');

    // Remove the revalidation block
    const originalLength = content.length;
    content = content.replace(/\n+\/\/ Revalidate every 60 seconds - allows CMS updates to show without redeployment\nexport const revalidate = 60\n*/g, '\n');

    if (content.length !== originalLength) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✅ Removed from: ${file}`);
      removed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n✅ Removed ISR config from ${removed} files`);
