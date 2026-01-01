-- Update minimum polling interval from 15 minutes to 2 hours (120 minutes)
-- This reduces server load and is more appropriate for RSS feed checking

-- Drop the old constraint
ALTER TABLE rss_feed_sources
  DROP CONSTRAINT IF EXISTS rss_feed_sources_polling_interval_minutes_check;

-- Add the new constraint with 120 minute minimum
ALTER TABLE rss_feed_sources
  ADD CONSTRAINT rss_feed_sources_polling_interval_minutes_check
  CHECK (polling_interval_minutes >= 120);

-- Update any existing feeds with intervals less than 120 to use 120
UPDATE rss_feed_sources
SET polling_interval_minutes = 120
WHERE polling_interval_minutes < 120;

DO $$
BEGIN
  RAISE NOTICE '✅ Updated polling interval minimum to 2 hours (120 minutes)';
END $$;
