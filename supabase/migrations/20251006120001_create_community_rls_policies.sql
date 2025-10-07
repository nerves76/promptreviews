-- ============================================
-- Community Feature - RLS Policies Migration
-- ============================================
-- Architecture: Global Public Community
-- Simple authenticated access (no account isolation)
-- ============================================

-- ============================================
-- Enable RLS on All Tables
-- ============================================
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Community Profiles Policies
-- ============================================

-- All authenticated users can view opted-in profiles (needed for @mentions, display names)
CREATE POLICY "authenticated_users_can_view_profiles"
    ON community_profiles FOR SELECT
    TO authenticated
    USING (opted_in_at IS NOT NULL);

-- Users can create their own profile
CREATE POLICY "users_can_create_own_profile"
    ON community_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
    ON community_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all profiles (including opted-out)
CREATE POLICY "admins_can_view_all_profiles"
    ON community_profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- ============================================
-- Channels Policies
-- ============================================

-- All authenticated users can view active channels
CREATE POLICY "authenticated_users_can_view_channels"
    ON channels FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only admins can create channels
CREATE POLICY "admins_can_create_channels"
    ON channels FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Only admins can update channels
CREATE POLICY "admins_can_update_channels"
    ON channels FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Only admins can delete channels
CREATE POLICY "admins_can_delete_channels"
    ON channels FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- ============================================
-- Posts Policies
-- ============================================

-- All authenticated users can view non-deleted posts
CREATE POLICY "authenticated_users_can_view_posts"
    ON posts FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Authenticated users can create posts
CREATE POLICY "users_can_create_posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Authors can update their own non-deleted posts
CREATE POLICY "authors_can_update_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own posts
CREATE POLICY "authors_can_delete_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);

-- Admins can update any post (including soft-deleted)
CREATE POLICY "admins_can_update_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Admins can delete any post (hard delete for severe moderation)
CREATE POLICY "admins_can_delete_posts"
    ON posts FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- ============================================
-- Post Comments Policies
-- ============================================

-- All authenticated users can view non-deleted comments
CREATE POLICY "authenticated_users_can_view_comments"
    ON post_comments FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Authenticated users can create comments
CREATE POLICY "users_can_create_comments"
    ON post_comments FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

-- Authors can update their own non-deleted comments
CREATE POLICY "authors_can_update_own_comments"
    ON post_comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Authors can soft-delete their own comments
CREATE POLICY "authors_can_delete_own_comments"
    ON post_comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid() AND deleted_at IS NOT NULL);

-- Admins can update any comment
CREATE POLICY "admins_can_update_comments"
    ON post_comments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Admins can delete any comment (hard delete)
CREATE POLICY "admins_can_delete_comments"
    ON post_comments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- ============================================
-- Post Reactions Policies
-- ============================================

-- All authenticated users can view reactions
CREATE POLICY "authenticated_users_can_view_post_reactions"
    ON post_reactions FOR SELECT
    TO authenticated
    USING (true);

-- Users can create their own reactions
CREATE POLICY "users_can_create_post_reactions"
    ON post_reactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions (to toggle off)
CREATE POLICY "users_can_delete_own_post_reactions"
    ON post_reactions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- Comment Reactions Policies
-- ============================================

-- All authenticated users can view reactions
CREATE POLICY "authenticated_users_can_view_comment_reactions"
    ON comment_reactions FOR SELECT
    TO authenticated
    USING (true);

-- Users can create their own reactions
CREATE POLICY "users_can_create_comment_reactions"
    ON comment_reactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own reactions (to toggle off)
CREATE POLICY "users_can_delete_own_comment_reactions"
    ON comment_reactions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- Mentions Policies
-- ============================================

-- Users can view mentions directed at them
CREATE POLICY "users_can_view_own_mentions"
    ON mentions FOR SELECT
    TO authenticated
    USING (mentioned_user_id = auth.uid());

-- No direct INSERT policy - mentions created via create_mention_records() function only
-- This prevents spam and ensures proper validation

-- Users can update their own mentions (mark as read)
CREATE POLICY "users_can_update_own_mentions"
    ON mentions FOR UPDATE
    TO authenticated
    USING (mentioned_user_id = auth.uid())
    WITH CHECK (mentioned_user_id = auth.uid());

-- Admins can view all mentions (for moderation)
CREATE POLICY "admins_can_view_all_mentions"
    ON mentions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Admins can delete mentions (moderation)
CREATE POLICY "admins_can_delete_mentions"
    ON mentions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE account_id = auth.uid()
        )
    );

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'Community RLS policies created successfully';
    RAISE NOTICE 'All tables secured with row-level security';
    RAISE NOTICE 'Policy pattern: Authenticated access, author-owns, admin-override';
END $$;
