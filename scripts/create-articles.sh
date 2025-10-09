#!/bin/bash

# Create Google Business Profile metric articles via API
# Run from project root: bash scripts/create-articles.sh

BASE_URL="http://localhost:3002"

echo "🚀 Creating Google Business Profile metric articles..."
echo ""

# Array of articles (first one as test)
curl -X POST "$BASE_URL/api/admin/help-content" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "google-biz-optimizer/metrics/monthly-patterns",
    "title": "Understanding Monthly Review Patterns",
    "status": "published",
    "metadata": {
      "category": "google-business",
      "description": "Learn how monthly review patterns help optimize your review collection timing."
    },
    "content": "# Understanding Monthly Review Patterns\n\n## What Are Monthly Review Patterns?\n\nMonthly review patterns show you how your reviews are distributed throughout the month. This metric tracks when customers are most likely to leave reviews and helps identify trends in your review collection efforts.\n\n## Why This Matters\n\nUnderstanding monthly patterns is crucial because:\n\n- **Optimize Timing**: Knowing when customers are most likely to leave reviews helps you time your review requests more effectively\n- **Identify Gaps**: Spotting periods with fewer reviews allows you to increase outreach during slower times\n- **Seasonal Insights**: Patterns can reveal seasonal trends in your business that affect customer engagement\n- **Campaign Effectiveness**: Track how your marketing campaigns influence review submission timing\n\n## Taking Action\n\nUse this data to:\n1. Schedule review requests during peak engagement periods\n2. Create targeted campaigns for slow review periods\n3. Align review collection with your busiest business days\n4. Improve overall review volume consistency"
  }'

echo ""
echo "✅ Test complete! Check if it worked before running the full batch."
