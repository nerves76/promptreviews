const esbuild = require('esbuild');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const CleanCSS = require('clean-css');

async function build() {
    try {
        // Read custom CSS and Tailwind CSS
        const customCss = fs.readFileSync(path.join(__dirname, 'MultiWidget.css'), 'utf8');
        const tailwindInput = path.join(__dirname, 'tailwind.css');
        const tailwindConfig = path.join(__dirname, '../../..', 'tailwind.config.js');
        const tailwindOut = path.join(__dirname, 'dist', 'tailwind.out.css');

        // Ensure dist directory exists
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir);
        }

        // Run Tailwind CLI to generate CSS
        execSync(`npx tailwindcss -c ${tailwindConfig} -i ${tailwindInput} -o ${tailwindOut} --minify`, { stdio: 'inherit' });

        // Read generated Tailwind CSS
        const tailwindCss = fs.readFileSync(tailwindOut, 'utf8');

        // Combine Tailwind output with custom CSS
        const combinedCss = tailwindCss + '\n' + customCss;

        // Minify CSS
        const minifiedCss = new CleanCSS().minify(combinedCss);
        fs.writeFileSync(path.join(distDir, 'widget.min.css'), minifiedCss.styles);

        // Use esbuild to bundle and minify JS (including React, ReactDOM, MultiWidget)
        await esbuild.build({
            entryPoints: [path.join(__dirname, 'embed-multi.jsx')],
            bundle: true,
            minify: true,
            outfile: path.join(distDir, 'widget-embed.min.js'),
            platform: 'browser',
            target: ['es2015'],
            format: 'iife',
            sourcemap: false,
            external: [], // bundle everything
        });

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