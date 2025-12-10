# Database Migrations Changelog

## [2025-12-09]
### Migrations Added

#### 20251226000000_add_review_auto_verified_notifications.sql
- **NEW FEATURE**: Auto-verified review notification system
- **notification_type enum**: Added `review_auto_verified` value for when Prompt Page reviews are verified on Google
- **notification_preferences table**: Added `in_app_review_auto_verified` and `email_review_auto_verified` columns (both default TRUE)
- **email_templates table**: Added `review_auto_verified` template with green success styling
  - Subject: "Great news! {{reviewerName}}'s review is now live on Google"
  - Variables: firstName, reviewerName, reviewContent, starRatingStars, reviewsUrl, accountUrl
- **Purpose**: Notify account owners when their customers' Prompt Page submissions are auto-verified against published Google reviews
- **Triggers**:
  - Primary: `reviewSyncService.ts` during Google review import
  - Fallback: `verify-google-reviews` daily cron job
- **UI**: Toggle added to Account settings page under Notification settings
- **Related Refactor**: Notifications system refactored to use centralized registry pattern (see `/docs/NOTIFICATIONS_SYSTEM.md`)

## [2025-10-12]
### Migrations Added

#### 20251012000001_create_sentiment_analysis_runs.sql
- **NEW FEATURE**: Sentiment analysis feature for review analytics
- **sentiment_analysis_runs table**: Stores historical sentiment analysis results with full metrics
- **Columns**: id, account_id, run_date, review_count_analyzed, date_range_start, date_range_end, plan_at_time, results_json, analysis_version, processing_time_seconds, created_at
- **Indexes**: idx_sentiment_runs_account_date (account_id, run_date DESC) and idx_sentiment_runs_account_month (account_id, DATE_TRUNC('month', run_date))
- **accounts table updates**: Added sentiment_analyses_this_month (INTEGER, default 0) and sentiment_last_reset_date (DATE, default CURRENT_DATE)
- **RLS Policies**: Users can view/create/delete sentiment runs for their own accounts
- **Purpose**: Track sentiment analysis usage per account and store full analysis results with JSONB for flexible querying
- **Plan Limits**: Grower (5/month), Builder (20/month), Maven (unlimited)

## [2025-10-02]
### Migrations Added

#### 20251002001007_add_style_preset_to_businesses.sql
- **BUG FIX**: Added style_preset column to properly track selected design preset
- **Issue**: After saving design changes, preset selection would switch to wrong preset (e.g., glassy -> snazzy)
- **Root Cause**: System tried to guess which preset matched saved settings by comparing all fields (fragile and error-prone)
- **Solution**: Added style_preset TEXT column to businesses table to explicitly store selected preset name
- **Valid Values**: glassy, solid, paper, outdoorsy, snazzy, or custom
- **Code Updates**: StyleModalPage now saves selectedPreset value when saving and loads it when fetching
- **Behavior**: Preset selection now persists correctly across save/reload cycles
- **Fallback**: Falls back to checkIfMatchesPreset detection for existing data without saved preset

#### 20251002001006_fix_universal_prompt_page_status_filter.sql
- **HOTFIX**: Fix universal prompt page access by removing status filter
- **Issue**: Migration 20251002001000 added status filter that broke universal prompt pages in non-in_queue statuses
- **Impact**: Universal prompt pages with status = complete, in_progress, sent, follow_up, or draft returned 404
- **Root Cause**: Policy restricted to `is_universal = true AND status = 'in_queue'` but status is not a gating signal for public access
- **Fix**: Removed status filter - anon policy now allows access to ANY universal prompt page: `USING (is_universal = true)`
- **Why Necessary**: Universal pages should be publicly accessible regardless of workflow status
- **Security Note**: Status is a workflow tracking field, not an access control field; universal pages are designed to be publicly shared

#### 20251002001005_hotfix_restore_public_prompt_page_access.sql
- **MIGRATION SUPERSEDED**: This migration ran with incorrect policy (attempted to allow all in_queue pages)
- **Superseded by**: 20251002001006 which correctly removes status filter for universal pages only

#### 20251002001004_restrict_public_leaderboard_access.sql
- **SECURITY HARDENING**: Restricted public_leaderboard view to prevent unrestricted direct database access
- **BEFORE**: View had GRANT SELECT TO anon/authenticated, allowing unlimited direct queries from any Supabase client
- **AFTER**: Only service_role can SELECT from the view
- **Access Control**: Leaderboard data still public, but now accessed exclusively through /api/game/leaderboard endpoint
- **Rate Limiting**: API endpoint enforces 20 requests per minute per IP to prevent scraping and abuse
- **Benefits**: Prevents scraping, enables monitoring, reduces DB load through controlled access
- Leaderboard remains publicly viewable but with proper abuse prevention controls

#### 20251002001003_restrict_critical_function_health_access.sql
- **CRITICAL SECURITY FIX**: Fixed global data leak in critical_function_health view exposed to all authenticated users
- **critical_function_health view**: View aggregated GLOBAL operational telemetry across ALL accounts (function names, failure rates, runtime)
- **BEFORE**: View had GRANT SELECT TO authenticated, exposing platform-wide critical function metrics to any logged-in user
- **AFTER**: Only service_role can SELECT from the view
- **Code Updates**: Created /api/admin/critical-monitoring route that verifies admin status before using service role to query view
- **Code Updates**: Updated /admin/critical-monitoring page to call API route instead of direct Supabase query
- Admin UI now properly proxies access through authenticated admin API that checks permissions
- Prevents exposure of operational intelligence and platform architecture details to customers

#### 20251002001002_harden_game_leaderboard_security.sql
- **SECURITY HARDENING**: Full security lockdown for game leaderboard tables
- **game_leaderboard table**: Added missing UPDATE/DELETE prevention policies
- **game_scores table**: Revoked direct SELECT access to hide PII (emails, IP addresses)
- **BEFORE**: Anyone could read raw email addresses and IP addresses from game_scores table
- **AFTER**: Public must use public_leaderboard view which masks emails (shows ***@domain.com)
- **Rate Limiting**: DB-enforced 10 submissions per 5 minutes per IP (via trigger)
- **Daily Limits**: DB-enforced 50 submissions per 24 hours per IP (prevents spam)
- **Score Validation**: Triggers prevent impossibly high scores based on level reached
- **Speed Checks**: Warns about suspiciously fast completion times (potential cheating)
- **API Updates**: submit-score route now captures real IP/user-agent and handles rate limit errors with 429 status
- Prevents score tampering, PII exposure, spam submissions, and cheating

#### 20251002001001_restrict_admin_views_access.sql
- **CRITICAL SECURITY FIX**: Fixed global data leak in admin views exposed to all authenticated users
- **reactivation_metrics view**: View showed GLOBAL reactivation statistics across ALL accounts (total counts, averages)
- **account_users_readable view**: View exposed user emails and business details from joined tables across ALL accounts
- **BEFORE**: Both views had GRANT SELECT TO authenticated/anon/public, exposing platform-wide admin data to any logged-in user
- **AFTER**: Only service_role can SELECT from these views
- Admin routes must use service role client after checking caller is an admin
- Prevents platform-wide metrics enumeration and protects sensitive admin data

#### 20251002001000_harden_prompt_pages_rls.sql
- **CRITICAL SECURITY FIX**: Fixed permissive public policy and broken authenticated policies on prompt_pages
- **Issue 1 - Public enumeration**: Policy allowed TO public with USING (status = 'in_queue'), exposing ALL queued prompt pages across ALL accounts to any session
- **Issue 2 - Broken auth policies**: Used `auth.uid() = account_id` which is incorrect (compares user_id to account_id UUID)
- **BEFORE**: Any user could enumerate all prompt pages with status = 'in_queue' regardless of account
- **AFTER**: Anonymous users can only view universal pages that are still in queue (is_universal = true AND status = 'in_queue')
- **BEFORE**: Authenticated policies were ineffective due to UUID type mismatch
- **AFTER**: Authenticated policies properly use account_users junction table
- All authenticated policies now use `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`
- Prevents cross-account prompt page enumeration and ensures proper multi-account access

#### 20251002000000_reenable_account_invitations_rls.sql
- **SECURITY FIX**: Re-enabled RLS on account_invitations table with proper owner-only policies
- **BEFORE**: RLS was completely disabled (migrations 0088, 0132), allowing any authenticated user to view all invitations
- **AFTER**: Only account owners can view, create, update, or delete invitations for their accounts
- All policies use `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND role = 'owner')`
- Invitation acceptance flows updated to use service role client for token-based lookups
- Prevents enumeration of team invitations across accounts
- Maintains secure token-based acceptance flow for new users

## [2025-10-01]
### Migrations Added

#### 20251001000002_fix_rls_account_isolation.sql
- **CRITICAL SECURITY FIX**: Fixed world-readable RLS policies across multiple tables
- **widgets table**: Replaced `auth.uid()` checks with proper account_users junction table queries; restricted anon access to only active widgets
- **widget_reviews table**: Added account scoping via widgets join; restricted anon access to reviews for active widgets only
- **analytics_events table**: Replaced `USING (true)` with account filtering via prompt_pages join; prevents cross-account analytics exposure
- **admins table**: Restricted SELECT to admins only (was readable by all authenticated users)
- All authenticated policies now use `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())` pattern
- Prevents enumeration of admin accounts, widget configurations, and analytics data across tenants
- Anonymous access now properly restricted to only active/public resources

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
