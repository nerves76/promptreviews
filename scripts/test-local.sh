#!/bin/bash

# Local Auth Testing Script
# Run with: ./test-local.sh

echo "🔍 Starting Local Auth Testing Environment"
echo "=========================================="

# Check if npm packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run CLI test first
echo ""
echo "🔧 Running CLI Diagnostics..."
echo "=========================================="
node test-auth-cli.js

echo ""
echo "=========================================="
echo "✅ CLI Diagnostics Complete"
echo ""

# Start the dev server
echo "🚀 Starting development server..."
echo "=========================================="
echo "📍 Test page will be available at: http://localhost:3000/test-auth"
echo "📍 Auth debugger will appear on ALL pages in dev mode"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server (use default port 3000)
npx next dev