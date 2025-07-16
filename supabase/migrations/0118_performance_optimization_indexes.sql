-- Migration: Add performance optimization indexes
-- Created: 2025-01-15
-- Purpose: Optimize the combined prompt page API endpoint performance

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Optimize prompt page lookups by slug (most critical)
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

-- Add comment for tracking
COMMENT ON INDEX idx_prompt_pages_slug_active IS 'Performance optimization for prompt page API endpoint - slug lookups';
COMMENT ON INDEX idx_businesses_account_id IS 'Performance optimization for prompt page API endpoint - business joins';
COMMENT ON INDEX idx_prompt_pages_account_status IS 'Performance optimization for dashboard prompt page queries';
COMMENT ON INDEX idx_prompt_pages_universal IS 'Performance optimization for universal prompt page queries';
COMMENT ON INDEX idx_prompt_pages_created_at IS 'Performance optimization for analytics and sorting';
COMMENT ON INDEX idx_businesses_name_trgm IS 'Performance optimization for business name search';
COMMENT ON INDEX idx_prompt_pages_active_only IS 'Performance optimization for active prompt pages only'; 