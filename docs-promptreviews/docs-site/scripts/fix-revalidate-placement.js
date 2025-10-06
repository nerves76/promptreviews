#!/usr/bin/env node
/**
 * Fix incorrectly placed ISR revalidation exports
 * They were inserted inside import statements - move them after imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all page.tsx files in src/app
const files = execSync('find src/app -name "page.tsx" -type f', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${files.length} page files\n`);

const REVALIDATE_COMMENT = '// Revalidate every 60 seconds - allows CMS updates to show without redeployment';
const REVALIDATE_EXPORT = 'export const revalidate = 60';

let fixed = 0;
let alreadyCorrect = 0;
let errors = 0;

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // Check if file has revalidate statement
    const hasRevalidate = lines.some(line => line.includes('export const revalidate'));
    if (!hasRevalidate) {
      continue;
    }

    // Find the revalidate lines
    let revalidateCommentIndex = -1;
    let revalidateExportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === REVALIDATE_COMMENT) {
        revalidateCommentIndex = i;
      }
      if (lines[i].trim() === REVALIDATE_EXPORT) {
        revalidateExportIndex = i;
      }
    }

    if (revalidateCommentIndex === -1 || revalidateExportIndex === -1) {
      continue;
    }

    // Check if it's in the correct position (after imports)
    // Correct if the line before the comment is a closing } from an import
    const lineBeforeComment = lines[revalidateCommentIndex - 1];
    const lineTwoBeforeComment = lines[revalidateCommentIndex - 2];

    // If already correct (preceded by blank line and import closing), skip
    if (lineBeforeComment?.trim() === '' && lineTwoBeforeComment?.includes('} from')) {
      alreadyCorrect++;
      continue;
    }

    // Remove the incorrectly placed revalidate lines
    const newLines = lines.filter((line, i) =>
      i !== revalidateCommentIndex &&
      i !== revalidateExportIndex &&
      !(i === revalidateCommentIndex - 1 && line.trim() === '') // Remove blank line before
    );

    // Find the last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i].trim();
      if (line.startsWith('import ')) {
        lastImportIndex = i;
      } else if (line.startsWith('export ') || line.startsWith('const ') ||
                 line.startsWith('function ') || line.startsWith('interface ') ||
                 (line.length > 0 && !line.startsWith('//') && !line.startsWith('/*'))) {
        // We've passed all imports
        break;
      }
    }

    if (lastImportIndex === -1) {
      console.log(`⚠️  Could not find imports in: ${file}`);
      errors++;
      continue;
    }

    // Insert after last import (and any closing braces if multi-line import)
    let insertIndex = lastImportIndex + 1;

    // If the last import has an opening { without closing }, find the closing }
    if (newLines[lastImportIndex].includes('{') && !newLines[lastImportIndex].includes('}')) {
      for (let i = lastImportIndex + 1; i < newLines.length; i++) {
        if (newLines[i].includes('}')) {
          insertIndex = i + 1;
          break;
        }
      }
    }

    // Insert the revalidate block
    newLines.splice(insertIndex, 0, '', REVALIDATE_COMMENT, REVALIDATE_EXPORT);

    // Write back
    fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;

  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
    errors++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed}`);
console.log(`   ✓  Already correct: ${alreadyCorrect}`);
console.log(`   ❌ Errors: ${errors}`);
