-- Add keywords field to prompt_pages table
-- This allows prompt pages to have both global keywords (from business profile)
-- and page-specific keywords

ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for keywords search performance
CREATE INDEX IF NOT EXISTS idx_prompt_pages_keywords ON prompt_pages USING GIN (keywords);

-- Add comment to document the field
COMMENT ON COLUMN prompt_pages.keywords IS 'Array of keywords for this prompt page. Can include both global keywords from business profile and page-specific keywords.';
