const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Run the build script to generate minified JS and CSS
console.log('Building SingleWidget...');
execSync('node build.js', { cwd: __dirname, stdio: 'inherit' });

// 2. Define source and destination paths
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, '../../..', 'public', 'widgets', 'single');

// 3. Ensure the destination directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 4. Copy widget.min.js and widget.min.css to the public directory
['widget.min.js', 'widget.min.css'].forEach(file => {
  const src = path.join(distDir, file);
  const dest = path.join(publicDir, file);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} to ${dest}`);
});

console.log('✅ Build and copy complete!'); 