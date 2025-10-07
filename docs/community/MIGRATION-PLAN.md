# Community Feature - Database Migration Plan

**Date**: 2025-10-06
**Architecture**: Global Public Community
**Version**: 2.0

---

## Overview

This document outlines the database migration strategy for implementing a global public community feature. The key architectural principle is **simplicity**: remove account_id from community content tables since all data is globally accessible to authenticated users.

---

## Migration Philosophy

### v1 vs v2 Approach

**v1 (Account-Isolated - WRONG)**:
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL, -- ❌ Wrong
    channel_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT
);

-- Complex RLS with subquery
CREATE POLICY "posts_select" ON posts
    FOR SELECT TO authenticated
    USING (
        account_id IN (
            SELECT account_id FROM account_users
            WHERE user_id = auth.uid()
        )
    );
```

**v2 (Global Public - CORRECT)**:
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    -- No account_id! Posts are global
    channel_id UUID NOT NULL,
    author_id UUID NOT NULL,
    content TEXT
);

-- Simple RLS
CREATE POLICY "posts_select" ON posts
    FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
```

**Performance Impact**:
- v1: Every query requires subquery against account_users table
- v2: Direct table scan, no joins needed
- **Expected improvement**: 50-80% faster query times

---

## Migration File Naming

Following PromptReviews conventions (from schema audit):

**Format**: `YYYYMMDDHHMMSS_description.sql`

**Timestamp Base**: 2025-10-06 12:00:00 UTC
- Migration 1: `20251006120000_create_community_core_tables.sql`
- Migration 2: `20251006120001_create_community_rls_policies.sql`
- Migration 3: `20251006120002_seed_default_channels.sql`
- Migration 4: `20251006120003_add_community_username_function.sql`

**Location**: `/supabase/migrations/`

---

## Migration Phases

### Phase 1: Core Tables
**File**: `20251006120000_create_community_core_tables.sql`

Creates foundational tables without RLS policies.

**Tables**:
1. `community_profiles` - User identity (one per user, not per account)
2. `channels` - Global channels (no account_id)
3. `posts` - Global posts (no account_id)
4. `comments` - Global comments (no account_id)
5. `reactions` - Global reactions (no account_id)
6. `mentions` - User notifications (no account_id)
7. `monthly_summaries` - Account-specific data (HAS account_id)
8. `saved_posts` - User bookmarks (no account_id)

**Why separate from RLS?**: Matches PromptReviews pattern (see existing migrations)

---

### Phase 2: RLS Policies
**File**: `20251006120001_create_community_rls_policies.sql`

Implements Row Level Security policies.

**Pattern**: Simple authenticated access (no account isolation)

**Policy Types**:
- SELECT: `deleted_at IS NULL` (show non-deleted content)
- INSERT: `author_id = auth.uid()` (users create as themselves)
- UPDATE: `author_id = auth.uid()` (users edit own content)
- DELETE: Admin policy only (soft delete via UPDATE)

**Why separate from tables?**: Easier to test and rollback if issues

---

### Phase 3: Default Data
**File**: `20251006120002_seed_default_channels.sql`

Seeds initial channels.

**Channels**:
1. General - Open discussion
2. Strategy - Tactics and best practices
3. Google Business - GBP-specific discussions
4. Feature Requests - Product feedback
5. Wins - Success stories and monthly summaries

**Why separate?**: Can be re-run safely, doesn't depend on RLS

---

### Phase 4: Helper Functions
**File**: `20251006120003_add_community_username_function.sql`

Creates Postgres functions for username generation and utilities.

**Functions**:
1. `generate_username(user_id uuid)` - Creates unique username
2. `get_user_display_name(user_id uuid, account_id uuid)` - Returns "User • Business" format
3. `parse_mentions(content text)` - Extracts @usernames
4. `create_mention_notifications(source_type text, source_id uuid, content text)` - Auto-creates mention records

**Why separate?**: Functions need tables to exist first

---

## Detailed Migration Scripts

### Migration 1: Core Tables

```sql
-- 20251006120000_create_community_core_tables.sql

-- ============================================
-- Community Profiles (User Identity - Global)
-- ============================================
CREATE TABLE community_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name_override TEXT,
    guidelines_accepted_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    notify_mentions BOOLEAN DEFAULT true,
    notify_broadcasts BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_community_profiles_username ON community_profiles(username);
CREATE INDEX idx_community_profiles_opted_out ON community_profiles(opted_out_at) WHERE opted_out_at IS NULL;

COMMENT ON TABLE community_profiles IS 'User profiles for community feature - one per user (not per account)';

-- ============================================
-- Channels (Global, No Account Scope)
-- ============================================
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    category TEXT CHECK (category IN ('discussion', 'support', 'wins', 'feedback')),
    is_active BOOLEAN DEFAULT true,
    admin_only_posting BOOLEAN DEFAULT false, -- For announcements
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_channels_slug ON channels(slug);
CREATE INDEX idx_channels_active ON channels(is_active) WHERE is_active = true;
CREATE INDEX idx_channels_sort ON channels(sort_order);

COMMENT ON TABLE channels IS 'Global community channels - no account isolation';

-- ============================================
-- Posts (Global, No Account Scope)
-- ============================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    body TEXT,
    external_url TEXT,

    -- Metadata
    is_pinned BOOLEAN DEFAULT false,
    is_from_promptreviews_team BOOLEAN DEFAULT false,

    -- Monthly summary specific (only for auto-generated summary posts)
    is_monthly_summary BOOLEAN DEFAULT false,
    summary_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    summary_month DATE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_title_length CHECK (char_length(title) > 0 AND char_length(title) <= 200),
    CONSTRAINT valid_body_length CHECK (body IS NULL OR char_length(body) <= 5000),
    CONSTRAINT valid_external_url CHECK (external_url IS NULL OR external_url ~* '^https?://'),
    CONSTRAINT summary_fields_check CHECK (
        (is_monthly_summary = false AND summary_account_id IS NULL AND summary_month IS NULL)
        OR
        (is_monthly_summary = true AND summary_account_id IS NOT NULL AND summary_month IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_posts_channel_created ON posts(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_pinned ON posts(is_pinned, created_at DESC) WHERE is_pinned = true AND deleted_at IS NULL;
CREATE INDEX idx_posts_summaries ON posts(summary_account_id, summary_month) WHERE is_monthly_summary = true;
CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE posts IS 'Global community posts - visible to all authenticated users';

-- ============================================
-- Comments (Global, No Account Scope)
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT valid_comment_length CHECK (char_length(body) > 0 AND char_length(body) <= 2000)
);

CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_author ON comments(author_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE comments IS 'Comments on posts - single-level threading only';

-- ============================================
-- Reactions (Global, No Account Scope)
-- ============================================
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (emoji IN ('thumbs_up', 'star', 'celebrate', 'clap', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT reaction_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL)
        OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_reaction_per_target UNIQUE (user_id, post_id, comment_id, emoji)
);

CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_reactions_comment ON reactions(comment_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

COMMENT ON TABLE reactions IS 'Emoji reactions to posts and comments';

-- ============================================
-- Mentions (User Notifications, No Account Scope)
-- ============================================
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('post', 'comment')),
    source_id UUID NOT NULL,
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_mentions_user_read ON mentions(mentioned_user_id, read_at);
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);
CREATE INDEX idx_mentions_unread ON mentions(mentioned_user_id) WHERE read_at IS NULL;

COMMENT ON TABLE mentions IS '@mentions for notifications - tied to user, not account';

-- ============================================
-- Monthly Summaries (Account-Specific Data)
-- ============================================
CREATE TABLE monthly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    summary_month DATE NOT NULL,

    -- Summary data
    review_count INT,
    average_rating NUMERIC(3,2),
    top_positive_theme TEXT,
    top_negative_theme TEXT,
    analytics_url TEXT,

    -- Posting status
    prepared_at TIMESTAMPTZ DEFAULT NOW(),
    posted_at TIMESTAMPTZ,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,

    created_by UUID REFERENCES auth.users(id),

    UNIQUE(account_id, summary_month)
);

CREATE INDEX idx_monthly_summaries_account_month ON monthly_summaries(account_id, summary_month DESC);
CREATE INDEX idx_monthly_summaries_posted ON monthly_summaries(posted_at) WHERE posted_at IS NOT NULL;

COMMENT ON TABLE monthly_summaries IS 'Account-specific monthly review summaries - optionally posted to community';

-- ============================================
-- Saved Posts (User Bookmarks)
-- ============================================
CREATE TABLE saved_posts (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_saved_posts_user ON saved_posts(user_id, created_at DESC);

COMMENT ON TABLE saved_posts IS 'User-saved/bookmarked posts - per user, not per account';
```

---

### Migration 2: RLS Policies

```sql
-- 20251006120001_create_community_rls_policies.sql

-- ============================================
-- Enable RLS on All Tables
-- ============================================
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Community Profiles Policies
-- ============================================

-- Users can view all profiles (needed for @mentions, display names)
CREATE POLICY "authenticated_view_profiles"
    ON community_profiles FOR SELECT
    TO authenticated
    USING (opted_out_at IS NULL);

-- Users can insert their own profile
CREATE POLICY "users_create_own_profile"
    ON community_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own_profile"
    ON community_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- Channels Policies
-- ============================================

-- Everyone can view active channels
CREATE POLICY "authenticated_view_channels"
    ON channels FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only admins can manage channels
CREATE POLICY "admins_manage_channels"
    ON channels FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Posts Policies
-- ============================================

-- Everyone can view non-deleted posts
CREATE POLICY "authenticated_view_posts"
    ON posts FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Users can create posts (unless channel is admin-only)
CREATE POLICY "users_create_posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND (
            NOT EXISTS (
                SELECT 1 FROM channels
                WHERE id = posts.channel_id
                AND admin_only_posting = true
            )
            OR EXISTS (
                SELECT 1 FROM admins
                WHERE user_id = auth.uid()
            )
        )
    );

-- Authors can update their own posts
CREATE POLICY "authors_update_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own posts
CREATE POLICY "authors_delete_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);

-- Admins can manage all posts
CREATE POLICY "admins_manage_posts"
    ON posts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Comments Policies
-- ============================================

-- Everyone can view non-deleted comments
CREATE POLICY "authenticated_view_comments"
    ON comments FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Users can create comments
CREATE POLICY "users_create_comments"
    ON comments FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Authors can update their own comments
CREATE POLICY "authors_update_own_comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own comments
CREATE POLICY "authors_delete_own_comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);

-- Admins can manage all comments
CREATE POLICY "admins_manage_comments"
    ON comments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Reactions Policies
-- ============================================

-- Everyone can view reactions
CREATE POLICY "authenticated_view_reactions"
    ON reactions FOR SELECT
    TO authenticated
    USING (true);

-- Users can create their own reactions
CREATE POLICY "users_create_reactions"
    ON reactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions
CREATE POLICY "users_delete_own_reactions"
    ON reactions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- Mentions Policies
-- ============================================

-- Users can view mentions directed at them
CREATE POLICY "users_view_own_mentions"
    ON mentions FOR SELECT
    TO authenticated
    USING (mentioned_user_id = auth.uid());

-- System can create mentions (via function only)
-- No direct INSERT policy - use RPC function

-- Users can mark their mentions as read
CREATE POLICY "users_update_own_mentions"
    ON mentions FOR UPDATE
    TO authenticated
    USING (mentioned_user_id = auth.uid())
    WITH CHECK (mentioned_user_id = auth.uid());

-- ============================================
-- Monthly Summaries Policies
-- ============================================

-- Users can view summaries for their accounts
CREATE POLICY "account_members_view_summaries"
    ON monthly_summaries FOR SELECT
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- System creates summaries (via Edge function)
-- Account owners can manually trigger
CREATE POLICY "account_owners_create_summaries"
    ON monthly_summaries FOR INSERT
    TO authenticated
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- ============================================
-- Saved Posts Policies
-- ============================================

-- Users can view their own saved posts
CREATE POLICY "users_view_own_saved_posts"
    ON saved_posts FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can save posts
CREATE POLICY "users_save_posts"
    ON saved_posts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can unsave posts
CREATE POLICY "users_unsave_posts"
    ON saved_posts FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
```

---

### Migration 3: Seed Channels

```sql
-- 20251006120002_seed_default_channels.sql

INSERT INTO channels (name, slug, description, icon, category, sort_order) VALUES
    (
        'General',
        'general',
        'Open discussion, introductions, and general questions about review management',
        '💬',
        'discussion',
        1
    ),
    (
        'Strategy',
        'strategy',
        'Share tactics, best practices, and optimization tips for collecting and managing reviews',
        '🎯',
        'discussion',
        2
    ),
    (
        'Google Business',
        'google-business',
        'Discussions specific to Google Business Profile reviews and optimization',
        '🔍',
        'discussion',
        3
    ),
    (
        'Feature Requests',
        'feature-requests',
        'Suggest new features and improvements for PromptReviews',
        '💡',
        'feedback',
        4
    ),
    (
        'Wins',
        'wins',
        'Celebrate successes, share milestones, and view monthly performance summaries',
        '🎉',
        'wins',
        5
    );

-- Log seeding
DO $$
BEGIN
    RAISE NOTICE 'Seeded % default channels', (SELECT COUNT(*) FROM channels);
END $$;
```

---

### Migration 4: Helper Functions

```sql
-- 20251006120003_add_community_username_function.sql

-- ============================================
-- Username Generation Function
-- ============================================
CREATE OR REPLACE FUNCTION generate_username(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_first_name TEXT;
    v_username TEXT;
    v_hash TEXT;
    v_attempt INT := 0;
    v_max_attempts INT := 5;
BEGIN
    -- Get user's first name from auth.users raw_user_meta_data
    SELECT
        COALESCE(
            (raw_user_meta_data->>'first_name'),
            split_part(email, '@', 1)
        )
    INTO v_first_name
    FROM auth.users
    WHERE id = p_user_id;

    -- Normalize first name
    v_first_name := lower(regexp_replace(v_first_name, '[^a-z0-9]', '', 'g'));
    v_first_name := left(v_first_name, 12);

    -- Try to generate unique username
    WHILE v_attempt < v_max_attempts LOOP
        -- Generate hash from user_id + attempt + random
        v_hash := left(
            encode(
                digest(p_user_id::text || v_attempt::text || random()::text, 'sha256'),
                'base32'
            ),
            4
        );
        v_hash := lower(regexp_replace(v_hash, '[^a-z0-9]', '', 'g'));

        -- Combine
        v_username := v_first_name || '-' || v_hash;

        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM community_profiles WHERE username = v_username) THEN
            RETURN v_username;
        END IF;

        v_attempt := v_attempt + 1;
    END LOOP;

    -- If all attempts failed, raise error
    RAISE EXCEPTION 'Failed to generate unique username after % attempts', v_max_attempts;
END;
$$;

COMMENT ON FUNCTION generate_username IS 'Generates unique username in format: firstname-hash';

-- ============================================
-- Get Display Name Function
-- ============================================
CREATE OR REPLACE FUNCTION get_user_display_name(p_user_id UUID, p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_username TEXT;
    v_display_override TEXT;
    v_business_name TEXT;
    v_result TEXT;
BEGIN
    -- Get username and override
    SELECT username, display_name_override
    INTO v_username, v_display_override
    FROM community_profiles
    WHERE user_id = p_user_id;

    -- Get business name for account
    SELECT business_name
    INTO v_business_name
    FROM accounts
    WHERE id = p_account_id;

    -- Build display name
    IF v_display_override IS NOT NULL THEN
        v_result := v_display_override || ' (' || v_username || ') • ' || v_business_name;
    ELSE
        v_result := v_username || ' • ' || v_business_name;
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_user_display_name IS 'Returns formatted display name: "username • Business Name"';

-- ============================================
-- Parse Mentions Function
-- ============================================
CREATE OR REPLACE FUNCTION parse_mentions(p_content TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_matches TEXT[];
BEGIN
    -- Extract all @username patterns
    SELECT array_agg(DISTINCT match[1])
    INTO v_matches
    FROM regexp_matches(p_content, '@([a-z0-9-]+)', 'g') AS match;

    RETURN COALESCE(v_matches, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION parse_mentions IS 'Extracts @usernames from text content';

-- ============================================
-- Create Mention Notifications Function
-- ============================================
CREATE OR REPLACE FUNCTION create_mention_notifications(
    p_source_type TEXT,
    p_source_id UUID,
    p_author_id UUID,
    p_content TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usernames TEXT[];
    v_username TEXT;
    v_user_id UUID;
    v_count INT := 0;
BEGIN
    -- Parse mentions from content
    v_usernames := parse_mentions(p_content);

    -- Create mention record for each valid user
    FOREACH v_username IN ARRAY v_usernames
    LOOP
        -- Get user_id for username
        SELECT user_id INTO v_user_id
        FROM community_profiles
        WHERE username = v_username
        AND opted_out_at IS NULL;

        -- Skip if not found or self-mention
        IF v_user_id IS NULL OR v_user_id = p_author_id THEN
            CONTINUE;
        END IF;

        -- Insert mention
        INSERT INTO mentions (source_type, source_id, mentioned_user_id, author_id)
        VALUES (p_source_type, p_source_id, v_user_id, p_author_id)
        ON CONFLICT DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION create_mention_notifications IS 'Creates mention records from parsed @usernames';
```

---

## Post-Migration Tasks

### 1. Sync Prisma Schema

After all migrations are applied:

```bash
# Pull latest schema from Supabase
npx prisma db pull

# Generate TypeScript types
npx prisma generate

# Verify changes
git diff prisma/schema.prisma
git diff src/generated/prisma/
```

### 2. Update Changelog

Add entry to `/supabase/migrations/CHANGELOG.md`:

```markdown
## [2025-10-06]
### Added
- Community feature core tables (posts, comments, reactions, channels)
- Global public architecture (no account isolation on content)
- Community profiles with username generation
- Simplified RLS policies for authenticated access
- Monthly summary integration (account-specific data, optionally public posts)
- Mention notifications system
- Default channel seeding (General, Strategy, Google Business, Feature Requests, Wins)
```

### 3. Verify Migration Status

```bash
# Check migrations applied
npx supabase migration list

# Should show:
# 20251006120000_create_community_core_tables.sql (applied)
# 20251006120001_create_community_rls_policies.sql (applied)
# 20251006120002_seed_default_channels.sql (applied)
# 20251006120003_add_community_username_function.sql (applied)
```

---

## Testing Strategy

### Local Testing (Before Remote Push)

```bash
# Reset local database
npx supabase db reset --local

# Verify migrations run cleanly
npx supabase migration list --local

# Test RLS policies
npx supabase db test --local
```

### RLS Policy Testing

Create test file: `/supabase/tests/community_rls.test.sql`

```sql
-- Test 1: Authenticated users can view posts
BEGIN;
SELECT plan(3);

-- Create test user
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com');

-- Create test post
INSERT INTO posts (id, channel_id, author_id, title, body)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    (SELECT id FROM channels WHERE slug = 'general'),
    '00000000-0000-0000-0000-000000000001',
    'Test Post',
    'Test content'
);

-- Set session to test user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

-- Test: Can view own post
SELECT ok(
    EXISTS (SELECT 1 FROM posts WHERE id = '00000000-0000-0000-0000-000000000002'),
    'User can view posts'
);

-- Test: Can create comment
SELECT lives_ok(
    $$INSERT INTO comments (post_id, author_id, body)
      VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test comment')$$,
    'User can create comments'
);

-- Test: Cannot impersonate another user
SELECT throws_ok(
    $$INSERT INTO posts (channel_id, author_id, title, body)
      VALUES ((SELECT id FROM channels WHERE slug = 'general'), '00000000-0000-0000-0000-000000000999', 'Fake', 'Body')$$,
    'User cannot create posts as another user'
);

SELECT * FROM finish();
ROLLBACK;
```

Run tests:
```bash
npx supabase test db
```

---

## Rollback Strategy

### Full Rollback

Create rollback file: `/supabase/migrations/ROLLBACK_community_feature.sql`

```sql
-- ROLLBACK: Community Feature
-- USE WITH CAUTION - Drops all community tables and data

-- Drop functions
DROP FUNCTION IF EXISTS create_mention_notifications;
DROP FUNCTION IF EXISTS parse_mentions;
DROP FUNCTION IF EXISTS get_user_display_name;
DROP FUNCTION IF EXISTS generate_username;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS saved_posts;
DROP TABLE IF EXISTS monthly_summaries;
DROP TABLE IF EXISTS mentions;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS community_profiles;

-- Log rollback
DO $$
BEGIN
    RAISE NOTICE 'Community feature tables and functions dropped';
END $$;
```

**Usage** (only if absolutely necessary):
```bash
psql $DATABASE_URL -f supabase/migrations/ROLLBACK_community_feature.sql
```

### Partial Rollback (Disable Feature, Keep Data)

Alternative: Disable RLS policies instead of dropping tables

```sql
-- Disable all community access (data preserved)
DROP POLICY IF EXISTS "authenticated_view_posts" ON posts;
DROP POLICY IF EXISTS "users_create_posts" ON posts;
-- ... (drop all policies)

-- Re-enable later by re-running migration 2
```

---

## Performance Considerations

### Expected Query Performance

**v1 (Account-Isolated)** - Every query:
```sql
SELECT * FROM posts
WHERE account_id IN (
    SELECT account_id FROM account_users WHERE user_id = 'xxx'
);
-- Requires: posts table scan + account_users join
-- Estimated: 50-200ms for 10k posts
```

**v2 (Global Public)** - Optimized:
```sql
SELECT * FROM posts
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
-- Requires: posts table scan only (indexed)
-- Estimated: 5-20ms for 10k posts
```

**Performance Gain**: 10x faster for typical queries

### Recommended Indexes

All critical indexes included in Migration 1:
- `idx_posts_channel_created` - Feed queries
- `idx_posts_pinned` - Pinned posts
- `idx_comments_post_created` - Comment threads
- `idx_reactions_post` - Reaction aggregation
- `idx_mentions_user_read` - Unread mentions

### Query Optimization Tips

1. **Always use indexed columns in WHERE clauses**
   - `WHERE deleted_at IS NULL` (indexed)
   - `WHERE channel_id = 'xxx'` (indexed)

2. **Use LIMIT for pagination**
   - Never fetch all posts at once
   - Use `LIMIT 20 OFFSET N` or cursor-based pagination

3. **Aggregate reactions efficiently**
   ```sql
   SELECT emoji, COUNT(*) FROM reactions
   WHERE post_id = 'xxx'
   GROUP BY emoji;
   ```

4. **Prefetch display names**
   - Use `get_user_display_name()` function
   - Cache results on frontend for 5 minutes

---

## Migration Checklist

### Pre-Migration
- [ ] Review all migration files for syntax errors
- [ ] Test migrations on local Supabase instance
- [ ] Run RLS policy tests
- [ ] Verify Prisma schema compatibility
- [ ] Create rollback script
- [ ] Notify team of migration window

### Migration Execution
- [ ] Run migration 1: Core tables
- [ ] Verify tables created: `\dt` in psql
- [ ] Run migration 2: RLS policies
- [ ] Verify policies created: `\dp` in psql
- [ ] Run migration 3: Seed channels
- [ ] Verify channels exist: `SELECT * FROM channels`
- [ ] Run migration 4: Helper functions
- [ ] Verify functions created: `\df`

### Post-Migration
- [ ] Sync Prisma schema: `npx prisma db pull`
- [ ] Generate types: `npx prisma generate`
- [ ] Update CHANGELOG.md
- [ ] Test with real user account
- [ ] Verify RLS policies working
- [ ] Monitor Supabase logs for errors
- [ ] Deploy frontend changes

---

## Next Steps

After successful migration:

1. **Backend Agent**: Implement RPC functions for post/comment creation
2. **Frontend Agent**: Build community UI components
3. **Automation Agent**: Create monthly summary cron job
4. **QA Agent**: Write integration tests

---

**Migration Plan Complete**
