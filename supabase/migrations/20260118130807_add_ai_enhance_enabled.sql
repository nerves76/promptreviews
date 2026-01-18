-- Add ai_enhance_enabled column to prompt_pages table
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS ai_enhance_enabled BOOLEAN DEFAULT true;

-- Add default_ai_enhance_enabled column to businesses table for defaults
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS default_ai_enhance_enabled BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN prompt_pages.ai_enhance_enabled IS 'Whether the Enhance with AI button is enabled on this prompt page';
COMMENT ON COLUMN businesses.default_ai_enhance_enabled IS 'Default value for ai_enhance_enabled on new prompt pages';
