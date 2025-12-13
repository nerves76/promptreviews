-- Add keyword metrics columns for SEO data from DataForSEO
-- These fields store search volume, difficulty, intent, and other SEO metrics

-- Search intent (informational, navigational, commercial, transactional)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_intent TEXT;

-- Keyword difficulty score (0-100)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS keyword_difficulty INTEGER;

-- Search volume (monthly average)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_volume INTEGER;

-- Cost per click
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cpc NUMERIC(10,2);

-- Competition level (LOW, MEDIUM, HIGH)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS competition_level TEXT;

-- PPC bid range
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS low_top_of_page_bid NUMERIC(10,2);
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS high_top_of_page_bid NUMERIC(10,2);

-- Categories (array of category strings)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Search volume trend (stores monthly, quarterly, yearly percent changes)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_volume_trend JSONB;

-- When metrics were last updated
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ;

-- Add check constraints
ALTER TABLE keywords ADD CONSTRAINT keywords_search_intent_check
  CHECK (search_intent IS NULL OR search_intent IN ('informational', 'navigational', 'commercial', 'transactional'));

ALTER TABLE keywords ADD CONSTRAINT keywords_competition_level_check
  CHECK (competition_level IS NULL OR competition_level IN ('LOW', 'MEDIUM', 'HIGH'));

ALTER TABLE keywords ADD CONSTRAINT keywords_keyword_difficulty_check
  CHECK (keyword_difficulty IS NULL OR (keyword_difficulty >= 0 AND keyword_difficulty <= 100));

-- Add index for filtering by intent and difficulty
CREATE INDEX IF NOT EXISTS idx_keywords_search_intent ON keywords(account_id, search_intent) WHERE search_intent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_keywords_difficulty ON keywords(account_id, keyword_difficulty) WHERE keyword_difficulty IS NOT NULL;

COMMENT ON COLUMN keywords.search_intent IS 'Primary search intent: informational, navigational, commercial, or transactional';
COMMENT ON COLUMN keywords.keyword_difficulty IS 'SEO difficulty score 0-100 (higher = harder to rank)';
COMMENT ON COLUMN keywords.search_volume IS 'Average monthly search volume';
COMMENT ON COLUMN keywords.cpc IS 'Average cost per click in USD';
COMMENT ON COLUMN keywords.competition_level IS 'PPC competition level: LOW, MEDIUM, or HIGH';
COMMENT ON COLUMN keywords.low_top_of_page_bid IS 'Minimum bid for top of page ad placement';
COMMENT ON COLUMN keywords.high_top_of_page_bid IS 'Maximum bid for top of page ad placement';
COMMENT ON COLUMN keywords.categories IS 'Topic/industry categories for the keyword';
COMMENT ON COLUMN keywords.search_volume_trend IS 'Search volume trends: {monthly: %, quarterly: %, yearly: %}';
COMMENT ON COLUMN keywords.metrics_updated_at IS 'When SEO metrics were last fetched from DataForSEO';
