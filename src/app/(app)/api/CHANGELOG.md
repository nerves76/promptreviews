# API Changelog

## [2025-09-03]
### Fixed - Loading States Standardization
- **Standardized all loading components:**
  - Updated `AppLoader` to use `StandardLoader` internally for consistency
  - Updated `PageLoader` to use `StandardLoader` internally for consistency
  - Fixed prompt page client (r/[slug]/page-client.tsx) to use single loader instead of duplicating loading UI
  - Removed unused FiveStarSpinner import from business-profile page
  - Fixed ServicePromptPageForm loading text to use white color on gradient background
  - Ensured no pages have multiple FiveStarSpinner components visible simultaneously

### Security - Comprehensive Security Audit Fixes
- **Fixed authentication bypass in AI endpoints:**
  - `/api/fix-grammar` - Added session verification, prevented user_id spoofing
  - `/api/generate-review` - Added authentication and account verification
  - `/api/generate-reviews` - Added complete auth system with ownership checks
  - All AI endpoints now require valid authentication and verify user ownership

- **Fixed public API data exposure:**
  - `/api/prompt-pages/[slug]` - Filtered sensitive business data from public access
  - Only returns necessary display fields (name, styling, social URLs)
  - Excludes emails, phones, addresses, internal settings, API keys
  - Added rate limiting protection

- **Security improvements:**
  - All endpoints use `createServerSupabaseClient()` for proper SSR auth
  - Added comprehensive security logging for violations
  - Implemented proper 401/403 status codes
  - Added account context verification throughout

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