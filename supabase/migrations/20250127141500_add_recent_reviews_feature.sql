-- Add Recent Reviews feature fields
-- Migration: 20250127141500_add_recent_reviews_feature.sql

-- Add recent_reviews_enabled to prompt_pages table
ALTER TABLE public.prompt_pages 
ADD COLUMN IF NOT EXISTS recent_reviews_enabled BOOLEAN DEFAULT FALSE;

-- Add default_recent_reviews_enabled to businesses table  
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS default_recent_reviews_enabled BOOLEAN DEFAULT FALSE;

-- Add recent_reviews_enabled to business_locations table (for future location support)
ALTER TABLE public.business_locations 
ADD COLUMN IF NOT EXISTS recent_reviews_enabled BOOLEAN DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.prompt_pages.recent_reviews_enabled IS 'Whether to show Recent Reviews button on public prompt pages (requires 3+ reviews)';
COMMENT ON COLUMN public.businesses.default_recent_reviews_enabled IS 'Default setting for Recent Reviews feature on new prompt pages';
COMMENT ON COLUMN public.business_locations.recent_reviews_enabled IS 'Location-specific Recent Reviews setting (overrides business default when not null)';

-- Create index for performance on review filtering queries
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_filtering 
ON public.review_submissions(prompt_page_id, status, review_type, created_at DESC) 
WHERE status = 'submitted' AND review_type != 'feedback'; 