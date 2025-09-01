# Dashboard Changelog

## [2025-09-01] - Part 2
### Fixed - Critical Account Isolation Issue
- Multiple dashboard pages not respecting account switcher selection
- Pages were showing data from user's first account instead of selected account
- Root cause: `getAccountIdForUser()` function bypasses account selection
- Fixed components now use auth context hooks for current account
- Added proper dependencies to re-fetch data when switching accounts
- Files fixed:
  - `/dashboard/edit-prompt-page/universal/page.tsx` - Universal prompt page editor
  - `/dashboard/edit-prompt-page/[slug]/page.tsx` - Individual prompt page editor
  - `/dashboard/widget/components/ReviewManagementModal.tsx` - Review management modal
  - `/dashboard/widget/WidgetList.tsx` - Updated to pass selectedAccount prop
  - `/dashboard/widget/page.tsx` - Updated to pass selectedAccount prop
  - `/dashboard/reviews/page.tsx` - Reviews listing page
- API endpoints verified clean - no account isolation issues found

## [2025-09-01]
### Fixed
- Pricing modal no longer appears after successful Stripe payment
- Added checks for payment success parameters and recent account updates
- Increased timeout for justCompletedPayment flag from 1s to 10s
- Added multiple safeguards against modal reappearing

### Added
- Logout button in pricing modal when plan selection is required
- Users can now sign out if they don't want to select a plan immediately

## [2025-08-31]
### Fixed
- Hydration mismatch error after Stripe payment
- Converted direct window checks to useState/useEffect pattern in layout.tsx
- Fixed isPlanPageSuccess check to prevent SSR/client mismatch

## [Previous]
### Features
- Dashboard main page with business stats
- Plan selection flow
- Success modals for payment completion
- Business creation flow integration
- Trial eligibility checking