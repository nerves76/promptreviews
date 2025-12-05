#!/bin/bash

# Clear All Test Data from PromptReviews Database using Supabase CLI
# 
# This script uses the Supabase CLI to execute the SQL cleanup script
# to remove all test data while preserving table structure.
# 
# Usage: ./clear-database-cli.sh
# 
# Prerequisites:
# - Supabase CLI installed (npm install -g supabase)
# - Logged into Supabase CLI (supabase login)
# - Project linked (supabase link --project-ref YOUR_PROJECT_REF)

set -e

echo "🔍 Checking Supabase CLI installation..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in a linked project
if ! supabase status &> /dev/null; then
    echo "❌ Not in a linked Supabase project."
    echo "   Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Project is linked"

echo "⚠️  WARNING: This will delete ALL data from the database!"
echo "   Tables to be cleared:"
echo "   - auth.users (all user accounts)"
echo "   - accounts, account_users, businesses, contacts"
echo "   - widgets, widget_reviews, review_submissions"
echo "   - prompt_pages, analytics_events, ai_usage"
echo "   - feedback, announcements, quotes"
echo "   - email_templates, trial_reminder_logs, admins"
echo ""

read -p "Are you sure you want to proceed? Type 'YES' to confirm: " confirmation

if [ "$confirmation" != "YES" ]; then
    echo "❌ Operation cancelled by user"
    exit 0
fi

echo "🗑️  Executing database cleanup..."

# Execute the SQL script using Supabase CLI
supabase db reset --linked

echo "✅ Database has been reset to initial state"
echo "🎉 All test data has been removed!"
echo "🚀 You can now test the sign-up process with a clean database." 