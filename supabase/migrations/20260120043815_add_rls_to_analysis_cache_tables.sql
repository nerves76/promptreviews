-- Add RLS policies to competitor_analysis_cache and domain_analysis_cache tables
-- These tables were created without RLS, leaving them unrestricted

-- ============================================
-- competitor_analysis_cache RLS
-- ============================================

-- Enable RLS
ALTER TABLE competitor_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own account's competitor analysis
CREATE POLICY "Users can view their account competitor analysis"
  ON competitor_analysis_cache
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert competitor analysis for their accounts
CREATE POLICY "Users can insert competitor analysis for their accounts"
  ON competitor_analysis_cache
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their account's competitor analysis
CREATE POLICY "Users can update their account competitor analysis"
  ON competitor_analysis_cache
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their account's competitor analysis
CREATE POLICY "Users can delete their account competitor analysis"
  ON competitor_analysis_cache
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- domain_analysis_cache RLS
-- ============================================
-- Note: This table is a global cache (no account_id) for domain analysis
-- that can be shared across accounts. We restrict to authenticated users only.

-- Enable RLS
ALTER TABLE domain_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view domain analysis cache
CREATE POLICY "Authenticated users can view domain analysis"
  ON domain_analysis_cache
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can insert domain analysis
CREATE POLICY "Authenticated users can insert domain analysis"
  ON domain_analysis_cache
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update domain analysis
CREATE POLICY "Authenticated users can update domain analysis"
  ON domain_analysis_cache
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- No delete policy - cache entries should persist
