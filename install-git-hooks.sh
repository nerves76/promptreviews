#!/bin/bash

# Install Git Hooks for Code Safety
# This script installs pre-commit hooks that run safety checks

set -e

echo "🔧 Installing Git Safety Hooks..."
echo "=================================="

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a Git repository"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit safety hook
# Runs safety checks before allowing commits

echo "🛡️  Running pre-commit safety checks..."

# Check if safety validator exists
if [ ! -f "code-safety-validator.js" ]; then
    echo "⚠️  Warning: Code safety validator not found"
    echo "Safety checks will be skipped"
    exit 0
fi

# Run full safety audit
echo "🔍 Running full safety audit..."
if ! node code-safety-validator.js --full-check; then
    echo ""
    echo "🚨 COMMIT BLOCKED: Safety audit failed"
    echo "❌ Critical safety issues detected"
    echo ""
    echo "Please fix the issues above before committing."
    echo "If you need to commit anyway (NOT RECOMMENDED), use:"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

# Check for dangerous patterns in staged files
echo "🔍 Checking staged files for dangerous patterns..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -n "$STAGED_FILES" ]; then
    # Check for dangerous SQL patterns
    if echo "$STAGED_FILES" | grep -E "\.(sql|js|ts)$" > /dev/null; then
        echo "📋 SQL/JavaScript files detected, checking for dangerous operations..."
        
        for file in $STAGED_FILES; do
            if [ -f "$file" ] && echo "$file" | grep -E "\.(sql|js|ts)$" > /dev/null; then
                # Check for dangerous SQL operations
                if grep -i -E "(DROP TABLE|DROP DATABASE|DELETE FROM.*(?!WHERE)|TRUNCATE TABLE)" "$file" > /dev/null; then
                    echo "🚨 DANGEROUS SQL OPERATION DETECTED in $file"
                    echo "❌ Commit blocked for safety"
                    echo ""
                    echo "If this operation is intentional, please:"
                    echo "1. Review the operation carefully"
                    echo "2. Create backups if needed"
                    echo "3. Use: git commit --no-verify (if absolutely sure)"
                    exit 1
                fi
                
                # Check for dangerous file operations
                if grep -E "(rm -rf|sudo rm|DELETE FROM [^W])" "$file" > /dev/null; then
                    echo "🚨 DANGEROUS FILE OPERATION DETECTED in $file"
                    echo "❌ Commit blocked for safety"
                    exit 1
                fi
            fi
        done
    fi
    
    # Check if critical files are being deleted
    DELETED_FILES=$(git diff --cached --name-only --diff-filter=D)
    if [ -n "$DELETED_FILES" ]; then
        echo "📋 File deletions detected, checking for critical files..."
        
        CRITICAL_FILES="package.json next.config.js .env supabase/config.toml restore_complete_schema.sql database-restoration-toolkit.js CODE_PROTECTION_SYSTEM.md"
        
        for critical_file in $CRITICAL_FILES; do
            if echo "$DELETED_FILES" | grep -F "$critical_file" > /dev/null; then
                echo "🚨 CRITICAL FILE DELETION DETECTED: $critical_file"
                echo "❌ Commit blocked for safety"
                echo ""
                echo "This file is critical for system operation and safety."
                echo "If deletion is intentional, use: git commit --no-verify"
                exit 1
            fi
        done
    fi
fi

echo "✅ Pre-commit safety checks passed"
exit 0
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create pre-push hook for additional safety
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Pre-push safety hook
# Additional safety checks before pushing to remote

echo "🛡️  Running pre-push safety checks..."

# Check if we're about to push dangerous changes
BRANCH=$(git branch --show-current)
echo "📋 Pushing branch: $BRANCH"

# Check recent commits for dangerous patterns
RECENT_COMMITS=$(git log --oneline -10)

if echo "$RECENT_COMMITS" | grep -i -E "(delete|drop|remove|destroy)" > /dev/null; then
    echo "⚠️  Recent commits contain potentially dangerous operations:"
    echo "$RECENT_COMMITS" | grep -i -E "(delete|drop|remove|destroy)"
    echo ""
    echo "Please verify these changes are intentional."
    echo "Continue? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Push cancelled by user"
        exit 1
    fi
fi

echo "✅ Pre-push safety checks passed"
exit 0
EOF

# Make pre-push hook executable
chmod +x .git/hooks/pre-push

# Create commit-msg hook to prevent dangerous commit messages
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Commit message safety hook
# Prevents commits with dangerous keywords in messages

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check for dangerous keywords in commit message
DANGEROUS_KEYWORDS="delete database|drop table|remove all|destroy|wipe|purge|delete everything"

if echo "$COMMIT_MSG" | grep -i -E "$DANGEROUS_KEYWORDS" > /dev/null; then
    echo "🚨 DANGEROUS COMMIT MESSAGE DETECTED"
    echo "❌ Commit message contains potentially dangerous keywords"
    echo ""
    echo "Message: $COMMIT_MSG"
    echo ""
    echo "If this is intentional, please:"
    echo "1. Review your changes carefully"
    echo "2. Ensure you have backups"
    echo "3. Use: git commit --no-verify"
    exit 1
fi

exit 0
EOF

# Make commit-msg hook executable
chmod +x .git/hooks/commit-msg

echo ""
echo "✅ Git safety hooks installed successfully!"
echo ""
echo "📋 Installed hooks:"
echo "   - pre-commit: Runs safety audit before commits"
echo "   - pre-push: Additional checks before pushing"
echo "   - commit-msg: Validates commit messages"
echo ""
echo "🛡️  Your repository is now protected against:"
echo "   ✅ Dangerous SQL operations"
echo "   ✅ Critical file deletions"
echo "   ✅ Unsafe shell commands"
echo "   ✅ Configuration changes without validation"
echo ""
echo "⚠️  To bypass hooks (NOT RECOMMENDED), use:"
echo "   git commit --no-verify"
echo "   git push --no-verify"
echo ""
echo "🔧 To test the hooks, try:"
echo "   npm run safety:full-audit"
EOF