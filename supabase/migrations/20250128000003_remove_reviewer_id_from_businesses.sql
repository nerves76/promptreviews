-- Remove the problematic reviewer_id column from businesses table
-- This column should not exist as business owners are not reviewers

-- First drop any constraints that might reference reviewer_id
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_reviewer_id_fkey;

-- Drop any indexes on reviewer_id
DROP INDEX IF EXISTS idx_businesses_reviewer_id;

-- Now drop the reviewer_id column
ALTER TABLE public.businesses DROP COLUMN IF EXISTS reviewer_id;

-- Add comment to document the change
COMMENT ON TABLE public.businesses IS 'Business profiles owned by accounts. The reviewer_id column was removed as business owners are not reviewers.'; 