const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const { execSync } = require('child_process');

// Paths
const sourceDir = __dirname;
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, '../../../public/widgets/multi');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Read source files
const widgetJs = fs.readFileSync(path.join(sourceDir, 'widget.js'), 'utf8');
const testHtmlSource = fs.readFileSync(path.join(sourceDir, 'test.html'), 'utf8');

// Minify JavaScript
async function build() {
    try {
        // Bundle and minify JS with esbuild
        await esbuild.build({
            entryPoints: [path.join(sourceDir, 'widget.js')],
            bundle: true,
            minify: true,
            format: 'iife',
            globalName: 'PromptReviewsWidget',
            outfile: path.join(distDir, 'widget-embed.min.js'),
            target: ['es2017'],
        });

        // Run Tailwind on the widget's CSS
        console.log('Running Tailwind on widget CSS...');
        execSync('npx tailwindcss -i ./tailwind.css -c ../../../tailwind.config.js -o ./dist/widget-embed.css --minify', { stdio: 'inherit' });

        // Minify the Tailwind output CSS
        const tailwindOutput = fs.readFileSync(path.join(distDir, 'widget-embed.css'), 'utf8');
        const cssMinified = new CleanCSS().minify(tailwindOutput).styles;

        // Write minified CSS
        fs.writeFileSync(path.join(distDir, 'widget-embed.min.css'), cssMinified);

        // Copy minified files to public
        fs.copyFileSync(path.join(distDir, 'widget-embed.min.js'), path.join(publicDir, 'widget-embed.min.js'));
        fs.copyFileSync(path.join(distDir, 'widget-embed.min.css'), path.join(publicDir, 'widget-embed.min.css'));

        // Copy test.html to public
        fs.writeFileSync(path.join(publicDir, 'test.html'), testHtmlSource);

        console.log('Build completed successfully');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 