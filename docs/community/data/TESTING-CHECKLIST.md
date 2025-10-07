# Community Feature - Migration Testing Checklist

**Date**: 2025-10-06
**Purpose**: Verify database migrations applied correctly
**Run After**: Applying migrations to local or remote database

---

## Pre-Migration Checks

### ✅ Environment Verification
```bash
# Check current migration status
npx supabase migration list

# Verify you're on correct branch
git branch

# Confirm you have latest code
git pull origin main
```

---

## Migration Application Tests

### ✅ Test 1: Tables Created Successfully

**Run in Supabase SQL Editor or psql**:
```sql
-- Check all community tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'community_profiles',
    'channels',
    'posts',
    'post_comments',
    'post_reactions',
    'comment_reactions',
    'mentions'
  )
ORDER BY table_name;

-- Expected output: 7 rows
-- ✅ PASS if all 7 tables listed
-- ❌ FAIL if any tables missing
```

### ✅ Test 2: Columns Created Correctly

**Community Profiles**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'community_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- user_id (uuid, NO)
-- username (text, NO)
-- display_name_override (text, YES)
-- opted_in_at (timestamp with time zone, YES)
-- guidelines_ack_at (timestamp with time zone, YES)
-- created_at (timestamp with time zone, YES)
-- updated_at (timestamp with time zone, YES)
```

**Posts**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid, NO)
-- channel_id (uuid, NO)
-- author_id (uuid, NO)
-- title (text, NO)
-- body (text, YES)
-- external_url (text, YES)
-- created_at (timestamp with time zone, YES)
-- updated_at (timestamp with time zone, YES)
-- deleted_at (timestamp with time zone, YES)

-- ✅ CRITICAL: Ensure NO account_id column exists
```

### ✅ Test 3: Indexes Created

```sql
-- Check critical indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'post_comments', 'community_profiles', 'channels')
ORDER BY tablename, indexname;

-- Expected indexes (minimum):
-- idx_community_profiles_username
-- idx_channels_slug
-- idx_posts_channel_created
-- idx_posts_created
-- idx_post_comments_post_created
-- idx_post_reactions_post
-- idx_mentions_unread
```

### ✅ Test 4: Foreign Key Constraints

```sql
-- Check foreign keys exist
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('posts', 'post_comments', 'post_reactions', 'comment_reactions', 'mentions')
ORDER BY tc.table_name;

-- Expected foreign keys:
-- posts.channel_id → channels.id
-- posts.author_id → auth.users.id
-- post_comments.post_id → posts.id
-- post_comments.author_id → auth.users.id
-- post_reactions.post_id → posts.id
-- post_reactions.user_id → auth.users.id
-- comment_reactions.comment_id → post_comments.id
-- comment_reactions.user_id → auth.users.id
-- mentions.mentioned_user_id → auth.users.id
-- mentions.author_id → auth.users.id
```

### ✅ Test 5: Check Constraints

```sql
-- Verify username format constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'community_profiles'::regclass
  AND contype = 'c'; -- Check constraint

-- Expected: username_format CHECK (username ~ '^[a-z0-9-]+$')

-- Verify reaction enum constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'post_reactions'::regclass
  AND contype = 'c';

-- Expected: reaction IN ('thumbs_up', 'star', 'celebrate', 'clap', 'laugh')
```

---

## RLS Policy Tests

### ✅ Test 6: RLS Enabled on All Tables

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'community_profiles',
    'channels',
    'posts',
    'post_comments',
    'post_reactions',
    'comment_reactions',
    'mentions'
  );

-- Expected: rowsecurity = true for all tables
-- ✅ PASS if all true
-- ❌ FAIL if any false
```

### ✅ Test 7: Policy Count Check

```sql
-- Count policies per table
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'community_profiles',
    'channels',
    'posts',
    'post_comments',
    'post_reactions',
    'comment_reactions',
    'mentions'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected (minimum):
-- community_profiles: 3-4 policies
-- channels: 4 policies
-- posts: 5+ policies
-- post_comments: 5+ policies
-- post_reactions: 3 policies
-- comment_reactions: 3 policies
-- mentions: 4+ policies
```

### ✅ Test 8: View Policy Definitions

```sql
-- View all community policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'posts'
ORDER BY policyname;

-- Verify key policies exist:
-- ✅ authenticated_users_can_view_posts (SELECT)
-- ✅ users_can_create_posts (INSERT)
-- ✅ authors_can_update_own_posts (UPDATE)
-- ✅ authors_can_delete_own_posts (UPDATE for soft delete)
-- ✅ admins_can_update_posts (UPDATE)
```

---

## Function Tests

### ✅ Test 9: Functions Exist

```sql
-- Check all functions created
SELECT routine_name, data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_username',
    'get_user_display_identity',
    'parse_mentions',
    'create_mention_records'
  )
ORDER BY routine_name;

-- Expected: 4 functions
-- ✅ PASS if all 4 exist
```

### ✅ Test 10: Test Username Generation

```sql
-- Test username generation (requires a real user_id)
-- Replace 'YOUR_USER_ID' with actual auth.users.id
SELECT generate_username('YOUR_USER_ID'::uuid);

-- Expected output: lowercase-hash format (e.g., 'john-a7f3')
-- ✅ PASS if returns valid username
-- ❌ FAIL if error or invalid format
```

### ✅ Test 11: Test Mention Parsing

```sql
-- Test mention parsing
SELECT parse_mentions('Hey @alex-7h3n and @chris-9k2l, what do you think about @feature-requests?');

-- Expected output: {alex-7h3n, chris-9k2l, feature-requests}
-- ✅ PASS if returns array of usernames
```

### ✅ Test 12: Test Display Identity

```sql
-- Test display identity function (requires real user_id)
SELECT get_user_display_identity('YOUR_USER_ID'::uuid);

-- Expected output: "username • Business Name" or "Display Name (username) • Business"
-- ✅ PASS if returns formatted string
```

---

## Seed Data Tests

### ✅ Test 13: Default Channels Seeded

```sql
-- Check channels were seeded
SELECT slug, name, icon, sort_order
FROM channels
ORDER BY sort_order;

-- Expected output (5 rows):
-- general       | General           | 💬 | 1
-- strategy      | Strategy          | 🎯 | 2
-- google-business | Google Business | 🔍 | 3
-- feature-requests | Feature Requests | 💡 | 4
-- promote       | Promote           | 📣 | 5

-- ✅ PASS if all 5 channels exist with correct order
```

---

## Data Integrity Tests

### ✅ Test 14: Unique Constraints

```sql
-- Try inserting duplicate username (should fail)
INSERT INTO community_profiles (user_id, username, opted_in_at)
VALUES (gen_random_uuid(), 'test-user', NOW());

INSERT INTO community_profiles (user_id, username, opted_in_at)
VALUES (gen_random_uuid(), 'test-user', NOW());  -- Should fail

-- Expected: ERROR - duplicate key value violates unique constraint
-- ✅ PASS if second insert fails
-- ❌ FAIL if both inserts succeed

-- Cleanup
DELETE FROM community_profiles WHERE username = 'test-user';
```

### ✅ Test 15: Check Constraints

```sql
-- Try inserting invalid username (should fail)
INSERT INTO community_profiles (user_id, username, opted_in_at)
VALUES (gen_random_uuid(), 'INVALID USERNAME!', NOW());

-- Expected: ERROR - new row violates check constraint "username_format"
-- ✅ PASS if insert fails
-- ❌ FAIL if insert succeeds
```

### ✅ Test 16: Cascade Deletes

```sql
-- Create test post and comment
INSERT INTO community_profiles (user_id, username, opted_in_at)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'test-cascade', NOW());

INSERT INTO posts (id, channel_id, author_id, title, body)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  (SELECT id FROM channels WHERE slug = 'general'),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Post',
  'Test content'
);

INSERT INTO post_comments (id, post_id, author_id, body)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test comment'
);

-- Delete post (should cascade to comments)
DELETE FROM posts WHERE id = '00000000-0000-0000-0000-000000000002'::uuid;

-- Check comment was deleted
SELECT COUNT(*) as remaining_comments
FROM post_comments
WHERE id = '00000000-0000-0000-0000-000000000003'::uuid;

-- Expected: 0 rows
-- ✅ PASS if comment was deleted
-- ❌ FAIL if comment still exists

-- Cleanup
DELETE FROM community_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
```

---

## RLS Access Tests (Requires Auth Session)

### ✅ Test 17: Authenticated User Can View Posts

```sql
-- Set session to authenticated user (replace with real user_id)
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID';

-- Try to select posts
SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL;

-- Expected: Query succeeds (returns count)
-- ✅ PASS if query works
-- ❌ FAIL if permission denied

-- Reset role
RESET role;
```

### ✅ Test 18: Unauthenticated User Cannot Access

```sql
-- Set session to anonymous
SET LOCAL role = anon;

-- Try to select posts (should fail)
SELECT COUNT(*) FROM posts;

-- Expected: No rows (RLS blocks access) or permission denied
-- ✅ PASS if access blocked
-- ❌ FAIL if data returned

-- Reset role
RESET role;
```

### ✅ Test 19: User Can Create Own Content

```sql
-- Set session to authenticated user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID';

-- Try to create post as self
INSERT INTO posts (channel_id, author_id, title, body)
VALUES (
  (SELECT id FROM channels WHERE slug = 'general'),
  'YOUR_USER_ID'::uuid,  -- Same as JWT sub
  'Test Post',
  'Test content'
);

-- Expected: Insert succeeds
-- ✅ PASS if insert works
-- ❌ FAIL if permission denied

-- Cleanup
DELETE FROM posts WHERE title = 'Test Post' AND author_id = 'YOUR_USER_ID'::uuid;
RESET role;
```

### ✅ Test 20: User Cannot Impersonate Others

```sql
-- Set session to authenticated user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = 'YOUR_USER_ID';

-- Try to create post as different user (should fail)
INSERT INTO posts (channel_id, author_id, title, body)
VALUES (
  (SELECT id FROM channels WHERE slug = 'general'),
  '00000000-0000-0000-0000-000000000099'::uuid,  -- Different user
  'Fake Post',
  'Impersonation attempt'
);

-- Expected: ERROR - new row violates row-level security policy
-- ✅ PASS if insert fails
-- ❌ FAIL if insert succeeds

RESET role;
```

---

## Performance Tests

### ✅ Test 21: Index Usage on Feed Query

```sql
-- Enable query plan output
EXPLAIN ANALYZE
SELECT p.id, p.title, p.created_at
FROM posts p
WHERE p.channel_id = (SELECT id FROM channels WHERE slug = 'general')
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20;

-- Check output for:
-- ✅ PASS if "Index Scan using idx_posts_channel_created"
-- ❌ FAIL if "Seq Scan on posts" (means index not used)
```

### ✅ Test 22: Mention Unread Index Usage

```sql
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM mentions
WHERE mentioned_user_id = 'YOUR_USER_ID'::uuid
  AND read_at IS NULL;

-- Check output for:
-- ✅ PASS if "Index Scan using idx_mentions_unread" or "idx_mentions_user_read"
-- ❌ FAIL if "Seq Scan on mentions"
```

---

## Prisma Sync Verification

### ✅ Test 23: Prisma Schema Updated

```bash
# After running npx prisma db pull
git diff prisma/schema.prisma

# Expected: New models added:
# - model community_profiles { ... }
# - model channels { ... }
# - model posts { ... }
# - model post_comments { ... }
# - model post_reactions { ... }
# - model comment_reactions { ... }
# - model mentions { ... }

# ✅ PASS if all 7 models present
# ❌ FAIL if models missing
```

### ✅ Test 24: TypeScript Types Generated

```bash
# Check generated Prisma client
ls -la node_modules/.prisma/client/

# Should show updated timestamp
# ✅ PASS if recent (after migration)
# ❌ FAIL if old timestamp

# Test import in TypeScript
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma client loaded:', !!prisma.posts);"

# Expected: "Prisma client loaded: true"
```

---

## Rollback Tests (Optional - Test in Non-Production Only)

### ✅ Test 25: Rollback Scripts Work

**WARNING**: Only run in development/test environment

```bash
# Backup current state first!
pg_dump $DATABASE_URL > backup_before_rollback.sql

# Run rollback (reverse order)
psql $DATABASE_URL -f supabase/migrations/20251006120002_rollback.sql
psql $DATABASE_URL -f supabase/migrations/20251006120001_rollback.sql
psql $DATABASE_URL -f supabase/migrations/20251006120000_rollback.sql

# Verify tables dropped
psql $DATABASE_URL -c "\dt community*"
psql $DATABASE_URL -c "\dt posts"

# Expected: No tables found
# ✅ PASS if all tables removed
# ❌ FAIL if tables still exist

# Restore from backup
psql $DATABASE_URL < backup_before_rollback.sql
```

---

## Summary Checklist

After running all tests, complete this checklist:

- [ ] **Test 1-5**: All tables, columns, indexes, and constraints created ✅
- [ ] **Test 6-8**: RLS enabled on all tables with correct policies ✅
- [ ] **Test 9-12**: All 4 helper functions exist and work ✅
- [ ] **Test 13**: 5 default channels seeded correctly ✅
- [ ] **Test 14-16**: Data integrity constraints enforced ✅
- [ ] **Test 17-20**: RLS policies block unauthorized access ✅
- [ ] **Test 21-22**: Critical indexes used in queries ✅
- [ ] **Test 23-24**: Prisma schema synced and types generated ✅
- [ ] **Test 25** (Optional): Rollback scripts work ✅

---

## Troubleshooting Common Issues

### Issue: "relation does not exist"
**Cause**: Migration not applied
**Fix**:
```bash
npx supabase migration list  # Check status
npx supabase db push         # Apply migrations
```

### Issue: "permission denied for table"
**Cause**: RLS policy too restrictive or no auth session
**Fix**:
```sql
-- Check if authenticated
SELECT auth.uid();  -- Should return user_id, not null

-- Check policies exist
\dp posts
```

### Issue: Function doesn't exist
**Cause**: Migration 1 not applied
**Fix**:
```bash
# Verify migration 1 applied
psql $DATABASE_URL -c "\df generate_username"
```

### Issue: Channels not seeded
**Cause**: Migration 3 not run or failed silently
**Fix**:
```sql
-- Manually run seed
\i supabase/migrations/20251006120002_seed_community_defaults.sql
```

---

## Next Steps After Successful Tests

1. ✅ **Update CHANGELOG.md** in `/supabase/migrations/`
2. ✅ **Commit migrations** to git
3. ✅ **Deploy to staging** (if applicable)
4. ✅ **Run tests in staging**
5. ✅ **Deploy to production**
6. ✅ **Notify Backend Agent** to start API development

---

**Document Status**: ✅ Complete
**Total Tests**: 25 verification tests
**Estimated Time**: 15-30 minutes to run all tests
