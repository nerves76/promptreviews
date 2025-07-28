-- Migration: Add performance indexes for faster queries
-- Date: 2025-01-31
-- Purpose: Add missing indexes to improve database query performance

-- Add composite index for prompt page + business joins
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_slug 
ON prompt_pages(account_id, slug) 
WHERE slug IS NOT NULL;

-- Add index for widget_reviews queries
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_verified 
ON widget_reviews(widget_id, verified);

-- Add covering index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_dashboard 
ON prompt_pages(account_id, is_universal, status, created_at DESC)
INCLUDE (slug, type, review_type);

-- Add index for business location queries
CREATE INDEX IF NOT EXISTS idx_business_locations_account 
ON business_locations(account_id, id);

-- Add index for contacts queries
CREATE INDEX IF NOT EXISTS idx_contacts_account_created 
ON contacts(account_id, created_at DESC);

-- Add index for account_users queries
CREATE INDEX IF NOT EXISTS idx_account_users_user_account 
ON account_users(user_id, account_id);

-- Add index for businesses queries
CREATE INDEX IF NOT EXISTS idx_businesses_account_name 
ON businesses(account_id, name);

-- Add index for prompt page type queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_type_status 
ON prompt_pages(type, status, created_at DESC);

-- Note: campaign_type index removed as column doesn't exist yet
-- This index should be added in a separate migration after the column is created

-- Add index for slug lookups
CREATE INDEX IF NOT EXISTS idx_prompt_pages_slug_lookup 
ON prompt_pages(slug) 
WHERE slug IS NOT NULL;

-- Add index for account-based queries with status
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_status 
ON prompt_pages(account_id, status, created_at DESC);

-- Add index for business profile queries
CREATE INDEX IF NOT EXISTS idx_businesses_profile 
ON businesses(account_id, name, logo_url, business_website);

-- Add index for widget queries
CREATE INDEX IF NOT EXISTS idx_widgets_account_type 
ON widgets(account_id, type, created_at DESC); 