-- Check scheduled Google Business posts status
-- This script helps investigate why scheduled posts may not have gone out

-- 1. Check all scheduled posts from the last 7 days
SELECT
    id,
    user_id,
    post_kind,
    scheduled_date,
    timezone,
    status,
    error_log,
    created_at,
    updated_at,
    published_at,
    CASE
        WHEN selected_locations IS NOT NULL
        THEN jsonb_array_length(selected_locations::jsonb)
        ELSE 0
    END as location_count
FROM google_business_scheduled_posts
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY scheduled_date DESC, created_at DESC;

-- 2. Check specifically for posts that should have been processed but weren't
SELECT
    id,
    scheduled_date,
    timezone,
    status,
    error_log,
    created_at,
    updated_at,
    CASE
        WHEN status = 'pending' AND scheduled_date <= CURRENT_DATE THEN 'SHOULD HAVE BEEN PROCESSED'
        WHEN status = 'failed' THEN 'FAILED'
        WHEN status = 'completed' THEN 'SUCCESS'
        WHEN status = 'partial_success' THEN 'PARTIAL'
        ELSE status
    END as issue_status
FROM google_business_scheduled_posts
WHERE
    (status = 'pending' AND scheduled_date <= CURRENT_DATE)
    OR (status IN ('failed', 'partial_success') AND created_at > NOW() - INTERVAL '7 days')
ORDER BY scheduled_date DESC;

-- 3. Check the results table for location-specific failures
SELECT
    r.id,
    r.scheduled_post_id,
    r.location_id,
    r.status,
    r.error_message,
    r.published_at,
    p.scheduled_date,
    p.post_kind
FROM google_business_scheduled_post_results r
JOIN google_business_scheduled_posts p ON p.id = r.scheduled_post_id
WHERE r.created_at > NOW() - INTERVAL '7 days'
    AND r.status != 'success'
ORDER BY r.created_at DESC;

-- 4. Check if users have valid Google Business Profile tokens
SELECT
    p.user_id,
    p.scheduled_date,
    p.status as post_status,
    gbp.access_token IS NOT NULL as has_token,
    gbp.expires_at,
    CASE
        WHEN gbp.expires_at IS NULL THEN 'NO_EXPIRY_SET'
        WHEN gbp.expires_at < NOW() THEN 'TOKEN_EXPIRED'
        ELSE 'TOKEN_VALID'
    END as token_status,
    gbp.selected_account_id IS NOT NULL as has_account
FROM google_business_scheduled_posts p
LEFT JOIN google_business_profiles gbp ON gbp.user_id = p.user_id
WHERE p.created_at > NOW() - INTERVAL '7 days'
    AND p.status IN ('pending', 'failed')
ORDER BY p.scheduled_date DESC;

-- 5. Summary of post statuses over last 30 days
SELECT
    status,
    COUNT(*) as count,
    MIN(scheduled_date) as earliest_scheduled,
    MAX(scheduled_date) as latest_scheduled
FROM google_business_scheduled_posts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY count DESC;

-- 6. Check for posts stuck in 'processing' status (might indicate cron job crashed)
SELECT
    id,
    scheduled_date,
    status,
    updated_at,
    NOW() - updated_at as time_stuck
FROM google_business_scheduled_posts
WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '1 hour'
ORDER BY updated_at;