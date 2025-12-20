-- ============================================
-- UNIFIED KEYWORD SYSTEM - TABLE CREATION
--
-- This migration creates the foundation for the unified keyword system:
-- - keyword_groups: For organizing keywords
-- - keywords: Central keyword storage
-- - keyword_prompt_page_usage: Junction table for keyword<->page relationships
-- - keyword_review_matches_v2: Tracks which reviews contain which keywords
-- ============================================

-- ============================================
-- KEYWORD GROUPS
-- For organizing keywords (seasonal, service types, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(account_id, name)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_keyword_groups_account ON keyword_groups(account_id);

COMMENT ON TABLE keyword_groups IS 'Groups for organizing keywords (e.g., General, Seasonal, Services)';
COMMENT ON COLUMN keyword_groups.name IS 'Display name of the group';
COMMENT ON COLUMN keyword_groups.display_order IS 'Order for UI display (lower = first)';

-- ============================================
-- KEYWORDS
-- Central keyword storage, account-level
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES keyword_groups(id) ON DELETE SET NULL,

  -- The keyword itself
  phrase TEXT NOT NULL,
  normalized_phrase TEXT NOT NULL,  -- lowercase, trimmed for matching
  word_count INTEGER NOT NULL,      -- for color threshold logic (calculated on insert)

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),

  -- Usage tracking (denormalized for fast reads, updated by batch job)
  review_usage_count INTEGER DEFAULT 0,
  last_used_in_review_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(account_id, normalized_phrase)
);

CREATE INDEX IF NOT EXISTS idx_keywords_account ON keywords(account_id);
CREATE INDEX IF NOT EXISTS idx_keywords_group ON keywords(group_id);
CREATE INDEX IF NOT EXISTS idx_keywords_usage ON keywords(account_id, review_usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_normalized ON keywords(account_id, normalized_phrase);

COMMENT ON TABLE keywords IS 'Central storage for all keywords, account-level';
COMMENT ON COLUMN keywords.phrase IS 'Original keyword phrase as entered by user';
COMMENT ON COLUMN keywords.normalized_phrase IS 'Lowercase, trimmed version for matching';
COMMENT ON COLUMN keywords.word_count IS 'Number of words (for color threshold logic)';
COMMENT ON COLUMN keywords.status IS 'active or paused';
COMMENT ON COLUMN keywords.review_usage_count IS 'Denormalized count of reviews containing this keyword';

-- ============================================
-- KEYWORD <-> PROMPT PAGE JUNCTION
-- Which keywords are assigned to which prompt pages
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_prompt_page_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  prompt_page_id UUID NOT NULL REFERENCES prompt_pages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- For auto-rotation: active pool vs reserve
  is_in_active_pool BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(keyword_id, prompt_page_id)
);

CREATE INDEX IF NOT EXISTS idx_kppu_keyword ON keyword_prompt_page_usage(keyword_id);
CREATE INDEX IF NOT EXISTS idx_kppu_page ON keyword_prompt_page_usage(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_kppu_account ON keyword_prompt_page_usage(account_id);

COMMENT ON TABLE keyword_prompt_page_usage IS 'Junction table linking keywords to prompt pages';
COMMENT ON COLUMN keyword_prompt_page_usage.is_in_active_pool IS 'Whether keyword is shown to customers (true) or in reserve (false)';
COMMENT ON COLUMN keyword_prompt_page_usage.display_order IS 'Order for UI display';

-- ============================================
-- KEYWORD <-> REVIEW MATCHES (V2)
-- Which reviews contain which keywords
-- Replaces old review_keyword_matches table
-- ============================================
CREATE TABLE IF NOT EXISTS keyword_review_matches_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- One of these will be set depending on review source
  review_submission_id UUID REFERENCES review_submissions(id) ON DELETE CASCADE,
  google_review_id TEXT,  -- For GBP reviews (external ID)

  matched_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate matches (partial unique indexes for nullable columns)
  CONSTRAINT unique_keyword_review_submission UNIQUE (keyword_id, review_submission_id),
  CONSTRAINT unique_keyword_google_review UNIQUE (keyword_id, google_review_id)
);

CREATE INDEX IF NOT EXISTS idx_krm_v2_keyword ON keyword_review_matches_v2(keyword_id);
CREATE INDEX IF NOT EXISTS idx_krm_v2_review ON keyword_review_matches_v2(review_submission_id);
CREATE INDEX IF NOT EXISTS idx_krm_v2_account ON keyword_review_matches_v2(account_id);
CREATE INDEX IF NOT EXISTS idx_krm_v2_google ON keyword_review_matches_v2(google_review_id) WHERE google_review_id IS NOT NULL;

COMMENT ON TABLE keyword_review_matches_v2 IS 'Tracks which reviews contain which keywords';
COMMENT ON COLUMN keyword_review_matches_v2.review_submission_id IS 'For reviews submitted through PromptReviews';
COMMENT ON COLUMN keyword_review_matches_v2.google_review_id IS 'For reviews from Google Business Profile';

-- ============================================
-- TRIGGER: Auto-update updated_at on keywords
-- ============================================
CREATE OR REPLACE FUNCTION update_keywords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_keywords_updated_at ON keywords;
CREATE TRIGGER trigger_keywords_updated_at
  BEFORE UPDATE ON keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_keywords_updated_at();

-- ============================================
-- TRIGGER: Auto-update updated_at on keyword_groups
-- ============================================
CREATE OR REPLACE FUNCTION update_keyword_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_keyword_groups_updated_at ON keyword_groups;
CREATE TRIGGER trigger_keyword_groups_updated_at
  BEFORE UPDATE ON keyword_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_keyword_groups_updated_at();
