-- Add 'initial_sync' status to rss_feed_items
-- This status means "we've seen this item but it existed before the feed was connected"
-- Users can manually schedule these items via Browse, but they won't auto-post

-- First drop the existing constraint
ALTER TABLE rss_feed_items DROP CONSTRAINT IF EXISTS rss_feed_items_status_check;

-- Add new constraint with initial_sync status
ALTER TABLE rss_feed_items 
  ADD CONSTRAINT rss_feed_items_status_check 
  CHECK (status IN ('pending', 'scheduled', 'skipped', 'failed', 'initial_sync'));

-- Update the comment
COMMENT ON COLUMN rss_feed_items.status IS 'pending=new, scheduled=post created, skipped=filtered out, failed=error, initial_sync=existed when feed was connected';

DO $$
BEGIN
  RAISE NOTICE '✅ Added initial_sync status to rss_feed_items';
END $$;
