-- SQL Queries to fix Google Business posts scheduled for 2025
-- Run these in your Supabase Dashboard (Production)

-- 1. First, check what posts are scheduled for 2025
SELECT
    id,
    user_id,
    post_kind,
    scheduled_date,
    timezone,
    status,
    created_at
FROM google_business_scheduled_posts
WHERE scheduled_date >= '2025-01-01'
ORDER BY scheduled_date;

-- 2. Check specifically for Sept 23, 2025 (the date shown in your screenshot)
SELECT
    id,
    post_kind,
    scheduled_date,
    status,
    created_at,
    selected_locations
FROM google_business_scheduled_posts
WHERE scheduled_date = '2025-09-23';

-- 3. FIX OPTION A: Change Sept 23, 2025 to Sept 23, 2024 (will process as past date)
UPDATE google_business_scheduled_posts
SET
    scheduled_date = '2024-09-23',
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';

-- 4. FIX OPTION B: Change to TODAY (will process at next cron run at 1 PM UTC)
UPDATE google_business_scheduled_posts
SET
    scheduled_date = CURRENT_DATE,
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';

-- 5. FIX OPTION C: Change ALL 2025 dates to 2024 (subtract 1 year)
UPDATE google_business_scheduled_posts
SET
    scheduled_date = scheduled_date - INTERVAL '1 year',
    updated_at = NOW()
WHERE
    scheduled_date >= '2025-01-01'
    AND scheduled_date < '2026-01-01'
    AND status = 'pending';

-- 6. After fixing, verify the changes:
SELECT
    id,
    post_kind,
    scheduled_date,
    status,
    updated_at
FROM google_business_scheduled_posts
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;

-- 7. Check if there are now posts ready to be processed:
SELECT
    COUNT(*) as posts_ready_for_processing
FROM google_business_scheduled_posts
WHERE scheduled_date <= CURRENT_DATE
    AND status = 'pending';