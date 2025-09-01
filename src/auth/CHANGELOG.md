# Auth System Changelog

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