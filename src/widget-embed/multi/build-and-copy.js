const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run the build script
console.log('Building widget...');
execSync('node build.js', { stdio: 'inherit' });

// Define paths
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, '../../../public/widgets/multi');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy built files to public directory
console.log('Copying files to public directory...');
fs.copyFileSync(
    path.join(distDir, 'widget-embed.min.js'),
    path.join(publicDir, 'widget-embed.min.js')
);
fs.copyFileSync(
    path.join(distDir, 'widget-embed.min.css'),
    path.join(publicDir, 'widget-embed.min.css')
);

// Create embed code template
const embedCode = `<!-- PromptReviews Multi Widget -->
<link rel="stylesheet" href="https://app.promptreviews.app/widgets/multi/widget-embed.min.css">
<div class="promptreviews-widget" data-widget="WIDGET_ID" data-widget-type="multi"></div>
<script src="https://app.promptreviews.app/widgets/multi/widget-embed.min.js" async></script>`;

fs.writeFileSync(path.join(publicDir, 'embed-code.html'), embedCode);

console.log('Build and copy completed successfully!'); 