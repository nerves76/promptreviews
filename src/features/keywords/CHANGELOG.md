# Keywords Feature Changelog

## [2025-12-28]
### Fixed - Keyword Data Consistency Across Features
- **Normalization consistency**: All keyword lookups now use shared `normalizePhrase()` function
  - Handles lowercase, trim, and collapse multiple spaces to single space
  - Prevents lookup mismatches when terms have irregular spacing
  - Files: `useVolumeData.ts`, `useRankStatus.ts`, `useGeoGridStatus.ts`

- **Auto-refresh on page visibility**: Added `visibilitychange` event listeners to all keyword hooks
  - `useVolumeData` - Refetches volume data when page becomes visible
  - `useRankStatus` - Refetches rank status when page becomes visible
  - `useGeoGridStatus` - Refetches geo grid status when page becomes visible
  - Ensures data is always fresh after running checks on other pages

- **KeywordManager visibility refresh**: Added visibility change handler to refetch enrichment data
  - When user navigates away and returns, enrichment data auto-refreshes
  - Prevents stale data after running rank/volume checks elsewhere

### Added - Manual Review Matching Check
- **New UI**: "Check reviews" button in Reviews section of keyword sidebar
- **Location**: `components/sidebar/ReviewsEditSection.tsx`
- **Behavior**:
  - Button appears when keyword has a review phrase or aliases set
  - Costs 1 credit per check
  - Scans all account reviews for matches
  - Shows result toast with: reviews scanned, total matches, exact/alias breakdown
  - Automatically clears result after 5 seconds
- **API**: Calls `POST /api/keywords/[id]/check-reviews`

### How Review Matching Works
1. User clicks "Check reviews (1 credit)" button
2. System debits 1 credit from account
3. Fetches all reviews for the account
4. Clears existing matches for this keyword
5. Runs `KeywordMatchService` to find phrase/alias matches
6. Updates keyword usage counts via `syncKeywordUsageCounts`
7. Returns match statistics to UI
8. On failure, automatically refunds the credit

### Related Files
- `keywordMatchService.ts` - Core matching logic
- `reprocessKeywordMatches.ts` - Batch processing and count sync
- `/api/keywords/[id]/check-reviews/route.ts` - API endpoint
