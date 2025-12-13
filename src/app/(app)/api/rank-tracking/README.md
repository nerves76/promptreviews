# Rank Tracking API Routes

Complete API implementation for Google SERP rank tracking feature.

## Overview

All routes follow geo-grid patterns for consistency:
- ✅ Account isolation via `getRequestAccountId()`
- ✅ Server Supabase client for privileged operations
- ✅ Proper error handling and logging
- ✅ Credit-based pricing integration
- ✅ Rate limiting for discovery endpoints

## API Routes

### 1. Groups Management

#### `GET /api/rank-tracking/groups`
List all keyword groups for the account.

**Response:**
```json
{
  "groups": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "name": "Portland Desktop",
      "device": "desktop",
      "locationCode": 1022858,
      "locationName": "Portland, Oregon, United States",
      "scheduleFrequency": "weekly",
      "scheduleDayOfWeek": 1,
      "scheduleHour": 9,
      "nextScheduledAt": "2025-01-13T17:00:00Z",
      "lastCheckedAt": "2025-01-06T17:00:00Z",
      "isEnabled": true,
      "keywordCount": 5
    }
  ]
}
```

#### `POST /api/rank-tracking/groups`
Create a new keyword group.

**Body:**
```json
{
  "name": "Portland Desktop",
  "device": "desktop",
  "locationCode": 1022858,
  "locationName": "Portland, Oregon, United States",
  "scheduleFrequency": "weekly",
  "scheduleDayOfWeek": 1,
  "scheduleHour": 9
}
```

### 2. Single Group

#### `GET /api/rank-tracking/groups/[id]`
Get group details with summary stats.

**Response:**
```json
{
  "group": {
    "id": "uuid",
    "name": "Portland Desktop",
    "summary": {
      "avgPosition": 7.5,
      "keywordsInTop10": 8,
      "keywordsRanking": 10
    }
  }
}
```

#### `PUT /api/rank-tracking/groups/[id]`
Update group settings.

**Body:**
```json
{
  "name": "Portland Desktop (Updated)",
  "scheduleFrequency": "daily",
  "scheduleHour": 10,
  "isEnabled": true
}
```

#### `DELETE /api/rank-tracking/groups/[id]`
Delete group (cascades to keywords and checks).

### 3. Group Keywords

#### `GET /api/rank-tracking/groups/[id]/keywords`
List keywords in group with latest positions.

**Response:**
```json
{
  "keywords": [
    {
      "id": "uuid",
      "keywordId": "uuid",
      "keyword": {
        "phrase": "best plumber",
        "searchQuery": "best plumber portland"
      },
      "targetUrl": "https://example.com/plumbing",
      "latestPosition": 4,
      "latestCheckedAt": "2025-01-06T17:00:00Z",
      "latestMatchedTargetUrl": true
    }
  ]
}
```

#### `POST /api/rank-tracking/groups/[id]/keywords`
Add keywords to group.

**Body:**
```json
{
  "keywordIds": ["uuid1", "uuid2"],
  "targetUrls": {
    "uuid1": "https://example.com/plumbing",
    "uuid2": "https://example.com/services"
  }
}
```

#### `DELETE /api/rank-tracking/groups/[id]/keywords`
Remove keywords from group.

**Body:**
```json
{
  "keywordIds": ["uuid1", "uuid2"]
}
```

### 4. Manual Check

#### `POST /api/rank-tracking/check`
Run manual rank check with credit debit.

**Body:**
```json
{
  "groupId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "checksPerformed": 10,
  "totalApiCost": 0.02,
  "creditsUsed": 10,
  "creditsRemaining": 90,
  "results": [
    {
      "keywordId": "uuid",
      "phrase": "best plumber",
      "searchQuery": "best plumber portland",
      "position": 4,
      "foundUrl": "https://example.com/plumbing",
      "found": true,
      "matchedTargetUrl": true
    }
  ]
}
```

**Error (Insufficient Credits):**
```json
{
  "error": "Insufficient credits",
  "required": 10,
  "available": 5
}
```
Status: `402 Payment Required`

**Credit Flow:**
1. Calculate cost: `keywordCount × 1 credit`
2. Check balance
3. Debit credits with idempotency key
4. Run DataForSEO SERP checks
5. Store results in `rank_checks` table
6. Refund on failure (not implemented in POST, but available via `refundFeature()`)

### 5. Results

#### `GET /api/rank-tracking/results`
Fetch rank check results.

**Query Params:**
- `groupId` (required)
- `keywordId` (optional) - Filter by keyword
- `mode` - `current` (latest per keyword) or `history` (all checks)
- `startDate` - Filter after date (YYYY-MM-DD)
- `endDate` - Filter before date (YYYY-MM-DD)
- `limit` - Max results (default 100)

**Response (current mode):**
```json
{
  "results": [
    {
      "keywordId": "uuid",
      "keyword": {
        "phrase": "best plumber"
      },
      "position": 4,
      "foundUrl": "https://example.com/plumbing",
      "serpFeatures": {
        "featuredSnippet": false,
        "mapPack": true
      },
      "checkedAt": "2025-01-06T17:00:00Z"
    }
  ],
  "mode": "current",
  "lastCheckedAt": "2025-01-06T17:00:00Z"
}
```

### 6. Schedule Settings

#### `GET /api/rank-tracking/groups/[id]/schedule`
Get schedule settings.

**Response:**
```json
{
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": 1,
    "hour": 9,
    "nextScheduledAt": "2025-01-13T17:00:00Z",
    "isEnabled": true
  }
}
```

#### `PUT /api/rank-tracking/groups/[id]/schedule`
Update schedule settings.

**Body:**
```json
{
  "frequency": "daily",
  "hour": 10
}
```

**Frequency Options:**
- `daily` - Run every day at specified hour
- `weekly` - Run on `dayOfWeek` (0-6) at specified hour
- `monthly` - Run on `dayOfMonth` (1-28) at specified hour
- `null` - Disable scheduling

### 7. Locations

#### `GET /api/rank-tracking/locations`
Search locations for rank tracking.

**Query Params:**
- `search` (optional) - Search query
- `limit` (default 100)

**Response:**
```json
{
  "locations": [
    {
      "locationCode": 1022858,
      "locationName": "Portland, Oregon, United States",
      "countryIsoCode": "US",
      "locationType": "City"
    }
  ]
}
```

**Fallback:** If `rank_locations` table doesn't exist, returns common US locations (25+ cities and states).

### 8. Keyword Discovery

#### `POST /api/rank-tracking/discovery`
Get search volume and trend for a keyword.

**Body:**
```json
{
  "keyword": "best plumber",
  "locationCode": 1022858
}
```

**Response:**
```json
{
  "keyword": "best plumber",
  "volume": 1900,
  "trend": "rising",
  "cpc": 12.50,
  "competition": 0.75,
  "competitionLevel": "HIGH",
  "monthlySearches": [
    {
      "year": 2024,
      "month": 12,
      "searchVolume": 2100
    }
  ],
  "rateLimit": {
    "limit": 50,
    "used": 5,
    "remaining": 45,
    "resetsAt": "2025-01-07T00:00:00Z"
  }
}
```

**Rate Limit:** 50 requests per day per account
**Error (Rate Limited):**
```json
{
  "error": "Daily keyword research limit reached. Try again tomorrow.",
  "limit": 50,
  "used": 50,
  "resetsAt": "2025-01-07T00:00:00Z"
}
```
Status: `429 Too Many Requests`

#### `GET /api/rank-tracking/discovery/suggestions`
Get keyword suggestions.

**Query Params:**
- `seed` (required) - Seed keyword
- `locationCode` (default 2840)
- `limit` (default 50)

**Response:**
```json
{
  "suggestions": [
    {
      "keyword": "best plumber near me",
      "volume": 3200,
      "cpc": 15.20,
      "competition": 0.80,
      "competitionLevel": "HIGH"
    }
  ],
  "rateLimit": {
    "limit": 50,
    "used": 6,
    "remaining": 44
  }
}
```

## Database Tables

### `rank_keyword_groups`
Keyword groups (device + location + schedule).

### `rank_group_keywords`
Keywords tracked in each group.

### `rank_checks`
Historical ranking results.

### `rank_discovery_usage`
Daily usage tracking for discovery endpoints.

## Error Handling

All routes return consistent error responses:

```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no auth)
- `402` - Payment Required (insufficient credits)
- `404` - Not Found (group/keyword not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Credit Pricing

| Action | Credits |
|--------|---------|
| Check one keyword in one group | 1 credit |

**Examples:**
- 10 keywords × 1 group = 10 credits
- 10 keywords × 3 groups = 30 credits

## Account Isolation

✅ All routes use `getRequestAccountId()` to enforce account isolation.
✅ All database queries filter by `account_id`.
✅ Keyword validation ensures keywords belong to the account.

## Console Logging

All routes log operations with consistent prefixes:
- `🔄 [RankTracking]` - Starting operation
- `✅ [RankTracking]` - Success
- `❌ [RankTracking]` - Error
- `💳 [RankTracking]` - Credit operations
- `🔍 [RankTracking]` - Search operations

## Testing Checklist

Before deploying:
- [ ] Test all CRUD operations for groups
- [ ] Test adding/removing keywords
- [ ] Test manual check with sufficient credits
- [ ] Test manual check with insufficient credits (expect 402)
- [ ] Test discovery with rate limit (expect 429 after 50 requests)
- [ ] Test account isolation (create test account, verify no data leakage)
- [ ] Test schedule settings (verify next_scheduled_at calculation)
- [ ] Test results fetching (current and history modes)

## DataForSEO Integration

Uses existing SERP client:
- `/src/features/rank-tracking/api/dataforseo-serp-client.ts`
- `checkRankForDomain()` - Check rank for target domain
- `getKeywordVolume()` - Get search volume data
- `getKeywordSuggestions()` - Get keyword suggestions

## Target Domain Resolution

For Phase 1, target domain is extracted from business profile:
```typescript
const { data: business } = await serviceSupabase
  .from('businesses')
  .select('business_website')
  .eq('account_id', accountId)
  .single();

const targetDomain = extractDomain(business?.business_website);
```

## Next Steps

1. Create frontend UI components
2. Create cron job for scheduled checks (`/api/cron/run-scheduled-rank-checks`)
3. Add notifications for position drops
4. Implement rank_locations table for full location search
5. Add CHANGELOG.md entry
