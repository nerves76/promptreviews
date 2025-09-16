#!/bin/bash

# Deployment script for cPanel
# This script can be triggered via webhook or manually

set -e

echo "🚀 Starting deployment..."

# Build the site
echo "📦 Building static site..."
npm run build:prod

# Create timestamp for backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backup_$TIMESTAMP"

# Create backup of current site (if exists)
if [ -d "public_html/docs" ]; then
    echo "💾 Creating backup..."
    cp -r public_html/docs $BACKUP_DIR
fi

# Deploy new files
echo "📤 Deploying new files..."
cp -r out/* public_html/docs/

# Set permissions
echo "🔐 Setting permissions..."
find public_html/docs -type f -exec chmod 644 {} \;
find public_html/docs -type d -exec chmod 755 {} \;

echo "✅ Deployment complete!"
echo "🌐 Site should be live at: https://yoursite.com/docs/"
echo "📁 Backup saved as: $BACKUP_DIR"
