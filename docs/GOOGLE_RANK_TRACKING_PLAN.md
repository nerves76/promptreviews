# Google Rank Tracking Plan

Plan to ship Google SERP rank tracking (DataForSEO) that plugs into the unified keyword library, keyword concepts, and the reviews-focused workflow. Emphasis on account isolation, credit controls, and notification hooks.

## Goals (Reviews-First)
- Track Google organic rankings for keywords tied to review acquisition and local visibility (service + geo combos, branded queries, reputation terms).
- Show rank + URL trends per keyword, roll up by keyword concept, and flag cannibalization across review landing pages.
- Reuse existing geo-grid locations, keyword library, credit wallet, notifications, and account isolation patterns.

## Integrations
- **Keyword Library/Concepts**: Use `keywords` (phrase, search_query, aliases, location_scope) as the source of truth. Allow multiple target URLs with a preferred URL flag for cannibalization detection. Surfaces live rank metrics on keyword and concept views.
- **Geo-Grid**: Share locations (google_business_locations), scheduling infra, DataForSEO client, and credit debiting patterns. Optionally let users request a geogrid sample from the same UI for local SERP nuance.
- **Credit System**: Meter per keyword per check; debit at enqueue with idempotency keys (`rank:<task_id>`). Expose per-account daily budget guardrails and spending logs.
- **Notifications**: Use existing notification system to alert on drops, URL changes, and failed tasks. Respect account scoping and user preferences.
- **Account Isolation**: All tables filter by `account_id`; RLS + selected-account header enforced. No cross-account sharing of tasks or results. Stored raw payloads redacted to account scope.

## Data Model (Proposed)
- `rank_tasks` (id, account_id, keyword_id, location_code, language_code, device, depth, target_domain, schedule_id?, status, dataforseo_task_id, cost_credits, created_at, completed_at, raw_response jsonb nullable).
- `rank_results` (id, account_id, keyword_id, check_date, position, found_url, matched_target boolean, serp_features jsonb, top_competitors jsonb[], landing_domain, device, location_code, language_code, dataforseo_task_id, concept_ids[] cached).
- `rank_schedules` (id, account_id, frequency enum daily/3xweek/weekly/custom, next_run_at, device, location_code, depth default 100, enabled boolean).
- `rank_aggregates_daily` (account_id, keyword_id, date, position_avg, position_best, position_worst, delta_vs_prev, visibility_score, concept_ids[]).
- `rank_domain_health` (account_id, domain, last_seen_position, keywords_count, top_gainers, top_losers) for per-domain cannibalization and coverage.
- Note: all FKs scoped by `account_id`; partial indexes on (account_id, keyword_id, check_date) and (account_id, dataforseo_task_id).

## Scheduling and Workflows
- **Scheduler**: Reuse cron/queue used by geo-grid; batch tasks by locale/device to optimize cost. Respect per-account frequency caps and daily credit budget.
- **Task Creation**: For each due keyword, create DataForSEO SERP task with `location_code`, `language_code`, `device`, `depth` (default 100; configurable to 50 for cost savings). Store task id immediately with idempotency key.
- **Ingestion**: Poll or webhook for completion. Normalize: position, found URL, detected domain, SERP feature flags (map pack, FAQ, featured snippet), top competitor domains. Store raw payload for 30 days for debugging (nullable after TTL).
- **URL Validation**: Canonicalize to root domain; match against account-owned domains list; flag if ranking URL is off-domain (content gap) or wrong URL (cannibalization).
- **Concept Rollups**: On ingest, attach `concept_ids[]` from keyword and update aggregates so concept dashboards show average rank, movers, coverage.

## Credits and Limits
- Pricing rule (proposal): `base 1 credit + 1 per 10 results of depth` (e.g., depth 100 = 11 credits) or adopt DataForSEO cost pass-through multiplier; pick one rule and seed `credit_pricing_rules` with feature_type `rank_tracking`.
- Debit on enqueue; refund ledger entry on failed/expired tasks; include `keyword_id`, `location_code`, `device` in metadata.
- **Budgets**: Per-account daily credit ceiling for rank checks; block scheduling beyond budget with clear UI copy. Show estimated monthly spend per schedule.
- Tier defaults: free accounts disabled; grower/builder limited keywords/frequencies; maven unlocked higher depth/frequency.

## Notifications and Alerts
- Alerts when position drops by N (configurable), URL changes for a keyword, or keyword falls off top 50. Digest option to reduce noise.
- Delivery via existing notifications system + email; include account-safe deep links to keyword/concept detail.
- Ops alerts for task failure spikes or spend spikes.

## UI/UX Surfaces
- **Keyword Detail**: trend chart (position over time), latest URL, change badges, SERP feature chips, preferred vs actual URL indicator, “run now” with credit estimate.
- **Concept View**: aggregates (avg rank, coverage %, winners/losers), top URLs per concept, cross-location filters.
- **Reviews Context**: highlight review-landing URLs and show recent review volume/ratings next to rank trends to connect ranking with reputation efforts.
- **Competitors**: show top competing domains per keyword/concept with their movement; optional “track competitor” toggle per keyword (no extra tasks, just reuse payload).
- **Admin/Support**: page to inspect raw responses by task id for debugging, scoped by account.

## Account Isolation & Security
- Enforce `account_id` filters on all queries; RLS mirrors geo-grid/keywords pattern.
- Ensure `keyword_id` belongs to account before scheduling; prevent cross-account DataForSEO tasks.
- Keep raw payload retention bounded (e.g., 30 days) and redact PII if present.
- Idempotency keys stored unique per account to avoid duplicate billing.

## MVP Scope
- Manual + scheduled rank checks for a small set of keywords per account, single device (desktop) and single locale, depth 100.
- UI: keyword detail card, basic chart, preferred URL flag, credit estimate + insufficient balance CTA.
- Backend: task enqueue, polling ingestion, ledger debit/refund, aggregates daily.
- Notifications: drop-by-threshold alert (single rule) and task failure alert.

## Future Enhancements
- Mobile vs desktop split; per-keyword device selection.
- Multi-URL tracking with canonical selection and cannibalization resolver tips.
- Competitor watchlists with diffing over time.
- Shared task cache: if multiple accounts track same keyword+locale? (likely skip to preserve isolation).
- Export/CSV and API endpoints for BI.

## Testing & Validation
- Fixture-based ingestion tests with recorded DataForSEO payloads.
- Idempotency tests for enqueue/retry; credit refund on failure.
- Permission tests to ensure cross-account access is blocked.
- E2E slice in staging for one account: schedule daily, verify ledger, verify notifications.

## Open Questions
- How many keywords per account do we want to support at launch, and which frequencies should be allowed per tier?
- Do we prefer polling or webhook for DataForSEO completion (considering current infra and firewall constraints)?
- What domains should be treated as “owned” for URL matching (custom domain list per account vs infer from prompt pages/business links)?
- Should rank depth default to 50 to reduce cost, with 100 as an upgrade?
- How tightly should we couple rank tracking to geo-grid UI (single combined “Visibility” hub vs separate pages)?
