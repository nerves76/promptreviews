# Database Migrations Changelog

## [2025-10-01]
### Migrations Added

#### 20251001000000_add_account_id_to_review_submissions.sql
- Added `account_id` UUID column to `review_submissions` table for account isolation
- Backfilled `account_id` from associated `prompt_pages` table
- Created indexes for performance on account-based queries
- Added trigger function `auto_populate_review_submission_account_id()` to automatically populate account_id on INSERT/UPDATE
- Added trigger `trigger_auto_populate_review_submission_account_id` to ensure account_id is always set from prompt_page

#### 20251001000001_update_review_submissions_rls_policies.sql
- **SECURITY FIX**: Replaced permissive RLS policies with account-based access control
- Dropped old policies: "Allow select for authenticated users", "Allow public read access for submitted reviews", "Users manage their reviews"
- Created new authenticated policy: Users can only view/manage reviews for accounts they belong to (via account_users table)
- Created new anonymous policy: Only allows viewing submitted reviews from universal prompt pages with recent_reviews_enabled=true
- Preserved anonymous INSERT policy for public review submissions
- Enforces proper account isolation to prevent cross-account data leakage

## [2025-09-20]
### Migrations Added

#### 20250920125016_simplify_account_user_trigger.sql
- Simplified ensure_account_user trigger to reduce complexity
- Removed triple user ID detection logic in favor of simpler approach
- Prefer created_by field, fall back to auth.uid() only

## [2025-09-18]
### Migrations Added

#### 20250918090000_add_created_by_to_accounts.sql
- Added `created_by` column to `accounts` with auditing index and foreign key
- Backfilled attribution using earliest owner membership
- Updated auth triggers and `ensure_account_user` to set `created_by`

## [2025-09-01]
### Migrations Added

#### 20250901000002_fix_account_users_select_policy.sql
- Simplified RLS policies for account_users table
- Fixed overly restrictive SELECT policy that prevented auth

#### 20250901000003_fix_trial_dates_for_new_accounts.sql  
- Updated create_account_for_new_user() trigger
- Trial dates no longer set during account creation
- Trial dates only set when user selects paid plan

#### 20250901000004_add_is_additional_account_flag.sql
- Added is_additional_account boolean column to accounts table
- Distinguishes additional accounts from primary accounts
- Prevents additional accounts from getting free trials

## [Previous]
### Database Schema
- accounts table with multi-tenant support
- account_users junction table for many-to-many relationships
- RLS policies for security
- Triggers for automatic account creation
