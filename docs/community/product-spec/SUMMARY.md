# Community Feature Product Spec - Summary & Recommendations

**Agent:** Product Spec Agent
**Date:** 2025-10-06
**Phase:** Phase 1 MVP Validation
**Status:** Complete - Ready for Stakeholder Review

---

## Executive Summary

I have completed a comprehensive validation of the Community Feature roadmap and produced three detailed specification documents for the MVP (Phase 1). The roadmap is **well-structured and ambitious**, but contains **4 critical issues** that must be resolved before implementation can begin.

### Documents Delivered

1. **`gaps-and-questions.md`** (23KB) - 25 identified issues with severity ratings
2. **`acceptance-criteria.md`** (41KB) - 100+ testable acceptance criteria across 13 feature areas
3. **`ui-requirements.md`** (38KB) - Complete component specifications for frontend implementation

---

## Critical Findings

### 🚨 BLOCKERS - Must Resolve Before Implementation

#### 1. Account vs Business Scope Confusion (HIGH PRIORITY)
- **Issue:** Roadmap uses `account_id` and `business_id` interchangeably
- **Reality:** PromptReviews has distinct account/business model where one account can have multiple businesses
- **Impact:** Affects entire database schema and RLS policies
- **Recommendation:** Use `account_id` consistently; community is account-scoped (all businesses share)

#### 2. RLS Policy Pattern Mismatch (HIGH PRIORITY)
- **Issue:** Roadmap assumes JWT contains `active_account_id` claim
- **Reality:** PromptReviews doesn't use JWT claims for account context
- **Impact:** All RLS policies in roadmap are invalid
- **Recommendation:** Follow existing pattern - check `account_users` table for membership, don't rely on JWT

#### 3. Profiles Table Doesn't Exist (MEDIUM PRIORITY)
- **Issue:** Roadmap assumes `profiles` table exists for username storage
- **Reality:** Only `auth.users` table exists from Supabase
- **Impact:** Migration strategy unclear
- **Recommendation:** Create new `user_profiles` table in public schema for community fields

#### 4. Username Generation with Multi-Business (MEDIUM PRIORITY)
- **Issue:** Handle generation uses business name, but users can have multiple businesses
- **Reality:** Unclear which business name to use, potential for account leakage
- **Recommendation:** Generate handles without business reference: `firstname-hash` only

---

## Key Recommendations

### Immediate Actions (Before Data Agent Work Begins)

1. **Hold Alignment Meeting** - Resolve account vs business scoping decision
   - Confirm: Community is account-scoped, not business-scoped
   - Update roadmap to use `account_id` consistently throughout

2. **Audit Existing Auth Patterns** - Document how RLS currently works
   - How is account context passed to backend?
   - What's the pattern for account-scoped queries?
   - Can we reuse existing utility functions?

3. **Simplify Username System** - Remove business name from handle generation
   - Format: `{firstname}-{hash}` (e.g., "alex-h7k2")
   - Display name shows first name only
   - No business context in usernames (prevents leakage)

4. **Clarify MVP Boundary** - Remove Phase 2 confusion
   - Move @everyone entirely to Phase 2
   - Move monthly summaries to Phase 2
   - Focus Phase 1 on: posts, comments, reactions, direct mentions only

### Architecture Decisions Needed

5. **Realtime Strategy** - Confirm Supabase Realtime usage
   - Does PromptReviews already use Realtime elsewhere?
   - What's the data fetching pattern (SWR, React Query, direct client)?
   - How to prevent refresh issues (per CLAUDE.md known issues)?

6. **Feature Flags** - Infrastructure decision
   - Where are flags stored (database vs config)?
   - Who can toggle them (admin UI needed)?
   - Per-account or global flags?

7. **Channel Membership** - Simplify or keep explicit?
   - Recommendation: Remove `channel_memberships` table
   - Auto-grant access based on `account_users` membership
   - Simpler model, less complexity

---

## Validation Results

### ✅ Strengths of Current Roadmap

1. **Well-Structured Multi-Agent Approach** - Clear handoff points and responsibilities
2. **Comprehensive Feature Coverage** - All core community features addressed
3. **Security Conscious** - RLS policies, account isolation, and rate limiting considered
4. **Phased Approach** - Smart separation of MVP vs automation features
5. **Operational Safeguards** - Feature flags, staging rehearsal, rollback plan
6. **Testing Strategy** - Unit, integration, E2E, and performance tests planned

### ⚠️ Areas Requiring Attention

1. **Account Isolation** - Critical given recent issues (CLAUDE.md line 267-280)
2. **Mention Parsing** - Underspecified, needs detailed algorithm
3. **Error Handling** - User-facing messages need to be defined
4. **Performance Benchmarks** - Need specific targets (load time, query time)
5. **Content Moderation** - Profanity filter deferred to Phase 2, but abuse could occur in Phase 1

---

## Acceptance Criteria Highlights

### 100+ Testable Criteria Across:

- **Username System** (6 AC) - Handle generation, uniqueness, display, immutability
- **Navigation** (4 AC) - Community link, channel switching, default channel
- **Channel Management** (4 AC) - Auto-creation, display order, account scoping
- **Post Creation** (7 AC) - Validation, composer, guidelines gate, error handling
- **Post Display** (7 AC) - Feed, header, content rendering, actions, deleted state
- **Comments** (6 AC) - Display, composer, validation, edit/delete, deleted post handling
- **Reactions** (6 AC) - Display, adding, removing, multiple reactions, tooltips, rate limiting
- **Mentions** (7 AC) - Autocomplete, parsing, validation, display, cross-account prevention
- **Community Guidelines** (5 AC) - First visit modal, acceptance, link, content source
- **Account Switching** (6 AC) - Refresh, isolation, realtime update, draft handling
- **Real-time Updates** (7 AC) - Posts, comments, reactions, filtering, reconnection, performance
- **Permissions & Security** (9 AC) - Membership, ownership, cross-account, XSS/SQL injection, rate limiting
- **Performance** (7 AC) - Page load, infinite scroll, realtime, memory, bundle size

### Notable Edge Cases Covered

- User with no first name (handle generation fallback)
- Handle collision (retry logic, UUID fallback)
- Deleted post with comments (comments remain visible)
- Cross-account mention attempt (silently ignored)
- Account switch with unsaved draft (confirmation dialog)
- Realtime subscription during network failure (reconnection)
- Rate limiting for reactions and posts

---

## UI Requirements Highlights

### 25+ Components Specified

**Layout:** CommunityLayout, CommunityHeader, ChannelList, ChannelHeader

**Posts:** PostFeed, PostCard, PostComposer, PostActionsMenu

**Comments:** CommentList, CommentComposer

**Reactions:** ReactionBar, ReactionButton

**Inputs:** MentionAutocomplete

**Modals:** GuidelinesModal, ConfirmationDialog

**Utilities:** EmptyState, LoadingSpinner, Toast, RelativeTime

### Design Patterns Established

- Responsive breakpoints (mobile <768px, tablet 768-1024px, desktop >1024px)
- Accessibility requirements (WCAG AA, keyboard nav, ARIA labels)
- Loading states (skeletons, spinners, optimistic updates)
- Error handling (user-friendly messages, retry options)
- Performance optimization (code splitting, memoization, virtual scrolling)
- Integration with existing PromptReviews design system

### Open Design Questions Flagged

1. Should user avatars be shown in Phase 1?
2. Should channels have custom icons or always use #?
3. Reaction picker always visible or behind "+" button?
4. Who provides actual guidelines content text?
5. Support dark mode in Phase 1 or Phase 2?

---

## Risk Assessment

### High Risk Items

1. **Cross-Account Data Leakage** - History of issues (CLAUDE.md recent fixes)
   - Mitigation: Comprehensive RLS testing, Sentry monitoring, E2E tests

2. **Account Switcher Integration** - Could trigger unwanted refreshes (known issue)
   - Mitigation: Careful realtime subscription management, close modals on switch

3. **Performance with Large Datasets** - 10k+ posts per channel
   - Mitigation: Database indexes, cursor pagination, virtual scrolling

### Medium Risk Items

4. **Realtime Stability** - WebSocket connection issues
   - Mitigation: Feature flag to disable, fallback to manual refresh

5. **Mention Parsing Complexity** - Edge cases with special characters
   - Mitigation: Server-side validation, extensive unit tests

6. **Username Collisions** - Hash generation could fail
   - Mitigation: Retry logic, UUID fallback, monitoring

### Low Risk Items

7. **Content Moderation** - Spam/abuse in Phase 1
   - Mitigation: Rate limiting, admin delete, defer auto-moderation to Phase 2

8. **Mobile UX** - Touch interactions, small screens
   - Mitigation: Responsive design, 44px touch targets, mobile testing

---

## Success Criteria Validation

The roadmap defines clear success metrics:

✅ **30% weekly community visits** - Measurable via analytics
✅ **15% participation rate** - Trackable (posts/comments/reactions)
✅ **0 cross-account incidents** - Verifiable via monitoring
✅ **95% summary posts delivered** - Phase 2 metric, clear

### Additional Metrics Recommended

- **P95 page load time <2s** - Performance benchmark
- **Error rate <1%** - Reliability benchmark
- **40% 7-day retention** - Engagement benchmark
- **Accessibility score 100** - Quality benchmark

---

## Implementation Readiness

### ✅ Ready to Proceed (After Blockers Resolved)

- Data model is well-designed (pending account_id fix)
- API/RPC surface is comprehensive
- Component architecture is solid
- Testing strategy is thorough

### ⏸️ Blocked Until Decisions Made

- Database migrations (pending account scope decision)
- RLS policies (pending auth pattern confirmation)
- Username generation (pending multi-business resolution)
- Channel membership model (pending simplification decision)

### 📋 Dependencies on Other Teams

- **Design Team:** High-fidelity mockups, design tokens, guidelines content
- **Product Team:** Answer critical questions in gaps document
- **Infrastructure Team:** Feature flag system setup
- **Security Team:** Review RLS policies and account isolation approach

---

## Handoff Checklist

### For Product Team Review

- [ ] Review gaps-and-questions.md (25 issues identified)
- [ ] Answer critical questions (Issues #1-4 are blockers)
- [ ] Confirm MVP scope (Phase 1 features only)
- [ ] Approve success metrics
- [ ] Provide community guidelines content

### For Design Team Review

- [ ] Review ui-requirements.md (25+ components)
- [ ] Answer open design questions (10 questions listed)
- [ ] Provide high-fidelity mockups
- [ ] Export design tokens (colors, typography, spacing)
- [ ] Create empty state illustrations

### For Engineering Team Review

- [ ] Review acceptance-criteria.md (100+ criteria)
- [ ] Validate technical feasibility
- [ ] Confirm existing patterns can be reused
- [ ] Estimate effort for MVP
- [ ] Identify additional risks

### For Data Agent (Next in Sequence)

- [ ] Blockers resolved (account scope, RLS pattern, profiles table)
- [ ] Schema approved by product team
- [ ] Migration strategy confirmed
- [ ] RLS policy pattern documented
- [ ] Seed data requirements defined

---

## Recommended Next Steps

### Week 1: Alignment & Decision Making

1. **Day 1-2:** Stakeholder review meeting
   - Present findings and critical issues
   - Make decisions on blockers (#1-4)
   - Assign owners to open questions

2. **Day 3:** Technical deep dive
   - Audit existing auth/RLS patterns with tech lead
   - Document current account isolation approach
   - Confirm realtime usage and patterns

3. **Day 4-5:** Update roadmap
   - Product manager revises roadmap with decisions
   - Consistent terminology (account_id throughout)
   - Clear MVP boundary (remove Phase 2 references)

### Week 2: Design & Planning

4. **Day 6-8:** Design sprint
   - Design team creates mockups based on ui-requirements.md
   - Answer open design questions
   - Design review and iteration

5. **Day 9-10:** Engineering planning
   - Break down acceptance criteria into tasks
   - Estimate effort and timeline
   - Create sprint plan

### Week 3: Implementation Begins

6. **Data & RLS Agent** begins work
   - Create migrations
   - Implement RLS policies
   - Seed default channels

7. **Backend API Agent** prepares
   - Review API contracts
   - Plan RPC functions
   - Prepare test harnesses

---

## Final Recommendations

### Do This

1. **Prioritize account isolation** - Given history of issues, make this priority #1
2. **Simplify where possible** - Remove channel_memberships table, simplify username generation
3. **Test thoroughly** - Multi-account scenarios, concurrent users, edge cases
4. **Feature flag everything** - Ability to rollback any piece is critical
5. **Monitor closely** - Sentry, analytics, error tracking from day 1

### Don't Do This

1. **Don't add JWT claims** - Security risk, doesn't fit existing pattern
2. **Don't include business name in handles** - Causes multi-business confusion
3. **Don't mix Phase 1 and Phase 2** - Keep MVP focused and shippable
4. **Don't skip accessibility** - Build it in from the start, not retrofit
5. **Don't underestimate account switching complexity** - Known pain point

### Consider for Phase 2

1. Monthly/weekly summaries with auto-posting
2. @everyone broadcast mentions with email
3. Saved/pinned posts surface
4. In-app notification badges
5. Content moderation queue
6. Search functionality
7. User profiles
8. Rich text editor

---

## Conclusion

The Community Feature roadmap is **solid and well-thought-out**, with a clear vision and comprehensive coverage. However, **4 critical architectural decisions must be made** before implementation can proceed safely.

The biggest concerns are:
1. **Account isolation** (preventing data leakage across accounts)
2. **Consistency with existing patterns** (RLS, auth, data model)
3. **Username system complexity** (multi-business handling)

With these issues resolved, the feature is **ready to build** and has a high likelihood of success.

### Estimated Timeline (Post-Resolution)

- **Phase 0 (Prep):** 1 week - ✅ Complete
- **Phase 1 (Infrastructure):** 1 week - Data & RLS Agent
- **Phase 2 (Core MVP):** 2 weeks - Backend & Frontend Agents
- **Phase 3 (Beta):** 1 week - QA & pilot testing
- **Phase 4 (Launch):** 1 week - Rollout & monitoring

**Total MVP Timeline:** 6 weeks from blocker resolution to public launch

---

## Appendix: Document Links

- **Gaps & Questions:** `/docs/community/product-spec/gaps-and-questions.md`
- **Acceptance Criteria:** `/docs/community/product-spec/acceptance-criteria.md`
- **UI Requirements:** `/docs/community/product-spec/ui-requirements.md`
- **Original Roadmap:** `/slack-like-social feature.md`

---

**Agent Status:** Work Complete ✅
**Handoff Ready:** Awaiting stakeholder decisions on critical issues
**Next Agent:** Data & RLS Agent (blocked until issues #1-4 resolved)

---

*Prepared by: Product Spec Agent*
*Review Status: Draft*
*Approvers Needed: Product Manager, Tech Lead, Design Lead*
