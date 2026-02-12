-- Enable RLS on url_analysis_cache
-- This is a global cache (not account-scoped) so all authenticated users
-- can read and write. The API routes already verify authentication and
-- account access via getRequestAccountId().

ALTER TABLE url_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read cached analyses
CREATE POLICY "Authenticated users can read url analysis cache"
  ON url_analysis_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow any authenticated user to insert cached analyses
CREATE POLICY "Authenticated users can insert url analysis cache"
  ON url_analysis_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update cached analyses (for upsert)
CREATE POLICY "Authenticated users can update url analysis cache"
  ON url_analysis_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
