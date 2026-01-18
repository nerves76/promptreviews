-- Create domain_analysis_cache table for caching AI domain analysis results
-- This prevents redundant API calls for the same domain

CREATE TABLE IF NOT EXISTS domain_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  site_type TEXT NOT NULL,
  strategy TEXT NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by domain
CREATE INDEX IF NOT EXISTS idx_domain_analysis_cache_domain ON domain_analysis_cache(domain);

-- Comment on table
COMMENT ON TABLE domain_analysis_cache IS 'Caches AI-generated domain analysis for visibility opportunities feature';
