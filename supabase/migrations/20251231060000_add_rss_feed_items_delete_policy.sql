-- Add DELETE policy for rss_feed_items
-- Users should be able to delete items from feeds they have access to

CREATE POLICY "Users can delete items from own feeds"
  ON rss_feed_items FOR DELETE
  USING (feed_source_id IN (
    SELECT id FROM rss_feed_sources WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

-- Also add UPDATE policy in case we need it later
CREATE POLICY "Users can update items from own feeds"
  ON rss_feed_items FOR UPDATE
  USING (feed_source_id IN (
    SELECT id FROM rss_feed_sources WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

DO $$
BEGIN
  RAISE NOTICE '✅ Added DELETE and UPDATE policies for rss_feed_items';
END $$;
