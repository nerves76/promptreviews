-- Add remaining prompt page default settings columns to businesses table

-- Kickstarters Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS kickstarters_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS selected_kickstarters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS kickstarters_background_design BOOLEAN DEFAULT false;

-- Review Platforms Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS review_platforms JSONB DEFAULT '[]'::jsonb;

-- Keywords Settings (Global)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS keywords TEXT DEFAULT '';

-- AI Dos and Don'ts Settings (Global)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_dos TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS ai_donts TEXT DEFAULT '';

-- Add comments to document these columns
COMMENT ON COLUMN businesses.kickstarters_enabled IS 'Default: Whether kickstarters are enabled for new prompt pages';
COMMENT ON COLUMN businesses.selected_kickstarters IS 'Default: Selected kickstarter questions as JSON array';
COMMENT ON COLUMN businesses.kickstarters_background_design IS 'Default: Whether kickstarters use background design';

COMMENT ON COLUMN businesses.review_platforms IS 'Default: Selected review platforms as JSON array';

COMMENT ON COLUMN businesses.keywords IS 'Global: Keywords for AI generation across all prompt pages';
COMMENT ON COLUMN businesses.ai_dos IS 'Global: AI dos instructions across all prompt pages';
COMMENT ON COLUMN businesses.ai_donts IS 'Global: AI donts instructions across all prompt pages';