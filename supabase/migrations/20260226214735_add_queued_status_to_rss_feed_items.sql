-- Add 'queued' status to rss_feed_items
-- This status represents items that have been added to the content queue (drafts)
-- but not yet scheduled with a date. Previously these were misleadingly marked as 'scheduled'.

-- Drop the existing CHECK constraint and recreate with the new value
ALTER TABLE rss_feed_items
  DROP CONSTRAINT IF EXISTS rss_feed_items_status_check;

ALTER TABLE rss_feed_items
  ADD CONSTRAINT rss_feed_items_status_check
  CHECK (status IN ('pending', 'scheduled', 'skipped', 'failed', 'initial_sync', 'queued'));

COMMENT ON COLUMN rss_feed_items.status IS 'pending=new, scheduled=post created with date, queued=added to draft queue, skipped=filtered out, failed=error, initial_sync=existed when feed was connected';

-- Update existing items that are linked to draft posts to use the new 'queued' status
UPDATE rss_feed_items fi
SET status = 'queued'
FROM google_business_scheduled_posts sp
WHERE fi.scheduled_post_id = sp.id
  AND sp.status = 'draft'
  AND fi.status = 'scheduled';
