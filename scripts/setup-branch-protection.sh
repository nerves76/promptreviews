#!/bin/bash

# Branch Protection Setup Script for PromptReviews
# This script sets up GitHub branch protection rules for main and staging branches

set -e  # Exit on error

echo "========================================="
echo "GitHub Branch Protection Setup"
echo "========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

echo "✅ GitHub CLI is installed"
echo ""

# Check authentication
echo "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "⚠️  Not authenticated with GitHub CLI"
    echo ""
    echo "Please authenticate now by running the following:"
    echo "This will open your browser for authentication."
    echo ""
    gh auth login
    echo ""
fi

# Verify authentication worked
if ! gh auth status &> /dev/null; then
    echo "❌ Authentication failed. Please try again."
    exit 1
fi

echo "✅ Authenticated with GitHub"
echo ""

# Get repo info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Function to create branch protection
protect_branch() {
    local branch=$1
    local require_approvals=${2:-0}

    echo "----------------------------------------"
    echo "Setting up protection for: $branch"
    echo "----------------------------------------"

    # Enable branch protection with comprehensive rules
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        "/repos/$REPO/branches/$branch/protection" \
        --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": $require_approvals
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Branch '$branch' is now protected"
    else
        echo "❌ Failed to protect branch '$branch'"
        return 1
    fi
    echo ""
}

# Protect main branch
echo "=== Protecting 'main' branch ==="
echo ""
echo "Protection settings:"
echo "  • Require pull request before merging (0 approvals for solo work)"
echo "  • Require status checks to pass"
echo "  • Require branches to be up to date"
echo "  • Require conversation resolution"
echo "  • Block force pushes"
echo "  • Block deletion"
echo ""

protect_branch "main" 0

# Ask about staging branch
echo "=== Staging Branch ==="
read -p "Do you want to protect the 'staging' branch too? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    protect_branch "staging" 0
else
    echo "Skipping staging branch protection"
fi

echo ""
echo "========================================="
echo "✅ Branch Protection Setup Complete!"
echo "========================================="
echo ""
echo "You can view and modify these settings at:"
echo "https://github.com/$REPO/settings/branches"
echo ""
echo "Note: As the repo owner, you can still push directly to protected"
echo "branches. Consider enabling 'Require status checks' once you have"
echo "CI/CD set up (like GitHub Actions for testing)."
echo ""
