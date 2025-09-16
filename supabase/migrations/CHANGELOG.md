# Database Migrations Changelog

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