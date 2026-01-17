-- ============================================
-- Add search_results and fan_out_queries columns to llm_visibility_checks
-- These capture the full "fan out" data from DataForSEO ChatGPT Scraper API
-- ============================================

-- search_results: All web search outputs the model retrieved (including unused)
ALTER TABLE llm_visibility_checks
ADD COLUMN IF NOT EXISTS search_results JSONB;

-- fan_out_queries: Related search queries the AI performed
ALTER TABLE llm_visibility_checks
ADD COLUMN IF NOT EXISTS fan_out_queries JSONB;

COMMENT ON COLUMN llm_visibility_checks.search_results IS 'All web search results the AI retrieved, including unused entries. Array of {url, domain, title, description}';
COMMENT ON COLUMN llm_visibility_checks.fan_out_queries IS 'Related search queries the AI performed to gather information. Array of query strings';
