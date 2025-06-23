const fs = require('fs');
const path = require('path');

async function buildWidget() {
  try {
    console.log('Starting photo widget build...');

    const jsPath = path.join(__dirname, '..', 'public', 'widgets', 'photo', 'widget-embed.js');
    const cssPath = path.join(__dirname, '..', 'public', 'widgets', 'photo', 'photo-widget.css');
    const tempJsPath = path.join(__dirname, '..', 'public', 'widgets', 'photo', 'widget-embed.temp.js');

    console.log(`Reading JS from: ${jsPath}`);
    let jsContent = fs.readFileSync(jsPath, 'utf8');

    console.log(`Reading CSS from: ${cssPath}`);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Escape backticks and other template literal characters in the CSS
    const escapedCssContent = cssContent
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/`/g, '\\`')   // Escape backticks
      .replace(/\${/g, '\\${'); // Escape ${...} interpolations

    // A placeholder in the injectCSS function will be replaced by the actual CSS.
    // Ensure this placeholder exists in widget-embed.js
    const placeholder = "'__INJECT_CSS_CONTENT__'";
    if (jsContent.includes(placeholder)) {
      jsContent = jsContent.replace(placeholder, `\`${escapedCssContent}\``);
      console.log('Successfully injected CSS content into JavaScript.');
    } else {
      throw new Error(`Placeholder ${placeholder} not found in ${jsPath}. Please add it to the injectCSS function.`);
    }

    console.log(`Writing temporary file to: ${tempJsPath}`);
    fs.writeFileSync(tempJsPath, jsContent);

    console.log('Photo widget build process completed successfully.');
    // The package.json script will now run terser on this temp file.

  } catch (error) {
    console.error('Error during photo widget build process:', error);
    process.exit(1);
  }
}

buildWidget(); 