-- Add 'draft' status to google_business_scheduled_post_status enum
-- Draft posts have no scheduled_date and appear in the content queue

-- Add the new enum value
ALTER TYPE google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'draft';

-- Allow NULL scheduled_date for drafts
ALTER TABLE google_business_scheduled_posts
  ALTER COLUMN scheduled_date DROP NOT NULL;

-- Add queue_order column for ordering drafts in the queue
ALTER TABLE google_business_scheduled_posts
  ADD COLUMN IF NOT EXISTS queue_order INTEGER DEFAULT 0;

-- Add source tracking for drafts (rss, manual, etc.)
ALTER TABLE google_business_scheduled_posts
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

-- Add reference to RSS feed item if created from RSS
ALTER TABLE google_business_scheduled_posts
  ADD COLUMN IF NOT EXISTS rss_feed_item_id UUID REFERENCES rss_feed_items(id) ON DELETE SET NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Added draft status, queue_order, source_type, and rss_feed_item_id to google_business_scheduled_posts';
END $$;
