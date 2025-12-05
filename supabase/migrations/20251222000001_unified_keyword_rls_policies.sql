-- ============================================
-- UNIFIED KEYWORD SYSTEM - RLS POLICIES
--
-- Row Level Security policies for the unified keyword tables.
-- All tables are account-scoped through account_users relationship.
-- ============================================

-- ============================================
-- KEYWORD GROUPS - RLS
-- ============================================
ALTER TABLE keyword_groups ENABLE ROW LEVEL SECURITY;

-- Users can view their account's keyword groups
DROP POLICY IF EXISTS "Users can view their account's keyword groups" ON keyword_groups;
CREATE POLICY "Users can view their account's keyword groups"
  ON keyword_groups FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can insert keyword groups for their accounts
DROP POLICY IF EXISTS "Users can insert keyword groups" ON keyword_groups;
CREATE POLICY "Users can insert keyword groups"
  ON keyword_groups FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can update their account's keyword groups
DROP POLICY IF EXISTS "Users can update their account's keyword groups" ON keyword_groups;
CREATE POLICY "Users can update their account's keyword groups"
  ON keyword_groups FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can delete their account's keyword groups
DROP POLICY IF EXISTS "Users can delete their account's keyword groups" ON keyword_groups;
CREATE POLICY "Users can delete their account's keyword groups"
  ON keyword_groups FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for keyword groups
DROP POLICY IF EXISTS "Service role can manage all keyword groups" ON keyword_groups;
CREATE POLICY "Service role can manage all keyword groups"
  ON keyword_groups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- KEYWORDS - RLS
-- ============================================
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- Users can view their account's keywords
DROP POLICY IF EXISTS "Users can view their account's keywords" ON keywords;
CREATE POLICY "Users can view their account's keywords"
  ON keywords FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can insert keywords for their accounts
DROP POLICY IF EXISTS "Users can insert keywords" ON keywords;
CREATE POLICY "Users can insert keywords"
  ON keywords FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can update their account's keywords
DROP POLICY IF EXISTS "Users can update their account's keywords" ON keywords;
CREATE POLICY "Users can update their account's keywords"
  ON keywords FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can delete their account's keywords
DROP POLICY IF EXISTS "Users can delete their account's keywords" ON keywords;
CREATE POLICY "Users can delete their account's keywords"
  ON keywords FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for keywords
DROP POLICY IF EXISTS "Service role can manage all keywords" ON keywords;
CREATE POLICY "Service role can manage all keywords"
  ON keywords FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- KEYWORD_PROMPT_PAGE_USAGE - RLS
-- ============================================
ALTER TABLE keyword_prompt_page_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their account's keyword usage
DROP POLICY IF EXISTS "Users can view their account's keyword usage" ON keyword_prompt_page_usage;
CREATE POLICY "Users can view their account's keyword usage"
  ON keyword_prompt_page_usage FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can insert keyword usage for their accounts
DROP POLICY IF EXISTS "Users can insert keyword usage" ON keyword_prompt_page_usage;
CREATE POLICY "Users can insert keyword usage"
  ON keyword_prompt_page_usage FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can update their account's keyword usage
DROP POLICY IF EXISTS "Users can update their account's keyword usage" ON keyword_prompt_page_usage;
CREATE POLICY "Users can update their account's keyword usage"
  ON keyword_prompt_page_usage FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Users can delete their account's keyword usage
DROP POLICY IF EXISTS "Users can delete their account's keyword usage" ON keyword_prompt_page_usage;
CREATE POLICY "Users can delete their account's keyword usage"
  ON keyword_prompt_page_usage FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Service role bypass for keyword usage
DROP POLICY IF EXISTS "Service role can manage all keyword usage" ON keyword_prompt_page_usage;
CREATE POLICY "Service role can manage all keyword usage"
  ON keyword_prompt_page_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- KEYWORD_REVIEW_MATCHES_V2 - RLS
-- ============================================
ALTER TABLE keyword_review_matches_v2 ENABLE ROW LEVEL SECURITY;

-- Users can view their account's keyword matches
DROP POLICY IF EXISTS "Users can view their account's keyword matches v2" ON keyword_review_matches_v2;
CREATE POLICY "Users can view their account's keyword matches v2"
  ON keyword_review_matches_v2 FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Service role can manage all keyword matches (batch job needs this)
DROP POLICY IF EXISTS "Service role can manage all keyword matches v2" ON keyword_review_matches_v2;
CREATE POLICY "Service role can manage all keyword matches v2"
  ON keyword_review_matches_v2 FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users can insert their own matches (for real-time matching if needed)
DROP POLICY IF EXISTS "Users can insert keyword matches v2" ON keyword_review_matches_v2;
CREATE POLICY "Users can insert keyword matches v2"
  ON keyword_review_matches_v2 FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));
