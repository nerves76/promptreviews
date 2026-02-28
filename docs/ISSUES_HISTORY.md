# Resolved Issues History

Historical log of resolved issues. Moved from CLAUDE.md to reduce file size.

## 2025-11-29 - Google Business Reviews Account Isolation Fix
- **Issue:** "Failed to fetch reviews" and "Review Data Unavailable" errors on GBP Reviews tab
- **Root Cause:** All `reviews-management` APIs were querying `google_business_profiles` by `user_id` instead of `account_id`
- **Also Fixed:** Response time metric now uses median of last 12 months (was mean of all time, skewed by outliers)
- **Files Fixed:**
  - `/api/reviews-management/fetch-reviews/route.ts`
  - `/api/reviews-management/respond-review/route.ts`
  - `/api/reviews-management/update-review-reply/route.ts`
  - `/api/reviews-management/unresponded-reviews/route.ts`
  - `/components/ReviewManagement.tsx` - Now uses `apiClient`
  - `/components/UnrespondedReviewsWidget.tsx` - Now uses `apiClient`
  - `/lib/googleBusiness/overviewAggregator.ts` - Median + 12-month filter
- **Status:** RESOLVED

## 2025-01-13 - Communication & Contacts Account Isolation Fixes
- **Issues Found:** Communication records, reminders, and contacts not isolated by account
- **Communication System:** Fixed APIs to use `getRequestAccountId()`, components to use `apiClient`
- **Contacts System:** Fixed page queries and API endpoints to filter by account
- **Social Posting:** Fixed GBP and AI endpoints to use proper account context
- **Status Labels:** Fixed to use server Supabase client
- **Status:** RESOLVED - All data properly isolated by account
- **Files Fixed:** 11 files across communication, contacts, and social posting systems

## 2025-09-03 - Comprehensive Security Audit and Fixes
- **Issues Found:** Multiple account isolation vulnerabilities in prompt page features
- **AI Endpoints:** Fixed authentication bypass in fix-grammar and generate-review APIs
- **Kickstarters:** Added account verification to prevent cross-account access
- **Public API:** Filtered sensitive business data from public endpoints
- **Business Defaults:** Completed inheritance for all missing features
- **Status:** RESOLVED - All vulnerabilities fixed and deployed
- **Files Fixed:** 19 files with comprehensive security enhancements

## 2025-09-02 - Cross-Account Platform Leakage
- **Issue:** Review platforms from wrong accounts appearing in Universal Prompt Pages
- **Root Cause:** Fallback logic used business platforms even when explicitly cleared
- **Solution:** Distinguished between null (never saved) and empty array (explicitly cleared)
- **Status:** RESOLVED - Platform inheritance logic fixed

## 2025-09-01 - Critical Account Isolation Breach
- **Issue:** Dashboard pages showing data from wrong accounts when using account switcher
- **Symptoms:** Prompt pages, reviews, and widgets displaying data from user's first account regardless of selection
- **Root Cause:** `getAccountIdForUser()` function bypasses account switcher, always returns first account
- **Status:** RESOLVED
- **Solution:** Replace `getAccountIdForUser()` with auth context hooks throughout dashboard

## 2025-08 - Automatic Page Refreshes (Timer-based)
- **Issue:** All pages refresh automatically on a timer (~55 minutes)
- **Root Cause:** Likely related to auth token refresh cycle
- **Status:** Debug tools deployed (RefreshDebugger, UltimateRefreshDebugger, GlobalRefreshMonitor in root layout)
- **Workaround:** Save work frequently, autosave is active on most forms

## 2024 - Widget Page Refreshes
- **Issue:** Form data loss, PageCard flickering
- **Root Cause:** Duplicate fetches, token refresh side effects
- **Status:** RESOLVED
- **Documentation:** `/docs/WIDGET_REFRESH_FIX.md`
