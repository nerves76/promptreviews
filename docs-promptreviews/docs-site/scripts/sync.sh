#!/bin/bash

# Local sync script for easy deployment
# Usage: ./scripts/sync.sh

set -e

echo "🔄 Starting sync deployment..."

# Build the site
echo "📦 Building static site..."
npm run build:prod

# Create deployment package
echo "📦 Creating deployment package..."
cd out
zip -r ../deploy-$(date +"%Y%m%d_%H%M%S").zip .
cd ..

echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload the new zip file to cPanel"
echo "2. Extract it to public_html/docs/"
echo "3. Visit https://yoursite.com/docs/"
echo ""
echo "💡 Tip: Use FTP for faster uploads"
