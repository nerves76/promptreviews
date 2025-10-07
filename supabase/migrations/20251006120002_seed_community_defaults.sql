-- ============================================
-- Community Feature - Seed Default Channels
-- ============================================
-- Creates 5 channels: General, Strategy, Google Business, Feature Requests, Promote
-- ============================================

INSERT INTO channels (slug, name, description, icon, sort_order, is_active) VALUES
    (
        'general',
        'General',
        'Open discussion, introductions, and general questions about review management',
        '💬',
        1,
        true
    ),
    (
        'strategy',
        'Strategy',
        'Share tactics, best practices, and optimization tips for collecting and managing reviews',
        '🎯',
        2,
        true
    ),
    (
        'google-business',
        'Google Business',
        'Discussions specific to Google Business Profile reviews and optimization',
        '🔍',
        3,
        true
    ),
    (
        'feature-requests',
        'Feature Requests',
        'Suggest new features and improvements for PromptReviews',
        '💡',
        4,
        true
    ),
    (
        'promote',
        'Promote',
        'Share your business and success stories with the community (self-promotion welcome)',
        '📣',
        5,
        true
    );

-- Log seeding
DO $$
DECLARE
    v_channel_count INT;
BEGIN
    SELECT COUNT(*) INTO v_channel_count FROM channels;
    RAISE NOTICE 'Seeded % channels successfully', v_channel_count;
    RAISE NOTICE 'Channels: General, Strategy, Google Business, Feature Requests, Promote';
END $$;
