-- Reset the failed photo upload to retry it with the fix

-- Check the current status of the photo upload
SELECT
    id,
    post_kind,
    scheduled_date,
    status,
    error_log
FROM google_business_scheduled_posts
WHERE id = 'b7ce4120-d778-4b1e-9a68-64c1f3fd21e5';

-- Reset it to pending so the cron will retry it
UPDATE google_business_scheduled_posts
SET
    status = 'pending',
    error_log = NULL,
    updated_at = NOW()
WHERE
    id = 'b7ce4120-d778-4b1e-9a68-64c1f3fd21e5'
    AND status = 'failed';

-- Also reset the results table
UPDATE google_business_scheduled_post_results
SET
    status = 'pending',
    error_message = NULL,
    updated_at = NOW()
WHERE
    scheduled_post_id = 'b7ce4120-d778-4b1e-9a68-64c1f3fd21e5';

-- Verify the reset
SELECT
    'Post reset to pending - will be processed on next cron run' as message,
    id,
    post_kind,
    status
FROM google_business_scheduled_posts
WHERE id = 'b7ce4120-d778-4b1e-9a68-64c1f3fd21e5';