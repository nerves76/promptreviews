# Community Feature Architecture

## Core Architectural Decisions

### 1. Account Isolation Strategy

**Context**: PromptReviews uses `account_users` table for multi-account access.

**Decision**: Use `account_id` column on all community tables with RLS policies filtering by user's account membership.

**Implementation**:
```sql
-- RLS Policy Pattern
CREATE POLICY "Users access own account data" ON posts
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );
```

**Why**:
- No JWT `active_account_id` claim exists currently
- Adding JWT claim would require auth refactor
- RLS subquery pattern proven in existing tables

### 2. Account Context Flow

**Current Pattern** (from `AccountBusinessContext.tsx`):
```
User Login → getAccountIdForUser() → localStorage key → accountId state
User Switch → switchAccount(newId) → verify access → update localStorage → reload data
```

**Community Integration**:
- Community pages read `accountId` from `useAccountBusiness()` hook
- All API calls pass `accountId` as parameter or filter
- Realtime subscriptions filter by `account_id`

**Default Channels** (seeded per account):
- **General** - General discussions and introductions
- **Strategy** - Tactics, best practices, what's working
- **Google-Business** - GBP-specific topics and questions
- **Feature-Requests** - Product feedback and feature ideas

### 3. Username System

**No Backfill Required**: Generate handles on first community opt-in.

**Algorithm**:
```
firstname-businessname-{4-char-hash}
Example: alex-fireside-7h3n
```

**Storage**: Add to existing user/profile table:
```sql
ALTER TABLE auth.users
  ADD COLUMN community_handle text UNIQUE,
  ADD COLUMN community_display_name text,
  ADD COLUMN community_opted_in_at timestamptz;
```

### 4. Avatar Strategy

**Decision**: Use `businesses.logo_url` as avatar for all posts/comments.

**Rationale**:
- Existing field, already populated
- Represents the business (account-centric, not user-centric)
- Reinforces brand identity in community

**Fallback**: Generic business icon if `logo_url` is null.

### 5. Free Trial Gating

**Requirement**: Ability to limit/disable community for free trial users to prevent spam.

**Decision**: Deferred to post-MVP. No blocking in Phase 1.

**Future Implementation** (Phase 2):
```sql
CREATE FUNCTION can_post_to_community(user_account_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = user_account_id
    AND (plan IS NOT NULL AND plan != 'free' OR trial_ends_at > now())
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

**Note**: Users can read community regardless of plan. Posting restrictions only.

### 6. Realtime Architecture

**Current State**: No existing Supabase Realtime usage in codebase.

**Implementation**:
```typescript
// Subscribe to channel posts
const channel = supabase
  .channel(`community:${accountId}:${channelId}`)
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `account_id=eq.${accountId}`
    },
    (payload) => handlePostUpdate(payload)
  )
  .subscribe();
```

**Considerations**:
- Enable Realtime in Supabase dashboard
- Use channel-specific subscriptions to limit data
- Implement optimistic updates for better UX
- Add fallback polling if websocket fails

### 7. Testing Strategy

**Existing Infrastructure**:
- ✅ Playwright configured (`/tests` directory, `playwright.config.js`)
- ❌ No Vitest setup
- ❌ No pgTAP

**Recommended Stack**:
- **E2E**: Playwright (already configured)
- **Unit/Integration**: Add Vitest for utilities and hooks
- **SQL Testing**: Manual testing + Supabase Studio for now (Phase 2: pgTAP)

### 8. Component Size Limits

**Requirement**: No files > 600 lines.

**Strategy**:
- Break `CommunityLayout` into:
  - `ChannelSidebar.tsx` (< 200 lines)
  - `PostFeed.tsx` (< 300 lines)
  - `PostCard.tsx` (< 200 lines)
- Centralize shared logic in `/hooks` and `/utils`
- Use composition over monolithic components

### 9. Feature Centralization

**Pattern**: Create reusable utilities for common operations.

**Examples**:
```
/src/lib/community/
  ├── mentions.ts        # Parse @mentions
  ├── permissions.ts     # Check user roles
  ├── formatting.ts      # Sanitize/format text
  └── reactions.ts       # Toggle reactions
```

**Apply to**:
- Mention parsing (posts + comments)
- Reaction toggling (posts + comments in future)
- Permission checks (edit/delete/pin)
- Text sanitization (all user input)

## Data Flow Diagrams

### Post Creation Flow
```
User clicks "New Post"
  → PostComposer modal opens
  → User types content
  → Parse @mentions as they type
  → Submit triggers optimistic update
  → API call to create_post() RPC
  → RLS validates account_id
  → Insert post + log_mentions()
  → Realtime broadcasts to channel subscribers
  → UI updates with server data
```

### Account Switch Flow
```
User selects different account from dropdown
  → switchAccount(newAccountId) called
  → Verify user_id in account_users for newAccountId
  → Update accountId state + localStorage
  → Trigger page reload/data refresh
  → Community page useEffect detects accountId change
  → Unsubscribe from old channel
  → Subscribe to new account's channels
  → Fetch posts for new account
```

## Migration Strategy

### Phase 1 (MVP)
1. Create tables with RLS
2. Add community_handle generation function
3. Seed default channels per account
4. Build core UI
5. Enable Realtime in Supabase

### Phase 2 (Automation)
1. Create summary tables
2. Add Vercel Cron endpoint
3. Build summary generation pipeline
4. Add digest sharing UI

## Security Considerations

1. **RLS on all tables** - No exceptions
2. **Input sanitization** - Use DOMPurify for markdown-lite
3. **Rate limiting** - 5 posts/minute per user
4. **Account verification** - All writes check `account_users` membership
5. **No PII leakage** - Handles don't expose other accounts
6. **Admin-only actions** - Pin/delete restricted to role check

## Performance Optimization

1. **Indexes**:
   - `(account_id, channel_id, created_at DESC)` on posts
   - `(account_id, post_id)` on comments
   - `(mentioned_user_id, read_at)` on mentions

2. **Caching**:
   - Channel list: 5 min cache
   - User handles for mentions: 2 min cache
   - React Query for feed data

3. **Pagination**:
   - 20 posts per page
   - Infinite scroll with cursor-based pagination
   - Load comments on-demand (lazy)

## Monitoring & Observability

1. **Sentry Events**:
   - `community.post_created`
   - `community.mention_sent`
   - `community.account_switched`
   - `community.error.*`

2. **Logs**:
   - RLS policy violations
   - Failed RPC calls
   - Realtime connection errors
   - Rate limit hits

3. **Metrics**:
   - Posts per account per day
   - Active users per account
   - Mention response time
   - Realtime connection uptime
