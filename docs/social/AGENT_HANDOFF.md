# Multi-Platform Social Posting - Agent Handoff

**Date:** 2025-10-18
**Status:** Ready for Team Pickup
**Priority:** Bluesky Integration with Google Business Scheduler

---

## ⚠️ IMPORTANT SCOPE CHANGE (2025-10-18)

**Original Plan:** Build a standalone multi-platform composer.

**New Phase 1 Approach:** Extend the existing Google Business scheduler to support Bluesky as an optional additional platform.

**What This Means:**
- Users will see a checkbox "Also post to Bluesky" when creating/scheduling Google Business posts
- Google remains the primary platform (required)
- Bluesky is an optional addon (checkbox opt-in)
- Faster time to value, lower risk, natural integration point
- Standalone composer becomes Phase 2 (future)

**Read this handoff doc with the new approach in mind!** Some sections reference the standalone composer—those are Phase 2.

---

## 🎯 Quick Start

Welcome to the Multi-Platform Social Posting project! This document will get you oriented and productive quickly.

### What You're Building (Phase 1)
An enhancement to the existing Google Business post scheduler that allows users to optionally cross-post to Bluesky. Users will see a checkbox "Also post to Bluesky" in the Google Business composer, and when they schedule a post, it will go to both platforms.

### Critical Principles
1. **Never break Google Business posting** - existing flows are sacred and isolated
2. **Graceful degradation** - optional platform failures don't affect core features
3. **Feature-flagged rollout** - everything ships behind flags
4. **Account-scoped security** - all credentials use RLS with account isolation

---

## 📚 Essential Reading (In Order)

### 1. Master Plan (15 min read)
**Location:** `/Users/chris/promptreviews/MULTI_PLATFORM_POSTING_PLAN.md`

This is your source of truth. Read sections in this order:
1. Goals & Guiding Principles (lines 3-13)
2. Architecture Overview (lines 21-44)
3. AI Agent Coordination Playbook (lines 75-99)
4. Risks & Mitigations (lines 101-105)

**Key Takeaways:**
- Layered architecture: UI → PostManager → Adapter
- Connection registry stores encrypted platform credentials
- Bluesky first (low-risk, app password auth), then Twitter/X (OAuth), then Slack
- Scheduling v2 comes in Phase 2 after MVP proven

### 2. Task Board (5 min scan)
**Location:** `/Users/chris/promptreviews/docs/social/TASKBOARD.md`

Your daily work reference. Key sections:
- **Immediate Next Steps** (bottom) - what to do first by role
- **In Progress** - active work items with full specs
- **Spec Complete** - approved designs ready for implementation
- **Workstream Summary** - progress at a glance

### 3. Project Context (10 min read)
**Location:** `/Users/chris/promptreviews/CLAUDE.md`

Essential codebase knowledge:
- Tech stack: Next.js 15, Supabase, Prisma, TypeScript
- Database workflow: Supabase migrations → Prisma sync
- Git conventions and deployment process
- Known issues (important: Turbopack broken, don't use `--turbo`)

---

## 🏗️ Architecture Quick Reference

### Current State
```
Google Business Posting (ENHANCE, DON'T REPLACE)
├── Components: src/app/(app)/components/GoogleBusinessProfile/**
├── Database: google_business_scheduled_posts, google_business_scheduled_post_results
├── API: src/app/(app)/api/google-business/**
└── Cron: src/app/(app)/api/cron/process-google-business-scheduled/route.ts
```

### Target Architecture (Phase 1: Bluesky Integration)
```
Enhanced Google Business Posting + Bluesky
├── UI Enhancement: Add Bluesky checkbox to existing Google Business composer
├── Schema Extension: additional_platforms JSONB column on google_business_scheduled_posts
├── Bluesky Adapter: src/features/social-posting/adapters/BlueskyAdapter.ts (new)
├── Connection Storage: social_platform_connections table (new)
├── Connection API: src/app/(app)/api/social-posting/connections/route.ts (new)
└── Cron Enhancement: Post to Bluesky after Google posting succeeds
```

### Data Flow (Phase 1)
```
User → Google Business Composer UI (existing)
  ↓
  Sees "Also post to Bluesky" checkbox (feature flag controlled)
  ↓
  Checks Bluesky, fills content/media
  ↓
  Submits to existing Google Business endpoint
  ↓
  Saves post to google_business_scheduled_posts with additional_platforms = {bluesky: {...}}
  ↓
  Cron job runs at scheduled time
  ↓
  Posts to Google (existing flow, always happens)
  ↓
  If additional_platforms.bluesky.enabled: Load Bluesky adapter and post (wrap in try/catch)
  ↓
  Store results for both platforms in google_business_scheduled_post_results
```

### Phase 2 Architecture (Future: Standalone Composer)
```
Multi-Platform Composer (separate from Google Business)
├── UI: src/app/(app)/composer/** (to be created)
├── Supports: Bluesky, Twitter/X, Slack (no Google Business requirement)
├── Unified Scheduling Schema: social_scheduled_posts (new tables)
└── Platform-agnostic cron runner
```

---

## 🎭 Agent Roles & Responsibilities

### Infrastructure Agent
**Focus:** Database, core services, security
**First Tasks:** INF-1, INF-2 (see Task Board)
**Key Skills:** SQL migrations, Prisma, RLS policies, TypeScript services

**Your Deliverables:**
1. `social_platform_connections` table with RLS
2. `AdapterRegistry` service for lazy adapter loading
3. Connection management endpoints (CRUD)
4. Server helpers for loading account connections

**Coordination:**
- Pair with Adapter Agent on interface contracts
- Review schema changes with QA Agent for RLS tests
- Sync with Product Strategist on feature flags

### Adapter Agent
**Focus:** Platform-specific integrations
**First Tasks:** ADAPT-1 (Bluesky), then API-1
**Key Skills:** API client libraries, OAuth flows, error handling

**Your Deliverables:**
1. BlueskyAdapter implementing PostManager interface
2. Session management (app password → refresh token)
3. Content validation (character limits, media rules)
4. Integration tests with mocked APIs

**Coordination:**
- Wait for Infrastructure Agent to complete INF-1 + INF-2
- Share API contracts with Infrastructure Agent before coding
- Work with QA Agent on test scenarios

### UI/UX Agent
**Focus:** UI enhancement to Google Business composer
**First Tasks:** SPEC-2 (design Bluesky checkbox), then UI-1 (implement)
**Key Skills:** React, Next.js, Tailwind, Headless UI, user experience

**Your Deliverables (Phase 1):**
1. Design Bluesky checkbox placement in Google Business composer
2. Connection status indicators (connected/disconnected/error)
3. "Connect Bluesky" modal or flow
4. Validation warnings if content exceeds Bluesky limits
5. Save platform selection to `additional_platforms` column

**Your Deliverables (Phase 2 - Future):**
1. Standalone multi-platform composer interface
2. Connection management dashboard page

**Coordination:**
- Pair with Product Strategist on UX requirements
- DO NOT modify existing Google Business UI until SPEC-2 approved
- Follow existing dashboard patterns (see `/src/app/(app)/dashboard/`)

### Product Strategist Agent
**Focus:** Scope, requirements, business rules
**First Tasks:** SPEC-1 (plan matrix), documentation setup
**Key Skills:** Product planning, feature flags, documentation

**Your Deliverables:**
1. Plan tier matrix (which platforms on which plans)
2. Feature flag naming convention
3. Upgrade gating logic in `/src/lib/account-features.ts`
4. Status tracking in `/docs/status/social-composer.md`

**Coordination:**
- Review all specs before implementation starts
- Sign off on design with UI/UX Agent
- Lead weekly retrospectives (async in task board)

### QA & Reliability Agent
**Focus:** Testing, validation, regression prevention
**First Tasks:** Build Google regression suite, review all PRs
**Key Skills:** Testing strategy, manual QA, security review

**Your Deliverables:**
1. Google Business posting regression tests
2. Integration tests for new adapters
3. RLS validation for connection storage
4. Launch checklist enforcement

**Coordination:**
- Review all migrations with Infrastructure Agent
- Validate adapter implementations before merge
- Sign off on launches with Product Strategist

---

## 🚀 Implementation Sequence (Phase 1)

### Step 1: Foundation (Week 1)
**Goal:** Database infrastructure ready

1. **Infrastructure Agent:**
   - [ ] Create `social_platform_connections` migration (INF-1)
   - [ ] Add `additional_platforms` column to google_business_scheduled_posts (INF-2)
   - [ ] Add RLS tests
   - [ ] Sync Prisma schema

2. **QA Agent:**
   - [ ] Build Google Business regression suite
   - [ ] Document test scenarios

3. **Product Strategist:**
   - [ ] Finalize SPEC-1 (plan tier matrix for Bluesky access)
   - [ ] Create `/docs/status/social-composer.md`

**Exit Criteria:**
- ✅ Migrations merged and tested
- ✅ Google posting still works (regression tests pass)
- ✅ Can store Bluesky connection data

### Step 2: Adapter & API (Week 2)
**Goal:** Bluesky adapter functional with connection management

1. **Adapter Agent:**
   - [ ] Install `@atproto/api` dependency
   - [ ] Implement BlueskyAdapter (ADAPT-1)
   - [ ] Create mock integration tests

2. **Infrastructure Agent:**
   - [ ] Build connection management endpoints (API-1)
   - [ ] Test storing/retrieving Bluesky credentials

3. **QA Agent:**
   - [ ] Test Bluesky posting flow with mocked API
   - [ ] Verify account isolation in connections

**Exit Criteria:**
- ✅ Can connect Bluesky account via API
- ✅ Can post to Bluesky via adapter (mocked)
- ✅ Errors fail gracefully

### Step 3: UI & Cron Enhancement (Week 3)
**Goal:** Bluesky checkbox live in Google Business composer

1. **UI/UX Agent:**
   - [ ] Complete SPEC-2 (Bluesky checkbox UX design)
   - [ ] Implement UI-1 (add checkbox to Google Business composer)
   - [ ] Add connection status indicators
   - [ ] Implement "Connect Bluesky" flow

2. **Infrastructure Agent:**
   - [ ] Enhance cron job to post to Bluesky (CRON-1)
   - [ ] Store per-platform results
   - [ ] Add comprehensive error handling

3. **Product Strategist:**
   - [ ] Set up `feature_bluesky_posting` flag
   - [ ] Prepare beta user communications

**Exit Criteria:**
- ✅ Checkbox visible in Google Business composer (behind flag)
- ✅ Can schedule posts with Bluesky enabled
- ✅ Existing Google posting flow unchanged

### Step 4: Integration & Launch (Week 4)
**Goal:** End-to-end Bluesky posting launched to beta users

1. **QA Agent:**
   - [ ] Full manual testing (happy path + errors)
   - [ ] Test scheduled posts going to both platforms
   - [ ] Verify failure scenarios (expired credentials, rate limits)
   - [ ] Security review (no token leakage, account isolation)

2. **Product Strategist:**
   - [ ] Enable feature flag for beta accounts
   - [ ] Monitor Sentry for errors
   - [ ] Gather user feedback

3. **All Agents:**
   - [ ] Monitor deployment
   - [ ] Fix any issues discovered
   - [ ] Document learnings

**Exit Criteria:**
- ✅ Beta users can post to Google + Bluesky
- ✅ Google posting success rate unchanged
- ✅ Bluesky posting success rate >90%
- ✅ All tests pass (regression + new features)

---

## 🔧 Development Environment Setup

### Prerequisites
```bash
# Node.js 18+ required
node --version  # Should be 18.x or higher

# Install dependencies
cd /Users/chris/promptreviews
npm install

# Verify Supabase CLI
npx supabase --version
```

### Environment Variables
Copy `.env.local.example` (if exists) or ensure you have:
```bash
# Required for local development
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# For Sentry (optional, disable in dev)
DISABLE_SENTRY=true

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Local Database
```bash
# Reset local database to match migrations
npx supabase db reset --local

# After schema changes, sync Prisma
npx prisma db pull
npx prisma generate
```

### Run Development Server
```bash
# Standard dev server (port 3002)
npm run dev

# IMPORTANT: Do NOT use --turbo flag (currently broken)
# DO NOT run: npm run dev:fast

# With Sentry enabled for debugging
npm run dev:debug
```

### Verify Setup
1. Open http://localhost:3002
2. Sign in to dashboard
3. Check existing Google Business posting works
4. Console should show no errors

---

## 📋 Daily Workflow

### Starting Your Day
1. Pull latest changes: `git pull origin main`
2. Check Task Board for your assigned tasks
3. Read card comments for blockers/updates from other agents
4. Update your task status in Task Board

### During Development
1. Create feature branch: `git checkout -b feature/your-task-name`
2. Make changes, commit frequently with clear messages
3. Run tests: `npm run lint`, `npm run test:auth`
4. Post progress updates in Task Board card comments

### Before Submitting for Review
1. Self-review checklist:
   - [ ] Code follows existing patterns
   - [ ] TypeScript types are correct
   - [ ] No console errors in browser
   - [ ] Google Business posting still works
   - [ ] Comments explain complex logic
   - [ ] Secrets/tokens never logged

2. Move card to "Ready for QA" column
3. Tag reviewers in card comments
4. Link PR in card details

### Code Review Process
- **Reviewer:** Non-author agent reviews code
- **QA Agent:** Runs test suite and manual tests
- **Both must approve** before merging

---

## 🔍 Finding Your Way Around the Codebase

### Key Directories
```
/Users/chris/promptreviews/
├── src/
│   ├── app/(app)/
│   │   ├── dashboard/          # Dashboard pages (existing)
│   │   ├── api/                # API routes (extend here)
│   │   └── composer/           # New composer UI (to create)
│   ├── features/
│   │   └── social-posting/     # Core posting logic (refactor here)
│   │       ├── core/
│   │       │   └── services/   # PostManager, AdapterRegistry
│   │       └── adapters/       # Platform adapters (Bluesky, etc.)
│   ├── lib/
│   │   ├── account-features.ts # Plan/feature checks
│   │   └── prisma.ts           # Database client
│   └── components/ui/          # Reusable UI components
├── supabase/
│   └── migrations/             # Database migrations (add here)
├── prisma/
│   └── schema.prisma           # Database types (sync with migrations)
├── docs/
│   ├── social/                 # This project's docs
│   └── status/                 # Status tracking (create here)
└── CLAUDE.md                   # Project context (read first)
```

### Existing Patterns to Follow

**API Routes:**
```typescript
// src/app/(app)/api/example/route.ts
import { createClient } from '@/auth/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use account ID from session, never trust client input
  const accountId = await getAccountIdForUser(user.id)

  // Your logic here

  return Response.json({ success: true })
}
```

**React Components:**
```typescript
// src/app/(app)/composer/page.tsx
'use client'

import { useAuth } from '@/auth/context/AuthProvider'
import { Button } from '@/components/ui/button'

export default function ComposerPage() {
  const { selectedAccount } = useAuth()

  // Component logic

  return (
    <div className="space-y-4">
      {/* Use Tailwind classes, Headless UI components */}
    </div>
  )
}
```

**Database Migrations:**
```sql
-- supabase/migrations/20251018120000_create_social_platform_connections.sql

-- Create table
CREATE TABLE social_platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  credentials JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE social_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account connections"
  ON social_platform_connections FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
```

---

## 🚨 Common Pitfalls to Avoid

### 1. Breaking Google Business Posting
**DON'T:**
- Modify files in `src/app/(app)/components/GoogleBusinessProfile/`
- Change `google_business_scheduled_posts` schema
- Share components between Google and new composer (yet)

**DO:**
- Run regression tests before every commit
- Keep Google adapter registration separate
- Test Google posting after any PostManager changes

### 2. Cross-Account Data Leakage
**DON'T:**
- Trust `accountId` from client requests
- Skip RLS policies on new tables
- Use user_id alone (accounts can have multiple users)

**DO:**
- Always get account ID from session server-side
- Test connection queries with multiple accounts
- Add RLS tests for every new table

### 3. Cascading Failures
**DON'T:**
- Throw errors from adapter methods if only one platform fails
- Make Google posting depend on other platforms
- Block UI if optional platform connection fails

**DO:**
- Return per-platform results (success + errors)
- Wrap adapter calls in try/catch
- Show graceful error messages in UI

### 4. Token/Credential Security
**DON'T:**
- Log credentials or tokens (even in dev)
- Store tokens in localStorage or client state
- Return raw credentials from API endpoints

**DO:**
- Encrypt credentials in database
- Use service role key for credential access
- Return connection status only (not tokens)

### 5. Forgotten Documentation
**DON'T:**
- Skip updating Task Board status
- Leave decisions undocumented
- Merge without updating CHANGELOG

**DO:**
- Post daily updates in card comments
- Document "why" decisions in code comments
- Update `/docs/social/posting-notes.md` with key learnings

---

## 🧪 Testing Strategy

### Unit Tests
**Location:** Create alongside implementation files
```typescript
// src/features/social-posting/adapters/__tests__/BlueskyAdapter.test.ts
import { BlueskyAdapter } from '../BlueskyAdapter'

describe('BlueskyAdapter', () => {
  it('validates post within character limit', () => {
    // Test logic
  })
})
```

### Integration Tests
**Location:** `/tests/social-posting/` (create this directory)
```typescript
// tests/social-posting/bluesky-flow.test.ts
// Test full flow: connect → post → verify
```

### Manual Testing Checklist
- [ ] Connect Bluesky account
- [ ] Post text-only content
- [ ] Post with image attachment
- [ ] Post to Google + Bluesky simultaneously
- [ ] Disconnect Bluesky account
- [ ] Try to post after disconnect (should show error)
- [ ] Verify Google posting unaffected by Bluesky errors
- [ ] Check account isolation (switch accounts, verify separate connections)

### Regression Tests
**Must pass before every merge:**
```bash
# Run linter
npm run lint

# Test auth flow
npm run test:auth

# Manual: Load Google Business composer
# Manual: Create a test Google Business post
# Manual: Verify scheduled posts display correctly
```

---

## 📊 Monitoring & Rollout

### Feature Flags
**Location:** TBD by Product Strategist (likely `account_features` table)

**Flags to Create:**
- `feature_social_composer` - Gates access to new composer
- `feature_bluesky_posting` - Enables Bluesky adapter
- `feature_twitter_posting` - For Phase 2
- `feature_slack_posting` - For Phase 2

### Launch Checklist
Before flipping flags in production:
- [ ] All tests pass (unit + integration + regression)
- [ ] QA Agent manual testing complete
- [ ] Two agents have reviewed code
- [ ] Sentry monitoring active
- [ ] Rollback plan documented
- [ ] Support team notified
- [ ] Metrics dashboard created

### Metrics to Watch
- Google Business posting success rate (should not change)
- Bluesky posting success rate
- Connection errors per platform
- API response times
- Error rate in Sentry

### Rollback Plan
If issues found in production:
1. Disable feature flag immediately
2. Investigate errors in Sentry
3. Fix issues in staging
4. Re-test full suite
5. Gradual re-enable with monitoring

---

## 🆘 Getting Help

### When Blocked
1. Check Task Board for dependencies
2. Post blocker in card comments
3. Tag relevant agent for coordination
4. Document decision/resolution

### Key Resources
- **Main Plan:** `MULTI_PLATFORM_POSTING_PLAN.md` (architecture, risks)
- **Task Board:** `docs/social/TASKBOARD.md` (daily work)
- **Project Context:** `CLAUDE.md` (codebase conventions)
- **This Handoff:** `docs/social/AGENT_HANDOFF.md` (you are here)

### Documentation to Create
- `/docs/status/social-composer.md` - Current status, flag states, recent deploys
- `/docs/social/posting-notes.md` - API quirks, rate limits, key decisions
- `/tests/social-posting/README.md` - Test scenarios and setup

---

## ✅ Handoff Complete - You're Ready!

### Your First 30 Minutes
1. ✅ Read MULTI_PLATFORM_POSTING_PLAN.md (Goals, Architecture, Playbook)
2. ✅ Scan TASKBOARD.md (find your role's "Immediate Next Steps")
3. ✅ Skim CLAUDE.md (tech stack, database workflow, known issues)
4. ✅ Set up dev environment (install, run server, verify Google posting)
5. ✅ Claim your first task in Task Board

### Your First Day
1. Read your first task card completely
2. Review code areas you'll modify
3. Post questions in card comments
4. Coordinate with dependency owners
5. Start implementation following existing patterns

### Your First Week
1. Complete at least one task end-to-end
2. Participate in code review (review someone else's work)
3. Update Task Board daily
4. Document one decision in posting-notes.md
5. Run regression tests before every commit

---

## 🎉 Welcome to the Team!

You have everything you need to start building. The foundation is solid, the plan is clear, and the first platform (Bluesky) is scoped for quick wins.

Remember:
- **Never break Google Business posting** (that's the golden rule)
- **Ship behind feature flags** (safe, gradual rollout)
- **Update the Task Board** (daily communication)
- **Ask for help early** (tag agents in card comments)

The next agent picking this up will thank you for keeping docs updated and tests passing. Let's build something great! 🚀

---

**Questions?** Post in Task Board card comments or create a new issue in the repo.
**Feedback on this handoff?** Update this document to help the next agent!
