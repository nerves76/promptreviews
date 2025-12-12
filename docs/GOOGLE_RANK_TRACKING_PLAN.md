# Google Rank Tracking Plan

Plan to ship Google SERP rank tracking (DataForSEO) built around the **keyword concept** as the central entity. A concept represents an idea your business wants to own, tracked across organic search, local pack, reviews, and more.

## The Keyword Concept Model

A **keyword concept** represents a topic/idea. Everything else supports measuring how well you "own" that concept:

```
Concept: "Best Food Branding Agency"
│
├── Canonical phrase: "best food branding agency"
├── Review phrase: "the best food branding agency on the west coast"
├── Search query: "best food branding agency portland"
├── Aliases: ["food branding expert", "branding agency for food companies"]
│
└── Tracked across:
    ├── SERP Rankings
    │   ├── Portland Desktop → #4
    │   ├── Portland Mobile → #6
    │   └── US National → #12
    ├── Local Pack (Geo-Grid)
    │   └── Portland 3mi → top 3 at 4/5 points
    ├── Reviews
    │   └── 8 mentions via aliases
    ├── Website (future)
    │   └── 3 pages address this concept
    └── LLM Mentions (future)
        └── Mentioned in ChatGPT, Perplexity responses
```

The concept is the atomic unit of "topic ownership" measurement.

## Existing Keywords Table = Concepts

The current `keywords` table already supports this model:

| Field | Role |
|-------|------|
| `phrase` | Canonical identifier for the concept |
| `review_phrase` | Customer-facing version (shown on prompt pages) |
| `search_query` | Optimized for rank tracking APIs |
| `aliases` | Variations for review matching |
| `location_scope` | Local vs regional vs national intent |

**Rule:** When adding a new keyword:
- Is this a new concept? → Create new keyword entry
- Is this a variation of existing concept? → Add as alias

## Goals

- Track Google organic rankings for keyword concepts by location and device
- Same concept can be tracked in multiple groups (Portland Desktop, US National, etc.)
- Roll up visibility metrics at the concept level across all channels
- Credit-based pricing (no hard caps, pay-per-check)
- Reuse existing keyword library, credits, notifications, account isolation

## Data Model

### 1. `rank_keyword_groups` — Keyword groups defined by device + location

```sql
CREATE TABLE rank_keyword_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Portland Desktop", "US Mobile", etc.
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile')),
  location_code INT NOT NULL,            -- DataForSEO location code
  location_name TEXT NOT NULL,           -- "Portland, Oregon, United States"

  -- Scheduling
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INT CHECK (schedule_day_of_week BETWEEN 0 AND 6),
  schedule_day_of_month INT CHECK (schedule_day_of_month BETWEEN 1 AND 28),
  schedule_hour INT NOT NULL DEFAULT 9 CHECK (schedule_hour BETWEEN 0 AND 23),
  next_scheduled_at TIMESTAMPTZ,
  last_scheduled_run_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,

  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rank_keyword_groups_account ON rank_keyword_groups(account_id);
CREATE INDEX idx_rank_keyword_groups_schedule ON rank_keyword_groups(next_scheduled_at)
  WHERE is_enabled = true AND schedule_frequency IS NOT NULL;
```

### 2. `rank_group_keywords` — Concepts in each group

```sql
CREATE TABLE rank_group_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES rank_keyword_groups(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  target_url TEXT,                       -- Expected URL (for cannibalization detection)
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(group_id, keyword_id)
);

CREATE INDEX idx_rank_group_keywords_group ON rank_group_keywords(group_id);
CREATE INDEX idx_rank_group_keywords_keyword ON rank_group_keywords(keyword_id);
```

### 3. `rank_checks` — Ranking results over time

```sql
CREATE TABLE rank_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES rank_keyword_groups(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  search_query_used TEXT NOT NULL,       -- Actual query sent to API
  position INT,                          -- NULL if not in top N
  found_url TEXT,                        -- URL that ranked
  matched_target_url BOOLEAN,            -- Cannibalization flag

  serp_features JSONB,                   -- {featured_snippet, map_pack, faq, images, etc.}
  top_competitors JSONB,                 -- [{domain, position, url, title}]

  api_cost_usd DECIMAL(10,6),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rank_checks_account ON rank_checks(account_id);
CREATE INDEX idx_rank_checks_group_date ON rank_checks(group_id, checked_at DESC);
CREATE INDEX idx_rank_checks_keyword_date ON rank_checks(keyword_id, checked_at DESC);
CREATE INDEX idx_rank_checks_account_keyword ON rank_checks(account_id, keyword_id, checked_at DESC);
```

### Notes

- **No separate config table** — Groups ARE the config (device + location + schedule)
- **Same concept in multiple groups** — Track "best plumber" in Portland Desktop AND US National
- **Concept-level rollups** — Query by `keyword_id` across all groups to see full picture
- **RLS policies** — Mirror geo-grid patterns, filter by `account_id`

## User Flow

### Creating a Keyword Group

1. User clicks "New Group"
2. Enters name: "Portland Desktop"
3. Selects device: Desktop
4. Selects location: Portland, Oregon (location code picker)
5. Sets schedule: Weekly on Mondays at 9am

### Adding Concepts to a Group

1. User opens group "Portland Desktop"
2. Clicks "Add Keywords"
3. Selects concepts from existing keyword library
4. Same concept can be added to multiple groups

### Viewing Results

**Group View:**
- List of concepts with current position + trend sparkline
- Overall metrics (avg position, visibility score, keywords in top 10)
- Last checked timestamp
- "Run Now" button with credit estimate

**Concept Detail View (click on a keyword):**
- Position history chart (7/30/90 days)
- Current URL ranking
- SERP features detected
- Competitors at this position
- **Cross-group comparison:** "This concept ranks #4 in Portland Desktop, #12 in US National"

**Concept Hub View (future):**
- All groups tracking this concept
- Geo-grid visibility for this concept
- Review mentions for this concept
- Website pages addressing this concept

## Example Groups

| Group Name | Device | Location | Use Case |
|------------|--------|----------|----------|
| Portland Desktop | desktop | Portland, OR | Local organic rankings |
| Portland Mobile | mobile | Portland, OR | Mobile-specific rankings |
| Oregon Statewide | desktop | Oregon | Regional visibility |
| US National | desktop | United States | National rankings |

## Search Query Selection

When checking rankings, use this priority:
1. `keywords.search_query` — if set, optimized for ranking APIs
2. `keywords.phrase` — fallback to canonical phrase

Store `search_query_used` in `rank_checks` for debugging.

## Credits and Pricing

### Philosophy
Credit-based like geo-grids: no hard keyword limits, all usage metered.

### DataForSEO Costs
- SERP API: ~$0.002 per request
- Our credits: ~$0.10 each
- Margin: ~50×

### Pricing (Simple)

| Action | Credits |
|--------|---------|
| Check one concept in one group | **1 credit** |

**Examples:**
- 10 concepts × 1 group = 10 credits
- 10 concepts × 3 groups (Desktop, Mobile, National) = 30 credits

### Credit Flow
1. Calculate: `concepts_in_group × 1`
2. Check balance; return 402 if insufficient
3. Debit with idempotency key
4. Run checks
5. Refund on failure

## Scheduling

### Frequencies
- **Daily** — For competitive keywords, high-traffic sites
- **Weekly** — Default, good balance of freshness and cost
- **Monthly** — For less competitive or long-tail concepts

### Cron Job
`/api/cron/run-scheduled-rank-checks`
- Runs hourly
- Finds groups where `next_scheduled_at <= NOW()`
- Checks credit balance, skips if insufficient (sends notification)
- Runs checks, updates `last_checked_at` and `next_scheduled_at`

## Notifications

- Position drops by N (configurable, default: 5)
- Concept falls off first page (position > 10)
- URL changes (potential cannibalization)
- Insufficient credits for scheduled check

## UI Surfaces

### Phase 1

**Rank Tracking Page** (`/dashboard/rank-tracking`)
- List of keyword groups with summary stats
- Click group → see concepts and positions
- Click concept → see history and details

**Keyword Group Detail**
- Table: Concept | Position | Change | URL | SERP Features
- Trend sparklines
- "Add Keywords" / "Run Now" buttons
- Schedule settings

**Concept History Modal/Page**
- Position chart over time
- URL that ranked
- SERP features timeline
- Competitors list

### Phase 2

**Concept Hub** (unified view per concept)
- SERP rankings across all groups
- Geo-grid visibility
- Review mentions
- Website coverage
- LLM mentions

**Visibility Dashboard**
- Combined view of organic + local + reviews
- "Topic ownership" score per concept

## Future: Expanding Concept Tracking

The concept model scales to track topic ownership everywhere:

| Channel | Implementation | Status |
|---------|---------------|--------|
| SERP Rankings | This plan | Phase 1 |
| Local Pack | Geo-grid (existing) | Done |
| Reviews | Alias matching (existing) | Done |
| Website Pages | Crawl site, match concepts | Future |
| LLM Mentions | Track ChatGPT/Perplexity/AI Overviews | Future |

## Account Isolation

- All tables filter by `account_id`
- RLS policies mirror existing patterns
- Validate `keyword_id` belongs to account before adding to group
- `getRequestAccountId()` required in all API routes

## MVP Scope

### Backend
- [ ] Database migration (3 tables)
- [ ] `/api/rank-tracking/groups` — CRUD for groups
- [ ] `/api/rank-tracking/groups/[id]/keywords` — Add/remove concepts
- [ ] `/api/rank-tracking/check` — Manual rank check
- [ ] `/api/rank-tracking/results` — Fetch results
- [ ] `/api/cron/run-scheduled-rank-checks` — Scheduled checks
- [ ] DataForSEO SERP client (extend existing)
- [ ] Credit debit/refund integration

### Frontend
- [ ] `/dashboard/rank-tracking` — Groups list
- [ ] Group detail view with concepts table
- [ ] Concept history chart
- [ ] Location picker component
- [ ] Schedule settings

### Constraints (Phase 1)
- One domain per account (implicit, from business profile)
- Unlimited groups per account (within credit budget)
- Unlimited concepts per group (within credit budget)
- Weekly default schedule

## File Structure

```
src/features/rank-tracking/
├── index.ts
├── api/
│   └── dataforseo-serp-client.ts
├── services/
│   └── rank-checker.ts
├── hooks/
│   ├── useRankGroups.ts
│   ├── useGroupKeywords.ts
│   └── useRankHistory.ts
├── components/
│   ├── RankGroupsList.tsx
│   ├── RankGroupDetail.tsx
│   ├── RankKeywordRow.tsx
│   ├── RankHistoryChart.tsx
│   ├── LocationPicker.tsx
│   └── ScheduleSettings.tsx
└── utils/
    └── types.ts

src/app/(app)/api/rank-tracking/
├── groups/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── keywords/route.ts
├── check/route.ts
└── results/route.ts

src/app/(app)/dashboard/rank-tracking/
├── page.tsx
└── [groupId]/page.tsx
```

## DataForSEO Location Codes

Common US locations:

| Code | Location |
|------|----------|
| 2840 | United States |
| 1022858 | Portland, Oregon |
| 1014221 | Los Angeles, California |
| 1014895 | Chicago, Illinois |
| 1023191 | New York, New York |
| 1026339 | Austin, Texas |
| 1027744 | Seattle, Washington |
| 21167 | Oregon (state) |
| 21136 | California (state) |

Full list: https://api.dataforseo.com/v3/serp/google/locations

## Open Questions

- Location picker UX: Searchable dropdown? How many locations to pre-populate?
- Should we auto-suggest groups based on business location?
- Concept Hub view: MVP or Phase 2?
