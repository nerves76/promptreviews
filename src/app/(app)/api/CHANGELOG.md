# API Changelog

## [2025-09-02]
### Security
- Fixed critical security vulnerabilities in `/api/fix-grammar` endpoint:
  - Added proper session verification using `createServerSupabaseClient()`
  - Added user_id validation to prevent ID spoofing attacks
  - Added proper error logging for security violations
  - Implemented proper 401/403 status codes for unauthorized/forbidden requests

## [2025-09-01]
### Fixed
- Stripe webhook not processing due to missing stripe listen command
- Webhook now properly updates account plan after checkout.session.completed
- Added proper error message extraction in signup route to avoid empty {} errors
- Signup route no longer sets trial dates during account creation (only when plan selected)

### Changed
- Trial dates now only set when user selects a paid plan, not during signup
- Added is_additional_account flag to distinguish additional accounts from primary accounts

## [Previous]
### Webhook Endpoints
- `/api/stripe-webhook` - Handles Stripe payment events
- `/api/auth/signup` - User registration endpoint
- `/api/accounts/create-additional` - Multi-account support