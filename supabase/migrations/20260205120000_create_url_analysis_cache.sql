-- Create url_analysis_cache table for caching URL-specific analysis results
-- This is global (not account-scoped) since a URL's page type is the same for everyone

CREATE TABLE IF NOT EXISTS url_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  site_type TEXT NOT NULL,
  strategy TEXT NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_url_analysis_cache_url ON url_analysis_cache(url);
