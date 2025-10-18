# Multi-Platform Posting Plan

## Goals
- Allow users to compose once and publish across Google Business, Twitter/X, Bluesky, Slack (phased).
- Keep Google Business posting and scheduling reliable even if optional platforms fail or are disabled.
- Introduce upgrade gating so non-Google platforms can be offered on higher tiers without impacting core plans.

## Guiding Principles
- **Extend, don't replace**: Add Bluesky posting to existing Google Business scheduler UI rather than building separate composer (Phase 1). Standalone composer becomes Phase 2.
- **Layered architecture**: UI → orchestration (`PostManager`) → adapter. Adapters only register when credentials + feature flag + plan check succeed.
- **Graceful degradation**: Failure to authenticate or post to optional platforms must never block Google Business operations.
- **Feature flag everything**: Each new platform ships behind flags to allow selective rollout.
- **Upgrade-aware**: Plan limits checked at API boundary so premium platforms never appear for non-upgraded accounts.

## Current State Snapshot
- Google Business composer/scheduler lives in dedicated components and tables (`google_business_scheduled_posts`, `google_business_scheduled_post_results`).
- `PostManager` (`src/features/social-posting/core/services/PostManager.ts`) supports multiple adapters but only registers Google today.
- Posting endpoint (`src/app/(app)/api/social-posting/posts/route.ts`) pulls Google tokens directly and short-circuits for other platforms.
- Scheduling cron (`src/app/(app)/api/cron/process-google-business-scheduled/route.ts`) is hard-wired to Google data structures.

## Architecture Overview

### Phase 1: Extend Google Business Scheduler with Bluesky
**Goal:** Add "Also post to Bluesky" option in existing Google Business post scheduler.

1. **Connection Registry**
   - Create `social_platform_connections` table storing `account_id`, `platform`, encrypted creds/token metadata, status, scopes.
   - Add server helper to hydrate adapters per request. Google continues to use `google_business_profiles` directly.

2. **Bluesky Adapter**
   - App password → refresh session via `@atproto/api`. Map post content to `bsky.feed.post`. Handle rich text facets later.
   - Implements `validatePost`, `optimizeContent`, and `createPost` with Bluesky-specific constraints.

3. **UI Enhancement - Google Business Scheduler**
   - Add opt-in checkbox in existing Google Business composer: "Also post to Bluesky"
   - Show connection status (connected/disconnected/error)
   - Link to connection management (connect/disconnect Bluesky)
   - Display per-platform validation warnings if needed

4. **Scheduled Post Storage Extension**
   - Add `additional_platforms` JSONB column to `google_business_scheduled_posts` table
   - Store selected platforms and their status: `{"bluesky": {"enabled": true, "connection_id": "uuid"}}`
   - Keep Google as primary; additional platforms are optional addons

5. **Cron Enhancement**
   - Update `/api/cron/process-google-business-scheduled/route.ts` to check `additional_platforms`
   - After posting to Google (existing flow), attempt Bluesky posting if enabled
   - Store results in `google_business_scheduled_post_results` with platform identifier
   - Log errors but never fail Google posting due to Bluesky issues

6. **Upgrade & Feature Flags**
   - Add `account_features` helper. UI checks `feature_bluesky_posting` flag + plan tier.
   - UI hides Bluesky option unless enabled; API rejects requests missing entitlement.

### Phase 2: Standalone Multi-Platform Composer (Future)
**Goal:** Dedicated composer for posting to multiple platforms without requiring Google Business.

1. **Standalone Composer UI**
   - New route (e.g., `src/app/(app)/composer`) with shared fields (content, media, CTA) plus per-platform panels.
   - Uses `PostManager` for validation + publishing across all connected platforms.

2. **Additional Platform Adapters**
   - **Twitter/X**: OAuth2 client credentials, `tweet.write` scope, `twitter-api-v2`. Enforce 280 chars.
   - **Slack**: Bot token with `chat:write` and optional `channels:read`. Store default channel per account.

3. **Unified Scheduling Schema**
   - Introduce neutral schema (`social_scheduled_posts`, `social_scheduled_results`, `social_scheduled_media`).
   - Cron runner resolves adapters dynamically; Google scheduling migrates to new schema.
   - Write migrator that moves Google jobs to neutral schema once proven.

## Workstreams & Milestones (Phase 1: Google Business + Bluesky)

1. **Discovery & Specs**
   - Define UX for Bluesky checkbox in Google Business scheduler.
   - Define pricing/plan matrix for Bluesky platform availability.
   - Design connection management flow (connect/disconnect Bluesky account).

2. **Infrastructure**
   - Create `social_platform_connections` table + Prisma type.
   - Add `additional_platforms` JSONB column to `google_business_scheduled_posts`.
   - Implement connection management endpoints (connect, disconnect, status) for Bluesky.
   - Migrate `PostManager` to support optional adapter registration.

3. **Bluesky Adapter**
   - Implement `BlueskyAdapter` using `@atproto/api`.
   - Handle authentication (app password → session management).
   - Validate content against Bluesky constraints (character limits, media).
   - Write integration tests with mocked Bluesky API.

4. **UI Enhancement**
   - Add Bluesky checkbox to Google Business post composer UI.
   - Show connection status and "Connect Bluesky" link if not connected.
   - Add connection management page (connect/disconnect Bluesky).
   - Display validation warnings if content exceeds Bluesky limits.
   - Ship behind `feature_bluesky_posting` flag.

5. **Cron Enhancement**
   - Update Google Business scheduling cron to read `additional_platforms`.
   - After successful Google posting, attempt Bluesky posting if enabled.
   - Store per-platform results in `google_business_scheduled_post_results`.
   - Ensure Bluesky failures never block Google posting.

6. **Hardening**
   - Add structured logging + Sentry breadcrumbs for Bluesky adapter operations.
   - Build regression tests for Google posting/scheduling (ensure no regressions).
   - Run integration tests for Bluesky adapter with mocked APIs.
   - Security review: verify account isolation and token encryption.

## Future Workstreams (Phase 2: Standalone Composer)
- Build standalone multi-platform composer UI (no Google Business requirement).
- Add Twitter/X and Slack adapters.
- Design neutral scheduling schema and migrate Google jobs.

## AI Agent Coordination Playbook
### Core Roles
- **Product Strategist Agent**: owns scope decisions, keeps plan/feature flags aligned with tiers, updates this document when requirements change.
- **Infrastructure Agent**: designs schemas (`social_platform_connections`, adapter registry), handles migrations, ensures RLS and encryption.
- **Adapter Agent**: implements platform-specific clients/adapters, writes integration tests, maintains per-platform limits.
- **UI/UX Agent**: ships the composer interface and connection management UI, collaborates with Adapter Agent for validation feedback.
- **QA & Reliability Agent**: maintains regression suites (Google scheduler smoke tests + new platform tests), reviews logs, enforces rollout checklist.
- **Documentation/Support Agent**: keeps runbooks, feature flag matrix, and customer-facing notes up to date.

### Coordination Cadence
1. **Kickoff**: Product Strategist assembles a shared task board (one list per workstream) and drafts an initial plan summary. All agents acknowledge dependencies before coding.
2. **Daily Sync (async allowed)**: Each agent posts status + blockers in the task board comments. Infrastructure and Adapter agents coordinate API contracts before implementation.
3. **Milestone Reviews**: At the end of each workstream, QA Agent runs validation checklist while another agent (not the implementer) reviews diffs for regressions. Only after dual sign-off does the task move to "Done".

### Quality Gates & Cross-Checks
- **Design Reviews**: UI/UX Agent pairs with Product Strategist before building new screens to confirm upgrade gating and feature-flag placement.
- **Schema Changes**: Infrastructure Agent opens a migration PR; Adapter Agent validates that stored credentials stay isolated per account; QA Agent runs Supabase RLS tests.
- **Adapter Development**: Adapter Agent writes a verification script (mock Bluesky client) that QA Agent reviews. Product Strategist ensures failure messaging meets UX tone.
- **Deployment Readiness**: QA Agent runs Google regression suite + new composer tests. Documentation Agent confirms release notes and support scripts are updated. Product Strategist flips the feature flag only after confirming logs/metrics dashboards exist.

### Tracking & Communication Tools
- Shared task board divided by workstreams; every task includes owner, reviewers, and QA checklist link.
- `docs/status/social-composer.md` (create if absent) captures current flag states, recent deploys, and outstanding risks; Documentation Agent keeps it fresh.
- Each agent logs important context (API rate changes, approval statuses) in `/docs/social/posting-notes.md` for future handoffs.
- Weekly retrospective comment thread (led by Product Strategist) captures what went well, what needs adjustment, and upcoming platform additions (Slack/Discord/Circle for Phase 2).

## Risks & Mitigations
- **Google Business UI regressions** → Enhanced UI must maintain existing functionality perfectly. Write comprehensive regression tests. Use feature flags to hide Bluesky option until proven.
- **Cron failures** → Bluesky posting happens after Google posting completes. Wrap in try/catch to prevent cascading failures. Log all errors to Sentry.
- **Token leakage/cross-account exposure** → Store Bluesky tokens in dedicated table with RLS identical to account boundaries. Never expose tokens in API responses.
- **Adapter failure causing cascade** → Wrap each adapter call in `try/catch`, return per-platform status. Google posting must succeed even if Bluesky fails.
- **Character limit mismatches** → Validate content against both platforms before allowing submission. Show warnings if content may be truncated.

## Open Questions (Phase 1)
- Should the Bluesky checkbox default to on or off for users with connected accounts?
- Do we show character count for both platforms simultaneously in the composer?
- How do we handle media attachments - post same image to both platforms or allow per-platform selection?
- Should we allow scheduling to Google only, Bluesky only, or require both when Bluesky is checked?

## Open Questions (Phase 2)
- Do we need per-platform media overrides (e.g., cropped aspect ratio)?
- Should Slack posting support scheduling or only immediate posts?
- How will we handle link shorteners / tracking parameters per platform?
- Are there compliance needs (e.g., archived posts) that influence storage design?

## Immediate Next Steps (Phase 1)
1. Stakeholder review of new scope: extending Google Business scheduler vs. standalone composer.
2. Draft schema migrations:
   - `social_platform_connections` table
   - `additional_platforms` column on `google_business_scheduled_posts`
3. Design UX for Bluesky checkbox in Google Business composer (wireframes).
4. Mock Bluesky connection + posting flow in staging to validate `@atproto/api` library.
5. Add regression checklist for Google scheduling to run before and after integration.
