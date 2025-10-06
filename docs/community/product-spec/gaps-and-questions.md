# Community Feature - Gaps and Questions

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Status:** Draft for Review

## Executive Summary

This document identifies critical gaps, ambiguities, and potential conflicts discovered during product spec validation of the Community Feature roadmap. Issues are categorized by severity and impact on MVP delivery.

---

## Critical Issues (Must Resolve Before Implementation)

### 1. Account vs Business Scope Ambiguity

**Issue:** The roadmap uses `account_id` and `business_id` interchangeably, but the existing PromptReviews architecture has a specific multi-account model:
- `accounts` table: Main billing/plan entity
- `businesses` table: Business profile linked to account
- `account_users` table: Many-to-many mapping

**Current Roadmap Statement:**
> "all community interactions are scoped to the currently selected account" (line 13)
> "channels.business_id uuid not null" (line 125)

**Conflict:**
- Data model shows channels using `business_id` (line 125)
- But posts, comments, reactions use `account_id` (lines 155, 158, 175, 178, 190, 193)
- Roadmap text says "scoped to account" but schema uses both

**Questions:**
1. Should community be scoped to `account_id` or `business_id`?
2. In PromptReviews, one account can have multiple businesses (locations). Should each business have separate communities or should community be account-wide?
3. If account-wide, should display context show "which business" a post relates to?

**Recommendation:**
- **Use `account_id` consistently** throughout community feature
- Community is account-scoped (all businesses under account share one community)
- Optional: Add `business_id` reference to posts as metadata for context, but not for isolation
- Update all schema references to use `account_id` instead of `business_id`

**Impact:** HIGH - Affects database schema, RLS policies, and entire data access pattern

---

### 2. Username System and Multi-Business Display

**Issue:** The handle generation algorithm uses business name (line 88), but users can belong to multiple businesses within an account.

**Current Approach:**
```
handle = first-name + business-name + hash
display_name = "Alex • Fireside Bakery"
```

**Problems:**
1. If a user has 3 businesses, which business name is used for the handle?
2. The roadmap says "handle reference is global but display name includes active business" (line 98) - but this could leak business names across accounts
3. What happens when a user posts from Account A, then switches to Account B? Does their display name change?

**Questions:**
1. Should handles be generated without business name to avoid multi-business confusion?
2. Should display name show "Alex from [Account Name]" instead of business name?
3. How do we prevent business name leakage when user belongs to multiple accounts?

**Recommendation:**
- Generate handles using only: `firstname-hash` (no business reference)
- Display name shows user's first name + account context (not business)
- Store handle at user level (global), not per-account
- Display name can be account-aware but shouldn't reveal other accounts

**Impact:** MEDIUM - Affects username generation logic and display patterns

---

### 3. Profiles Table Assumption

**Issue:** Roadmap assumes a `profiles` table exists (line 105), but existing schema uses `users` table from Supabase Auth.

**Current Roadmap:**
```sql
alter table profiles
  add column if not exists handle text unique,
  add column if not exists display_name text,
  ...
```

**Reality Check:**
- PromptReviews uses `auth.users` from Supabase (Prisma schema shows this)
- User metadata likely stored in `auth.users.raw_user_meta_data` or separate table
- No `profiles` table found in existing migrations or schema

**Questions:**
1. Should we create a new `profiles` table or use existing `users` table?
2. Where should community preferences be stored?
3. How do we handle the unique constraint on handle across the entire platform?

**Recommendation:**
- Create new `user_profiles` table in public schema for community-specific fields
- Store handle, display_name, and community preferences there
- Link to `auth.users.id` via foreign key
- Auto-create profile on first community access

**Impact:** MEDIUM - Affects migration strategy and data architecture

---

### 4. Real-time Active Account Context

**Issue:** Supabase RLS policies use `auth.jwt() ->> 'active_account_id'` (line 277), but this JWT claim doesn't exist in current PromptReviews implementation.

**Current PromptReviews Pattern:**
- Account selection stored in React context (SharedAccountState)
- No JWT claim for active account
- RLS policies typically check `account_users` table for membership

**Example RLS Policy from Roadmap:**
```sql
create policy "Members manage their posts" on posts
  for all using (
    account_id = (auth.jwt() ->> 'active_account_id')::uuid
  )
```

**Questions:**
1. How will active account be communicated to RLS policies?
2. Should we add `active_account_id` to JWT custom claims?
3. Or should RLS policies join against `account_users` table like existing features?

**Recommendation:**
- **DO NOT add active_account_id to JWT** - this creates security risks (user could manipulate)
- Follow existing RLS pattern: check `account_users` table for membership
- Pass account_id as function parameter in RPC calls, validate against membership
- Updated policy example:
  ```sql
  create policy "Members manage their posts" on posts
    for all using (
      account_id in (
        select account_id from account_users where user_id = auth.uid()
      )
    )
  ```

**Impact:** HIGH - Affects all RLS policies and security model

---

### 5. Channel Membership Duplication

**Issue:** The `channel_memberships` table (line 139) includes both `user_id` and `account_id`, but primary key is only on `(channel_id, user_id)`.

**Problem:**
- If user belongs to account via `account_users`, why duplicate `account_id` in channel_memberships?
- If user switches accounts, do we need separate channel memberships per account?
- Current primary key allows one membership per user per channel, but account_id suggests it should be per-account

**Questions:**
1. Is channel membership per-user globally, or per-user-per-account?
2. Should primary key be `(channel_id, user_id, account_id)`?
3. Or should we remove account_id and derive it from user's account membership?

**Recommendation:**
- If community is account-scoped: Channel membership is automatic for all account members (no separate table needed)
- If explicit membership required: Primary key should be `(channel_id, user_id, account_id)`
- Likely simplest: Remove channel_memberships table entirely, derive from account_users

**Impact:** MEDIUM - Affects channel access control and database structure

---

### 6. Mention Parsing and Validation

**Issue:** Roadmap describes `@mention` parsing (line 68, 308) but provides no specification for:
- How mentions are parsed from plain text
- Validation of mentioned users (must they be in same account?)
- How frontend displays mentions (highlighted? linked?)
- What happens if mentioned user leaves account?

**Missing Specifications:**
- Mention syntax: `@username` or `@handle` or `@display-name`?
- Mention autocomplete: search by what field?
- Mention rendering: plain text with styling or clickable links?
- Mention notifications: in-app only or email too (marked Phase 2)?

**Questions:**
1. What exact syntax triggers a mention? `@alex-fireside-7h3n` or `@Alex`?
2. Must mentioned user be member of the account posting in?
3. How are invalid mentions handled (user not found, no access)?
4. Should mentions be stored as IDs in body text or separate table only?

**Recommendation:**
- Mention syntax: `@handle` (the generated username)
- Parse mentions on backend (don't trust frontend parsing)
- Validate all mentioned users are members of the posting account
- Store mentions in separate `mentions` table only (don't modify post body)
- Frontend renders body with mention highlights via client-side parser
- Invalid mentions fail silently (no notification created)

**Impact:** MEDIUM - Affects UX, API design, and notification system

---

### 7. @everyone Implementation Scope

**Issue:** Roadmap marks `@everyone` as Phase 2 in some places (line 58, 295) but describes implementation details in Phase 1 specs (line 316).

**Confusion:**
- Section 2 (User Journeys) lists "Broadcast to Everyone (Phase 2)" (line 57)
- Section 3 (Feature Requirements) mentions "@everyone mention (Phase 2)" (line 76)
- Section 8 (API/RPC) lists `broadcast_everyone(post_id uuid)` without phase marker (line 316)
- Data model includes logic for @everyone expansion (line 216)

**Questions:**
1. Is @everyone in MVP (Phase 1) or Phase 2 automation?
2. If Phase 2, should we remove from initial RPC specs?
3. If Phase 1, should we update user journey section?

**Recommendation:**
- **Move @everyone entirely to Phase 2**
- Remove from MVP acceptance criteria
- Keep database schema extensible (mentions table supports it)
- Focus Phase 1 on direct user mentions only

**Impact:** LOW - Simplifies MVP scope and clarifies roadmap

---

### 8. Monthly Summary Auto-Post vs Manual Control

**Issue:** Unclear whether monthly summaries auto-post to community or require user approval.

**Conflicting Statements:**
- "Automated job posts summary card into 'Wins' channel" (line 52)
- "Provide admin UI toggle per account `community_auto_summary_enabled`" (line 357)
- "Invokes `post_*_summary` if auto-share is enabled and preference matches cadence" (line 321)

**Questions:**
1. Is auto-posting opt-in or opt-out?
2. Can users preview summary before it posts?
3. What if summary data is incomplete or incorrect?
4. Should there be approval workflow for first auto-post?

**Recommendation:**
- Phase 2 feature should be **opt-in** with preview
- Default: summaries generated but NOT posted automatically
- Users can preview, edit title/description, then manually publish
- Future enhancement: full auto-post after user opts in explicitly
- Separate concerns: summary generation (automated) vs posting (user-controlled initially)

**Impact:** LOW - Phase 2 feature, but affects UX design expectations

---

## Architecture Conflicts with Existing Patterns

### 9. Supabase Realtime Subscription Pattern

**Issue:** Roadmap specifies subscribing to table changes (line 291), but doesn't address how this fits with existing PromptReviews patterns.

**Questions:**
1. Does PromptReviews already use Supabase Realtime elsewhere?
2. What's the data fetching pattern: SWR, React Query, or direct Supabase client?
3. How do we handle auth token in realtime subscriptions?

**Existing Pattern Check Needed:**
- Search for existing Realtime usage in codebase
- Verify compatibility with account switching
- Ensure realtime doesn't trigger unwanted re-renders (per CLAUDE.md refresh issues)

**Recommendation:**
- Audit existing data fetching patterns before implementing
- Use React Query for initial data, Realtime for updates
- Ensure realtime subscription respects active account context
- Add feature flag to disable realtime if issues arise

**Impact:** MEDIUM - Affects implementation approach and stability

---

### 10. Community Guidelines Content Source

**Issue:** Roadmap says "content sourced from CMS or static markdown" (line 74) but doesn't specify which.

**Questions:**
1. Does PromptReviews have a CMS?
2. Should guidelines be in database for per-account customization?
3. Or single static markdown file for all accounts?

**Recommendation:**
- Start with static markdown file in repo
- Future enhancement: per-account customizable guidelines in database
- Don't block MVP on CMS decision

**Impact:** LOW - Can be resolved during implementation

---

## Data Model Questions

### 11. Soft Delete Strategy

**Issue:** Roadmap specifies `deleted_at` for soft delete (line 72, 167, 184) but doesn't address:
- How deleted content appears to users
- Whether deleted content is truly hidden or marked
- Cascade delete behavior for comments/reactions on deleted posts

**Questions:**
1. Can users see "[deleted]" placeholders like Reddit?
2. Are comments/reactions on deleted posts also soft-deleted?
3. Can admins restore deleted content?
4. How long before hard delete (GDPR compliance)?

**Recommendation:**
- Deleted posts show "[Post deleted]" placeholder with comment count
- Comments remain visible (valuable context)
- Only admins can restore within 30 days
- Hard delete after 30 days for GDPR compliance

**Impact:** LOW - Implementation detail, document in data spec

---

### 12. Post External URL Validation

**Issue:** Schema shows `check (external_url ~* '^https?://')` (line 161) but doesn't specify:
- Should HTTP be auto-upgraded to HTTPS?
- URL length limits?
- Validation of URL accessibility?
- Preview card generation?

**Recommendation:**
- Accept http:// but store as https:// when possible
- Max length 2048 characters
- No accessibility validation (could fail for legitimate private links)
- Phase 2: Add open graph preview cards

**Impact:** LOW - Implementation detail

---

### 13. Reaction Limit per User

**Issue:** Primary key allows one reaction type per user per post (line 195), but doesn't prevent:
- User adding 5 different reactions to same post
- Reaction spam across many posts

**Questions:**
1. Should users be limited to one reaction total per post?
2. Or allow multiple reaction types per post (like Slack)?
3. Rate limiting on reaction creation?

**Recommendation:**
- Allow multiple reaction types per post (UX matches Slack/Discord)
- Rate limit: max 30 reactions per minute per user
- UI shows all user's reactions highlighted

**Impact:** LOW - UX decision, doesn't affect MVP delivery

---

## Missing Specifications

### 14. Post Title Requirements

**Issue:** Posts require title (line 159) but no specifications for:
- Min/max length
- Allowed characters
- Validation rules

**Recommendation:**
- Title: 1-200 characters
- Body: 0-5000 characters
- Sanitize HTML, allow markdown-lite
- No emojis in title enforcement

**Impact:** LOW - Add to acceptance criteria

---

### 15. Comment Threading Depth

**Issue:** Roadmap says "only single-level comments" (line 27) but schema doesn't prevent deeper threading.

**Question:**
Should comments have `parent_comment_id` for threading, or strictly flat?

**Recommendation:**
- MVP: Flat comments only (no `parent_comment_id`)
- All comments reference post, sorted by created_at
- Future: Add threading with max depth 1

**Impact:** LOW - Simplifies MVP

---

### 16. Channel Sort Order and Defaults

**Issue:** Channels have `sort_order` (line 131) and seed data should create defaults, but:
- No specification of default channel names/slugs
- No specification of which channel is default on `/community` load

**Questions:**
1. Confirm default channels: General, Strategy, Google-Business (from line 66)?
2. Which is default? (Roadmap says "General" on line 42)
3. Can users reorder channels or is sort_order admin-only?

**Recommendation:**
- Default channels (auto-created per account):
  1. General (slug: general, sort: 0) - DEFAULT
  2. Strategy (slug: strategy, sort: 1)
  3. Google Business (slug: google-business, sort: 2)
- Users cannot reorder (sort_order is admin-only)
- Future: Add "Wins" channel for summaries (Phase 2)

**Impact:** LOW - Needed for seed data script

---

### 17. Infinite Scroll Implementation

**Issue:** Roadmap mentions "infinite scroll" (line 42, 333) but no specs for:
- Page size
- Ordering (newest first or oldest?)
- Cursor-based or offset pagination?

**Recommendation:**
- Cursor-based pagination (best practice for realtime data)
- Page size: 20 posts
- Order: newest first (created_at DESC)
- Use `created_at` + `id` as cursor for stability

**Impact:** LOW - Implementation detail

---

### 18. Account Switcher Integration Testing

**Issue:** Roadmap emphasizes account switching (line 12, 50, 436) but doesn't specify:
- What happens to open modals when user switches accounts?
- Should unsaved post draft persist across switch?
- How does realtime subscription update?

**Recommendation:**
- Close all modals on account switch
- Discard unsaved drafts (show warning)
- Realtime: unsubscribe old, subscribe new
- Add to E2E test suite (high priority)

**Impact:** MEDIUM - Critical for UX quality

---

## Security & Privacy Concerns

### 19. Cross-Account Data Leakage Prevention

**Issue:** Given recent account isolation breach issues (CLAUDE.md, line 267-280), community feature must be audited for:
- Posts showing wrong account
- Mentions across accounts
- Reactions visible across accounts

**Questions:**
1. How do we test account isolation thoroughly?
2. Should we add explicit account_id checks in every query?
3. What logging/monitoring detects leakage?

**Recommendation:**
- ALL RLS policies must verify account membership via account_users
- ALL RPC functions must validate account_id parameter
- Add Sentry breadcrumb with account_id on every community action
- Create E2E test: User A switches accounts, verifies no Account B data visible
- Add database trigger to log cross-account access attempts

**Impact:** CRITICAL - Security issue, must be thoroughly addressed

---

### 20. Handle Uniqueness and Security

**Issue:** Handles must be unique (line 96) but generation uses semi-predictable components (first name + business + hash).

**Questions:**
1. Could malicious user guess/enumerate handles?
2. What prevents handle squatting?
3. How do we handle collisions (5 retry max, then what)?

**Recommendation:**
- Use cryptographically random hash (not deterministic)
- If 5 retries fail, fall back to UUID-based handle
- Handles are NOT security tokens (public info)
- Rate limit handle generation to prevent enumeration
- No regeneration allowed (prevents handle squatting)

**Impact:** LOW - Handle is public info, but good practice

---

### 21. Content Moderation Requirements

**Issue:** Roadmap mentions "soft profanity filter" (line 487) but no details on:
- What service/library?
- What happens when triggered?
- User notification?
- Admin moderation queue?

**Questions:**
1. Is profanity filter MVP or Phase 2?
2. What's the action: block, flag, or warn?
3. Who reviews flagged content?

**Recommendation:**
- **Defer to Phase 2** - don't block MVP
- Phase 1: Admin can manually delete content
- Phase 2: Add automated flagging with admin review queue
- Use existing service (OpenAI moderation API or similar)

**Impact:** LOW - Phase 2 feature

---

## Open Architecture Decisions

### 22. Error Handling Strategy

**Issue:** No specification for error messages shown to users when:
- Post fails to create
- Realtime connection drops
- RLS policy blocks access
- RPC function fails

**Recommendation:**
- Standard error format: `{ error: string, code: string, retryable: boolean }`
- User-friendly messages (not "RLS policy violation")
- Retry UI for transient errors
- Log all errors to Sentry with correlation ID

**Impact:** LOW - Standard practice, document in API spec

---

### 23. Analytics Event Payload Structure

**Issue:** Roadmap lists events to track (line 477) but no payload schema.

**Recommendation:**
- All events include: `account_id`, `user_id`, `channel_id`, `timestamp`
- Specific payloads per event type
- Use existing PromptReviews analytics pipeline
- Document in separate analytics spec

**Impact:** LOW - Implementation detail

---

### 24. Feature Flag Strategy

**Issue:** Roadmap lists feature flags (line 455) but doesn't specify:
- Where flags are stored (database? config file?)
- Who can toggle flags (admins only?)
- Flag granularity (per-account or global?)

**Recommendation:**
- Use database table `feature_flags` with account-level overrides
- Global defaults, per-account overrides
- Admin UI to toggle flags
- Flags: `community_enabled`, `community_realtime`, `community_digests` (Phase 2)

**Impact:** LOW - Infrastructure decision

---

## Testing Gap Analysis

### 25. Missing Test Scenarios

**Issue:** Test strategy (line 464) lists types but not specific critical scenarios.

**Additional Test Cases Needed:**
1. User belongs to 3 accounts, switches between all, verifies isolation
2. User deleted from account mid-session, community access revoked
3. Handle collision during concurrent user creation
4. Realtime subscription survives auth token refresh
5. Post created while offline, syncs when reconnected
6. Account owner deletes all channels (error handling)
7. 1000+ post channel scroll performance
8. Mention parsing with special characters in username
9. React to same post from 2 accounts (should fail)
10. Delete comment while another user is replying

**Recommendation:**
- Document these in detailed test plan
- Prioritize account isolation and concurrency tests
- Add to E2E suite before public beta

**Impact:** MEDIUM - Quality assurance

---

## Summary of Critical Path Blockers

Before implementation can begin, the following MUST be resolved:

1. **Account vs Business Scope** (Issue #1) - Database design depends on this
2. **JWT Active Account** (Issue #4) - RLS policies depend on this
3. **Profiles Table** (Issue #3) - Migration strategy depends on this
4. **Username Multi-Business** (Issue #2) - Handle generation depends on this

All other issues are important but can be resolved during implementation phases.

---

## Recommendations for Product Team

### Immediate Actions

1. **Confirm Account Scoping Decision**
   - Schedule alignment meeting
   - Document decision with rationale
   - Update roadmap with consistent terminology

2. **Audit Existing Auth Patterns**
   - How is account context passed to backend?
   - How do existing RLS policies work?
   - Can we reuse patterns or do we need new approach?

3. **Prototype Handle Generation**
   - Build quick proof-of-concept
   - Test with edge cases (very long names, special chars)
   - Verify collision handling

4. **Define MVP Boundary Clearly**
   - Remove all Phase 2 references from Phase 1 specs
   - Create separate Phase 2 document
   - Ensure no "phase confusion" in requirements

### Documentation Needs

1. **API Contract Specification**
   - Request/response schemas for all RPCs
   - Error codes and messages
   - Rate limits and quotas

2. **Database Migration Plan**
   - Creation order (dependencies)
   - Rollback scripts
   - Data seeding approach

3. **Security Audit Checklist**
   - Account isolation verification
   - RLS policy testing
   - Penetration test scenarios

4. **Integration Test Matrix**
   - Account switching scenarios
   - Multi-user concurrency
   - Realtime sync edge cases

---

## Questions for Stakeholder Review

1. Is community account-scoped or business-scoped?
2. Should handles include business name or be business-agnostic?
3. Is @everyone in MVP or Phase 2?
4. Should monthly summaries auto-post or require approval?
5. Do we have budget for profanity filtering service?
6. What's the priority: ship fast or feature-complete?
7. What's the rollback plan if engagement is low?
8. Should we build feature flags infrastructure first?

---

## Next Steps

1. Product team reviews and answers critical questions (#1-4)
2. Technical lead confirms RLS and auth patterns
3. Designer provides wireframes for username display
4. Update roadmap with decisions
5. Agent handoff to Data & RLS Agent with resolved specs

---

**Document Status:** Ready for stakeholder review
**Assigned Reviewers:** Product Manager, Tech Lead, Security Reviewer
**Expected Resolution:** Before Data & RLS Agent work begins
