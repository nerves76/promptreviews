const fs = require('fs');
const path = require('path');

// Read the generation script to extract USED_ICONS and ICON_PATHS
const generateScriptPath = path.join(__dirname, 'generate-icon-sprite.js');
const scriptContent = fs.readFileSync(generateScriptPath, 'utf8');

// Extract USED_ICONS object
const usedIconsMatch = scriptContent.match(/const USED_ICONS = ({[\s\S]*?});/);
if (!usedIconsMatch) {
    console.error('❌ Could not find USED_ICONS in generate-icon-sprite.js');
    process.exit(1);
}

// Extract ICON_PATHS object
const iconPathsMatch = scriptContent.match(/const ICON_PATHS = ({[\s\S]*?});/);
if (!iconPathsMatch) {
    console.error('❌ Could not find ICON_PATHS in generate-icon-sprite.js');
    process.exit(1);
}

// Evaluate the objects (safe enough for this context as we control the file)
const USED_ICONS = eval('(' + usedIconsMatch[1] + ')');
const ICON_PATHS = eval('(' + iconPathsMatch[1] + ')');

const usedIconNames = Object.keys(USED_ICONS);
const definedIconNames = Object.keys(ICON_PATHS);

const missingIcons = usedIconNames.filter(icon => !definedIconNames.includes(icon));

if (missingIcons.length > 0) {
    console.error('❌ Found icons in USED_ICONS that are missing from ICON_PATHS (will render as placeholders):');
    missingIcons.forEach(icon => console.error(`   - ${icon}`));
    console.error(`\nTotal missing: ${missingIcons.length}`);
    process.exit(1);
} else {
    console.log('✅ All icons in USED_ICONS have defined paths in ICON_PATHS.');
    process.exit(0);
}
