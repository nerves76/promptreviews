# Unused Files Analysis for PromptReviews Project

Generated: July 1, 2025

## Summary

This analysis identified multiple categories of potentially unused files in your Next.js project. All files in the root directory were last modified on **July 1, 2025 at 8:31 PM UTC**, suggesting a recent bulk operation.

## 🔴 HIGH CONFIDENCE - Safe to Remove

### Empty Files (0 bytes)
These files contain no content and can be safely deleted:

- `current_schema.sql` - Empty SQL file
- `sentry.server.config.js` - Empty Sentry config (proper config exists in `src/instrumentation.ts`)
- `schema_export_20250626_182057.sql` - Empty schema export from June 26
- `next` - Stray empty file, not related to Next.js framework

### Standalone Test Scripts
These appear to be development/debugging scripts not integrated into the application:

- `test-admin-context.js` (2.6KB)
- `test-business-fix.js` (3.8KB) 
- `test-businesses-api.js` (5.3KB)
- `test-businesses-query.js` (3.1KB)
- `test-businesses-schema.js` (1.3KB)
- `test-current-user.js` (7.6KB)
- `test-force-signin-final.js` (2.1KB)
- `test-force-signin.js` (3.4KB)
- `test-onboarding-api.js` (6.1KB)
- `test-supabase-service-role.js` (717B)
- `test-universal-page.js` (5.3KB)
- `test-universal-prompt-creation.js` (9.5KB)
- `test-user-exists.js` (1.3KB)

**Evidence for removal:**
- No imports/requires found in main application code
- Not referenced in package.json scripts
- Self-contained scripts for debugging/testing
- One reference found in `cleanup-test-data.js` but it's also a utility script

## 🟡 MEDIUM CONFIDENCE - Review Before Removing

### Database Utility Scripts
These may be useful for database administration but aren't part of the main application:

- `check-accounts-schema.js` (3.3KB)
- `check-database-schema.js` (3.2KB)
- `check-email-templates.js` (1.4KB)
- `check-prompt-page-slugs.js` (3.2KB)
- `check-user-account.js` (3.9KB)
- `check-user.js` (2.1KB)
- `check-users.js` (2.1KB)
- `cleanup-test-data.js` (7.4KB)
- `clear-database.js` (4.5KB)
- `clear-session.js` (1.9KB)
- `confirm-all-emails.js` (2.1KB)
- `create-test-user.js` (1KB)
- `reset-user-password.js` (2.5KB)
- `troubleshoot-login.js` (12KB)
- `verify-tables.js` (2.8KB)

### SQL Files (Likely Temporary/One-off)
- `diagnose_admin_issue.sql` (1B)
- `disable_rls_test.sql` (320B)
- `test_admin_access.sql` (1.3KB)
- `test_admin_query.sql` (561B)
- `clear_all_test_data.sql` (4.1KB)
- `confirm-local-user-email.sql` (317B)
- `confirm-user-email.sql` (475B)
- `fix-account-rls.sql` (764B)
- Various `fix_*` and `check_*` SQL files

## 🟢 LOW RISK - Keep These

### Important Database Files
- `accounts_schema.sql` (57KB) - Core schema definition
- `local_schema.sql` (67KB) - Local development schema
- `db_dump.sql` (66KB) - Database backup
- `full_dump.sql` (66KB) - Complete database dump
- `restore_complete_schema.sql` (13KB) - Schema restoration

### Configuration Files
- `eslint.config.js` - ESLint configuration
- `next.config.js` - Next.js configuration  
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` / `package-lock.json` - Dependencies
- `vercel.json` - Deployment configuration

### Documentation
- All `.md` files contain project documentation

## 📊 Size Impact

**Total space that could be freed:**
- Empty files: ~0KB
- Test scripts: ~67KB
- Utility scripts: ~45KB  
- **Total potential savings: ~112KB**

## 🚀 Recommended Actions

1. **Immediate removal (Zero risk):**
   ```bash
   rm current_schema.sql sentry.server.config.js schema_export_20250626_182057.sql next
   ```

2. **Test scripts removal (Very low risk):**
   ```bash
   rm test-*.js
   ```

3. **Archive utility scripts** instead of deleting:
   ```bash
   mkdir -p archive/utils
   mv check-*.js cleanup-*.js clear-*.js confirm-*.js create-*.js reset-*.js troubleshoot-*.js verify-*.js archive/utils/
   ```

4. **Review one-off SQL files** and move to archive if no longer needed

## Notes

- The main application code in `src/` directory is well-organized and actively used
- No imports found referencing any of the root-level utility files
- All package.json scripts reference organized files in `scripts/` directory or standard Next.js commands
- Consider moving any useful utility scripts to the existing `scripts/` directory for better organization