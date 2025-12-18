-- Migration: Add search_terms array to keywords table
-- Part of Keyword Concepts Phase 1: Multiple search terms per concept
--
-- This adds a jsonb array column for storing multiple search terms that can be
-- tracked in SERPs for a single keyword concept. One term is marked as canonical
-- (the primary term shown when space is limited).
--
-- Structure of each entry:
-- {
--   "term": "portland plumber",
--   "is_canonical": true,
--   "added_at": "2025-01-18T..."
-- }

-- Add the new search_terms column
ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS search_terms jsonb DEFAULT '[]'::jsonb;

-- Migrate existing search_query data to the new array format
-- Only migrate non-null, non-empty search_query values
UPDATE keywords
SET search_terms = jsonb_build_array(
  jsonb_build_object(
    'term', search_query,
    'is_canonical', true,
    'added_at', COALESCE(updated_at, created_at, now())
  )
)
WHERE search_query IS NOT NULL
  AND search_query != ''
  AND (search_terms IS NULL OR search_terms = '[]'::jsonb);

-- Add GIN index for efficient querying within the jsonb array
-- This allows fast searches like: WHERE search_terms @> '[{"term": "some term"}]'
CREATE INDEX IF NOT EXISTS idx_keywords_search_terms
ON keywords USING GIN (search_terms jsonb_path_ops);

-- Add comments for documentation
COMMENT ON COLUMN keywords.search_terms IS
  'Array of search terms for SERP tracking. Each entry: {term: string, is_canonical: boolean, added_at: timestamp}. One term should have is_canonical=true.';

-- Note: We keep search_query column for now for backward compatibility
-- It can be deprecated once all code uses search_terms
