#!/bin/bash

# Script to verify which pages still need CMS connection

cd "$(dirname "$0")/.."

echo "=== Checking CMS Connection Status ==="
echo ""

pages=(
  "widgets"
  "team"
  "settings"
  "style-settings"
  "troubleshooting"
  "help"
  "integrations"
  "google-biz-optimizer"
  "faq-comprehensive"
)

for page in "${pages[@]}"; do
  file="src/app/$page/page.tsx"
  if [ -f "$file" ]; then
    if grep -q "getArticleBySlug" "$file"; then
      echo "✅ $page - Already connected"
    else
      echo "❌ $page - Needs connection"
    fi
  else
    echo "⚠️  $page - File not found at $file"
  fi
done

echo ""
echo "=== Summary ==="
