-- ============================================
-- ROLLBACK: Community RLS Policies Migration
-- ============================================
-- Removes all RLS policies from community tables
-- Tables remain but become inaccessible
-- ============================================

-- Drop Mentions Policies
DROP POLICY IF EXISTS "admins_can_delete_mentions" ON mentions;
DROP POLICY IF EXISTS "admins_can_view_all_mentions" ON mentions;
DROP POLICY IF EXISTS "users_can_update_own_mentions" ON mentions;
DROP POLICY IF EXISTS "users_can_view_own_mentions" ON mentions;

-- Drop Comment Reactions Policies
DROP POLICY IF EXISTS "users_can_delete_own_comment_reactions" ON comment_reactions;
DROP POLICY IF EXISTS "users_can_create_comment_reactions" ON comment_reactions;
DROP POLICY IF EXISTS "authenticated_users_can_view_comment_reactions" ON comment_reactions;

-- Drop Post Reactions Policies
DROP POLICY IF EXISTS "users_can_delete_own_post_reactions" ON post_reactions;
DROP POLICY IF EXISTS "users_can_create_post_reactions" ON post_reactions;
DROP POLICY IF EXISTS "authenticated_users_can_view_post_reactions" ON post_reactions;

-- Drop Post Comments Policies
DROP POLICY IF EXISTS "admins_can_delete_comments" ON post_comments;
DROP POLICY IF EXISTS "admins_can_update_comments" ON post_comments;
DROP POLICY IF EXISTS "authors_can_delete_own_comments" ON post_comments;
DROP POLICY IF EXISTS "authors_can_update_own_comments" ON post_comments;
DROP POLICY IF EXISTS "users_can_create_comments" ON post_comments;
DROP POLICY IF EXISTS "authenticated_users_can_view_comments" ON post_comments;

-- Drop Posts Policies
DROP POLICY IF EXISTS "admins_can_delete_posts" ON posts;
DROP POLICY IF EXISTS "admins_can_update_posts" ON posts;
DROP POLICY IF EXISTS "authors_can_delete_own_posts" ON posts;
DROP POLICY IF EXISTS "authors_can_update_own_posts" ON posts;
DROP POLICY IF EXISTS "users_can_create_posts" ON posts;
DROP POLICY IF EXISTS "authenticated_users_can_view_posts" ON posts;

-- Drop Channels Policies
DROP POLICY IF EXISTS "admins_can_delete_channels" ON channels;
DROP POLICY IF EXISTS "admins_can_update_channels" ON channels;
DROP POLICY IF EXISTS "admins_can_create_channels" ON channels;
DROP POLICY IF EXISTS "authenticated_users_can_view_channels" ON channels;

-- Drop Community Profiles Policies
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON community_profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON community_profiles;
DROP POLICY IF EXISTS "users_can_create_own_profile" ON community_profiles;
DROP POLICY IF EXISTS "authenticated_users_can_view_profiles" ON community_profiles;

-- Disable RLS (optional - tables become accessible to all)
-- ALTER TABLE mentions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE comment_reactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_reactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_comments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE community_profiles DISABLE ROW LEVEL SECURITY;

-- Log rollback
DO $$
BEGIN
    RAISE NOTICE 'Community RLS policies rolled back successfully';
    RAISE NOTICE 'Tables are now inaccessible (RLS enabled but no policies)';
    RAISE NOTICE 'To fully rollback, also run 20251006120000_rollback.sql';
END $$;
