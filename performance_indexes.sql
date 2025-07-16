-- ⚡ PERFORMANCE OPTIMIZATION: Database Indexes
-- These indexes optimize the new combined prompt page API endpoint
-- Run these commands in your Supabase SQL editor

-- 1. Optimize prompt page lookups by slug (primary lookup)
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug_active 
ON prompt_pages(slug) 
WHERE slug IS NOT NULL;

-- 2. Optimize the join between prompt_pages and businesses
CREATE INDEX IF NOT EXISTS idx_businesses_account_id 
ON businesses(account_id);

-- 3. Composite index for prompt page status and account lookups
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_status 
ON prompt_pages(account_id, status) 
WHERE status IN ('in_queue', 'in_progress', 'complete');

-- 4. Optimize universal prompt page queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_universal 
ON prompt_pages(account_id, is_universal) 
WHERE is_universal = true;

-- 5. Speed up analytics queries on prompt pages
CREATE INDEX IF NOT EXISTS idx_prompt_pages_created_at 
ON prompt_pages(created_at DESC);

-- 6. Optimize business profile queries by name (for search)
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm 
ON businesses USING gin(name gin_trgm_ops);

-- 7. Partial index for active prompt pages only
CREATE INDEX IF NOT EXISTS idx_prompt_pages_active_only 
ON prompt_pages(slug, account_id, updated_at) 
WHERE status != 'draft' AND slug IS NOT NULL;

-- ⚡ PERFORMANCE: Query performance analysis
-- Run these to check if indexes are being used:

-- Check index usage for slug lookup:
-- EXPLAIN ANALYZE SELECT * FROM prompt_pages WHERE slug = 'your-slug-here';

-- Check join performance:
-- EXPLAIN ANALYZE 
-- SELECT p.*, b.* 
-- FROM prompt_pages p 
-- JOIN businesses b ON p.account_id = b.account_id 
-- WHERE p.slug = 'your-slug-here';

-- Monitor index effectiveness:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename IN ('prompt_pages', 'businesses')
-- ORDER BY idx_scan DESC; 