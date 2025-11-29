# Keyword Monitoring & Review Sync – Multi-Agent Implementation Plan

## Objectives
- Combine the existing manual importer (`src/app/(app)/api/google-business-profile/import-reviews/route.ts`) and the verification cron (`src/app/(app)/api/cron/verify-google-reviews/route.ts`) into a shared syncing workflow that both imports missing Google reviews and verifies contact-submitted reviews.
- Persist review-keyword matches so dashboards can aggregate mentions quickly without reprocessing free text.
- Deliver a deterministic, testable V1 that can evolve toward richer keyword analytics (synonyms, embeddings) later.

## Current Components
| Component | Purpose | Notes |
| --- | --- | --- |
| Manual Import API | Authenticated users pull “all” or “new” reviews for a selected GBP location. | Creates contacts, review submissions, and handles duplicates via import type. |
| Verification Cron | Daily job that fetches reviews per account to auto-verify submissions marked `pending`. | Already authenticates against GBP and loops through accounts/locations. |
| Dashboards | Read from `review_submissions`, but no keyword aggregation layer yet. | Need additional schema for keyword sets and per-review matches. |
| GBP Profile Protection Monitor | Dedicated cron that runs daily to detect profile edits/suggested changes across connected GBPs. | Lives at `/api/cron/monitor-gbp-changes`; ensure new keyword cron scheduling doesn’t conflict with this monitor’s token refresh/usage. |

## Solution Overview
1. Introduce a shared `GoogleReviewSyncService` that encapsulates fetching GBP reviews, reconciling them against `review_submissions`, and returning the normalized list for downstream consumers.
2. Split the combined cron into two sequential phases per account:
   - **Sync phase:** call the shared service in “new” mode, upserting missing reviews, capturing `last_synced_at` per location.
   - **Verification phase:** reuse the fetched batch to resolve pending submissions via `findBestMatch` (no duplicate GBP calls).
3. After each import, trigger keyword matching that stores `review_keyword_matches` rows (review_id, keyword_term_id, matched_phrase, matched_at).
4. Serve keyword dashboards from aggregated tables/views to avoid reprocessing on every request.

## Multi-Agent Execution Plan

### Agent A – Review Sync & Cron Lead
- **Goal:** Build the shared sync service and refactor importer + cron to use it.
- **Responsibilities:**
  1. Design `GoogleReviewSyncService` (likely `src/features/google-reviews/sync.ts`) with methods `syncLocation({ accountId, locationId, mode })` and `syncAccount(accountId)`.
  2. Add schema support:
     - `google_business_locations.last_synced_at`
     - `review_submissions.google_review_id` (ensure unique constraint per location)
  3. Update manual importer route to delegate to the service (keeps UI behavior unchanged).
  4. Refactor cron handler to:
     - Enumerate connected accounts.
     - Call the sync service for each (collect stats, handle per-account errors).
     - Pass returned reviews to Agent B’s keyword matcher hook (event emitter or direct call).
  5. Draft unit/integration tests for the service (mock GBP client, ensure idempotency).

### Agent B – Keyword Data & Matching Engineer
- **Goal:** Define keyword set schema and automate per-review matching.
- **Responsibilities:**
  1. Create migrations (Prisma/Supabase SQL) for:
     - `keyword_sets` (id, account_id, name, scope_type, scope_payload, created_by, created_at).
     - `keyword_set_terms` (id, set_id, phrase, normalized_phrase).
     - `keyword_set_locations` (set_id, location_id) for “selected locations” scope.
     - `review_keyword_matches` (id, review_id, keyword_term_id, matched_phrase, matched_at, location_id).
  2. Implement deterministic matcher:
     - Lowercase comparison, simple plural normalization, exact multi-word phrase search.
     - Accept review text + keyword terms, return match list w/ offsets (optional).
  3. Expose `matchKeywordsForReviews(reviews: Review[])` used by the sync service after each import (ensure this is account-scoped).
  4. Seed initial keyword set API (basic CRUD) so UI can create sets, though UI work belongs to Agent C.
  5. Provide a utility that reads existing Prompt Page keyword settings (e.g., `prompt_pages.keywords`) and converts them into seed keyword sets so users can “import from Prompt Pages” rather than retyping.
  6. Write tests covering matcher edge cases (case sensitivity, overlapping phrases, multi-location scoping).

### Agent C – Dashboard & API Integrations
- **Goal:** Surface keyword insights in the dashboard and expose necessary APIs.
- **Responsibilities:**
  1. Add API routes/resolvers to list keyword sets, assign scopes, and fetch aggregated metrics (`mentions_by_keyword`, `mentions_by_location`, trending counts).
  2. Extend the dashboard UI:
     - Account overview widget showing top keywords and mentions across locations.
     - Table view “Keyword | Mentions (30d) | Top Locations”.
     - Location detail view with “missing keywords” (keywords defined for that location but zero matches).
  3. Provide mutation flows:
     - Create/edit keyword sets with scope selection (all vs selected locations).
     - Optional account-level default set for lightweight v1 fallback.
  4. Build a “Import from Prompt Pages” CTA on the Keyword Monitoring page that calls Agent B’s converter to pull over any keywords already defined inside Prompt Page settings while still letting users append custom keywords inline.
  5. Hook into existing GBP location selector so keywords can filter by location context.
  6. Ensure loading states and empty states match existing design guidelines.

### Agent D – QA & Code Review
- **Goal:** Own validation, end-to-end testing, and release readiness.
- **Responsibilities:**
  1. Develop integration tests that mock GBP responses, run the combined cron handler, and assert:
     - New reviews are inserted.
     - Pending submissions transition to `verified/not_found`.
     - Keyword matches are created.
  2. Create seed fixtures to populate keyword sets and sample reviews for deterministic tests.
  3. Review PRs from Agents A–C with focus on:
     - Data integrity (no duplicate reviews, correct foreign keys).
     - Performance (batch processing per account).
     - Security (cron auth, service-role usage).
  4. Validate deployment plan (feature flags, cron scheduling, alerting).

## Coordination & Handoff Flow
1. **Design review:** Agents A & B finalize shared interfaces (sync service emits normalized review objects consumed by matcher).
2. **Implementation order:**
   - Agent A builds sync service + schema updates.
   - Agent B delivers keyword schema + matcher + APIs.
   - Agent C consumes both to update UI/UX.
   - Agent D tests after each merge to `develop/main`, coordinating release toggles.
3. **Artifacts:** each agent delivers architectural notes + migration summaries to `/docs` as part of their PRs.

## Code Review Workflow
1. Every PR requires review from Agent D plus one peer (e.g., Agent B reviews Agent A’s PR and vice versa).
2. Checklist for reviewers:
   - Migration safety (idempotent, reversible).
   - Logging + Sentry coverage around cron errors.
   - Tests (unit + integration) updated/passing.
   - Performance: ensure sync loops are paginated and keyword matching is batched.
3. Merge gate: GitHub Checks must include automated test suite, lint, and (optionally) a dry-run cron execution script.

## Deliverables & Milestones
| Milestone | Owner(s) | Definition of Done |
| --- | --- | --- |
| Shared Sync Service | Agent A | Manual importer & cron both call shared module; `last_synced_at` tracked per location; tests green. |
| Keyword Schema + Matcher | Agent B | Migrations merged; matcher service exports deterministic API; review matches persisted. |
| Dashboard & API | Agent C | UI shows keyword mentions for account/location views; CRUD for keyword sets with scopes. |
| QA Sign-off | Agent D | Automated tests cover cron flow; staging cron run verifies + imports reviews; release checklist complete. |

## Implementation Progress
- ✅ Shared Google Review Sync Service (`GoogleReviewSyncService`) now powers both the manual importer and the verification cron.
- ✅ Manual importer route delegates to the shared service, including location validation and duplicate handling.
- ✅ Verification cron runs the sync service per account/location before matching submissions, so imports and verification share the same pipeline.
- ✅ Keyword set schema/API/UX shipped: CRUD endpoints under `/api/keyword-sets`, Prompt Page keyword importer, and the Get Reviews → Keyword Monitoring page now lets users create, edit, delete, and visualize keyword sets with live metrics.
- ⏳ Next: layer richer analytics/alerts (e.g., missing keyword notifications) and add QA automation over the new endpoints.

## Future Enhancements
- Support per-location override keyword sets (“Single GBP add-on list”).
- Introduce synonym groups and fuzzy matching pipelines.
- Consider materialized views for high-volume accounts to keep dashboards snappy.
- Add alerting when GBP tokens expire so cron failures surface quickly.
