# Social Posting - Technical Notes & Decisions

**Purpose:** Capture API quirks, rate limits, key decisions, and learnings for future reference.

---

## Platform-Specific Notes

### Bluesky (AT Protocol)

**Authentication:**
- Uses app passwords (no OAuth flow required)
- Session tokens expire but can be refreshed
- Library: `@atproto/api`

**Rate Limits:**
- TBD - document after testing
- Consider implementing backoff strategy

**Content Constraints:**
- Character limit: 300 characters (verify with API)
- Media: Supports images (confirm formats/sizes)
- Rich text: Supports facets (defer to Phase 2)

**API Quirks:**
- Document any edge cases discovered during implementation

**References:**
- API Docs: https://atproto.com/
- Client Library: https://github.com/bluesky-social/atproto

---

### Twitter/X (Phase 2)

**Authentication:**
- OAuth2 client credentials flow
- Requires app approval from Twitter
- Scopes needed: `tweet.read`, `tweet.write`

**Rate Limits:**
- TBD - research before implementation

**Content Constraints:**
- Character limit: 280 characters
- Thread support: Consider for future phase
- Media: Detailed rules TBD

**Blockers:**
- [ ] Twitter API application pending approval

---

### Google Business (Existing - DO NOT MODIFY)

**Current Implementation:**
- Fully functional posting and scheduling
- Located in: `src/app/(app)/components/GoogleBusinessProfile/**`
- Database: `google_business_scheduled_posts`, `google_business_scheduled_post_results`
- API: `src/app/(app)/api/google-business/**`

**Critical Notes:**
- Keep isolated until new system proven
- Run regression tests before any PostManager changes
- Google adapter uses existing `google_business_profiles` table

---

## Architectural Decisions

### Decision Log

#### 2025-10-18: Extend Google Business Scheduler vs. Standalone Composer
**Context:** Original plan was to build a standalone multi-platform composer. User feedback suggested integrating Bluesky into the existing Google Business posting flow would be more valuable.

**Decision:** Phase 1 will extend the existing Google Business scheduler with a "Also post to Bluesky" checkbox, rather than building a separate composer.

**Rationale:**
- **Faster time to value:** Enhance existing feature vs. build new one from scratch
- **Natural integration point:** Users already scheduling Google Business posts
- **Lower risk:** Google remains primary (required), Bluesky is optional addon
- **Simpler UX:** One familiar composer, multiple platforms
- **Easier rollout:** Feature flag can hide checkbox; no new navigation required
- **Phase 2 flexibility:** Standalone composer can still be built later for non-Google use cases

**Alternatives Considered:**
- Standalone composer first: Higher development effort, longer time to value
- Replace Google Business composer: Too risky, could break existing functionality
- Build both simultaneously: Resource intensive, harder to test

**Impact:**
- Simplified Phase 1 scope (4-week timeline vs. 6+ weeks)
- Google Business posting remains untouched except for additive UI/cron changes
- Standalone composer becomes Phase 2 (for users without Google Business accounts)
- Schema changes: Add `additional_platforms` JSONB column to existing google_business_scheduled_posts

**Technical Implementation:**
```typescript
// google_business_scheduled_posts table
{
  // ... existing columns
  additional_platforms: {
    bluesky: {
      enabled: true,
      connection_id: "uuid-of-bluesky-connection"
    }
  }
}
```

---

#### 2025-10-18: Bluesky Selected as First Platform
**Context:** Need to validate multi-platform architecture with low-risk integration.

**Decision:** Implement Bluesky first, before Twitter/X or Slack.

**Rationale:**
- No OAuth approval delays (uses app passwords)
- Simpler authentication flow
- Active developer community
- Lower rate limit concerns (assumption - verify)

**Alternatives Considered:**
- Twitter/X: Blocked on API approval
- Slack: More complex workspace permissions
- Instagram: Not in scope for MVP

**Impact:** Phase 1 can proceed immediately without external blockers.

---

#### 2025-10-18: Lazy Adapter Registration
**Context:** Not all users will have all platforms connected.

**Decision:** PostManager uses AdapterRegistry to load adapters only when credentials exist + feature flag enabled + plan permits.

**Rationale:**
- Reduces memory footprint
- Prevents errors from unconfigured platforms
- Allows graceful degradation
- Supports plan-based feature gating

**Implementation:**
```typescript
// Pseudocode
class AdapterRegistry {
  async resolveAdaptersForAccount(accountId: string): Promise<Adapter[]> {
    const connections = await getActiveConnections(accountId)
    const adapters = []

    for (const conn of connections) {
      if (featureFlagEnabled(conn.platform) && planPermits(accountId, conn.platform)) {
        adapters.push(createAdapter(conn.platform, conn.credentials))
      }
    }

    return adapters
  }
}
```

---

#### 2025-10-18: Separate Connection Storage
**Context:** Multiple platforms with different credential types (OAuth tokens, app passwords, API keys).

**Decision:** Create `social_platform_connections` table separate from `google_business_profiles`.

**Rationale:**
- Google Business uses existing flow (no migration needed)
- Flexible JSONB credentials field per platform
- Clean account isolation via RLS
- Easier to add new platforms without schema changes

**Schema:**
```sql
CREATE TABLE social_platform_connections (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  platform TEXT NOT NULL, -- 'bluesky', 'twitter', 'slack'
  credentials JSONB NOT NULL, -- encrypted
  status TEXT DEFAULT 'active',
  metadata JSONB,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ
);
```

---

## Security Guidelines

### Token Storage
- Always encrypt credentials in database
- Never log tokens (even in dev mode)
- Use Supabase service role key for credential access
- Return connection status only (never raw tokens) in API responses

### Account Isolation
- All queries filtered by `account_id`
- RLS policies mirror account_users relationships
- Test with multiple accounts (verify no leakage)

### Error Handling
- Don't expose token errors to client
- Generic messages: "Failed to connect to platform"
- Log detailed errors to Sentry with sanitized context

---

## Testing Notes

### Regression Suite (Google Business)
**Critical:** Must pass before every merge.

**Test Cases:**
- [ ] Load Google Business composer (no errors)
- [ ] Create immediate post to Google Business
- [ ] Schedule post for future date
- [ ] View scheduled posts list
- [ ] Cancel scheduled post
- [ ] Verify cron job processes scheduled posts

**Run Manually:**
```bash
# Start dev server
npm run dev

# Open Google Business composer
open http://localhost:3002/dashboard/google-business

# Test posting flow
# Check browser console for errors
```

---

### Bluesky Integration Tests
**Once implemented:**

**Test Cases:**
- [ ] Connect Bluesky account with app password
- [ ] Disconnect Bluesky account
- [ ] Post text-only content
- [ ] Post with image attachment
- [ ] Handle posting error (invalid credentials)
- [ ] Verify account isolation (different accounts see different connections)

**Mock Testing:**
```typescript
// Use mocked @atproto/api client
// Simulate success and error responses
```

---

## Performance Considerations

### Adapter Loading
- Lazy load adapters (don't instantiate all at startup)
- Cache connection queries per request (not globally)

### Posting Latency
- Post to platforms in parallel (not sequential)
- Set reasonable timeouts per platform
- Don't let one slow platform block others

### Database Queries
- Index `social_platform_connections(account_id, platform)`
- Use connection pooling via Prisma
- Monitor query performance in production

---

## Future Enhancements

### Scheduling v2 (Phase 2)
- Neutral schema: `social_scheduled_posts` (multi-platform)
- Migrate Google jobs to new schema (after validation)
- Unified cron runner (resolves adapters dynamically)

### Rich Content Support
- Per-platform media optimization (cropping, compression)
- Hashtag suggestions
- Link shorteners
- Preview cards

### Analytics
- Track post success/failure rates per platform
- Show posting history in dashboard
- Report on engagement (if platforms provide APIs)

---

## Known Issues

### Turbopack Broken
**Issue:** Next.js dev server with `--turbo` flag fails to load pages.

**Workaround:** Use `npm run dev` (NOT `npm run dev:fast`).

**Reference:** Noted in CLAUDE.md

---

### Automatic Page Refreshes
**Issue:** Dashboard pages refresh automatically every ~55 minutes.

**Root Cause:** Under investigation (likely auth token refresh side effect).

**Impact on This Project:** Ensure composer auto-saves work to prevent data loss.

**Reference:** See CLAUDE.md "Recent Issues Log"

---

## API Rate Limits

### Tracking
Document rate limits here as discovered:

**Bluesky:**
- TBD

**Twitter/X:**
- TBD

**Google Business:**
- Existing (reference Google docs)

---

## Useful Commands

### Database
```bash
# Check migration status
npx supabase migration list

# Apply migrations
npx supabase db push

# Reset local database
npx supabase db reset --local

# Sync Prisma after schema changes
npx prisma db pull && npx prisma generate
```

### Development
```bash
# Start dev server (port 3002)
npm run dev

# Run linter
npm run lint

# Test auth flow
npm run test:auth

# Build for production
npm run build
```

### Debugging
```bash
# Check running processes
lsof -i :3002

# Kill stuck process
pkill -f "next dev"

# View Supabase logs
npx supabase logs
```

---

## Glossary

**UniversalPost:** Shared data structure for multi-platform content (content, media, CTA, metadata).

**Adapter:** Platform-specific client implementing `validatePost`, `optimizeContent`, `createPost`.

**PostManager:** Orchestration service that coordinates posting across multiple adapters.

**AdapterRegistry:** Service that resolves which adapters are available for an account based on connections + flags + plan.

**Connection:** Stored credentials for a specific platform linked to an account (in `social_platform_connections` table).

**Feature Flag:** Toggle to enable/disable platforms per account (supports gradual rollout).

**RLS (Row Level Security):** Postgres policies ensuring users only access their own account's data.

---

## Resources

### Documentation
- [Main Plan](../../MULTI_PLATFORM_POSTING_PLAN.md)
- [Task Board](./TASKBOARD.md)
- [Agent Handoff](./AGENT_HANDOFF.md)
- [Project Context](../../CLAUDE.md)

### External APIs
- Bluesky: https://atproto.com/
- Twitter API: https://developer.twitter.com/
- Slack API: https://api.slack.com/

### Tools
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

---

## Change Log

### 2025-10-18
- Initial document created during project setup
- Documented Bluesky-first decision
- Outlined lazy adapter registration pattern
- Defined separate connection storage approach

---

**Instructions for Agents:**
- Update this document as you discover API quirks, make decisions, or encounter issues
- Add detailed notes about platform-specific behavior
- Document "why" for architectural decisions (helps future agents)
- Keep the decision log chronological
