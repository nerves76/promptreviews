const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

async function build() {
    try {
        // Read source files
        const js = fs.readFileSync(path.join(__dirname, 'widget.js'), 'utf8');
        const css = fs.readFileSync(path.join(__dirname, 'SingleWidget.css'), 'utf8');

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
        const embedCode = `<!-- PromptReviews Single Widget -->
<link rel="stylesheet" href="https://cdn.promptreviews.com/widgets/single/widget.min.css">
<div id="promptreviews-widget"></div>
<script src="https://cdn.promptreviews.com/widgets/single/widget.min.js"></script>
<script>
    window.PromptReviews.init({
        clientId: 'YOUR_CLIENT_ID',
        widgetData: {
            reviews: [/* Your review data */],
            design: {/* Your design settings */}
        }
    });
</script>`;

        fs.writeFileSync(path.join(distDir, 'embed-code.html'), embedCode);

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 