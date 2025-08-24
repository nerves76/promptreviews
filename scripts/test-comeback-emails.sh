#!/bin/bash

# Test script for comeback email cron job
# This script tests the comeback email functionality locally

echo "🧪 Testing Comeback Email Cron Job"
echo "=================================="
echo ""

# Check if CRON_SECRET_TOKEN is set
if [ -z "$CRON_SECRET_TOKEN" ]; then
  echo "❌ CRON_SECRET_TOKEN not set. Please set it in your .env.local file"
  exit 1
fi

# Test the cron endpoint
echo "📧 Triggering comeback email check..."
echo ""

curl -X GET http://localhost:3002/api/cron/send-comeback-emails \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "✅ Test complete! Check the response above for results."
echo ""
echo "Expected behavior:"
echo "- Should check for accounts cancelled 75-105 days ago"
echo "- Should send emails to eligible accounts"
echo "- Should record sends in communication_history table"
echo "- Should not send to accounts that already received the email"