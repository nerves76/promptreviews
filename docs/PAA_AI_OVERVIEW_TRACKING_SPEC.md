# PAA & AI Overview Tracking Specification

## Overview

Extend rank tracking to capture People Also Ask (PAA) questions and AI Overview citations, enabling users to track their visibility in these increasingly important SERP features.

## Current State

### Existing `rank_checks` Table
```sql
rank_checks (
  id, account_id, group_id, keyword_id,
  search_query_used, position, found_url,
  matched_target_url, serp_features,  -- currently just booleans
  top_competitors, api_cost_usd, checked_at
)
```

### Current `serp_features` JSONB
```json
{
  "featuredSnippet": true,
  "mapPack": false,
  "faq": true,
  "aiOverview": true,
  ...
}
```

**Problem:** We're only storing presence flags, not the actual data.

---

## Proposed Data Model Changes

### Option A: Expand `serp_features` JSONB (Recommended)

Keep everything in the existing table but enrich the `serp_features` column:

```json
{
  "featuredSnippet": {
    "present": true,
    "isOurs": true,
    "domain": "example.com",
    "url": "https://example.com/page"
  },
  "mapPack": {
    "present": true,
    "isOurs": false,
    "ourPosition": null
  },
  "peopleAlsoAsk": {
    "present": true,
    "questions": [
      {
        "question": "How much does a plumber cost?",
        "answerDomain": "homeadvisor.com",
        "answerUrl": "https://homeadvisor.com/...",
        "isOurs": false,
        "isAiGenerated": false
      },
      {
        "question": "What is the best plumber in Portland?",
        "answerDomain": "example.com",
        "answerUrl": "https://example.com/portland",
        "isOurs": true,
        "isAiGenerated": false
      }
    ],
    "ourQuestionCount": 1
  },
  "aiOverview": {
    "present": true,
    "isOursCited": true,
    "citations": [
      {
        "domain": "example.com",
        "url": "https://example.com/guide",
        "title": "Complete Plumbing Guide",
        "isOurs": true
      },
      {
        "domain": "wikipedia.org",
        "url": "https://en.wikipedia.org/...",
        "title": "Plumbing",
        "isOurs": false
      }
    ],
    "ourCitationCount": 1,
    "totalCitations": 2
  }
}
```

**Pros:**
- No schema migration needed
- All data in one place per check
- Easy to query with JSONB operators

**Cons:**
- Larger row size
- Repeated question text across checks

### Option B: Separate Tables

Create dedicated tables for PAA and AI Overview tracking:

```sql
-- PAA questions discovered during rank checks
CREATE TABLE rank_check_paa_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_check_id UUID REFERENCES rank_checks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer_domain TEXT,
  answer_url TEXT,
  is_ours BOOLEAN DEFAULT FALSE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Overview citations discovered during rank checks
CREATE TABLE rank_check_ai_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_check_id UUID REFERENCES rank_checks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  cited_domain TEXT NOT NULL,
  cited_url TEXT,
  cited_title TEXT,
  is_ours BOOLEAN DEFAULT FALSE,
  citation_position INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_paa_account_ours ON rank_check_paa_questions(account_id, is_ours);
CREATE INDEX idx_citations_account_ours ON rank_check_ai_citations(account_id, is_ours);
```

**Pros:**
- Normalized data
- Efficient querying for "all PAA wins" or "all AI citations"
- Can track question frequency over time

**Cons:**
- More complex queries for full check data
- Additional joins needed
- More tables to maintain

---

## Recommendation: Hybrid Approach

1. **Use Option A (enriched JSONB)** for the primary storage - keeps rank check data self-contained
2. **Add summary fields** to `rank_checks` for quick filtering:

```sql
ALTER TABLE rank_checks ADD COLUMN paa_question_count INT DEFAULT 0;
ALTER TABLE rank_checks ADD COLUMN paa_ours_count INT DEFAULT 0;
ALTER TABLE rank_checks ADD COLUMN ai_overview_present BOOLEAN DEFAULT FALSE;
ALTER TABLE rank_checks ADD COLUMN ai_overview_ours_cited BOOLEAN DEFAULT FALSE;
ALTER TABLE rank_checks ADD COLUMN ai_overview_citation_count INT DEFAULT 0;
```

This allows:
- Quick filtering: "Show checks where we appeared in PAA"
- Full details still available in `serp_features` JSONB
- No complex joins needed

---

## API Changes

### 1. Update DataForSEO Client

Modify `parseSerpFeatures()` to extract full data:

```typescript
interface EnrichedSerpFeatures {
  featuredSnippet: {
    present: boolean;
    isOurs: boolean;
    domain: string | null;
    url: string | null;
  };
  peopleAlsoAsk: {
    present: boolean;
    questions: PAAQuestion[];
    ourQuestionCount: number;
  };
  aiOverview: {
    present: boolean;
    isOursCited: boolean;
    citations: AICitation[];
    ourCitationCount: number;
  };
  // ... other features
}

interface PAAQuestion {
  question: string;
  answerDomain: string | null;
  answerUrl: string | null;
  isOurs: boolean;
  isAiGenerated: boolean;
}

interface AICitation {
  domain: string;
  url: string | null;
  title: string | null;
  isOurs: boolean;
}
```

### 2. Update Rank Check API Response

```typescript
interface RankCheckResponse {
  // ... existing fields
  serpFeatures: EnrichedSerpFeatures;
  // Summary fields for UI
  paaVisibility: {
    totalQuestions: number;
    questionsWeAnswer: number;
    questions: PAAQuestion[];
  } | null;
  aiVisibility: {
    present: boolean;
    cited: boolean;
    citationCount: number;
    citations: AICitation[];
  } | null;
}
```

### 3. New Endpoints

```
GET /api/rank-tracking/visibility/paa
  - Returns all PAA appearances across keywords
  - Filter by: keyword, date range, is_ours

GET /api/rank-tracking/visibility/ai-overview
  - Returns all AI Overview citations
  - Filter by: keyword, date range, is_ours
```

---

## UI Integration

### Keyword Concept Sidebar

Add to the existing "Rank Tracking" section:

```
┌─────────────────────────────────────┐
│ 📊 Rank Tracking                    │
├─────────────────────────────────────┤
│ Portland Keywords • Desktop         │
│ Position: #4 ↑2                     │
│ Last checked: Dec 13                │
│                                     │
│ PAA Visibility: 1 of 4 questions    │
│ AI Overview: Cited ✓                │
└─────────────────────────────────────┘
```

### Rank Tracking Dashboard

Add new tabs/sections:
- **PAA Tracker**: Shows questions and your visibility
- **AI Citations**: Shows where you're being cited

### Related Questions Integration

When viewing a keyword's related questions:
- Show which questions actually appear in PAA
- Show if you're the answer source
- Suggest new questions discovered from PAA

---

## Implementation Steps

### Phase 1: Data Capture (Backend)
1. Update `parseSerpFeatures()` to extract PAA questions and AI citations
2. Update `serp_features` JSONB structure in rank checks
3. Add summary columns to `rank_checks` table
4. Update rank check creation to populate new fields

### Phase 2: API Endpoints
1. Update existing rank check endpoints to return enriched data
2. Create `/visibility/paa` endpoint
3. Create `/visibility/ai-overview` endpoint

### Phase 3: UI Integration
1. Update KeywordDetailsSidebar to show PAA/AI visibility
2. Add PAA tracker view to rank tracking dashboard
3. Add AI citations view to rank tracking dashboard
4. Connect related questions to PAA discovery

### Phase 4: Analytics & Insights
1. Track PAA visibility trends over time
2. Track AI citation frequency
3. Alert when gaining/losing PAA positions
4. Suggest questions to target based on competitor PAA wins

---

## Cost Considerations

DataForSEO charges extra for some features:
- `load_async_ai_overview`: +$0.002 per request
- `people_also_ask_click_depth`: Increases with depth

Current rank check cost: ~$0.002-0.003
With full PAA + AI data: ~$0.004-0.006

**Recommendation:** Make this opt-in per rank tracking group:
- Basic tracking: Position only (current)
- Enhanced tracking: Include PAA + AI Overview data (+cost)

---

## Migration Path

1. No breaking changes to existing data
2. New fields populate going forward
3. Historical checks show `null` for new fields
4. Users can re-run checks to populate new data

---

## Questions to Resolve

1. **Storage limits:** How many PAA questions to store per check? (suggest: max 10)
2. **AI Overview depth:** Store full citation list or just "is cited" flag?
3. **Cost management:** Auto-enable enhanced tracking or require opt-in?
4. **Related questions sync:** Auto-add discovered PAA questions to keyword's related questions?
