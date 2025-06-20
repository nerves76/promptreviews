#!/bin/bash

# Widget Build Script
# This script builds the minified version of both widgets and provides feedback

echo "🔨 Building PromptReviews Widgets..."

# Check if source files exist
if [ ! -f "public/widgets/multi/widget-embed.js" ]; then
    echo "❌ Error: Multi widget source file public/widgets/multi/widget-embed.js not found"
    exit 1
fi

if [ ! -f "public/widgets/single/widget-embed.js" ]; then
    echo "❌ Error: Single widget source file public/widgets/single/widget-embed.js not found"
    exit 1
fi

# Get original file sizes
MULTI_ORIGINAL_SIZE=$(wc -c < "public/widgets/multi/widget-embed.js")
SINGLE_ORIGINAL_SIZE=$(wc -c < "public/widgets/single/widget-embed.js")
echo "📄 Multi widget original size: $((MULTI_ORIGINAL_SIZE / 1024))KB"
echo "📄 Single widget original size: $((SINGLE_ORIGINAL_SIZE / 1024))KB"

# Build minified versions
npm run build:widget

# Check if build was successful
if [ $? -eq 0 ]; then
    # Get minified file sizes
    MULTI_MINIFIED_SIZE=$(wc -c < "public/widgets/multi/widget-embed.min.js")
    SINGLE_MINIFIED_SIZE=$(wc -c < "public/widgets/single/widget-embed.min.js")
    
    MULTI_SAVINGS=$((MULTI_ORIGINAL_SIZE - MULTI_MINIFIED_SIZE))
    MULTI_SAVINGS_PERCENT=$((MULTI_SAVINGS * 100 / MULTI_ORIGINAL_SIZE))
    
    SINGLE_SAVINGS=$((SINGLE_ORIGINAL_SIZE - SINGLE_MINIFIED_SIZE))
    SINGLE_SAVINGS_PERCENT=$((SINGLE_SAVINGS * 100 / SINGLE_ORIGINAL_SIZE))
    
    echo "✅ Build successful!"
    echo "📦 Multi widget minified size: $((MULTI_MINIFIED_SIZE / 1024))KB"
    echo "💾 Multi widget size reduction: $((MULTI_SAVINGS / 1024))KB ($MULTI_SAVINGS_PERCENT%)"
    echo "📦 Single widget minified size: $((SINGLE_MINIFIED_SIZE / 1024))KB"
    echo "💾 Single widget size reduction: $((SINGLE_SAVINGS / 1024))KB ($SINGLE_SAVINGS_PERCENT%)"
    echo "🚀 Ready for production!"
else
    echo "❌ Build failed!"
    exit 1
fi 