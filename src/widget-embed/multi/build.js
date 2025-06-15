const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

async function build() {
    try {
        // Read source files
        const js = fs.readFileSync(path.join(__dirname, 'widget.js'), 'utf8');
        const css = fs.readFileSync(path.join(__dirname, 'MultiWidget.css'), 'utf8');

        // Minify JS
        const minifiedJs = await minify(js, {
            compress: true,
            mangle: true
        });

        // Minify CSS
        const minifiedCss = new CleanCSS().minify(css);

        // Create dist directory if it doesn't exist
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir);
        }

        // Write minified files
        fs.writeFileSync(path.join(distDir, 'widget.min.js'), minifiedJs.code);
        fs.writeFileSync(path.join(distDir, 'widget.min.css'), minifiedCss.styles);

        // Create embed code template
        const embedCode = `<!-- PromptReviews Multi Widget -->\n<link rel=\"stylesheet\" href=\"https://app.promptreviews.app/widgets/multi/widget.min.css\">\n<div class=\"promptreviews-widget\" data-widget=\"WIDGET_ID\" data-widget-type=\"multi\"></div>\n<script src=\"https://app.promptreviews.app/widgets/multi/widget.min.js\" async></script>`;

        fs.writeFileSync(path.join(distDir, 'embed-code.html'), embedCode);

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 