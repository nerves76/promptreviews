# Keyword Monitoring

A full-stack feature that lets teams define keyword sets, match them against every review stored in Prompt Reviews, and surface mention statistics in the dashboard.

## Overview
- **Sources**: All reviews in `review_submissions` (Prompt Pages, uploads, GBP imports, etc.).
- **Goal**: Track how often certain phrases appear across locations/accounts without reprocessing review text on every request.
- **Scope**: Account-wide or selected Google Business locations.

## Data Flow
1. **Review ingestion** (`GoogleReviewSyncService`):
   - Manual importer (`/api/google-business-profile/import-reviews`) and cron (`/api/cron/verify-google-reviews`) both insert/refresh Google reviews and populate `google_business_location_id`, `google_location_id`, `google_location_name` on `review_submissions`.
2. **Keyword matching** (`KeywordMatchService`):
   - Loads all active `keyword_sets` per account.
   - For each review, lowercases the text, applies word-boundary matching, and upserts rows into `review_keyword_matches`.
   - Matches run automatically after imports/crons and whenever keyword sets are created/edited/imported (via `reprocessKeywordMatchesForAccount`).
3. **Dashboard/API**:
   - `/api/keyword-sets` → list + metrics (30d mentions, top locations).
   - `/api/keyword-sets/[id]` → update/delete.
   - `/api/keyword-sets/import-from-prompt-pages` → optional shortcut to seed a set with keywords already stored on Prompt Pages.
   - UI at `/dashboard/get-reviews/keyword-monitoring` consumes these APIs, lets users create/edit keyword sets, scope them to locations, and copy Prompt Page keywords directly from the form.

## Schema
| Table | Purpose |
| --- | --- |
| `keyword_sets` | Top-level set per account (name, scope type/payload, creator, timestamps). |
| `keyword_set_terms` | Individual phrases within a set (stored with a normalized lowercase variant). |
| `keyword_set_locations` | Optional scope for “selected” keyword sets (join to `google_business_locations`). |
| `review_submissions` | Existing reviews; now include `google_business_location_id`, `google_location_id`, `google_location_name`. |
| `review_keyword_matches` | Junction table: review ↔ keyword term + set + location metadata + match timestamp. |

Indexes/constraints keep per-account isolation; sets/terms cascade deletes to matches.

## API Reference
### `GET /api/keyword-sets`
Returns `keywordSets[]` with terms, scope metadata, and 30-day metrics.

### `POST /api/keyword-sets`
Body:
```json
{
  "name": "Core Services",
  "scopeType": "account" | "selected",
  "locationIds": ["<google_business_location_id>"],
  "terms": ["custom cabinets", "kitchen remodel"]
}
```

### `PUT /api/keyword-sets/:id`
Same shape as POST; replaces terms and locations.

### `DELETE /api/keyword-sets/:id`
Removes the set + terms + matches (cascade).

### `POST /api/keyword-sets/import-from-prompt-pages`
Optional helper: scans `prompt_pages.keywords` for the account, dedupes, creates a new keyword set, and triggers a keyword reprocess.

## Dashboard Behavior
- **List**: Shows each keyword set, total mentions (30d), per-term chips, top locations, and edit/delete actions.
- **Create/Edit**: Form with name, scope (all vs selected locations), keywords textarea, and a “Copy Prompt Page keywords” button to seed the textarea.
- **Prompt Page copy**: Button calls the import API; success refreshes keyword sets and surfaces a toast.

## Operations / Maintenance
- **Reprocessing**: `reprocessKeywordMatchesForAccount(supabase, accountId)` re-runs the matcher over all reviews (useful after adding new sets, synonyms, or new review sources).
- **Cron dependency**: Keyword matches rely on the shared review sync so the cron should remain healthy; failures there will affect both review imports and keyword freshness.
- **Future work**: synonyms/fuzzy matching, alerts (“Keyword X not mentioned in 30d”), per-platform breakdowns.

## References
- `src/features/google-reviews/reviewSyncService.ts`
- `src/features/keywords/keywordMatchService.ts`
- `src/app/(app)/api/keyword-sets/*`
- `src/app/(app)/dashboard/get-reviews/keyword-monitoring/page.tsx`

