# Geo Grid Feature - Changelog

## [2025-12-28]
### Fixed - Data Consistency Improvements
- **Auto-refresh on visibility**: `useGeoGridResults` hook now refetches data when page becomes visible
  - Listens for `visibilitychange` events
  - Calls `fetchResults()` when `document.visibilityState === 'visible'`
  - Ensures data is always fresh after running checks on other pages
  - Only refetches when `autoFetch` is enabled and account is selected
