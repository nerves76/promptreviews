-- ============================================
-- ROLLBACK: Community Core Tables Migration
-- ============================================
-- WARNING: This will delete ALL community data
-- USE WITH EXTREME CAUTION
-- ============================================

-- Drop functions first (they depend on tables)
DROP FUNCTION IF EXISTS create_mention_records(TEXT, UUID, UUID, TEXT[]);
DROP FUNCTION IF EXISTS parse_mentions(TEXT);
DROP FUNCTION IF EXISTS get_user_display_identity(UUID);
DROP FUNCTION IF EXISTS generate_username(UUID);

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS mentions CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS post_reactions CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS community_profiles CASCADE;

-- Log rollback
DO $$
BEGIN
    RAISE NOTICE 'Community core tables rolled back successfully';
    RAISE NOTICE 'All community data has been deleted';
END $$;
