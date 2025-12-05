const fs = require('fs');
const path = require('path');

const generateScriptPath = path.join(__dirname, 'generate-icon-sprite.js');
const extractedIconsPath = path.join(__dirname, 'extracted_icons.json');

const scriptContent = fs.readFileSync(generateScriptPath, 'utf8');
const extractedIcons = JSON.parse(fs.readFileSync(extractedIconsPath, 'utf8'));

// Add custom icons that were not extracted
extractedIcons['prompty'] = {
    viewBox: '0 0 640 512',
    path: 'M320 0c17.7 0 32 14.3 32 32V96H480c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256c0-22.1-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40zm152 40c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z'
};

// Convert to string with indentation
const newIconPathsString = 'const ICON_PATHS = ' + JSON.stringify(extractedIcons, null, 2) + ';';

// Replace the ICON_PATHS object in the script
// We look for "const ICON_PATHS = {" and the closing "};"
// This regex assumes ICON_PATHS is defined as a const and ends with }; at the start of a line or after the object
const newScriptContent = scriptContent.replace(
    /const ICON_PATHS = \{[\s\S]*?\};/,
    newIconPathsString
);

if (newScriptContent === scriptContent) {
    console.error('❌ Could not replace ICON_PATHS. Regex match failed.');
    process.exit(1);
}

fs.writeFileSync(generateScriptPath, newScriptContent);
console.log('✅ Updated generate-icon-sprite.js with ' + Object.keys(extractedIcons).length + ' icons.');
