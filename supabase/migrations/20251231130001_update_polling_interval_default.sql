-- Update default polling interval from 60 minutes to weekly (10080 minutes)

ALTER TABLE rss_feed_sources
  ALTER COLUMN polling_interval_minutes SET DEFAULT 10080;

DO $$
BEGIN
  RAISE NOTICE '✅ Updated default polling interval to weekly (10080 minutes)';
END $$;
