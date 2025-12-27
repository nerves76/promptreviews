-- ============================================
-- Add search_query to gg_checks for per-search-term tracking
--
-- Previously geo grid only tracked the concept's phrase.
-- Now it tracks each search term individually, allowing
-- different rankings per search term to be captured.
-- ============================================

-- Add search_query column to store the actual search term used
ALTER TABLE gg_checks ADD COLUMN IF NOT EXISTS search_query TEXT;

-- Backfill existing records with the keyword's phrase
UPDATE gg_checks gc
SET search_query = k.phrase
FROM keywords k
WHERE gc.keyword_id = k.id
  AND gc.search_query IS NULL;

-- Add index for efficient lookups by keyword + search_query
CREATE INDEX IF NOT EXISTS idx_gg_checks_keyword_search_query
ON gg_checks(keyword_id, search_query, checked_at DESC);

-- Comment for documentation
COMMENT ON COLUMN gg_checks.search_query IS 'The actual search term used for this check. A keyword concept can have multiple search terms, each tracked separately.';
