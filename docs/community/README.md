# Community Feature Documentation

**Status**: Planning Phase
**Architecture**: Global Public Community (v2)
**Last Updated**: 2025-10-06

---

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| **[ROADMAP-v2.md](./ROADMAP-v2.md)** | Complete product specification and implementation plan | All team members |
| **[DECISIONS-NEEDED.md](./DECISIONS-NEEDED.md)** | Critical decisions requiring stakeholder input | Product owner, stakeholders |
| **[MIGRATION-PLAN.md](./MIGRATION-PLAN.md)** | Database migration strategy and scripts | Data agent, backend team |
| **[CHANGES-FROM-V1.md](./CHANGES-FROM-V1.md)** | Architectural pivot documentation | All team members |

---

## Executive Summary

The Community Feature will create **one global public community** where all PromptReviews customers can interact, share tactics, and celebrate wins together.

### Key Architectural Decisions

✅ **Global Public Architecture** (not per-account isolated)
- All authenticated users see the same posts, channels, and content
- Account selection only affects posting identity display ("User • Business Name")
- No `account_id` on posts, comments, or reactions (data is global)

✅ **Simplified Data Model**
- 70% reduction in table columns vs. original plan
- 10x faster queries (no account isolation subqueries)
- Simple RLS: authenticated users can read/write

✅ **One Shared Space**
- Global channels: General, Strategy, Google Business, Feature Requests, Wins
- All customers interact in same space (like one Slack workspace)
- Network effects drive engagement

---

## Critical Decisions Needed (Before Implementation)

See **[DECISIONS-NEEDED.md](./DECISIONS-NEEDED.md)** for detailed analysis.

### High Priority

1. **Monthly Summary Privacy**: Public by default, private by default, or opt-in?
   - **Impact**: Privacy concerns vs. engagement
   - **Recommendation**: Opt-in (private by default)

2. **Moderation Responsibility**: Team only, community moderators, or hybrid?
   - **Impact**: Scalability vs. overhead
   - **Recommendation**: Team only for MVP

3. **Launch Rollout**: Full launch, phased, opt-in, or plan-based?
   - **Impact**: Risk management vs. speed
   - **Recommendation**: Phased rollout (pilot → beta → full)

### Medium Priority

4. **Channel Strategy**: Generic only, industry-specific, or controlled expansion?
5. **@everyone Broadcasts**: Who can use? Frequency limits?
6. **Email Notifications**: MVP or Phase 2? Which types?

### Low Priority

7. **Username Immutability**: Can users change their username?
8. **Privacy Controls**: Beyond authentication, any additional controls?

---

## Implementation Phases

### Phase 0: Planning (1 week) - **CURRENT**
- ✅ Review architectural decisions
- ⏳ Stakeholder review of DECISIONS-NEEDED.md
- ⏳ Finalize monthly summary privacy approach
- ⏳ Assign agent owners

### Phase 1: Database Foundation (1 week)
- Create migration files (4 migrations)
- Implement RLS policies
- Seed default channels
- Test with multiple users

### Phase 2: Core MVP (2 weeks)
- Build community UI (Next.js components)
- Implement posting, commenting, reactions
- Add @mention autocomplete
- Wire realtime subscriptions
- Internal beta

### Phase 3: Public Beta (1 week)
- 10-20 pilot customers
- Collect feedback
- Iterate on UX

### Phase 4: Monthly Summaries (2 weeks)
- Build aggregation pipeline
- Create cron job
- Add share functionality
- Test opt-in/opt-out

### Phase 5: Notifications & Engagement (1 week)
- @mention notifications
- Unread badges
- Saved posts
- Admin moderation tools

### Phase 6: Launch & Iterate
- Rollout to all customers
- Monitor metrics
- Plan next features

---

## Architecture Highlights

### Global vs. Per-Account

**Original Plan (v1)**: Isolated communities per account
**Current Plan (v2)**: One global public community

**Why Changed**:
- Performance: 10x faster queries without account isolation
- Engagement: Network effects require critical mass
- Simplicity: 70% fewer database columns, simpler RLS
- Reality: Not enough users per account for vibrant isolated communities

See **[CHANGES-FROM-V1.md](./CHANGES-FROM-V1.md)** for detailed comparison.

### Data Model Simplification

**v1 (Complex)**:
```sql
posts (account_id, channel_id, author_id, content)
RLS: account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())
```

**v2 (Simple)**:
```sql
posts (channel_id, author_id, content)
RLS: deleted_at IS NULL
```

**Impact**: Direct queries, no joins, 10x performance improvement

### Identity Display

Users have:
- **Username**: `alex-7h3n` (global, immutable)
- **Display Name**: Changes with account selection
  - Account A: "alex-7h3n • Fireside Bakery"
  - Account B: "alex-7h3n • Other Business"

---

## Key Files & Migration Scripts

### Database Migrations

Location: `/supabase/migrations/`

1. **20251006120000_create_community_core_tables.sql**
   - community_profiles, channels, posts, comments, reactions, mentions, monthly_summaries, saved_posts

2. **20251006120001_create_community_rls_policies.sql**
   - Simple authenticated access policies

3. **20251006120002_seed_default_channels.sql**
   - General, Strategy, Google Business, Feature Requests, Wins

4. **20251006120003_add_community_username_function.sql**
   - generate_username(), get_user_display_name(), parse_mentions()

See **[MIGRATION-PLAN.md](./MIGRATION-PLAN.md)** for complete scripts and testing strategy.

---

## Success Metrics

### Launch Goals (30 days)

- **Adoption**: 30% of active users visit community weekly
- **Engagement**: 15% of visitors post or comment
- **Content**: 100+ posts in first week
- **Contributors**: 50+ unique users
- **Quality**: <5 moderation incidents
- **Performance**: <500ms page load time

### Tracking Events

- `community_viewed`
- `post_created`, `comment_created`, `reaction_added`
- `mention_sent`, `mention_received`
- `guidelines_accepted`
- `monthly_summary_posted`, `summary_shared_externally`

---

## Design System

### Glassmorphic Components

Matches PromptReviews design system:
- Frosted glass panels: `rgba(255, 255, 255, 0.08)`
- Backdrop blur: `blur(10px)`
- Subtle borders: `rgba(255, 255, 255, 0.18)`
- High contrast text for accessibility

### Visual Elements

- **Prompt Reviews Team Badge**: Purple gradient badge for team posts
- **Author Identity**: "username • Business Name" format
- **Reactions**: Colorful emoji with hover states
- **Channels**: Icon + name in sidebar

---

## Testing Strategy

### Required Tests

**Unit Tests**:
- Username generation and collision handling
- Mention parsing (@username extraction)
- Reaction toggle logic

**Integration Tests**:
- RLS policies (authenticated access, ownership checks)
- Post/comment creation and retrieval
- Mention notification creation

**E2E Tests** (Playwright):
- User posts → appears in feed
- User comments → comment appears
- User reacts → count increments
- User @mentions → notification created
- User switches account → identity changes (data stays same)

**Performance Tests**:
- 10k posts load time
- Realtime updates with 500 subscribers
- Mention search with 5k users

---

## Risk Mitigation

### Privacy Concerns
- **Risk**: Competitors see each other's posts/stats
- **Mitigation**: Opt-in summaries, clear guidelines, authenticated-only access

### Low Engagement
- **Risk**: Empty community, no posts
- **Mitigation**: Seed with team posts, onboarding prompts, weekly digests

### Spam & Abuse
- **Risk**: Spam overwhelms community
- **Mitigation**: Rate limiting, moderation tools, community guidelines

### Technical Performance
- **Risk**: Slow queries at scale
- **Mitigation**: Proper indexing, pagination, caching

---

## Directory Structure (Agent Artifacts)

- **`/data`** - Database migrations, RLS policies, ER diagrams (Data Agent)
- **`/backend`** - API endpoints, RPC functions, Edge functions (Backend Agent)
- **`/frontend`** - Components, pages, hooks, integration guides (Frontend Agent)
- **`/automation`** - Cron jobs, summary generation, digest workflows (Automation Agent)
- **`/qa`** - Test plans, test data, regression suites (QA Agent)
- **`/integration`** - Account switcher audit, existing schema analysis
- **`/handoffs`** - Agent handoff documentation and status

---

## Next Steps (This Week)

1. **Schedule Stakeholder Meeting**
   - Review DECISIONS-NEEDED.md
   - Make final calls on privacy, channels, moderation

2. **Assign Agent Owners**
   - Data Agent: Migration implementation
   - Backend Agent: RPC functions
   - Frontend Agent: UI components
   - Automation Agent: Monthly summary cron

3. **Kickoff Phase 1**
   - Create migration files
   - Test locally with multiple users
   - Sync Prisma schema

4. **Prepare for Phase 2**
   - Wireframe UI components
   - Define API contracts
   - Write integration tests

---

## Questions?

For questions or clarifications:
1. Read relevant documentation file above
2. Check DECISIONS-NEEDED.md for open questions
3. Review CHANGES-FROM-V1.md for context on architectural changes
4. Consult with Product Spec Agent (this document's author)

---

**Documentation Status**: ✅ Complete and ready for stakeholder review

**Next Document Update**: After stakeholder decisions made
