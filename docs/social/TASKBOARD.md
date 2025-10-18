# Multi-Platform Social Posting - Task Board

**Last Updated:** 2025-10-18
**Current Focus:** Bluesky Integration with Google Business Scheduler (Phase 1)
**Overall Status:** Ready for Agent Pickup

---

## 🎯 PHASE 1 SCOPE CHANGE
**New Approach:** Instead of building a standalone composer, we're extending the existing Google Business scheduler to support Bluesky as an optional additional platform. Users will see a checkbox "Also post to Bluesky" when creating/scheduling Google Business posts.

**Why This Works Better:**
- Faster time to value (enhance existing flow vs. build new one)
- Natural integration point (users already scheduling posts)
- Lower risk (Google remains primary, Bluesky is optional addon)
- Simpler UX (one composer, multiple platforms)

---

## 📋 BACKLOG
Phase 2 and future enhancements.

### BACK-1: Standalone Multi-Platform Composer (Phase 2)
- **Owner:** UI/UX Agent (Phase 2)
- **Plan Tier:** All tiers
- **Feature Flag:** `feature_social_composer`
- **Description:** Dedicated composer for posting to multiple platforms without requiring Google Business
- **Dependencies:** Phase 1 Bluesky integration proven successful
- **Notes:** Allows posting to Bluesky/Twitter/Slack without Google Business account

### BACK-2: Twitter/X Integration (Phase 2)
- **Owner:** Adapter Agent (Phase 2)
- **Plan Tier:** Upgrade tier
- **Feature Flag:** `feature_twitter_posting`
- **Blockers:**
  - [ ] Twitter API approval pending
  - [ ] OAuth2 client credentials setup
- **Dependencies:** Phase 1 adapter pattern validated by Bluesky
- **Notes:** Add to both Google Business scheduler and standalone composer

### BACK-3: Slack Integration (Phase 2)
- **Owner:** Adapter Agent (Phase 2)
- **Plan Tier:** Upgrade tier
- **Feature Flag:** `feature_slack_posting`
- **Blockers:**
  - [ ] Decide: workspace-level or per-channel permissions?
  - [ ] Bot token management strategy
- **Dependencies:** Multi-platform pattern proven
- **Notes:** Customer requests pending; prioritize after Twitter/X

### BACK-4: Unified Scheduling Schema (Phase 2)
- **Owner:** Infrastructure Agent (Phase 2)
- **Plan Tier:** All tiers
- **Feature Flag:** `feature_unified_scheduling`
- **Description:** Neutral scheduling tables to replace Google-only schema
- **Blockers:**
  - [ ] Phase 1 posting must be stable in production for 30+ days
  - [ ] Migration strategy for existing Google scheduled posts
- **Notes:** Keep legacy Google tables until full validation complete

### BACK-5: Per-Platform Media Optimization (Future)
- **Owner:** UI/UX Agent (future)
- **Description:** Allow different crops/aspect ratios per platform
- **Notes:** Open question from main plan - defer until user feedback

---

## 🔍 READY FOR SPEC

### SPEC-1: Plan Tier Matrix & Pricing
- **Owner:** Product Strategist Agent
- **Status:** Needs stakeholder review
- **Deliverables:**
  - [ ] Define which platforms available on which plans (Grower/Builder/Maven)
  - [ ] Pricing delta for multi-platform posting
  - [ ] Feature flag matrix (per platform + per plan)
- **Reviewers:** Business stakeholders
- **Notes:** Referenced in MULTI_PLATFORM_POSTING_PLAN.md "Open Questions"

### SPEC-2: Bluesky Checkbox UX in Google Business Scheduler
- **Owner:** UI/UX Agent
- **Status:** Needs design review
- **Deliverables:**
  - [ ] Wireframes for Bluesky checkbox placement in existing Google Business composer
  - [ ] Connection status indicator design (connected/disconnected/error)
  - [ ] "Connect Bluesky" modal/flow design
  - [ ] Validation messaging patterns (character limits, cross-platform warnings)
  - [ ] Default checkbox state (on/off when account connected?)
- **Reviewers:** Product Strategist Agent
- **Docs:** TBD - create figma/sketch links
- **Notes:** Must not disrupt existing Google Business posting flow. Feature flag controlled.

---

## ✅ SPEC COMPLETE
Approved specs ready for implementation.

### INF-1: Connection Registry Schema
- **Owner:** Infrastructure Agent
- **Reviewers:** QA Agent, Adapter Agent
- **Plan Tier:** Core infrastructure (all tiers)
- **Feature Flag:** N/A (internal)
- **Status:** Ready to implement
- **Description:** Create `social_platform_connections` table for storing Bluesky (and future platform) credentials
- **Deliverables:**
  - [ ] Supabase migration for new table:
    ```sql
    - account_id (FK to accounts)
    - platform (enum: bluesky, twitter, slack) -- NOTE: Google uses existing table
    - encrypted credentials/tokens (JSONB)
    - status (active, expired, disconnected)
    - metadata (JSONB) -- e.g., username, last_validated_at
    - connected_at, last_refreshed_at timestamps
    ```
  - [ ] RLS policies (account-scoped only)
  - [ ] Prisma schema sync
  - [ ] Server helper to load connections for account
- **Test Plan:**
  - Unit: RLS tests verify account isolation
  - Integration: Can store/retrieve encrypted Bluesky app password
  - Regression: Existing Google Business posting unaffected
- **Dependencies:** None (isolated new infrastructure)
- **Code Areas:**
  - `/supabase/migrations/`
  - `/prisma/schema.prisma`
  - `/src/lib/social-posting/connections.ts` (new)
- **Rollout:** Internal only, no user-facing changes

### INF-2: Extend Google Business Scheduled Posts Schema
- **Owner:** Infrastructure Agent
- **Reviewers:** QA Agent, Adapter Agent
- **Plan Tier:** Core infrastructure
- **Feature Flag:** N/A (internal schema change)
- **Status:** Ready to implement
- **Description:** Add `additional_platforms` column to store optional platform selections (Bluesky, future Twitter/Slack)
- **Deliverables:**
  - [ ] Supabase migration to add column:
    ```sql
    ALTER TABLE google_business_scheduled_posts
    ADD COLUMN additional_platforms JSONB DEFAULT '{}';

    -- Example data: {"bluesky": {"enabled": true, "connection_id": "uuid"}}
    ```
  - [ ] Prisma schema sync
  - [ ] Update TypeScript types
  - [ ] Backfill existing rows with `{}` (empty object)
- **Test Plan:**
  - Unit: Column accepts valid JSON
  - Integration: Can save/load platform selections
  - Regression: Existing Google scheduler reads/writes posts correctly
- **Dependencies:** None (additive schema change)
- **Code Areas:**
  - `/supabase/migrations/`
  - `/prisma/schema.prisma`
- **Rollout:** Internal schema change, no UI changes yet

---

## 🚧 IN PROGRESS
Active development with assigned agents.

### ADAPT-1: Bluesky Adapter Implementation
- **Owner:** Adapter Agent
- **Reviewers:** QA Agent, Infrastructure Agent
- **Plan Tier:** Upgrade tier (pending SPEC-1)
- **Feature Flag:** `feature_bluesky_posting`
- **Status:** Ready to start after INF-1 + INF-2
- **Description:** Build Bluesky adapter using `@atproto/api` for posting to Bluesky
- **Deliverables:**
  - [ ] Install `@atproto/api` dependency
  - [ ] Implement `BlueskyAdapter` class:
    - `validatePost()` - check character limits (300 chars), media rules
    - `optimizeContent()` - trim/suggest if over limit
    - `createPost()` - map post content → bsky.feed.post
  - [ ] Session management (app password → refresh session)
  - [ ] Error handling (rate limits, auth failures, network errors)
  - [ ] Integration test with mock Bluesky API
- **Test Plan:**
  - Unit: validatePost enforces Bluesky limits
  - Integration: Mock posting flow end-to-end
  - Regression: Google posting still works independently
- **Dependencies:**
  - [ ] INF-1: Connection Registry merged
- **Code Areas:**
  - `/src/features/social-posting/adapters/BlueskyAdapter.ts` (new)
  - `/src/features/social-posting/adapters/index.ts`
- **Rollout:** Behind feature flag, used by cron job
- **Notes:** Handle rich text facets in Phase 2; basic text-only posts for MVP

### API-1: Bluesky Connection Management Endpoints
- **Owner:** Infrastructure Agent
- **Reviewers:** Adapter Agent, QA Agent
- **Plan Tier:** Core infrastructure
- **Feature Flag:** `feature_bluesky_posting` (gates access)
- **Status:** Blocked until INF-1 complete
- **Description:** Endpoints for connecting/disconnecting Bluesky accounts
- **Deliverables:**
  - [ ] `POST /api/social-posting/connections/bluesky` - Connect Bluesky account
    - Accepts: app password, username
    - Validates credentials with Bluesky API
    - Stores encrypted in social_platform_connections
    - Returns: connection status
  - [ ] `GET /api/social-posting/connections` - List account's connections
    - Filters by account_id from session
    - Returns: platform, status, username, connected_at (no raw tokens)
  - [ ] `DELETE /api/social-posting/connections/:id` - Disconnect Bluesky
    - Verifies account ownership before deleting
  - [ ] `GET /api/social-posting/platforms/available` - Check Bluesky availability
    - Respects plan tier + feature flags
    - Returns: {bluesky: {available: true, connected: true/false}}
- **Test Plan:**
  - Unit: RLS prevents cross-account access
  - Integration: Connect/disconnect Bluesky successfully
  - Regression: Existing Google Business endpoints unchanged
- **Dependencies:**
  - [ ] INF-1: Connection Registry schema
- **Code Areas:**
  - `/src/app/(app)/api/social-posting/connections/route.ts` (new)
  - `/src/app/(app)/api/social-posting/platforms/route.ts` (new)
- **Rollout:** Behind feature flag

### UI-1: Bluesky Checkbox in Google Business Composer
- **Owner:** UI/UX Agent
- **Reviewers:** Product Strategist, QA Agent
- **Plan Tier:** Upgrade tier
- **Feature Flag:** `feature_bluesky_posting`
- **Status:** Blocked until SPEC-2 + API-1 + ADAPT-1 complete
- **Description:** Add "Also post to Bluesky" option to existing Google Business post/schedule UI
- **Deliverables:**
  - [ ] Locate Google Business composer component
  - [ ] Add Bluesky checkbox (only visible when feature flag enabled)
  - [ ] Show connection status:
    - Connected: show username, checkbox enabled
    - Not connected: show "Connect Bluesky" link
    - Error: show error message with reconnect option
  - [ ] Save `additional_platforms` to google_business_scheduled_posts
  - [ ] Show character count warnings if content exceeds Bluesky limits
  - [ ] Link to connection management (modal or new page)
- **Test Plan:**
  - Unit: Checkbox only appears when flag enabled
  - Integration: Scheduled posts save platform selection
  - Regression: Existing Google Business posting flow unchanged
  - Manual: Test with/without Bluesky connection
- **Dependencies:**
  - [ ] SPEC-2: UX approved
  - [ ] API-1: Connection endpoints live
  - [ ] ADAPT-1: Bluesky adapter ready
- **Code Areas:**
  - `/src/app/(app)/components/GoogleBusinessProfile/**` (identify composer)
  - `/src/app/(app)/dashboard/google-business/**` (if composer lives here)
- **Rollout:** Behind feature flag
- **Notes:** Must not break existing UI or posting flow

### CRON-1: Bluesky Posting in Scheduled Job
- **Owner:** Infrastructure Agent
- **Reviewers:** Adapter Agent, QA Agent
- **Plan Tier:** Core infrastructure
- **Feature Flag:** `feature_bluesky_posting`
- **Status:** Blocked until ADAPT-1 complete
- **Description:** Enhance Google Business cron to post to Bluesky when enabled
- **Deliverables:**
  - [ ] Read `additional_platforms` from google_business_scheduled_posts
  - [ ] After successful Google posting, check if Bluesky enabled
  - [ ] Load Bluesky connection and adapter
  - [ ] Attempt Bluesky posting (wrap in try/catch)
  - [ ] Store result in google_business_scheduled_post_results with platform identifier
  - [ ] Log errors to Sentry but never fail job
  - [ ] Handle edge cases: connection expired, adapter unavailable, rate limit
- **Test Plan:**
  - Unit: Bluesky failure doesn't throw
  - Integration: End-to-end scheduled post to both platforms
  - Regression: Google-only posts still work
  - Manual: Test with expired Bluesky connection
- **Dependencies:**
  - [ ] ADAPT-1: Bluesky adapter complete
  - [ ] INF-2: additional_platforms column exists
- **Code Areas:**
  - `/src/app/(app)/api/cron/process-google-business-scheduled/route.ts`
- **Rollout:** Production deployment with monitoring
- **Notes:** Google posting must always succeed even if Bluesky fails

---

## 🔬 READY FOR QA
Implementation complete, awaiting testing and review.

*No items yet*

---

## ✔️ QA/REVIEW
Active testing and peer review.

*No items yet*

---

## 🚀 READY TO LAUNCH
All reviews passed, awaiting deploy/flag flip.

*No items yet*

---

## 📦 LAUNCHED
Deployed to production with monitoring active.

*No items yet*

---

## 🗄️ ARCHIVED
Historical context for completed work.

*No items yet*

---

## 🎯 IMMEDIATE NEXT STEPS (Agent Handoff)

### For Infrastructure Agent (Start Here)
1. **INF-1: Connection Registry Schema** - Create the database foundation
   - Draft migration for `social_platform_connections` table
   - Add RLS policies mirroring account isolation patterns
   - Run `npx prisma db pull && npx prisma generate` after migration
   - Test with Bluesky connection data in staging

2. **INF-2: Extend Google Business Scheduled Posts** - Add platform selection column
   - Add `additional_platforms` JSONB column to google_business_scheduled_posts
   - Update Prisma schema and types
   - Backfill existing rows with empty object

3. **API-1: Connection Management Endpoints** - Bluesky connect/disconnect
   - Build endpoints for connecting Bluesky accounts
   - Validate credentials with Bluesky API before storing
   - Return connection status for UI

4. **CRON-1: Enhance Scheduling Cron** - Add Bluesky posting support
   - After successful Google posting, attempt Bluesky if enabled
   - Store per-platform results
   - Ensure Bluesky failures never break Google posting

### For Adapter Agent (After INF-1)
1. **ADAPT-1: Bluesky Adapter** - Core platform integration
   - Research `@atproto/api` authentication flow (app password → session)
   - Implement BlueskyAdapter with validatePost, optimizeContent, createPost
   - Create mock tests for validation and posting
   - Handle character limits and media constraints

### For UI/UX Agent (After SPEC-2 Approved)
1. **SPEC-2: Bluesky Checkbox UX** - Define the design
   - Design checkbox placement in Google Business composer
   - Plan connection status indicators
   - Design "Connect Bluesky" flow (modal or page)
   - Define validation warning patterns

2. **UI-1: Implement Bluesky Checkbox** - Build the UI enhancement
   - Add checkbox to Google Business composer (feature flag controlled)
   - Show connection status and "Connect" link
   - Save platform selection to additional_platforms column
   - Display character warnings if content too long for Bluesky

### For Product Strategist Agent
1. **SPEC-1: Plan Tier Matrix** - Define business rules
   - Confirm which plans get Bluesky access
   - Set feature flag strategy (`feature_bluesky_posting`)
   - Document upgrade prompts for non-eligible plans

2. **Documentation & Rollout**
   - Keep `/docs/social/posting-notes.md` fresh with decisions
   - Track rollout in `/docs/status/social-composer.md`
   - Prepare user communications for beta launch

### For QA Agent
1. **Build Regression Suite** for Google Business
   - Existing Google composer/scheduler must never break
   - Create automated smoke tests
   - Document manual test scenarios

2. **Integration Testing**
   - Test Bluesky posting flow end-to-end
   - Verify account isolation
   - Test failure scenarios (expired credentials, rate limits)
   - Validate Google posting unaffected by Bluesky errors

---

## 📊 WORKSTREAM SUMMARY

| Workstream | Total | Ready for Spec | Spec Complete | In Progress | Done |
|------------|-------|----------------|---------------|-------------|------|
| Discovery | 2 | 2 | 0 | 0 | 0 |
| Infrastructure | 4 | 0 | 2 | 2 | 0 |
| Adapters | 1 | 0 | 0 | 1 | 0 |
| UI Enhancement | 1 | 1 | 0 | 1 | 0 |
| QA/Hardening | TBD | 0 | 0 | 0 | 0 |

**Phase 1 Focus:** Extend Google Business scheduler with Bluesky support
**Phase 2 Backlog:** 5 items (Standalone composer, Twitter/X, Slack, Unified schema, Media optimization)

---

## 🔗 RELATED DOCS
- [Main Implementation Plan](../../MULTI_PLATFORM_POSTING_PLAN.md)
- [Task Board Template](./taskboard-template.md)
- [Posting Notes](./posting-notes.md) *(create as needed)*
- [Status Tracker](../status/social-composer.md) *(create as needed)*

---

## 📝 NOTES & DECISIONS
- **2025-10-18:** Board initialized with Bluesky-first scope
- **2025-10-18 SCOPE CHANGE:** Pivoted from standalone composer to extending Google Business scheduler
  - **Rationale:** Faster time to value, natural integration point, lower risk
  - **Phase 1:** Add "Also post to Bluesky" checkbox to Google Business composer
  - **Phase 2:** Build standalone multi-platform composer (future)
- **Architecture Decision:** Google remains primary platform, Bluesky is optional addon
- **First Platform:** Bluesky chosen for lowest friction (app password auth, no OAuth approval delays)
- **Quality Gate:** All new work requires peer review + QA sign-off before launch
