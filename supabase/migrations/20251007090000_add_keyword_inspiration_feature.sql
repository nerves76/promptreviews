-- Add keyword inspiration feature fields to prompt_pages
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS keyword_inspiration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_keyword_inspirations TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add default keyword inspiration fields to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS default_keyword_inspiration_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_selected_keyword_inspirations TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_pages_keyword_inspiration_enabled
ON prompt_pages(keyword_inspiration_enabled)
WHERE keyword_inspiration_enabled = true;

CREATE INDEX IF NOT EXISTS idx_businesses_default_keyword_inspiration_enabled
ON businesses(default_keyword_inspiration_enabled)
WHERE default_keyword_inspiration_enabled = true;

-- Add comments for documentation
COMMENT ON COLUMN prompt_pages.keyword_inspiration_enabled IS 'Whether the keyword inspiration feature is enabled for this prompt page';
COMMENT ON COLUMN prompt_pages.selected_keyword_inspirations IS 'Selected keywords to display (max 10) from the page keywords';
COMMENT ON COLUMN businesses.default_keyword_inspiration_enabled IS 'Default value for keyword inspiration enabled on new prompt pages';
COMMENT ON COLUMN businesses.default_selected_keyword_inspirations IS 'Default selected keywords for new prompt pages';
