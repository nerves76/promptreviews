const fs = require('fs');
const path = require('path');

// Path to the generation script
const generateScriptPath = path.join(__dirname, 'generate-icon-sprite.js');
const scriptContent = fs.readFileSync(generateScriptPath, 'utf8');

// Extract USED_ICONS object
const usedIconsMatch = scriptContent.match(/const USED_ICONS = ({[\s\S]*?});/);
if (!usedIconsMatch) {
    console.error('❌ Could not find USED_ICONS in generate-icon-sprite.js');
    process.exit(1);
}

const USED_ICONS = eval('(' + usedIconsMatch[1] + ')');
const iconNames = Object.keys(USED_ICONS);

const ICON_PATHS = {};
const libraries = {};

// Group icons by library
iconNames.forEach(iconName => {
    const lib = USED_ICONS[iconName];
    if (lib === 'custom') return; // Skip custom icons
    if (!libraries[lib]) {
        libraries[lib] = [];
    }
    libraries[lib].push(iconName);
});

// Process each library
Object.keys(libraries).forEach(lib => {
    const libPath = path.join(__dirname, '..', 'node_modules', 'react-icons', lib, 'index.js');
    if (!fs.existsSync(libPath)) {
        console.error(`❌ Library not found: ${lib} at ${libPath}`);
        return;
    }

    console.log(`Processing library: ${lib}...`);
    const libContent = fs.readFileSync(libPath, 'utf8');

    libraries[lib].forEach(iconName => {
        // Regex to find the icon definition
        // Matches pattern: module.exports.IconName = function IconName (props) { ... "viewBox":"0 0 512 512" ... "d":"..." ... }
        // Note: The format might vary slightly, so we try to be robust
        const regex = new RegExp(`module\\.exports\\.${iconName}\\s*=\\s*function\\s*${iconName}\\s*\\(props\\)[\\s\\S]*?"viewBox":"([^"]+)"[\\s\\S]*?"d":"([^"]+)"`);
        const match = libContent.match(regex);

        if (match) {
            ICON_PATHS[iconName] = {
                viewBox: match[1],
                path: match[2]
            };
            console.log(`  ✅ Found ${iconName}`);
        } else {
            console.warn(`  ⚠️  Could not extract path for ${iconName} in ${lib}`);
        }
    });
});

// Write the result to a file
const outputPath = path.join(__dirname, 'extracted_icons.json');
fs.writeFileSync(outputPath, JSON.stringify(ICON_PATHS, null, 2));
console.log(`\n✅ Extracted ${Object.keys(ICON_PATHS).length} icon paths to ${outputPath}`);
