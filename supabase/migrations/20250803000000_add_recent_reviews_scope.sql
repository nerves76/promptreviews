-- Add scope option for Recent Reviews feature
-- Allows users to choose between current prompt page only or all prompt pages

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS recent_reviews_scope TEXT DEFAULT 'current_page' 
CHECK (recent_reviews_scope IN ('current_page', 'all_pages'));

-- Add comment explaining the field
COMMENT ON COLUMN prompt_pages.recent_reviews_scope IS 'Scope for recent reviews: current_page (reviews from this prompt page only) or all_pages (reviews from all account prompt pages)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_prompt_pages_recent_reviews_scope 
ON prompt_pages(recent_reviews_scope);

-- Update existing rows to use the current behavior (current_page)
UPDATE prompt_pages 
SET recent_reviews_scope = 'current_page' 
WHERE recent_reviews_scope IS NULL;