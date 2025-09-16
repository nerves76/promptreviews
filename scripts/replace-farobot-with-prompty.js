#!/usr/bin/env node

/**
 * Script to replace FaRobot with prompty throughout the codebase
 * 
 * This script systematically replaces all instances of FaRobot with prompty
 * in TypeScript/JavaScript files, while preserving the existing styling and props.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process (TypeScript, JavaScript, TSX, JSX files)
const filePatterns = [
  'src/**/*.{ts,tsx,js,jsx}',
  'scripts/**/*.js',
  '!node_modules/**',
  '!dist/**',
  '!build/**',
  '!.next/**'
];

// Files to exclude from processing
const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/public/icons-sprite.svg', // Don't modify the sprite file directly
  '**/Icon.tsx' // Don't modify the Icon component definition
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // Replace FaRobot with prompty in Icon components
    // Pattern: <Icon name="prompty" ... />
    const iconPattern = /<Icon\s+name="prompty"([^>]*)\/>/g;
    newContent = newContent.replace(iconPattern, (match, props) => {
      modified = true;
      return `<Icon name="prompty"${props}/>`;
    });

    // Replace FaRobot with prompty in use statements (SVG sprites)
    // Pattern: <use href="/icons-sprite.svg#prompty" />
    const usePattern = /<use\s+href="\/icons-sprite\.svg#FaRobot"\s*\/>/g;
    newContent = newContent.replace(usePattern, (match) => {
      modified = true;
      return '<use href="/icons-sprite.svg#prompty" />';
    });

    // Replace FaRobot imports (if any direct imports)
    const importPattern = /import\s*{[^}]*FaRobot[^}]*}\s*from\s*['"][^'"]+['"]/g;
    newContent = newContent.replace(importPattern, (match) => {
      modified = true;
      return match.replace(/FaRobot/g, 'prompty');
    });

    // Replace FaRobot in string literals and comments
    const stringPattern = /(['"`])FaRobot\1/g;
    newContent = newContent.replace(stringPattern, (match, quote) => {
      modified = true;
      return `${quote}prompty${quote}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting FaRobot to prompty replacement...\n');

  let totalFiles = 0;
  let updatedFiles = 0;

  // Process each file pattern
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: excludePatterns });
    
    files.forEach(file => {
      totalFiles++;
      if (processFile(file)) {
        updatedFiles++;
      }
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - updatedFiles}`);

  if (updatedFiles > 0) {
    console.log('\n✅ FaRobot to prompty replacement completed successfully!');
    console.log('\n⚠️  Note: You may need to:');
    console.log('   1. Update any remaining references in documentation');
    console.log('   2. Test the application to ensure all icons display correctly');
    console.log('   3. Update any hardcoded references in other file types');
  } else {
    console.log('\nℹ️  No files were updated. All FaRobot references may already be replaced or in excluded files.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, main };
