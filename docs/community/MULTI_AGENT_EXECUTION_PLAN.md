# Multi-Agent Execution Plan - Community Feature

## Overview

This plan outlines how to execute the Slack-like community feature using multiple specialized agents working in parallel and sequential tracks.

## Key Architectural Context

### 1. Account Isolation
- Uses `account_users` table (no JWT claim for `active_account_id`)
- RLS policies filter via subquery: `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`
- Account context from `useAccountBusiness()` hook
- `switchAccount()` updates localStorage + triggers reload

### 2. Avatar Strategy
- Use `businesses.logo_url` for all post/comment avatars
- Business-centric (not user avatars)
- Fallback to generic icon if null

### 3. Username Generation
- **No backfill needed** - generate on first community opt-in
- Pattern: `firstname-businessname-{4char-hash}`
- Store in `auth.users` (add columns via migration)

### 4. Free Trial Gating
- Add `can_use_community(account_id)` SQL function
- Check account plan in RLS policies
- UI shows upgrade prompt for ineligible accounts

### 5. Component Constraints
- **Max 600 lines per file**
- Centralize reusable logic in `/lib/community/`
- Use composition over monoliths

### 6. Testing Infrastructure
- ✅ Playwright (configured)
- ❌ Vitest (need to add)
- ❌ pgTAP (Phase 2)

## Execution Tracks

### Track A: Foundation (Parallel)

**Agent 1a: Product Spec Agent** (5 days)
- Refine user journeys from plan
- Create wireframe references
- Draft community guidelines content
- Define acceptance criteria
- Document digest sharing UX

**Agent 1b: Data Agent** (5 days)
*Can run in parallel with 1a*
- Design migrations following existing patterns
- Implement RLS policies with account_users subquery
- Add username columns to auth.users
- Seed default channels per account:
  - General (general discussions)
  - Strategy (tactics & best practices)
  - Google-Business (GBP-specific topics)
  - Feature-Requests (product feedback)
- **Deliverable**: Migration files, ER diagram

**Gate**: Both agents complete before Track B starts

---

### Track B: Backend (Sequential after Track A)

**Agent 2: Backend Agent** (7 days)
*Requires Data Agent completion*
- Implement Supabase RPC functions:
  - `create_post()`, `update_post()`, `delete_post()`
  - `create_comment()`, `toggle_reaction()`
  - `log_mentions()`, `mark_mentions_read()`
  - `acknowledge_guidelines()`
  - `generate_user_handle()` (on demand)
- Create centralized utilities in `/src/lib/community/`:
  - `mentions.ts` - Parse @mentions
  - `permissions.ts` - Role/gating checks
  - `formatting.ts` - Sanitize text
  - `reactions.ts` - Toggle logic
- Add Vitest for unit tests
- API routes in `/src/app/api/community/`:
  - `GET /api/community/channels` - List channels
  - `POST /api/community/posts` - Create post (calls RPC)
  - `GET /api/community/posts/[postId]` - Get post
  - `GET /api/community/mentions/search` - Autocomplete
- **Deliverable**: Working API, RPC functions, 80%+ test coverage

---

### Track C: Frontend (Overlaps with Backend)

**Agent 3: Frontend Agent** (10 days)
*Can start when Backend Agent has RPC contracts defined (day 2)*
- **Phase 3a: Core Components** (days 1-5, parallel with Backend)
  - `CommunityLayout.tsx` - Main layout (<200 lines)
  - `ChannelSidebar.tsx` - Channel list (<200 lines)
  - `PostFeed.tsx` - Infinite scroll feed (<300 lines)
  - `PostCard.tsx` - Single post display (<200 lines)
  - `PostComposer.tsx` - Create post modal (<250 lines)
  - `CommentList.tsx` + `CommentComposer.tsx` (<150 lines each)
  - `GuidelinesModal.tsx` - Guidelines + acknowledgment (<200 lines)
  - `MentionAutocomplete.tsx` - @mention picker (<150 lines)

- **Phase 3b: Integration** (days 6-10, requires Backend completion)
  - Integrate with `useAccountBusiness()` hook
  - Implement Realtime subscriptions (first use in codebase!)
  - Add optimistic updates
  - Handle account switching
  - Implement fallback polling
  - Wire up API calls
  - Add Sentry events

- **Testing**:
  - Playwright E2E for core flows
  - Component tests with Vitest
  - Multi-account scenario testing

- **Deliverable**: Full UI, account-aware, Realtime working

---

### Track D: Polish & Automation (Parallel after Track C)

**Agent 4a: QA Agent** (5 days)
*Can start when Frontend Agent reaches Phase 3b*
- Load test data (50+ posts per channel)
- Manual test matrix:
  - Account switching scenarios
  - Multi-user Realtime updates
  - Free trial gating
  - Guidelines enforcement
  - Character limits, sanitization
- Regression suite (Playwright)
- Performance testing (10k posts)
- Security audit (RLS bypass attempts)
- **Deliverable**: Test matrix, regression suite, bug reports

**Agent 4b: Documentation Agent** (3 days)
*Can run in parallel with QA*
- Update `/docs/community/` with final architecture
- User-facing help docs
- Admin playbook
- Launch checklist
- Rollout messaging
- **Deliverable**: Complete documentation

---

### Track E: Phase 2 (Post-MVP)

**Agent 5: Automation Agent** (Phase 2, separate cycle)
*Scheduled after MVP ships and validates*
- Monthly/weekly summary tables
- Vercel Cron endpoint for summary generation
- Analytics aggregation pipeline
- Digest share modal + asset generation
- Pinned/saved posts UI
- Email notifications (optional)

---

## Parallel Execution Strategy

### Week 1-2: Foundation
```
Product Spec Agent ━━━━━━━━━━━━━━━┓
                                  ┣━━━ Gate ━━━➤ Backend Agent
Data Agent ━━━━━━━━━━━━━━━━━━━━━┛
```

### Week 2-3: Backend + Frontend Kickoff
```
Backend Agent ━━━━━━━━━━━━━━━┓
                              ┣━━━ Integration ━━━➤
Frontend Agent (Phase 3a) ━━━┛
```

### Week 3-4: Integration + QA
```
Frontend Agent (Phase 3b) ━━━━━━━━━┓
                                    ┣━━━➤ Launch
QA Agent ━━━━━━━━━━━━━━━━━━━━━━━━━┛
Docs Agent ━━━━━━━━━━━━━━━━━━━━━━┛
```

**Total Timeline: ~4 weeks for MVP**

---

## Handoff Gates

Each agent MUST complete their handoff document before the next agent starts:

1. **Product Spec → Data**: Requirements frozen, wireframes approved
2. **Data → Backend**: Migrations deployed, RLS tested
3. **Backend (Day 2) → Frontend (Phase 3a)**: RPC contracts defined
4. **Backend (Complete) → Frontend (Phase 3b)**: All APIs working
5. **Frontend → QA**: UI feature-complete
6. **QA → Launch**: All critical bugs fixed

---

## Agent-Specific Guidelines

### Product Spec Agent
- Focus on **Phase 1 MVP only** (defer automation to Phase 2)
- Wireframes should be simple references (not pixel-perfect)
- Guidelines content must be ready for DB seeding

### Data Agent
- Follow existing migration naming: `YYYYMMDDHHMMSS_description.sql`
- Test RLS with multiple account scenarios
- Document all indexes for performance
- Use DO blocks for error handling (see existing migrations)

### Backend Agent
- All functions < 100 lines
- Centralize shared logic in `/lib/community/`
- Use existing auth patterns (no new auth system)
- Add Vitest alongside Playwright

### Frontend Agent
- No file > 600 lines (split aggressively)
- Use business logo from `businesses.logo_url`
- First Realtime implementation - document patterns
- Account switch must reload cleanly

### QA Agent
- Test cross-account isolation thoroughly
- Validate free trial gating
- Load test with realistic data volumes
- Security focus on RLS policies

---

## Risk Mitigation

### Risk 1: Realtime Implementation (Greenfield)
**Mitigation**: Frontend Agent documents patterns, creates reusable hook

### Risk 2: Account Isolation Bugs
**Mitigation**: Data Agent writes comprehensive RLS tests, QA focuses on this

### Risk 3: Component Size Creep
**Mitigation**: Code review at 500 lines, force refactor before merge

### Risk 4: Free Trial Spam
**Mitigation**: Gating function in place from Day 1, admin override available

---

## Success Criteria

**MVP Launch Checklist**:
- [ ] All migrations deployed (local + production)
- [ ] RLS policies validated (no cross-account access)
- [ ] Posting, commenting, reactions working
- [ ] Realtime updates functional
- [ ] Account switching tested
- [ ] Guidelines modal enforced
- [ ] Business logos as avatars
- [ ] Free trial gating working
- [ ] Playwright E2E passing
- [ ] Performance acceptable (< 2s page load)
- [ ] Security audit clean
- [ ] Documentation complete

**Phase 1 Complete When**:
- 30% of active accounts visit community (Week 4 post-launch)
- 15% create/react to posts (Week 8 post-launch)
- Zero P1 security incidents
- Zero cross-account data leaks

---

## Agent Coordination Commands

### For Human Orchestrator

**Kick off Foundation Track**:
```bash
# Start both agents in parallel
claude-agent start product-spec --config docs/community/agents/product-spec.yml
claude-agent start data --config docs/community/agents/data.yml
```

**Monitor Progress**:
```bash
# Check status
cat docs/community/handoffs/STATUS.md

# View agent logs
claude-agent logs product-spec
claude-agent logs data
```

**Approve Handoff Gate**:
```bash
# After reviewing handoff docs
claude-agent approve-handoff data
claude-agent start backend  # Unlocked after approval
```

---

## Communication Protocol

**Daily Standup** (Async):
- Each agent updates `docs/community/handoffs/STATUS.md`
- Blockers flagged in GitHub issues
- Questions posted in project channel

**Handoff Review**:
- Human reviews handoff doc within 24h
- Approves or requests changes
- Next agent notified to proceed

**Emergency Escalation**:
- Critical blocker: Tag @chris in project channel
- Security issue: Immediate halt, security review
- Architecture change needed: All agents sync meeting

---

## Phase 2 Trigger Criteria

**Do NOT start Automation Agent until**:
- MVP shipped to production
- ≥100 active community users across ≥10 accounts
- Feature adoption validated (30% weekly visit rate)
- No P1/P0 bugs outstanding
- User feedback collected

**Estimated Phase 2 Start**: 6-8 weeks post-MVP launch

---

## Appendix: File Size Enforcement

**Automated Check** (add to CI):
```bash
# Find files > 600 lines in community feature
find src/app/community src/components/community -name "*.tsx" -o -name "*.ts" | \
  xargs wc -l | awk '$1 > 600 {print $2, $1, "lines - REFACTOR NEEDED"}'
```

**Refactor Strategy**:
- Extract custom hooks → `/hooks/use*.ts`
- Extract utilities → `/lib/community/*.ts`
- Split large components into sub-components
- Use composition (render props, children)

---

## Questions for Human Review

1. ✅ **Account switcher integration** - Confirmed `useAccountBusiness()` pattern
2. ✅ **Business logos** - Use `logo_url` from businesses table
3. ✅ **Username backfill** - Not needed, generate on opt-in
4. ✅ **Testing tools** - Playwright exists, add Vitest
5. ✅ **Realtime** - No existing usage, document patterns
6. ⚠️ **Free trial limits** - Confirm gating behavior (post-only? read-only? full block?)
7. ⚠️ **Channel seeding** - Seed for all accounts or opt-in?
8. ⚠️ **Admin role** - Use existing admin check or new community_admin role?

**✅ CONFIRMED (2025-10-05)**:
- **Free trial gating**: Posting only, implementation deferred (not in MVP)
- **Channel membership**: All users see all channels automatically (no join/leave UI needed)
- **Admin role**: Use existing `auth.jwt() ->> 'role' = 'admin'` check
