-- Migration: Add Independent Grouping for AI Search Queries and Rank Tracking Terms
-- Creates separate group tables for organizing keyword_questions and rank_tracking_terms

-- ============================================================================
-- 1. Create AI Search Query Groups table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_search_query_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Indexes for AI Search Query Groups
CREATE INDEX IF NOT EXISTS idx_ai_search_query_groups_account_id
  ON ai_search_query_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_query_groups_display_order
  ON ai_search_query_groups(account_id, display_order);

-- RLS for AI Search Query Groups
ALTER TABLE ai_search_query_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's ai search query groups"
  ON ai_search_query_groups FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ai search query groups for their accounts"
  ON ai_search_query_groups FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account's ai search query groups"
  ON ai_search_query_groups FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account's ai search query groups"
  ON ai_search_query_groups FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Create Rank Tracking Term Groups table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rank_tracking_term_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, name)
);

-- Indexes for Rank Tracking Term Groups
CREATE INDEX IF NOT EXISTS idx_rank_tracking_term_groups_account_id
  ON rank_tracking_term_groups(account_id);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_term_groups_display_order
  ON rank_tracking_term_groups(account_id, display_order);

-- RLS for Rank Tracking Term Groups
ALTER TABLE rank_tracking_term_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's rank tracking term groups"
  ON rank_tracking_term_groups FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rank tracking term groups for their accounts"
  ON rank_tracking_term_groups FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account's rank tracking term groups"
  ON rank_tracking_term_groups FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account's rank tracking term groups"
  ON rank_tracking_term_groups FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Create Rank Tracking Terms table (normalized from JSONB search_terms)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rank_tracking_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES rank_tracking_term_groups(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  is_canonical BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(keyword_id, term)
);

-- Indexes for Rank Tracking Terms
CREATE INDEX IF NOT EXISTS idx_rank_tracking_terms_account_id
  ON rank_tracking_terms(account_id);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_terms_keyword_id
  ON rank_tracking_terms(keyword_id);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_terms_group_id
  ON rank_tracking_terms(group_id);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_terms_term
  ON rank_tracking_terms(account_id, term);

-- RLS for Rank Tracking Terms
ALTER TABLE rank_tracking_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's rank tracking terms"
  ON rank_tracking_terms FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rank tracking terms for their accounts"
  ON rank_tracking_terms FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account's rank tracking terms"
  ON rank_tracking_terms FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their account's rank tracking terms"
  ON rank_tracking_terms FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Add group_id column to keyword_questions table
-- ============================================================================
ALTER TABLE keyword_questions
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES ai_search_query_groups(id) ON DELETE SET NULL;

-- Index for keyword_questions group_id
CREATE INDEX IF NOT EXISTS idx_keyword_questions_group_id
  ON keyword_questions(group_id);

-- ============================================================================
-- 5. Migrate existing JSONB search_terms to rank_tracking_terms table
-- ============================================================================
DO $$
DECLARE
  keyword_rec RECORD;
  term_obj JSONB;
BEGIN
  -- Loop through all keywords that have search_terms
  FOR keyword_rec IN
    SELECT id, account_id, search_terms
    FROM keywords
    WHERE search_terms IS NOT NULL
      AND jsonb_array_length(search_terms) > 0
  LOOP
    -- Loop through each term in the search_terms array
    FOR term_obj IN SELECT * FROM jsonb_array_elements(keyword_rec.search_terms)
    LOOP
      -- Insert into rank_tracking_terms, skip if duplicate
      INSERT INTO rank_tracking_terms (
        keyword_id,
        account_id,
        term,
        is_canonical,
        added_at,
        created_at
      )
      VALUES (
        keyword_rec.id,
        keyword_rec.account_id,
        term_obj->>'term',
        COALESCE((term_obj->>'isCanonical')::boolean, false),
        COALESCE((term_obj->>'addedAt')::timestamptz, now()),
        now()
      )
      ON CONFLICT (keyword_id, term) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 6. Updated_at trigger function (reuse if exists, create if not)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to new group tables
DROP TRIGGER IF EXISTS update_ai_search_query_groups_updated_at ON ai_search_query_groups;
CREATE TRIGGER update_ai_search_query_groups_updated_at
  BEFORE UPDATE ON ai_search_query_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rank_tracking_term_groups_updated_at ON rank_tracking_term_groups;
CREATE TRIGGER update_rank_tracking_term_groups_updated_at
  BEFORE UPDATE ON rank_tracking_term_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Summary of changes:
-- 1. Created ai_search_query_groups table for organizing keyword_questions
-- 2. Created rank_tracking_term_groups table for organizing rank_tracking_terms
-- 3. Created rank_tracking_terms table (normalized from JSONB search_terms)
-- 4. Added group_id column to keyword_questions table
-- 5. Migrated existing search_terms JSONB data to rank_tracking_terms
-- 6. Added RLS policies matching existing patterns
-- 7. Added indexes for efficient queries
-- 8. Added updated_at triggers
-- ============================================================================
