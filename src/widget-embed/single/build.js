const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const CleanCSS = require('clean-css');

async function build() {
    try {
        // Read source files
        const css = fs.readFileSync(path.join(__dirname, 'SingleWidget.css'), 'utf8');

        // Minify CSS
        const minifiedCss = new CleanCSS().minify(css);

        // Create dist directory if it doesn't exist
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir);
        }

        // Use esbuild to bundle and minify JS (including Swiper)
        await esbuild.build({
            entryPoints: [path.join(__dirname, 'widget.js')],
            bundle: true,
            minify: true,
            outfile: path.join(distDir, 'widget.min.js'),
            platform: 'browser',
            target: ['es2015'],
            format: 'iife',
            sourcemap: false,
            external: [], // bundle everything
        });

        // Write minified CSS
        fs.writeFileSync(path.join(distDir, 'widget.min.css'), minifiedCss.styles);

        // Create embed code template
        const embedCode = `<!-- PromptReviews Single Widget -->\n<link rel=\"stylesheet\" href=\"https://cdn.promptreviews.com/widgets/single/widget.min.css\">\n<div id=\"promptreviews-widget\"></div>\n<script src=\"https://cdn.promptreviews.com/widgets/single/widget.min.js\"></script>\n<script>\n    window.PromptReviews.init({\n        clientId: 'YOUR_CLIENT_ID',\n        widgetData: {\n            reviews: [/* Your review data */],\n            design: {/* Your design settings */}\n        }\n    });\n</script>`;

        fs.writeFileSync(path.join(distDir, 'embed-code.html'), embedCode);

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 