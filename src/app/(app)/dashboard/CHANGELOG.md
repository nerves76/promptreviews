# Dashboard Changelog

## [2026-01-11] - Agency Accounts Feature
### Added
**New UI Pages for Agency Feature:**

**Agency Dashboard (`/agency/*`):**
- `/agency/layout.tsx` - Agency-specific layout with sidebar navigation
- `/agency/page.tsx` - Dashboard home with metrics grid and client cards
- `/agency/clients/page.tsx` - Client list with status filters and search
- `/agency/clients/[clientId]/page.tsx` - Client detail with billing management
  - View client info, metrics, billing status
  - Take over billing modal
  - Release billing modal
  - Disconnect client modal

**Agency Settings (`/dashboard/settings/agency-access/*`):**
- `/dashboard/settings/agency-access/page.tsx` - Client-side agency management
  - View managing agency
  - Accept/decline pending invitations
  - Remove agency access with billing warning
  - "Become an agency" promotion section
- `/dashboard/settings/agency-access/convert/page.tsx` - 4-step conversion wizard
  - Step 1: Agency type (freelancer, small, mid, enterprise)
  - Step 2: Employee count
  - Step 3: Expected client count
  - Step 4: Multi-location percentage
  - Progress indicator and benefits banner

**Account Page Updates (`/dashboard/account/page.tsx`):**
- Added "Agency" section showing:
  - Link to agency dashboard (for agencies)
  - Link to agency access settings (for managed clients)
  - Convert to agency button (for regular accounts)

**AccountSwitcher Updates:**
- Added "Agency Dashboard" link when `account.is_agncy = true`

**Auth Integration:**
- `accountSelection.ts` - Now fetches `is_agncy` field for account list
- Account context includes `is_agncy` and `managing_agncy_id`

**Documentation:** `/docs/AGENCY_ACCOUNTS.md`

## [2025-09-02] - Account Isolation Fix Complete
### Fixed
- Fixed remaining account isolation issues in final dashboard pages
- Both pages now respect account switcher selection correctly
- Pages were showing data from user's first account instead of selected account
- Root cause: `getAccountIdForUser()` function bypassed account selection
- Files fixed:
  - `/dashboard/account/page.tsx` - Account settings and management page
  - `/dashboard/plan/page.tsx` - Pricing and plan management page
- All pages now use `useAuth()` hook to get `selectedAccountId` and `account` from context
- Updated useEffect dependencies to re-render when account selection changes
- Account isolation fix is now complete across all dashboard pages

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