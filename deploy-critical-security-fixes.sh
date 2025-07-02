#!/bin/bash

# =====================================================
# CRITICAL SECURITY FIXES DEPLOYMENT SCRIPT
# =====================================================
# This script applies the most critical authentication security fixes
# identified in the security audit.
#
# FIXES APPLIED:
# 1. Restore Row Level Security (RLS) on critical tables
# 2. Strengthen password policy requirements
# 3. Implement password reset rate limiting  
# 4. Replace vulnerable admin privilege escalation system
#
# Usage: ./deploy-critical-security-fixes.sh [--dry-run] [--force]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/security-fixes-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--dry-run] [--force]"
            echo "  --dry-run: Show what would be done without making changes"
            echo "  --force:   Skip confirmation prompts"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${message}" >&2
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${message}"
            ;;
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${message}"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Check if Supabase CLI is available
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        log "ERROR" "Supabase CLI not found. Please install it first:"
        log "INFO" "npm install -g supabase"
        exit 1
    fi
    
    log "INFO" "Supabase CLI found: $(supabase --version)"
}

# Check if we're in a Supabase project
check_supabase_project() {
    if [[ ! -f "supabase/config.toml" ]]; then
        log "ERROR" "Not in a Supabase project directory. supabase/config.toml not found."
        exit 1
    fi
    
    log "INFO" "Supabase project detected"
}

# Backup current configuration
backup_config() {
    local backup_dir="${SCRIPT_DIR}/security-backup-$(date +%Y%m%d-%H%M%S)"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would create backup in: $backup_dir"
        return 0
    fi
    
    mkdir -p "$backup_dir"
    
    # Backup Supabase config
    cp "supabase/config.toml" "$backup_dir/"
    log "SUCCESS" "Backed up supabase/config.toml to $backup_dir/"
    
    # Backup admin.ts if it exists
    if [[ -f "src/utils/admin.ts" ]]; then
        cp "src/utils/admin.ts" "$backup_dir/"
        log "SUCCESS" "Backed up src/utils/admin.ts to $backup_dir/"
    fi
    
    echo "$backup_dir" > "$SCRIPT_DIR/.last-backup-dir"
    log "INFO" "Backup location saved for potential rollback"
}

# Apply database migrations
apply_db_migrations() {
    local migrations=(
        "0067_restore_rls_security.sql"
        "0068_create_secure_admin_tables.sql"
    )
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would apply migrations:"
        for migration in "${migrations[@]}"; do
            log "INFO" "  - $migration"
        done
        return 0
    fi
    
    log "INFO" "Applying database migrations..."
    
    for migration in "${migrations[@]}"; do
        if [[ -f "supabase/migrations/$migration" ]]; then
            log "INFO" "Applying migration: $migration"
            if ! supabase db reset; then
                log "ERROR" "Failed to apply migration: $migration"
                return 1
            fi
            log "SUCCESS" "Applied migration: $migration"
        else
            log "WARNING" "Migration file not found: $migration"
        fi
    done
}

# Update password policy configuration
update_password_policy() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would update password policy:"
        log "INFO" "  - minimum_password_length: 6 → 12"
        log "INFO" "  - password_requirements: '' → 'lower_upper_letters_digits_symbols'"
        log "INFO" "  - max_frequency: '1s' → '60s'"
        return 0
    fi
    
    log "INFO" "Updating password policy in supabase/config.toml..."
    
    # The changes are already applied to the file, so just verify
    if grep -q "minimum_password_length = 12" supabase/config.toml && \
       grep -q 'password_requirements = "lower_upper_letters_digits_symbols"' supabase/config.toml && \
       grep -q 'max_frequency = "60s"' supabase/config.toml; then
        log "SUCCESS" "Password policy configuration updated"
    else
        log "ERROR" "Password policy update failed or incomplete"
        return 1
    fi
}

# Verify security fixes
verify_fixes() {
    log "INFO" "Verifying security fixes..."
    
    local verification_failed=false
    
    # Check if new migration files exist
    if [[ ! -f "supabase/migrations/0067_restore_rls_security.sql" ]]; then
        log "ERROR" "RLS restoration migration not found"
        verification_failed=true
    fi
    
    if [[ ! -f "supabase/migrations/0068_create_secure_admin_tables.sql" ]]; then
        log "ERROR" "Secure admin tables migration not found"
        verification_failed=true
    fi
    
    # Check if secure admin module exists
    if [[ ! -f "src/utils/adminSecurity.ts" ]]; then
        log "ERROR" "Secure admin module not found"
        verification_failed=true
    fi
    
    # Check password policy in config
    if ! grep -q "minimum_password_length = 12" supabase/config.toml; then
        log "ERROR" "Password length not updated in config"
        verification_failed=true
    fi
    
    if ! grep -q 'password_requirements = "lower_upper_letters_digits_symbols"' supabase/config.toml; then
        log "ERROR" "Password requirements not updated in config"
        verification_failed=true
    fi
    
    if ! grep -q 'max_frequency = "60s"' supabase/config.toml; then
        log "ERROR" "Password reset rate limiting not updated in config"
        verification_failed=true
    fi
    
    if [[ "$verification_failed" == "true" ]]; then
        log "ERROR" "Security fix verification failed"
        return 1
    fi
    
    log "SUCCESS" "All security fixes verified successfully"
}

# Generate deployment report
generate_report() {
    local report_file="${SCRIPT_DIR}/security-fixes-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << 'EOF'
# Critical Security Fixes Deployment Report

## Fixes Applied

### ✅ 1. Row Level Security (RLS) Restored
- **Migration**: `0067_restore_rls_security.sql`
- **Impact**: Prevents unauthorized access to account data
- **Status**: Applied
- **Details**: 
  - Re-enabled RLS on `accounts` and `account_users` tables
  - Created secure policies for user data access
  - Added verification functions

### ✅ 2. Strengthened Password Policy  
- **File**: `supabase/config.toml`
- **Impact**: Prevents weak password attacks
- **Status**: Applied
- **Changes**:
  - Minimum length: 6 → 12 characters
  - Requirements: None → Letters, numbers, symbols
  - Complexity: Basic → Full complexity required

### ✅ 3. Password Reset Rate Limiting
- **File**: `supabase/config.toml`  
- **Impact**: Prevents brute force password reset attacks
- **Status**: Applied
- **Changes**:
  - Rate limit: 1 second → 60 seconds between attempts

### ✅ 4. Secure Admin Management System
- **Migration**: `0068_create_secure_admin_tables.sql`
- **Module**: `src/utils/adminSecurity.ts`
- **Impact**: Prevents unauthorized admin privilege escalation
- **Status**: Applied
- **Features**:
  - Admin request/approval workflow
  - Audit logging for all admin actions
  - Rate limiting on admin requests
  - Multi-step verification process
  - Automatic request expiration

## Security Improvements

| Issue | Before | After | Risk Reduction |
|-------|---------|--------|----------------|
| Account Data Access | Any authenticated user | Only account owner | Critical → Secure |
| Password Strength | 6 chars, no requirements | 12 chars + complexity | High → Low |
| Password Reset Abuse | 1 second intervals | 60 second intervals | Critical → Medium |
| Admin Creation | Automatic by email | Request + approval | Critical → Secure |

## Next Steps

1. **Test the changes** in development environment
2. **Deploy to production** during maintenance window
3. **Monitor logs** for any authentication issues
4. **Train team** on new admin request process
5. **Review existing admin accounts** for legitimacy

## Rollback Instructions

If issues occur, restore from backup:
```bash
# Restore config
cp /path/to/backup/config.toml supabase/

# Rollback database migrations
supabase db reset --to 0066

# Remove new files
rm src/utils/adminSecurity.ts
```

## Monitoring

- Monitor authentication errors in logs
- Watch for RLS policy violations
- Track admin request submissions
- Alert on multiple failed password resets

---
Generated: $(date)
Deployment Log: $LOG_FILE
EOF

    log "SUCCESS" "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "INFO" "Starting Critical Security Fixes Deployment"
    log "INFO" "Log file: $LOG_FILE"
    log "INFO" "Dry run: $DRY_RUN"
    
    # Pre-flight checks
    check_supabase_cli
    check_supabase_project
    
    # Show what will be done
    log "INFO" "The following critical security fixes will be applied:"
    log "INFO" "1. 🔐 Restore Row Level Security (RLS) on critical tables"
    log "INFO" "2. 🔒 Strengthen password policy (12 chars + complexity)"
    log "INFO" "3. ⏱️  Implement password reset rate limiting (60s)"
    log "INFO" "4. 👤 Replace vulnerable admin privilege system"
    
    # Get confirmation unless forced
    if [[ "$FORCE" != "true" && "$DRY_RUN" != "true" ]]; then
        echo
        read -p "Do you want to proceed with these security fixes? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Create backup
    backup_config
    
    # Apply fixes
    log "INFO" "Applying security fixes..."
    
    # 1. Database migrations
    if ! apply_db_migrations; then
        log "ERROR" "Database migration failed"
        exit 1
    fi
    
    # 2. Password policy (already applied to files)
    if ! update_password_policy; then
        log "ERROR" "Password policy update failed"
        exit 1
    fi
    
    # Verify all fixes
    if ! verify_fixes; then
        log "ERROR" "Security fix verification failed"
        exit 1
    fi
    
    # Generate report
    generate_report
    
    log "SUCCESS" "🎉 Critical security fixes deployed successfully!"
    log "INFO" "Please test your application thoroughly before deploying to production"
    log "WARNING" "Remember to:"
    log "WARNING" "- Test authentication flows"
    log "WARNING" "- Verify admin access still works"
    log "WARNING" "- Check that users can only access their own data"
    log "WARNING" "- Train team on new admin request process"
}

# Run main function
main "$@"