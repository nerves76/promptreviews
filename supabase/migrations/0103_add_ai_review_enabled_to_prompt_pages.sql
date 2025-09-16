-- Add ai_review_enabled column to prompt_pages table
-- This column controls whether AI review generation is enabled for this prompt page

ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS ai_review_enabled boolean DEFAULT true;

-- Add comment to describe the column
COMMENT ON COLUMN prompt_pages.ai_review_enabled IS 'Whether AI review generation is enabled for this prompt page'; 