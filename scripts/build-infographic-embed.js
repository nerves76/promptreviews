#!/usr/bin/env node

/**
 * Build script for creating a standalone embeddable infographic
 * This creates a self-contained HTML file with all dependencies included
 */

const fs = require('fs');
const path = require('path');

console.log('Building standalone infographic embed...');

// Read the icons sprite
const iconsSprite = fs.readFileSync(
  path.join(__dirname, '../public/icons-sprite.svg'), 
  'utf8'
);

// Create standalone HTML with inline styles and minimal dependencies
const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptReviews Infographic</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d1b69 50%, #1e1e2e 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: auto;
        }
        .infographic-container {
            width: 100%;
            max-width: 1400px;
            padding: 2rem;
            text-align: center;
        }
        .loading {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.8);
        }
        .error {
            color: #ff6b6b;
            padding: 2rem;
            background: rgba(255, 0, 0, 0.1);
            border-radius: 8px;
            margin: 2rem;
        }
        /* Hide the SVG sprite */
        #icon-sprite-container {
            position: absolute;
            width: 0;
            height: 0;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <!-- Hidden SVG Sprite -->
    <div id="icon-sprite-container">
        ${iconsSprite}
    </div>
    
    <!-- Infographic Container -->
    <div class="infographic-container">
        <div class="loading">Loading infographic...</div>
    </div>

    <script>
        // Message parent about height changes
        function sendHeight() {
            const height = document.documentElement.scrollHeight;
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'infographic-resize',
                    height: height
                }, '*');
            }
        }

        // Simple message to indicate the embed is working
        window.addEventListener('load', function() {
            const container = document.querySelector('.infographic-container');
            
            // For production, you would load the actual infographic here
            // For now, show a message that it needs to be loaded from the app
            container.innerHTML = \`
                <div style="padding: 3rem; background: rgba(255,255,255,0.1); border-radius: 1rem;">
                    <h2 style="margin-bottom: 1rem;">PromptReviews Infographic</h2>
                    <p style="margin-bottom: 2rem;">For the full interactive infographic, please embed from:</p>
                    <code style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 0.5rem; display: block;">
                        https://app.promptreviews.app/infographic/embed
                    </code>
                    <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
                        The infographic requires React components that need to be served from the application.
                    </p>
                </div>
            \`;
            
            sendHeight();
        });

        // Update height on resize
        window.addEventListener('resize', sendHeight);
    </script>
</body>
</html>`;

// Write the standalone file
const outputPath = path.join(__dirname, '../public/infographic-standalone.html');
fs.writeFileSync(outputPath, standaloneHTML);

console.log(`✅ Standalone infographic built: ${outputPath}`);
console.log('\nFor production use, embed using:');
console.log('<iframe src="https://app.promptreviews.app/infographic/embed" width="100%" height="1200"></iframe>');