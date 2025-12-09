-- Migration: Add keyword concept columns
-- This extends the keywords table to support the KeywordConcept model:
-- - review_phrase: Customer-facing phrase for prompt pages (e.g., "best marketing consultant in Portland")
-- - search_query: Optimized for geo-grid/Google tracking (e.g., "portland marketing consultant")
-- - aliases: Variant phrases that map to this concept
-- - location_scope: Geographic scope (city, region, state, national)
-- - ai_generated: Whether AI enriched this keyword
-- - ai_suggestions: Store AI recommendations for review

-- Add new concept columns to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS review_phrase text;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS search_query text;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS aliases text[] DEFAULT '{}';
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS location_scope text;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS ai_suggestions jsonb;

-- Add check constraint for location_scope
ALTER TABLE keywords ADD CONSTRAINT keywords_location_scope_check
  CHECK (location_scope IS NULL OR location_scope = ANY (ARRAY['local', 'city', 'region', 'state', 'national']));

-- Add index for search_query lookups (used by geo-grid)
CREATE INDEX IF NOT EXISTS idx_keywords_search_query ON keywords(account_id, search_query) WHERE search_query IS NOT NULL;

-- Add index for aliases (GIN index for array containment queries)
CREATE INDEX IF NOT EXISTS idx_keywords_aliases ON keywords USING GIN(aliases) WHERE aliases != '{}';

-- Comment on columns for documentation
COMMENT ON COLUMN keywords.review_phrase IS 'Customer-facing phrase shown on prompt pages (e.g., "best marketing consultant in Portland")';
COMMENT ON COLUMN keywords.search_query IS 'Phrase used for geo-grid tracking and Google searches (e.g., "portland marketing consultant")';
COMMENT ON COLUMN keywords.aliases IS 'Array of variant phrases that should match to this keyword concept';
COMMENT ON COLUMN keywords.location_scope IS 'Geographic scope: local, city, region, state, or national';
COMMENT ON COLUMN keywords.ai_generated IS 'Whether the review_phrase and search_query were AI-generated';
COMMENT ON COLUMN keywords.ai_suggestions IS 'JSON object storing AI recommendations and alternatives';
