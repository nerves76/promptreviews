-- ============================================
-- Community Feature - Core Tables Migration
-- ============================================
-- Architecture: Global Public Community
-- All authenticated users can read/write
-- NO account_id on posts, comments, reactions
-- ============================================

-- ============================================
-- Community Profiles (User Identity - Global)
-- ============================================
-- One profile per user (not per account)
-- Username is immutable, display name is optional override
CREATE TABLE community_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name_override TEXT,
    opted_in_at TIMESTAMPTZ,
    guidelines_ack_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9-]+$'),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

CREATE INDEX idx_community_profiles_username ON community_profiles(username);
CREATE INDEX idx_community_profiles_opted_in ON community_profiles(opted_in_at) WHERE opted_in_at IS NOT NULL;

COMMENT ON TABLE community_profiles IS 'User profiles for community - one per user, not per account';
COMMENT ON COLUMN community_profiles.username IS 'Immutable username format: firstname-hash (e.g. alex-7h3n)';
COMMENT ON COLUMN community_profiles.display_name_override IS 'Optional custom display name (e.g. "Alex the Baker")';

-- ============================================
-- Channels (Global, No Account Scope)
-- ============================================
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_channels_slug ON channels(slug);
CREATE INDEX idx_channels_active_sort ON channels(is_active, sort_order) WHERE is_active = true;

COMMENT ON TABLE channels IS 'Global community channels - visible to all authenticated users';

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

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_title_length CHECK (char_length(title) > 0 AND char_length(title) <= 200),
    CONSTRAINT valid_body_length CHECK (body IS NULL OR char_length(body) <= 5000),
    CONSTRAINT valid_external_url CHECK (external_url IS NULL OR external_url ~* '^https?://')
);

-- Indexes for performance
CREATE INDEX idx_posts_channel_created ON posts(channel_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE posts IS 'Global community posts - visible to all authenticated users';
COMMENT ON COLUMN posts.deleted_at IS 'Soft delete timestamp for moderation';

-- ============================================
-- Post Comments (Global, No Account Scope)
-- ============================================
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT valid_comment_length CHECK (char_length(body) > 0 AND char_length(body) <= 2000)
);

CREATE INDEX idx_post_comments_post_created ON post_comments(post_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_comments_author ON post_comments(author_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE post_comments IS 'Comments on posts - single-level threading only';

-- ============================================
-- Post Reactions (Global, No Account Scope)
-- ============================================
CREATE TABLE post_reactions (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('thumbs_up', 'star', 'celebrate', 'clap', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (post_id, user_id, reaction)
);

CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions(user_id);

COMMENT ON TABLE post_reactions IS 'Emoji reactions to posts - one per user per reaction type';

-- ============================================
-- Comment Reactions (Global, No Account Scope)
-- ============================================
CREATE TABLE comment_reactions (
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('thumbs_up', 'star', 'celebrate', 'clap', 'laugh')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (comment_id, user_id, reaction)
);

CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);

COMMENT ON TABLE comment_reactions IS 'Emoji reactions to comments - one per user per reaction type';

-- ============================================
-- Mentions (User Notifications)
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
-- Helper Functions
-- ============================================

-- Generate unique username in format: firstname-hash
CREATE OR REPLACE FUNCTION generate_username(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_first_name TEXT;
    v_email TEXT;
    v_username TEXT;
    v_hash TEXT;
    v_attempt INT := 0;
    v_max_attempts INT := 5;
BEGIN
    -- Get user's first name and email from auth.users
    SELECT
        COALESCE(
            (raw_user_meta_data->>'first_name'),
            (raw_user_meta_data->>'firstName'),
            split_part(email, '@', 1)
        ),
        email
    INTO v_first_name, v_email
    FROM auth.users
    WHERE id = p_user_id;

    -- Fallback if no data found
    IF v_first_name IS NULL THEN
        v_first_name := 'user';
    END IF;

    -- Normalize first name: lowercase, remove non-alphanumeric, max 12 chars
    v_first_name := lower(regexp_replace(v_first_name, '[^a-z0-9]', '', 'g'));
    v_first_name := left(v_first_name, 12);

    -- If empty after normalization, use 'user'
    IF v_first_name = '' THEN
        v_first_name := 'user';
    END IF;

    -- Try to generate unique username
    WHILE v_attempt < v_max_attempts LOOP
        -- Generate 4-char hash from user_id + attempt + random
        v_hash := left(
            lower(
                encode(
                    digest(p_user_id::text || v_attempt::text || random()::text, 'sha256'),
                    'hex'
                )
            ),
            4
        );

        -- Combine firstname-hash
        v_username := v_first_name || '-' || v_hash;

        -- Check uniqueness
        IF NOT EXISTS (SELECT 1 FROM community_profiles WHERE username = v_username) THEN
            RETURN v_username;
        END IF;

        v_attempt := v_attempt + 1;
    END LOOP;

    -- If all attempts failed, raise error
    RAISE EXCEPTION 'Failed to generate unique username after % attempts for user %', v_max_attempts, p_user_id;
END;
$$;

COMMENT ON FUNCTION generate_username IS 'Generates unique username in format: firstname-hash (e.g., alex-7h3n)';

-- Get display identity for user (includes username, display name override, and business name)
CREATE OR REPLACE FUNCTION get_user_display_identity(p_user_id UUID)
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
    -- Get username and display override from community profile
    SELECT username, display_name_override
    INTO v_username, v_display_override
    FROM community_profiles
    WHERE user_id = p_user_id;

    -- Get user's primary business name (first account)
    SELECT a.business_name
    INTO v_business_name
    FROM accounts a
    JOIN account_users au ON au.account_id = a.id
    WHERE au.user_id = p_user_id
    ORDER BY au.created_at ASC
    LIMIT 1;

    -- Build display name
    IF v_display_override IS NOT NULL AND v_business_name IS NOT NULL THEN
        -- "Display Name (username) • Business Name"
        v_result := v_display_override || ' (' || v_username || ') • ' || v_business_name;
    ELSIF v_display_override IS NOT NULL THEN
        -- "Display Name (username)"
        v_result := v_display_override || ' (' || v_username || ')';
    ELSIF v_business_name IS NOT NULL THEN
        -- "username • Business Name"
        v_result := v_username || ' • ' || v_business_name;
    ELSE
        -- Just username
        v_result := v_username;
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_user_display_identity IS 'Returns formatted display name: "Username • Business Name" or "Display Name (username) • Business"';

-- Parse @mentions from text content
CREATE OR REPLACE FUNCTION parse_mentions(p_content TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_matches TEXT[];
BEGIN
    -- Extract all @username patterns (format: @firstname-hash)
    SELECT array_agg(DISTINCT match[1])
    INTO v_matches
    FROM regexp_matches(p_content, '@([a-z0-9-]+)', 'g') AS match;

    RETURN COALESCE(v_matches, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION parse_mentions IS 'Extracts @usernames from text content (returns array of usernames without @ prefix)';

-- Create mention records from parsed usernames
CREATE OR REPLACE FUNCTION create_mention_records(
    p_source_type TEXT,
    p_source_id UUID,
    p_author_id UUID,
    p_mentioned_usernames TEXT[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_username TEXT;
    v_user_id UUID;
    v_count INT := 0;
BEGIN
    -- Create mention record for each valid user
    FOREACH v_username IN ARRAY p_mentioned_usernames
    LOOP
        -- Get user_id for username
        SELECT user_id INTO v_user_id
        FROM community_profiles
        WHERE username = v_username
        AND opted_in_at IS NOT NULL; -- Only notify opted-in users

        -- Skip if not found or self-mention
        IF v_user_id IS NULL OR v_user_id = p_author_id THEN
            CONTINUE;
        END IF;

        -- Insert mention (ON CONFLICT DO NOTHING prevents duplicates)
        INSERT INTO mentions (source_type, source_id, mentioned_user_id, author_id)
        VALUES (p_source_type, p_source_id, v_user_id, p_author_id)
        ON CONFLICT DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION create_mention_records IS 'Creates mention notification records for array of usernames';

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'Community core tables created successfully';
    RAISE NOTICE 'Tables: community_profiles, channels, posts, post_comments, post_reactions, comment_reactions, mentions';
    RAISE NOTICE 'Functions: generate_username, get_user_display_identity, parse_mentions, create_mention_records';
END $$;
