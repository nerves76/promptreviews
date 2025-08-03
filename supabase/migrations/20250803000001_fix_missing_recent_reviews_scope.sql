-- Fix missing recent_reviews_scope column 
-- The original migration 20250803000000 was marked as applied but column doesn't exist
-- This is a safe repair migration

-- Add the missing column if it doesn't exist
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS recent_reviews_scope TEXT DEFAULT 'current_page';

-- Add the constraint only if the column was just created
DO $$
BEGIN
    -- Only add constraint if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'prompt_pages_recent_reviews_scope_check'
    ) THEN
        ALTER TABLE prompt_pages 
        ADD CONSTRAINT prompt_pages_recent_reviews_scope_check 
        CHECK (recent_reviews_scope IN ('current_page', 'all_pages'));
    END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN prompt_pages.recent_reviews_scope IS 'Scope for recent reviews: current_page (reviews from this prompt page only) or all_pages (reviews from all account prompt pages)';

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_prompt_pages_recent_reviews_scope 
ON prompt_pages(recent_reviews_scope);

-- Update existing rows to use the current behavior (current_page)
UPDATE prompt_pages 
SET recent_reviews_scope = 'current_page' 
WHERE recent_reviews_scope IS NULL;