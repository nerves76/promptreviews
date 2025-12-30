-- RSS Feed helper functions

-- Function to increment posts_today counter atomically
CREATE OR REPLACE FUNCTION increment_rss_posts_today(
  feed_id UUID,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE rss_feed_sources
  SET
    posts_today = posts_today + increment_by,
    updated_at = NOW()
  WHERE id = feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_rss_posts_today TO authenticated;
GRANT EXECUTE ON FUNCTION increment_rss_posts_today TO service_role;
