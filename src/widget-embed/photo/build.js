const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const CleanCSS = require('clean-css');

async function build() {
    try {
        // Read PhotoWidget CSS
        const css = fs.readFileSync(path.join(__dirname, '../../app/dashboard/widget/css/PhotoWidget.css'), 'utf8');

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
        const embedCode = `<!-- PromptReviews Photo Widget -->\n<link rel=\"stylesheet\" href=\"https://app.promptreviews.app/widgets/photo/widget.min.css\">\n<div class=\"promptreviews-widget\" data-widget=\"WIDGET_ID\" data-widget-type=\"photo\"></div>\n<script src=\"https://app.promptreviews.app/widgets/photo/widget.min.js\" async></script>`;
        fs.writeFileSync(path.join(distDir, 'embed-code.html'), embedCode);

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 