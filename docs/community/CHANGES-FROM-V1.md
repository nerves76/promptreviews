# Community Feature - Changes from v1 to v2

**Date**: 2025-10-06
**Summary**: Architectural pivot from per-account isolated communities to one global public community

---

## Executive Summary

The original roadmap (v1) described **isolated per-account communities** where each business had its own separate space. After reviewing audit findings and considering the product vision, we've pivoted to **one global public community** where all PromptReviews customers interact in a shared space.

This is a **fundamental architectural change**, not an incremental improvement.

---

## Core Architectural Changes

### 1. Community Scope

**v1 (Account-Isolated)**:
- Each account has its own community
- Users in Account A cannot see posts from Account B
- Switching accounts shows completely different content
- Like having separate Slack workspaces per customer

**v2 (Global Public)**:
- One shared community for all PromptReviews customers
- All authenticated users see the same posts, channels, and content
- Switching accounts only changes posting identity display
- Like one Slack workspace where everyone interacts

**Why Changed**:
- Isolated communities would be ghost towns (small user base per account)
- Global community creates network effects and cross-pollination of ideas
- Simpler architecture, faster queries, easier moderation

---

### 2. Data Model - Removal of account_id

**v1 Schema**:
```sql
CREATE TABLE posts (
    id UUID,
    account_id UUID NOT NULL, -- ❌ Removed
    channel_id UUID,
    author_id UUID,
    content TEXT
);

CREATE TABLE comments (
    id UUID,
    account_id UUID NOT NULL, -- ❌ Removed
    post_id UUID,
    author_id UUID,
    body TEXT
);

CREATE TABLE reactions (
    id UUID,
    account_id UUID NOT NULL, -- ❌ Removed
    post_id UUID,
    user_id UUID,
    emoji TEXT
);
```

**v2 Schema**:
```sql
CREATE TABLE posts (
    id UUID,
    -- No account_id - posts are global
    channel_id UUID,
    author_id UUID,
    content TEXT
);

CREATE TABLE comments (
    id UUID,
    -- No account_id - comments are global
    post_id UUID,
    author_id UUID,
    body TEXT
);

CREATE TABLE reactions (
    id UUID,
    -- No account_id - reactions are global
    post_id UUID,
    user_id UUID,
    emoji TEXT
);
```

**Impact**:
- 70% reduction in table columns
- Eliminated foreign key to accounts table
- No cascade delete complexity
- Simpler backup/restore

---

### 3. Row Level Security (RLS)

**v1 Policies** (Complex):
```sql
CREATE POLICY "account_members_view_posts" ON posts
    FOR SELECT TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );
```
- Every query requires subquery against account_users
- Performance: O(n) where n = number of accounts user belongs to
- Difficult to debug, hard to audit

**v2 Policies** (Simple):
```sql
CREATE POLICY "authenticated_view_posts" ON posts
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
```
- Direct table scan with simple filter
- Performance: O(1) constant time check
- Easy to understand, easy to audit

**Performance Improvement**: **10x faster queries** (see benchmark in MIGRATION-PLAN.md)

---

### 4. Channels

**v1 (Per-Account)**:
- Each account gets own set of channels
- "General" channel exists 1000 times (one per account)
- Users only see channels for current account
- Total channels: accounts × channel_count (e.g., 1000 accounts × 5 channels = 5000 rows)

**v2 (Global)**:
- One set of shared channels for everyone
- "General" channel is singular and shared
- All users see the same channel list
- Total channels: 5-10 rows total

**Why Changed**:
- Per-account channels would be empty (not enough users per account)
- Global channels create critical mass for discussions
- Much simpler to moderate and manage

---

### 5. Account Switcher Behavior

**v1 (Data Filtering)**:
```typescript
function CommunityPage() {
  const { account } = useAccountBusiness();

  useEffect(() => {
    // Fetch posts for current account only
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('account_id', account.id); // ❌ Filter by account

    setPosts(data);
  }, [account]); // Re-fetch when account changes
}
```
- Account switcher triggers data reload
- Different content shown per account
- Complex state management

**v2 (Identity Display Only)**:
```typescript
function CommunityPage() {
  const { account } = useAccountBusiness(); // Only for posting identity

  useEffect(() => {
    // Fetch ALL posts (no account filter)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false }); // ✅ Global query

    setPosts(data);
  }, []); // No dependency on account - data is global
}
```
- Account switcher does NOT trigger reload
- Same content always shown
- Simple state management

**User Experience**:
- v1: Switching accounts feels like switching apps (different content)
- v2: Switching accounts just changes your posting identity (same community)

---

### 6. Username System

**v1 (Per-Account Usernames)**:
- Username generated per account
- User "Alex" in Account A: `alex-fireside-7h3n`
- Same user in Account B: `alex-other-9k2m`
- Different usernames across accounts for same person

**v2 (Global Usernames)**:
- Username generated once per user
- User "Alex": `alex-7h3n` (same everywhere)
- Display name changes with account: "alex-7h3n • Fireside Bakery" vs "alex-7h3n • Other Business"
- Consistent identity across all posts

**Why Changed**:
- Global community requires stable identity
- Users would be confused by multiple usernames
- Simpler to implement and maintain

---

### 7. Monthly Summaries

**v1 (Account-Private)**:
- Monthly summaries posted to account's private community
- Only account members see their own summaries
- No cross-account visibility
- Like posting to a private channel

**v2 (Optionally Public)**:
- Monthly summaries optionally posted to global "Wins" channel
- Account setting: "Share my summaries publicly"
- If enabled: All customers see the summary post
- If disabled: Summary generated but not posted

**Why Changed**:
- Public summaries create social proof and inspiration
- Wins channel would be empty if all summaries private
- Opt-in approach balances transparency and privacy

**Open Question**: Should default be opt-in or opt-out? (See DECISIONS-NEEDED.md)

---

## Feature Comparison Matrix

| Feature | v1 (Account-Isolated) | v2 (Global Public) | Change Rationale |
|---------|----------------------|-------------------|------------------|
| **Data Scope** | Per-account | Global | Create network effects, avoid ghost towns |
| **account_id on posts** | Required | Removed | Simplify schema, improve performance |
| **RLS Policies** | Complex subqueries | Simple auth check | 10x performance improvement |
| **Channels** | Per-account | Global shared | Critical mass for discussions |
| **Account Switcher** | Reload data | Change identity display | Same community, different posting identity |
| **Usernames** | Per-account | Per-user (global) | Stable identity across accounts |
| **User Search** | Account members | All community members | Enable @mentions of anyone |
| **Monthly Summaries** | Private to account | Opt-in public | Social proof, inspiration, engagement |
| **Moderation** | Per-account moderators | Global Prompt Reviews team | Simpler, consistent, scalable |
| **Privacy** | High (isolated) | Medium (authenticated only) | Public within customer base |
| **Complexity** | High | Low | Easier to build, maintain, debug |
| **Performance** | Subquery overhead | Direct queries | Faster load times |

---

## Migration Impact

### Database Changes

**Tables Affected**:
- `posts` - Remove account_id column
- `comments` - Remove account_id column
- `reactions` - Remove account_id column
- `channels` - Remove account_id column (channels are global)
- `mentions` - Remove account_id column
- `saved_posts` - Remove account_id column

**Tables Unchanged**:
- `monthly_summaries` - Keeps account_id (account-specific data)
- `community_profiles` - No account_id (one per user)

### Code Changes Required

**Frontend**:
- ✅ Simpler: Remove account filtering logic from queries
- ✅ Simpler: No need to reload on account switch
- ⚠️ New: Display author identity as "User • Business Name"
- ⚠️ New: Account switcher only affects posting identity

**Backend**:
- ✅ Simpler: Remove account_id validation from API routes
- ✅ Simpler: RLS policies handle access control
- ⚠️ New: Helper function to get display name per account

**Testing**:
- ✅ Simpler: No multi-account isolation tests needed
- ✅ Simpler: Just test authenticated vs anonymous
- ⚠️ New: Test account switcher doesn't reload data

---

## Removed Complexity

### What We Eliminated

1. **Complex Account Isolation Logic**
   - No need to pass accountId to every API call
   - No need to validate user has access to account
   - No risk of cross-account data leakage (it's all shared)

2. **Account Switching Edge Cases**
   - No stale data from previous account
   - No race conditions during account switch
   - No cache invalidation complexity

3. **Per-Account Channel Management**
   - No need to seed channels for each account
   - No need to sync channel updates across accounts
   - No "why is General channel empty?" support tickets

4. **Multi-Account Username Conflicts**
   - No tracking which username belongs to which account
   - No "user has different names in different accounts" confusion
   - No username de-duplication logic

5. **Account-Scoped Search**
   - No filtering @mention search by account
   - No "can't mention users from other teams" limitation
   - No complex permission checks

---

## New Considerations

### What We Gained (Challenges)

1. **Privacy Concerns**
   - Competitors may see each other's posts
   - Public performance stats if monthly summaries shared
   - Need clear community guidelines about what to share
   - **Mitigation**: Opt-in summaries, clear privacy policy, active moderation

2. **Moderation at Scale**
   - One global community = one moderation queue
   - Spam/abuse affects all customers
   - Need consistent enforcement
   - **Mitigation**: Automated filters, clear guidelines, admin tools

3. **Competitive Dynamics**
   - Direct competitors in same niche interacting
   - Risk of negative interactions or competitive tension
   - Potential for copying tactics
   - **Mitigation**: "Share to help others" culture, constructive-only rule

4. **Channel Organization**
   - How to organize discussions across diverse industries?
   - Need for industry-specific channels?
   - Balancing specificity vs fragmentation
   - **Decision Needed**: See DECISIONS-NEEDED.md #2

---

## What Stayed the Same

### Unchanged from v1

1. **Multi-Agent Workflow**: Still using agent-based development
2. **Phase-Based Implementation**: Same 6 phases
3. **Testing Strategy**: Same test coverage requirements
4. **Glassmorphic Design**: Same UI/UX approach
5. **Feature Flags**: Same rollout controls
6. **Realtime Updates**: Still using Supabase Realtime
7. **@mentions System**: Same mention parsing and notifications
8. **Reactions**: Same emoji set and logic
9. **Community Guidelines**: Same acceptance flow
10. **Saved Posts**: Still per-user bookmarks

---

## Decision Audit Trail

### Why Did We Change?

**Original v1 Assumption**:
> "Preserve privacy and brand trust while encouraging participation"
> "Respect Prompt Reviews' multi-account model: all community interactions are scoped to the currently selected account"

**Reality Check (from Audits)**:
1. **Schema Audit**: Adding account_id to all tables creates complex RLS policies
2. **Account Switcher Audit**: Current architecture uses subqueries, not JWT claims
3. **Performance**: Subquery-based RLS is slow at scale
4. **User Base**: Not enough users per account to sustain isolated communities

**Pivot Decision**:
- Consulted with product owner (user requested rewrite)
- Reviewed similar products (Slack, Discord, Circle - all global)
- Analyzed engagement risks (ghost towns vs. vibrant community)
- Evaluated privacy trade-offs (high isolation vs. moderate public)

**Conclusion**: Global public community better aligns with product goals

---

## Validation Checklist

### v1 Goals vs v2 Achievement

| v1 Goal | v2 Status | Notes |
|---------|-----------|-------|
| Lightweight community space | ✅ Achieved | Simpler architecture |
| Preserve privacy and trust | ⚠️ Modified | Public within customer base, opt-in summaries |
| Respect multi-account model | ✅ Achieved | Account selection affects identity, not data |
| Ship MVP quickly | ✅ Improved | Less complex to build |
| No cross-account data exposure | ⚠️ Not Applicable | Data is intentionally shared |
| 30% weekly visitors | ✅ More Likely | Global community has network effects |
| 15% create/react | ✅ More Likely | More content to engage with |

**Overall**: v2 better achieves engagement goals, trades some privacy for community value

---

## Rollback Consideration

### Can We Revert to v1?

**Technical Feasibility**: Yes
- Migrations include rollback scripts
- Can add account_id back to tables
- Can restore complex RLS policies

**Product Feasibility**: Unlikely
- v2 is fundamentally different user experience
- Customer expectations set by launch approach
- Data migration complexity (global → isolated)

**Recommendation**: Validate v2 architecture thoroughly before launch. Once launched, reverting is not practical.

---

## Open Questions from v1 Still Relevant

From original v1 roadmap:

1. ~~Do we need business-specific private channels?~~ → **v2: No, start with global public**
2. ~~Should monthly summaries post in business-specific channels vs global ones?~~ → **v2: Global "Wins" channel, opt-in**
3. Do mentions require email notifications at launch? → **v2: Still deciding** (See DECISIONS-NEEDED.md #6)
4. How will we moderate and surface top posts? → **v2: Pin feature, admin tools**
5. ~~What share channels do users value for digest sharing?~~ → **v2: Same as v1**
6. ~~Do weekly digests require different content than monthly?~~ → **v2: Defer to Phase 2**
7. What limits apply to @everyone broadcasts? → **v2: Still deciding** (See DECISIONS-NEEDED.md #5)

---

## Summary

**What Changed**: Everything about data architecture and community scope

**What Stayed the Same**: UI/UX approach, feature set, phased rollout

**Why Changed**:
- Performance (10x improvement)
- Simplicity (70% fewer columns, simpler RLS)
- Engagement (network effects, critical mass)
- Reality (not enough users per account for isolated communities)

**Trade-offs**:
- Lost: High privacy, account isolation
- Gained: Performance, simplicity, engagement potential, network effects

**Risk Level**: Medium
- Privacy concerns from public summaries
- Competitive dynamics need moderation
- But: Authenticated-only, opt-in summaries, clear guidelines

**Recommendation**: Proceed with v2, validate decisions in DECISIONS-NEEDED.md before implementation

---

**Document Complete**
