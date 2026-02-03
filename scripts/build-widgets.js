const fs = require('fs');
const path = require('path');

/**
 * Unified Widget Build Script
 *
 * This script prepares all widget files for minification by:
 * 1. Reading shared utilities from widget-utils.js
 * 2. Injecting shared utilities into each widget
 * 3. Handling CSS injection for the photo widget
 * 4. Writing temporary files for Terser to minify
 */

const WIDGETS_DIR = path.join(__dirname, '..', 'public', 'widgets');
const SHARED_UTILS_PATH = path.join(WIDGETS_DIR, 'shared', 'widget-utils.js');

// Widget configurations
const WIDGETS = [
  {
    name: 'multi',
    jsFile: 'widget-embed.js',
    tempFile: 'widget-embed.temp.js',
    usesSharedUtils: true
  },
  {
    name: 'single',
    jsFile: 'widget-embed.js',
    tempFile: 'widget-embed.temp.js',
    usesSharedUtils: true
  },
  {
    name: 'photo',
    jsFile: 'widget-embed.js',
    tempFile: 'widget-embed.temp.js',
    cssFile: 'photo-widget.css',
    usesSharedUtils: true
  },
  {
    name: 'comparison',
    jsFile: 'widget-embed.js',
    tempFile: null, // No preprocessing needed, terser can minify directly
    usesSharedUtils: false
  },
  {
    name: 'pricing',
    jsFile: 'pricing-widget.js',
    tempFile: null, // No preprocessing needed
    usesSharedUtils: false
  }
];

/**
 * Reads the shared utilities file
 */
function readSharedUtils() {
  try {
    const content = fs.readFileSync(SHARED_UTILS_PATH, 'utf8');
    console.log('✅ Read shared utilities');
    return content;
  } catch (error) {
    console.error('❌ Failed to read shared utilities:', error.message);
    process.exit(1);
  }
}

/**
 * Injects shared utilities into a widget's IIFE
 * The utilities are inserted right after the opening of the IIFE
 */
function injectSharedUtils(jsContent, sharedUtils) {
  // Find the IIFE opening pattern: (function() { 'use strict';
  const iifePattern = /\(function\(\)\s*\{\s*['"]use strict['"];?\s*/;
  const match = jsContent.match(iifePattern);

  if (!match) {
    console.warn('⚠️ Could not find IIFE pattern to inject shared utils');
    return jsContent;
  }

  // Insert shared utils right after 'use strict';
  const insertIndex = match.index + match[0].length;
  const before = jsContent.substring(0, insertIndex);
  const after = jsContent.substring(insertIndex);

  return `${before}\n\n  // --- Shared Utilities (injected at build time) ---\n${sharedUtils}\n  // --- End Shared Utilities ---\n\n${after}`;
}

/**
 * Injects CSS content into the photo widget
 */
function injectCSS(jsContent, cssPath) {
  try {
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Escape backticks and template literal characters in the CSS
    const escapedCss = cssContent
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\${/g, '\\${');

    // Replace the placeholder with actual CSS
    const placeholder = "'__INJECT_CSS_CONTENT__'";
    if (jsContent.includes(placeholder)) {
      return jsContent.replace(placeholder, `\`${escapedCss}\``);
    } else {
      console.warn('⚠️ CSS placeholder not found in photo widget');
      return jsContent;
    }
  } catch (error) {
    console.error('❌ Failed to read CSS file:', error.message);
    return jsContent;
  }
}

/**
 * Processes a single widget
 */
function processWidget(widget, sharedUtils) {
  console.log(`\n📦 Processing ${widget.name} widget...`);

  const widgetDir = path.join(WIDGETS_DIR, widget.name);
  const jsPath = path.join(widgetDir, widget.jsFile);

  // Check if widget directory exists
  if (!fs.existsSync(widgetDir)) {
    console.warn(`⚠️ Widget directory not found: ${widgetDir}`);
    return false;
  }

  // Check if JS file exists
  if (!fs.existsSync(jsPath)) {
    console.warn(`⚠️ Widget JS file not found: ${jsPath}`);
    return false;
  }

  // If no preprocessing is needed, skip
  if (!widget.tempFile) {
    console.log(`  ⏭️ No preprocessing needed for ${widget.name}`);
    return true;
  }

  let jsContent = fs.readFileSync(jsPath, 'utf8');

  // Inject shared utilities if widget uses them
  if (widget.usesSharedUtils && sharedUtils) {
    jsContent = injectSharedUtils(jsContent, sharedUtils);
    console.log(`  ✅ Injected shared utilities`);
  }

  // Inject CSS for photo widget
  if (widget.cssFile) {
    const cssPath = path.join(widgetDir, widget.cssFile);
    jsContent = injectCSS(jsContent, cssPath);
    console.log(`  ✅ Injected CSS content`);
  }

  // Write temporary file
  const tempPath = path.join(widgetDir, widget.tempFile);
  fs.writeFileSync(tempPath, jsContent);
  console.log(`  ✅ Wrote temp file: ${widget.tempFile}`);

  return true;
}

/**
 * Main build function
 */
async function build() {
  console.log('🚀 Starting widget build process...\n');

  // Read shared utilities
  const sharedUtils = readSharedUtils();

  // Process each widget
  let successCount = 0;
  for (const widget of WIDGETS) {
    if (processWidget(widget, sharedUtils)) {
      successCount++;
    }
  }

  console.log(`\n✅ Build preparation complete: ${successCount}/${WIDGETS.length} widgets processed`);
  console.log('📝 Run terser commands to minify the widgets\n');
}

// Run the build
build().catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
