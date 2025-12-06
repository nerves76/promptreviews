# Geo Grid Rank Tracker - Implementation Plan

## Overview

Add a "Geo Grid" feature that shows users how their featured keywords affect Google Maps/Local Pack visibility across geographic points around their business.

**Core Value Proposition:** Close the loop between keyword-optimized reviews and actual local search visibility.

---

## Naming Convention

| Layer | Convention | Example |
|-------|------------|---------|
| Database tables | `gg_` prefix | `gg_configs`, `gg_checks`, `gg_tracked_keywords` |
| Feature folder | Full name | `src/features/geo-grid/` |
| API routes | Kebab-case | `/api/geo-grid/` |
| Hooks | Full name | `useGeoGridConfig`, `useGeoGridResults` |
| Components | Full name | `GeoGridDashboard`, `GeoGridSetup` |
| Types | Prefixed | `GGConfig`, `GGCheckResult`, `GGPointSummary` |

**Why "Geo Grid":** Industry-standard term for this type of rank tracking. Distinct from future organic/SERP rank tracking which could use `rank_tracker_*` or `serp_*` naming.

---

## Product Principles (Guardrails)

1. **Bundle-first, keyword-second** - Default view tracks all selected keywords as a bundle; inspecting individual phrases is secondary
2. **Buckets over precise ranks** - Show visibility tiers (Top-3 / Top-10 / Top-20 / Not showing) instead of raw rank numbers
3. **Trend signal, not "one true rank"** - Local results vary by location/device/time; we show consistent snapshots for trend tracking
4. **Correlation, not causation** - Never promise keyword → rank increase; show "adoption ↑ and visibility moved in same period"

---

## Phase 1 Scope (MVP)

### What We're Building

1. **Admin-only page** at `/admin/geo-grid` for initial testing
2. **5-point geo grid** (center + N/S/E/W) around business location
3. **User-selected keywords** for tracking (default to active pool)
4. **Daily rank checks** via DataForSEO API
5. **Simple results display** (table view first, map later)
6. **Cost tracking** in `ai_usage` table pattern
7. **Soft limits** with manual review (no complex Stripe billing)

### What We're NOT Building (Phase 2+)

- Fancy map visualization with colored markers
- Automatic insights/recommendations
- More than 5 check points
- Competitor deep-dive views
- Before/after comparison views
- Per-account DataForSEO credentials
- Stripe usage-based billing

---

## Technical Architecture

### Database Schema

```sql
-- ============================================
-- Table 1: Configuration per account
-- ============================================
CREATE TABLE gg_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  google_business_location_id UUID REFERENCES google_business_locations(id),

  -- Center point (from GBP location or manual entry)
  center_lat DECIMAL(10,7) NOT NULL,
  center_lng DECIMAL(10,7) NOT NULL,
  radius_miles DECIMAL(5,2) DEFAULT 3.0,

  -- Which points to check (default 5)
  check_points JSONB DEFAULT '["center","n","s","e","w"]'::jsonb,

  -- State
  is_enabled BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(account_id)
);

-- ============================================
-- Table 2: Which keywords to track per config
-- ============================================
CREATE TABLE gg_tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(config_id, keyword_id)
);

-- ============================================
-- Table 3: Individual rank check results
-- ============================================
CREATE TABLE gg_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Location checked
  check_point TEXT NOT NULL, -- 'center', 'n', 's', 'e', 'w'
  point_lat DECIMAL(10,7) NOT NULL,
  point_lng DECIMAL(10,7) NOT NULL,

  -- Results
  position INT, -- null if not found in top 20
  position_bucket TEXT, -- 'top3', 'top10', 'top20', 'none'
  business_found BOOLEAN DEFAULT false,

  -- Competitor context (top 3)
  top_competitors JSONB, -- [{name, rating, review_count, position}]

  -- Our listing's stats at time of check
  our_rating DECIMAL(2,1),
  our_review_count INT,
  our_place_id TEXT,

  -- Metadata
  checked_at TIMESTAMPTZ DEFAULT now(),
  api_cost_usd DECIMAL(10,6),
  raw_response JSONB, -- full API response for debugging (30-day retention)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Table 4: Daily aggregates for trends
-- ============================================
CREATE TABLE gg_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,

  -- Bundle-level stats
  total_keywords_checked INT,
  keywords_in_top3 INT,
  keywords_in_top10 INT,
  keywords_in_top20 INT,
  keywords_not_found INT,

  -- Per-point breakdown
  point_summaries JSONB, -- {"center": {"top3": 5, "top10": 8}, "n": {...}}

  -- Cost tracking
  total_api_cost_usd DECIMAL(10,6),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(account_id, check_date)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_gg_configs_account ON gg_configs(account_id);
CREATE INDEX idx_gg_tracked_keywords_config ON gg_tracked_keywords(config_id);
CREATE INDEX idx_gg_tracked_keywords_account ON gg_tracked_keywords(account_id);
CREATE INDEX idx_gg_checks_account_date ON gg_checks(account_id, checked_at DESC);
CREATE INDEX idx_gg_checks_keyword ON gg_checks(keyword_id, checked_at DESC);
CREATE INDEX idx_gg_checks_config_date ON gg_checks(config_id, checked_at DESC);
CREATE INDEX idx_gg_daily_summary_account ON gg_daily_summary(account_id, check_date DESC);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE gg_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_daily_summary ENABLE ROW LEVEL SECURITY;

-- Users can access their account's data
CREATE POLICY "Users can access own account gg_configs"
  ON gg_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_configs.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own account gg_tracked_keywords"
  ON gg_tracked_keywords FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_tracked_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own account gg_checks"
  ON gg_checks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own account gg_daily_summary"
  ON gg_daily_summary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_daily_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Service role bypass for cron jobs
CREATE POLICY "Service role full access gg_configs"
  ON gg_configs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access gg_tracked_keywords"
  ON gg_tracked_keywords FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access gg_checks"
  ON gg_checks FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access gg_daily_summary"
  ON gg_daily_summary FOR ALL
  TO service_role USING (true) WITH CHECK (true);
```

### File Structure

```
src/
├── features/
│   └── geo-grid/
│       ├── index.ts                          # Re-exports
│       │
│       ├── api/
│       │   └── dataforseo-client.ts          # DataForSEO API wrapper
│       │
│       ├── services/
│       │   ├── point-calculator.ts           # Geo math for 5 cardinal points
│       │   ├── rank-checker.ts               # Core check logic
│       │   ├── bucket-calculator.ts          # Position → bucket conversion
│       │   └── summary-aggregator.ts         # Daily summary generation
│       │
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── useGeoGridConfig.ts           # Config CRUD
│       │   ├── useGeoGridResults.ts          # Results fetching
│       │   └── useGeoGridKeywords.ts         # Keyword selection
│       │
│       ├── components/
│       │   ├── index.ts
│       │   ├── GeoGridSetup.tsx              # Initial setup flow
│       │   ├── GeoGridDashboard.tsx          # Main results view
│       │   ├── GeoGridKeywordSelector.tsx    # Pick keywords to track
│       │   ├── GeoGridResultsTable.tsx       # Table view of results
│       │   ├── GeoGridBundleSummary.tsx      # Overall visibility stats
│       │   ├── GeoGridPointSummary.tsx       # Per-point breakdown
│       │   └── GeoGridTrendChart.tsx         # 7-day trend (simple)
│       │
│       └── utils/
│           ├── types.ts                      # TypeScript interfaces
│           └── transforms.ts                 # DB → API transformations
│
├── app/(app)/
│   ├── admin/
│   │   └── geo-grid/
│   │       └── page.tsx                      # Admin-only page
│   │
│   └── api/
│       └── geo-grid/
│           ├── config/
│           │   └── route.ts                  # GET/POST config
│           ├── tracked-keywords/
│           │   └── route.ts                  # GET/POST/DELETE tracked keywords
│           ├── check/
│           │   └── route.ts                  # POST trigger manual check
│           ├── results/
│           │   └── route.ts                  # GET results
│           └── summary/
│               └── route.ts                  # GET daily summaries
```

### Environment Variables

```bash
# Add to .env.local
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

### Cost Tracking

Use existing `ai_usage` table pattern:

```typescript
await serviceSupabase.from("ai_usage").insert({
  user_id: user.id,
  account_id: accountId,
  feature_type: "geo_grid_check",
  prompt_tokens: 0,  // Not applicable
  completion_tokens: 0,
  total_tokens: 0,
  cost_usd: apiCost,  // From DataForSEO response
  created_at: new Date().toISOString(),
});
```

---

## Implementation Phases

### Phase 1A: Foundation (Database + API Client)

**Tasks:**
1. Create database migration with all 4 tables + indexes + RLS
2. Run `npx prisma db pull` and `npx prisma generate`
3. Create DataForSEO client wrapper
4. Create point calculator service
5. Add environment variables

**Deliverables:**
- Migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_geo_grid_tables.sql`
- Prisma schema updated
- `src/features/geo-grid/api/dataforseo-client.ts`
- `src/features/geo-grid/services/point-calculator.ts`

**Review Checkpoint:** Verify migration applies cleanly, API client can authenticate

---

### Phase 1B: Core Services

**Tasks:**
1. Create rank checker service (calls DataForSEO, stores results)
2. Create bucket calculator (position → top3/top10/top20/none)
3. Create summary aggregator (generates daily summaries)
4. Create utility types and transforms

**Deliverables:**
- `src/features/geo-grid/services/rank-checker.ts`
- `src/features/geo-grid/services/bucket-calculator.ts`
- `src/features/geo-grid/services/summary-aggregator.ts`
- `src/features/geo-grid/utils/types.ts`
- `src/features/geo-grid/utils/transforms.ts`

**Review Checkpoint:** Unit test rank checker with mock data, verify bucket logic

---

### Phase 1C: API Routes

**Tasks:**
1. Create config API route (GET/POST)
2. Create tracked-keywords API route (GET/POST/DELETE)
3. Create check API route (POST - trigger manual check)
4. Create results API route (GET)
5. Create summary API route (GET)

**Patterns to Follow:**
- Use `createServerSupabaseClient()` for auth
- Use `getRequestAccountId()` for account isolation
- Use service client for writes
- Transform DB rows to API responses
- Track costs in `ai_usage` table

**Deliverables:**
- `src/app/(app)/api/geo-grid/config/route.ts`
- `src/app/(app)/api/geo-grid/tracked-keywords/route.ts`
- `src/app/(app)/api/geo-grid/check/route.ts`
- `src/app/(app)/api/geo-grid/results/route.ts`
- `src/app/(app)/api/geo-grid/summary/route.ts`

**Review Checkpoint:** Test all endpoints via curl/Postman, verify account isolation

---

### Phase 1D: React Hooks

**Tasks:**
1. Create useGeoGridConfig hook
2. Create useGeoGridKeywords hook
3. Create useGeoGridResults hook

**Patterns to Follow:**
- Use `apiClient` for all requests
- Manage loading/error/data states
- Provide CRUD methods
- Use `useCallback` for methods

**Deliverables:**
- `src/features/geo-grid/hooks/useGeoGridConfig.ts`
- `src/features/geo-grid/hooks/useGeoGridKeywords.ts`
- `src/features/geo-grid/hooks/useGeoGridResults.ts`
- `src/features/geo-grid/hooks/index.ts`

**Review Checkpoint:** Hooks work correctly with API routes

---

### Phase 1E: Admin UI Components

**Tasks:**
1. Create GeoGridSetup component (initial config)
2. Create GeoGridKeywordSelector component (checkbox list of keywords)
3. Create GeoGridBundleSummary component (overall stats)
4. Create GeoGridResultsTable component (tabular results)
5. Create admin page that ties it together

**Patterns to Follow:**
- Use existing UI components (PageCard, buttons, alerts)
- Follow admin page layout pattern
- Use FiveStarSpinner for loading
- Use existing form input styles
- Use metric card pattern for stats

**Deliverables:**
- `src/features/geo-grid/components/GeoGridSetup.tsx`
- `src/features/geo-grid/components/GeoGridKeywordSelector.tsx`
- `src/features/geo-grid/components/GeoGridBundleSummary.tsx`
- `src/features/geo-grid/components/GeoGridResultsTable.tsx`
- `src/features/geo-grid/components/index.ts`
- `src/app/(app)/admin/geo-grid/page.tsx`

**Review Checkpoint:** Full flow works - setup → select keywords → run check → see results

---

### Phase 1F: Polish & Testing

**Tasks:**
1. Add admin nav link for Geo Grid
2. Error handling and edge cases
3. Loading states throughout
4. Empty states (no config, no keywords, no results)
5. Manual testing with real DataForSEO calls
6. Cost verification

**Deliverables:**
- Updated `src/app/(app)/admin/layout.tsx` with nav link
- Comprehensive error handling
- All edge cases covered

**Review Checkpoint:** Feature is production-ready for admin testing

---

## Multi-Agent Review Architecture

Each phase includes a **Review Checkpoint** where we pause for verification before proceeding.

### Review Process

After each phase:

1. **Code Review Agent** - Verify:
   - Account isolation is correct (all queries filter by account_id)
   - Existing patterns are followed (apiClient, hooks, transforms)
   - No security issues (auth checks, RLS policies)
   - TypeScript types are correct
   - Error handling is complete

2. **Integration Test** - Verify:
   - API routes return expected data
   - Hooks work with API routes
   - Components render correctly
   - Full flow works end-to-end

3. **Human Review** - You verify:
   - Feature works as expected
   - UI looks correct
   - Data makes sense
   - Ready to proceed to next phase

### Rollback Strategy

If issues are found:
- Database: Create reversal migration
- Code: Git revert to last checkpoint
- Each phase is a logical unit that can be reverted independently

---

## Existing Components to Reuse

### From UI Library
- `PageCard` - Main card wrapper
- `FiveStarSpinner` - Loading indicator
- `ButtonSpinner` - Button loading state
- `Icon` - Icons throughout
- `HelpBubble` - Contextual help
- Input styles from existing forms

### From Admin Pages
- Admin layout and nav pattern
- Metric card grid (4-column)
- Table with header/rows pattern
- Filter/tab buttons
- Alert messages (success/error)
- Button styles (primary/secondary/danger)

### From Keywords Feature
- `useKeywords` hook pattern
- `KeywordChip` component (for selection UI)
- Transform utilities pattern
- API route structure

---

## API Specifications

### DataForSEO Google Maps API

**Endpoint:** `POST https://api.dataforseo.com/v3/serp/google/maps/live/advanced`

**Request:**
```json
[{
  "language_code": "en",
  "location_coordinate": "37.7749,-122.4194,17",
  "keyword": "dentist near me"
}]
```

**Response (key fields):**
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "maps_search",
        "rank_group": 1,
        "rank_absolute": 1,
        "title": "Business Name",
        "rating": {
          "value": 4.5,
          "votes_count": 123
        },
        "place_id": "ChIJ..."
      }]
    }],
    "cost": 0.002
  }]
}
```

### Internal API Routes

#### GET /api/geo-grid/config
Returns current config for account (or null if not set up)

#### POST /api/geo-grid/config
Create/update config with center point and settings

#### GET /api/geo-grid/tracked-keywords
Returns list of keywords being tracked

#### POST /api/geo-grid/tracked-keywords
Add keywords to tracking

#### DELETE /api/geo-grid/tracked-keywords
Remove keywords from tracking

#### POST /api/geo-grid/check
Trigger a manual rank check (returns job ID or results)

#### GET /api/geo-grid/results
Returns recent check results with filtering options

#### GET /api/geo-grid/summary
Returns daily summaries for trend display

---

## Data Retention Strategy

| Table | Retention | Cleanup Method |
|-------|-----------|----------------|
| `gg_configs` | Forever | N/A |
| `gg_tracked_keywords` | Forever | N/A |
| `gg_checks` | 90 days | Monthly cron |
| `gg_checks.raw_response` | 30 days | Monthly cron (set to NULL) |
| `gg_daily_summary` | Forever | N/A (small footprint) |

**Cleanup SQL (for future cron job):**
```sql
-- Null out raw responses older than 30 days
UPDATE gg_checks
SET raw_response = NULL
WHERE raw_response IS NOT NULL
  AND checked_at < NOW() - INTERVAL '30 days';

-- Delete detailed checks older than 90 days
DELETE FROM gg_checks
WHERE checked_at < NOW() - INTERVAL '90 days';
```

---

## Cost Estimates

### Per Check
- 5 points × N keywords = 5N API calls
- Cost per call: ~$0.002 (Live mode)
- Example: 12 keywords = 60 calls = $0.12

### Monthly (Daily checks)
- 60 calls/day × 30 days = 1,800 calls = $3.60/account

### Soft Limit Recommendation
- Monthly cap: $10/account (~5,000 checks)
- Warning at: $7.50 (75%)
- This allows ~28 keywords tracked daily

---

## Success Criteria

Phase 1 is complete when:

1. Admin can set up Geo Grid for their account
2. Admin can select keywords to track
3. Admin can trigger a manual check
4. Results display in a table with bucket indicators
5. Bundle summary shows overall visibility
6. Costs are tracked in ai_usage table
7. All data is properly account-isolated
8. No errors in console, clean loading states

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| 5 or 7 points? | 5 (center + cardinal) |
| Counts or percentages? | Counts ("8/12 phrases") |
| Center point source? | From connected GBP location |
| GBP required? | Yes, prerequisite for feature |
| Billing model? | Soft limits, track in ai_usage |
| Admin-only initially? | Yes, at /admin/geo-grid |
| Naming convention? | `gg_` prefix for tables, `GeoGrid` for components |

---

## Next Steps

1. Review this plan document
2. Approve to proceed with Phase 1A
3. Build iteratively with review checkpoints
4. Test with real DataForSEO API calls
5. Iterate based on data quality feedback
