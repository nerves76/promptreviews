-- ============================================
-- ROLLBACK: Seed Community Defaults Migration
-- ============================================
-- Removes default channels
-- ============================================

-- Delete seeded channels by slug
DELETE FROM channels WHERE slug IN (
    'general',
    'strategy',
    'google-business',
    'feature-requests',
    'promote'
);

-- Log rollback
DO $$
BEGIN
    RAISE NOTICE 'Default channels rolled back successfully';
    RAISE NOTICE 'Removed channels: General, Strategy, Google Business, Feature Requests, Promote';
END $$;
