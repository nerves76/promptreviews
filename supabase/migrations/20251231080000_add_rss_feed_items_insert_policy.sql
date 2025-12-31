-- Add INSERT policy for rss_feed_items
-- Users should be able to insert items for feeds they have access to

CREATE POLICY "Users can insert items for own feeds"
  ON rss_feed_items FOR INSERT
  WITH CHECK (feed_source_id IN (
    SELECT id FROM rss_feed_sources WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

DO $$
BEGIN
  RAISE NOTICE '✅ Added INSERT policy for rss_feed_items';
END $$;
