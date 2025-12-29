# Rank Tracking Feature - Changelog

## [2025-12-28]
### Fixed - Data Consistency Improvements
- **Normalization fix in ConceptsTable**: Now uses shared `normalizePhrase()` function
  - Previously used inline `toLowerCase().trim()` which didn't collapse multiple spaces
  - Ensures volume/rank lookups match correctly with saved data
  - Import: `import { normalizePhrase } from '@/features/keywords/keywordUtils'`

- **Rank Tracking page normalization**: Updated `rankData` Map to use `normalizePhrase()`
  - Ensures consistent lookup of rank check data by search term
  - Matches normalization used when saving data

- **Auto-refresh on visibility**: Page now refetches data when user navigates back
  - Listens for `visibilitychange` events
  - Calls `fetchResearchResults()` and `fetchRankChecks()` on page visible
  - Ensures data is always fresh after running checks on other pages

## [2025-12-11]

### Added
- **DataForSEO SERP Client** (`api/dataforseo-serp-client.ts`)
  - Complete TypeScript client for DataForSEO's organic search APIs
  - Five main functions:
    1. `searchGoogleSerp()` - Get organic search results with SERP features
    2. `checkRankForDomain()` - Find domain position and competitors
    3. `getKeywordVolume()` - Get search volume, CPC, competition data
    4. `getKeywordSuggestions()` - Get related keyword ideas
    5. `getAvailableLocations()` - Fetch all location codes
  - Automatic timeout handling (30 seconds)
  - Cost tracking for all API calls
  - Detailed error handling and logging
  - SERP feature detection (featured snippets, site links, FAQs, images, videos, map pack, AI overview)
  - Structured response types with TypeScript interfaces

- **Test Suite** (`api/dataforseo-serp-client.test.ts`)
  - Comprehensive test coverage for all five functions
  - Example usage patterns and output
  - Run with: `npx tsx src/features/rank-tracking/api/dataforseo-serp-client.test.ts`

- **Documentation** (`api/README.md`)
  - Complete usage guide with code examples
  - Common location codes reference
  - SERP features documentation
  - Cost information
  - Integration patterns
  - Error handling guide

### Technical Details
- **Auth Pattern**: Copied from `/src/features/geo-grid/api/dataforseo-client.ts`
- **Environment Variables**: Uses `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`
- **Logging**: Emoji-prefixed console logs (`🔍`, `✅`, `❌`)
- **API Endpoints**:
  - Organic SERP: `/v3/serp/google/organic/live/advanced`
  - Keyword Volume: `/v3/keywords_data/google_ads/search_volume/live`
  - Keyword Suggestions: `/v3/dataforseo_labs/google/keyword_suggestions/live`
  - Locations: `/v3/serp/google/locations`

### Response Types
- `SerpSearchResult` - Search results with items array
- `SerpItem` - Individual result with position, URL, title, description, SERP features
- `SerpRankResult` - Domain rank check with competitors
- `KeywordVolumeResult` - Search volume with monthly trend data
- `KeywordSuggestion` - Related keyword with metrics
- `DataForSEOLocation` - Location code with name and country

### Use Cases
- Track organic search rankings across keywords
- Monitor competitor positions
- Research high-volume, low-competition keywords
- Analyze SERP features and opportunities
- Build keyword clustering tools
- Create rank tracking dashboards

### Notes
- All functions include proper error handling and return structured responses
- Cost is tracked even on failed requests
- Default depth is 100 results for SERP searches
- Default location is USA (2840) for keyword research
- Monthly search trend data included in volume results

- **React Hooks** (`hooks/`)
  - `useRankGroups` - Manage keyword groups (CRUD operations)
    - Create, update, delete groups
    - Auto-fetch on mount with loading states
    - Device type (desktop/mobile) and location configuration
    - Optional scheduling (daily/weekly/monthly)
  - `useGroupKeywords` - Manage keywords within a group
    - Add/remove keywords from groups
    - Fetch keywords with latest position data
    - Account-isolated keyword access
  - `useRankHistory` - Fetch and display rank check history
    - Get historical rank data for a group or keyword
    - Trigger on-demand rank checks
    - Loading state for running checks
    - Returns results with competitor data
  - `useLocations` - Search DataForSEO locations
    - Search locations by name
    - Returns location codes for rank tracking
    - Used in group creation/editing
  - `useKeywordDiscovery` - Keyword research capabilities
    - Discover keyword data (volume, CPC, competition)
    - Get keyword suggestions
    - Rate limit tracking
    - Monthly trend data
  - All hooks use `apiClient` for automatic auth header injection
  - All hooks follow established patterns from `useGeoGridConfig`
  - Proper TypeScript typing with exported interfaces
  - Error handling with user-friendly messages
