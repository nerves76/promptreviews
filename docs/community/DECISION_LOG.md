# Community Feature - Decision Log

## 2025-10-05: Initial Architecture Decisions

### Decision 1: No Channel Memberships Table
**Context**: Original plan included `channel_memberships` table for tracking who joined which channels.

**Decision**: Remove `channel_memberships` table entirely. All users automatically see all channels within their account.

**Rationale**:
- Simpler UX - no join/leave confusion
- Fewer tables to maintain
- Faster implementation
- Can add later if private channels needed

**Impact**:
- Removes ~200 lines of migration code
- Simplifies ChannelSidebar component
- No "join channel" API endpoint needed

---

### Decision 2: Defer Free Trial Gating
**Context**: Concern about spam from free trial users.

**Decision**: No posting restrictions in MVP. Can monitor and add later if needed.

**Rationale**:
- Premature optimization
- Want to encourage adoption first
- Can add retroactively via RLS policy update
- Admin delete/moderation available from Day 1

**Impact**:
- Removes `can_use_community()` function from MVP
- Simpler RLS policies
- Can add in < 1 hour if spam becomes issue

---

### Decision 3: Use Existing Admin Role
**Context**: Need admin privileges for pinning posts, deleting content, managing channels.

**Decision**: Use existing `auth.jwt() ->> 'role' = 'admin'` check.

**Rationale**:
- Already implemented in RLS policies throughout app
- No new roles to manage
- Consistent with existing patterns

**Impact**:
- RLS policies use standard admin check pattern
- No new role management needed
- Chris (existing admin) can moderate from Day 1

---

### Decision 4: Business Logos as Avatars
**Context**: Need avatar system for posts/comments.

**Decision**: Use `businesses.logo_url` for all user avatars in community.

**Rationale**:
- Already exists and populated
- Business-centric approach fits product
- No profile image upload needed
- Reinforces brand identity

**Impact**:
- No avatar upload/storage system needed
- PostCard/CommentCard components pull from business context
- Fallback to generic icon if logo_url is null

---

### Decision 5: On-Demand Username Generation
**Context**: Need unique handles for @mentions.

**Decision**: Generate `community_handle` on first community interaction, not via backfill.

**Rationale**:
- Not all users will use community
- Avoids generating thousands of unused handles
- Cleaner data
- Can prompt user to customize handle on first post

**Impact**:
- Add columns to auth.users: `community_handle`, `community_display_name`, `community_opted_in_at`
- Generate via RPC on first post/comment
- UI flow: First action → "Choose your community handle" modal → Generate with preview → Proceed

---

### Decision 6: RLS via Subquery (No JWT Claim)
**Context**: Need account isolation but no `active_account_id` JWT claim exists.

**Decision**: Use RLS subquery pattern: `account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid())`

**Rationale**:
- Adding JWT claim would require auth refactor
- Subquery pattern already proven in existing tables
- Performance acceptable (indexed foreign key)

**Impact**:
- All community tables follow same RLS pattern
- No auth system changes needed
- Slightly more complex policies but manageable

---

### Decision 7: Realtime via Supabase (Not Polling)
**Context**: Need live updates for posts/comments/reactions.

**Decision**: Implement Supabase Realtime websockets with fallback polling.

**Rationale**:
- Better UX than polling
- Supabase feature already available
- Sets pattern for future realtime features
- Fallback ensures reliability

**Impact**:
- Frontend Agent documents first Realtime implementation
- Create reusable `useCommunityRealtime()` hook
- Add connection status indicator
- Enable Realtime in Supabase dashboard (manual step)

---

---

### Decision 8: Four Default Channels
**Context**: Need to determine which channels are seeded by default for each account.

**Decision**: Seed 4 channels automatically for every account:
1. **General** - General discussions and introductions
2. **Strategy** - Tactics, best practices, what's working
3. **Google-Business** - GBP-specific topics and questions
4. **Feature-Requests** - Product feedback and feature ideas

**Rationale**:
- Gives clear starting points for different conversation types
- Feature-Requests provides direct feedback channel to PromptReviews team
- Google-Business aligns with core product value (GBP integration)
- Strategy encourages knowledge sharing

**Impact**:
- Data Agent seeds 4 channels per account in migration
- ChannelSidebar shows all 4 by default
- Admin can add more channels later (via direct DB or future UI)

---

## Future Decisions Needed

### When to Add Private Channels?
- **Trigger**: User requests OR multi-location businesses need location-specific channels
- **Estimated**: 3-6 months post-launch
- **Involves**: Add `channel_memberships` table, join/leave UI, invite system

### When to Add Free Trial Restrictions?
- **Trigger**: Spam reports OR >10 low-quality posts per day from free accounts
- **Estimated**: Monitor first 30 days, add if needed
- **Involves**: 1-hour RLS policy update

### When to Build Phase 2 Automation?
- **Trigger**: ≥100 active users + 30% weekly visit rate + user feedback requests
- **Estimated**: 6-8 weeks post-MVP launch
- **Involves**: Automation Agent work (summary generation, digest sharing, pinned posts)
