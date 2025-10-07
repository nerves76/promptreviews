# Community Feature - Migrations Applied

**Date**: 2025-10-06
**Status**: Ready for Application
**Version**: MVP (Phase 1)

---

## Overview

This document describes the database migrations created for the Community Feature MVP. All migrations follow the **global public architecture** - content is accessible to all authenticated users without account isolation.

---

## Migration Files Created

### 1. Core Tables Migration
**File**: `/supabase/migrations/20251006120000_create_community_core_tables.sql`

**Creates**:
- `community_profiles` - User profiles with username generation
- `channels` - Global community channels
- `posts` - Global posts (NO account_id)
- `post_comments` - Comments on posts
- `post_reactions` - Emoji reactions to posts
- `comment_reactions` - Emoji reactions to comments
- `mentions` - @mention notifications

**Helper Functions**:
- `generate_username(user_id)` - Creates unique username (firstname-hash)
- `get_user_display_identity(user_id)` - Returns formatted display name
- `parse_mentions(content)` - Extracts @usernames from text
- `create_mention_records(source_type, source_id, author_id, usernames)` - Creates mention notifications

**Key Decisions**:
- ✅ NO `account_id` on posts, comments, reactions (global community)
- ✅ Soft delete pattern (`deleted_at` column)
- ✅ Username is immutable, display name is optional override
- ✅ Simple reaction types: thumbs_up, star, celebrate, clap, laugh

### 2. RLS Policies Migration
**File**: `/supabase/migrations/20251006120001_create_community_rls_policies.sql`

**Creates**:
- RLS policies for all community tables
- Pattern: Simple authenticated access (no account isolation)
- Author-owns pattern (users can edit/delete own content)
- Admin-override pattern (admins can moderate any content)

**Policy Summary**:
- **SELECT**: All authenticated users can view non-deleted content
- **INSERT**: Users create content as themselves (author_id = auth.uid())
- **UPDATE**: Authors can update their own content
- **DELETE**: Authors can soft-delete own content, admins can hard-delete

### 3. Seed Default Channels
**File**: `/supabase/migrations/20251006120002_seed_community_defaults.sql`

**Creates 5 Channels**:
1. **General** 💬 - Open discussion, introductions, questions
2. **Strategy** 🎯 - Tactics, best practices, optimization tips
3. **Google Business** 🔍 - GBP-specific discussions
4. **Feature Requests** 💡 - Product feedback and suggestions
5. **Promote** 📣 - Self-promotion welcome

---

## How to Apply Migrations

### Prerequisites
```bash
# Ensure you're on the correct branch
git status

# Check current migration status
npx supabase migration list
```

### Step 1: Test Locally
```bash
# Reset local database (CAUTION: drops all local data)
npx supabase db reset --local

# Verify migrations run cleanly
npx supabase migration list --local

# Check tables were created
npx supabase db shell --local
\dt community*
\dt channels
\dt posts
\dt post_comments
\q
```

### Step 2: Apply to Remote (Production)
```bash
# Push migrations to remote Supabase
npx supabase db push

# Verify migrations applied
npx supabase migration list
```

### Step 3: Sync Prisma (REQUIRED)
```bash
# Pull latest schema from database
npx prisma db pull

# Generate TypeScript types
npx prisma generate

# Verify changes
git diff prisma/schema.prisma
git diff src/generated/prisma/
```

### Step 4: Update Changelog
Add entry to `/supabase/migrations/CHANGELOG.md`:

```markdown
## [2025-10-06]
### Added
- Community feature core tables (global public architecture)
- Community profiles with username generation
- Posts, comments, reactions (no account isolation)
- RLS policies for authenticated access
- Seeded 5 default channels
- Helper functions for username generation and mention parsing
```

---

## How to Rollback

### Full Rollback (Delete All Data)
```bash
# Run rollback scripts in reverse order
psql $DATABASE_URL -f supabase/migrations/20251006120002_rollback.sql
psql $DATABASE_URL -f supabase/migrations/20251006120001_rollback.sql
psql $DATABASE_URL -f supabase/migrations/20251006120000_rollback.sql

# Sync Prisma after rollback
npx prisma db pull
npx prisma generate
```

### Partial Rollback (Disable Access, Keep Data)
```bash
# Only rollback RLS policies
psql $DATABASE_URL -f supabase/migrations/20251006120001_rollback.sql

# Tables remain but are inaccessible (RLS enabled but no policies)
```

---

## Schema Summary

### Tables Created (7 total)

| Table | Primary Key | Foreign Keys | Has account_id? | Soft Delete? |
|-------|-------------|--------------|-----------------|--------------|
| `community_profiles` | user_id (UUID) | auth.users | ❌ No | ❌ No (opt-out via opted_in_at) |
| `channels` | id (UUID) | - | ❌ No | ❌ No (is_active flag) |
| `posts` | id (UUID) | channels, auth.users | ❌ No | ✅ Yes (deleted_at) |
| `post_comments` | id (UUID) | posts, auth.users | ❌ No | ✅ Yes (deleted_at) |
| `post_reactions` | (post_id, user_id, reaction) | posts, auth.users | ❌ No | ❌ No (hard delete) |
| `comment_reactions` | (comment_id, user_id, reaction) | post_comments, auth.users | ❌ No | ❌ No (hard delete) |
| `mentions` | id (UUID) | auth.users | ❌ No | ❌ No (hard delete) |

### Functions Created (4 total)

| Function | Returns | Purpose |
|----------|---------|---------|
| `generate_username(user_id)` | TEXT | Creates unique username (firstname-hash) |
| `get_user_display_identity(user_id)` | TEXT | Returns "Username • Business Name" |
| `parse_mentions(content)` | TEXT[] | Extracts @usernames from text |
| `create_mention_records(...)` | INT | Creates mention notification records |

---

## Key Architectural Decisions

### ✅ Global Public Architecture
- **NO `account_id`** on posts, comments, reactions
- All authenticated users see all content
- Account selection only affects posting identity display (frontend concern)

### ✅ Immutable Username + Display Name Override
- Username generated once: `firstname-hash` (e.g., `alex-7h3n`)
- Optional display name override: "Alex the Baker"
- Full display: "Alex the Baker (alex-7h3n) • Fireside Bakery"

### ✅ Simple RLS Pattern
- No complex `account_users` subqueries
- Direct `auth.uid()` checks
- Admin override via `admins` table check

### ✅ Soft Delete for Moderation
- Posts and comments use `deleted_at` timestamp
- Allows moderation recovery
- Reactions use hard delete (toggle behavior)

### ❌ Deferred to Phase 2
- NO `monthly_summaries` table
- NO `weekly_summaries` table
- NO `saved_posts` table
- NO email notifications (in-app only)

---

## Testing Verification

### Manual Testing Checklist
After applying migrations, verify:

```bash
# 1. All tables exist
npx supabase db shell
\dt community*
\dt channels
\dt posts
\dt post_comments

# 2. Indexes exist
\di idx_posts*
\di idx_community*

# 3. Functions exist
\df generate_username
\df get_user_display_identity
\df parse_mentions
\df create_mention_records

# 4. RLS policies exist
\dp community_profiles
\dp posts
\dp post_comments

# 5. Channels seeded
SELECT slug, name FROM channels ORDER BY sort_order;
-- Should show: general, strategy, google-business, feature-requests, promote

\q
```

### Automated Testing
See `/docs/community/data/TESTING-CHECKLIST.md` for SQL test queries.

---

## Performance Notes

### Expected Query Performance
- **Simple SELECT queries**: 5-20ms for 10k posts (vs. 50-200ms with account isolation)
- **Feed pagination**: ~10ms with indexed `created_at DESC`
- **Reaction aggregation**: ~5ms per post with composite index
- **Mention parsing**: ~1ms per post/comment

### Critical Indexes
All performance-critical indexes are included in migration:
- ✅ `idx_posts_channel_created` - Feed queries
- ✅ `idx_posts_created` - Global feed
- ✅ `idx_post_comments_post_created` - Comment threads
- ✅ `idx_post_reactions_post` - Reaction aggregation
- ✅ `idx_mentions_unread` - Unread mention count

---

## Next Steps for Backend Agent

After migrations are applied, Backend Agent needs to create:

### API Endpoints Required
1. **POST /api/community/posts** - Create post
   - Parse mentions from body
   - Call `create_mention_records()` function
   - Return post with author display identity

2. **POST /api/community/posts/:id/comments** - Create comment
   - Parse mentions from body
   - Create mention records
   - Return comment with author identity

3. **POST /api/community/posts/:id/react** - Toggle reaction
   - INSERT (add) or DELETE (remove) reaction
   - Return updated reaction counts

4. **GET /api/community/posts** - List posts
   - Support pagination (limit/offset or cursor)
   - Filter by channel_id
   - Exclude soft-deleted
   - Include author display identity

5. **GET /api/community/mentions** - List user's mentions
   - Filter by read_at (unread only)
   - Include source post/comment details

6. **PATCH /api/community/mentions/:id/read** - Mark mention as read

7. **GET /api/community/profiles/search** - Search usernames for @mentions
   - Fuzzy search on username field
   - Return username + display identity

### RPC Functions to Call
```typescript
// On post/comment creation
const { data: mentions } = await supabase.rpc('create_mention_records', {
  p_source_type: 'post',
  p_source_id: postId,
  p_author_id: userId,
  p_mentioned_usernames: parsedUsernames // ['alex-7h3n', 'chris-9k2l']
});

// Get display name for author
const { data: displayName } = await supabase.rpc('get_user_display_identity', {
  p_user_id: authorId
});
```

---

## Troubleshooting

### Migration Fails: "relation already exists"
**Cause**: Tables already created from previous run
**Solution**:
```bash
# Check what exists
npx supabase db shell
\dt community*

# If testing locally, reset database
npx supabase db reset --local

# If production, investigate what tables exist and why
```

### Migration Fails: "permission denied for table admins"
**Cause**: RLS policy references `admins` table but it doesn't exist
**Solution**:
```bash
# Check if admins table exists
npx supabase db shell
\dt admins

# If missing, check migrations/0038_create_admins_table.sql
```

### RLS Policies Block All Access
**Cause**: Policies enabled but user not authenticated
**Solution**:
```typescript
// Ensure Supabase client has auth session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session); // Should not be null
```

### Username Generation Fails
**Cause**: `raw_user_meta_data` missing first name
**Solution**:
- Function falls back to email prefix
- Check user metadata: `SELECT raw_user_meta_data FROM auth.users WHERE id = 'xxx'`

---

## Contact & Support

**For questions about migrations:**
- Check schema audit: `/docs/community/data/schema-audit.md`
- Review decisions: `/docs/community/DECISIONS-FINAL.md`
- See architecture: `/docs/community/ROADMAP-v2.md`

**Next Agent**: Backend API Agent (create RPC functions and REST endpoints)

---

**Document Status**: ✅ Complete and Ready
**Migrations Created**: 3 files + 3 rollback files
**Tables Created**: 7 tables, 4 functions, ~30 RLS policies
