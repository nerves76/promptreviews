-- Create competitor_analysis_cache table for caching AI competitor analysis results
-- This prevents redundant API calls for the same competitor per account

CREATE TABLE IF NOT EXISTS competitor_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  domain TEXT,
  who_they_are TEXT NOT NULL,
  why_mentioned TEXT NOT NULL,
  how_to_differentiate TEXT NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, competitor_name)
);

-- Index for fast lookups by account and competitor
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_cache_account ON competitor_analysis_cache(account_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_cache_lookup ON competitor_analysis_cache(account_id, competitor_name);

-- Comment on table
COMMENT ON TABLE competitor_analysis_cache IS 'Caches AI-generated competitor analysis for the competitors feature';
