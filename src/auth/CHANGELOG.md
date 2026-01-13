# Auth System Changelog

## [2026-01-11]
### Added - Agency Account Support
- `accountSelection.ts` - Now fetches `is_agncy` field when listing user accounts
- `UserAccount` interface includes `is_agncy?: boolean` property
- Account context provides agency status for UI decisions

### Changed
- `account_users` table supports new agency roles: `agency_manager`, `agency_billing_manager`
- Agency roles excluded from `max_users` count (like `support` role)
- Sign-in page now checks `is_agncy` and redirects agency users to `/agency` instead of `/dashboard`
- `BusinessGuard` now exempts `/agency` routes from business creation requirement

## [2025-09-01]
### Fixed
- RLS (Row Level Security) policies were too restrictive
- Simplified account_users SELECT policy to prevent auth failures
- Users can now always see their own account_user records

### Changed
- AuthContext now properly isolates token refresh events
- Token refreshes no longer trigger UI re-renders
- Fixed account fetching logic for multi-account scenarios

## [Previous]
### Core Features
- Supabase authentication integration
- Multi-account support with account switching
- Session management with ~55 minute refresh cycle
- Business context management