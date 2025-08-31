-- Add missing columns to businesses table for prompt page settings

-- Add AI button enabled
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_button_enabled BOOLEAN DEFAULT false;

-- Add fix grammar enabled  
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS fix_grammar_enabled BOOLEAN DEFAULT false;

-- Add recent reviews scope
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS recent_reviews_scope TEXT DEFAULT 'current_page';

-- Add recent reviews count
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS recent_reviews_count INTEGER DEFAULT 5;

-- Add kickstarters background design
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS kickstarters_background_design BOOLEAN DEFAULT false;

-- Add emoji sentiment selected
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS emoji_sentiment_selected TEXT[] DEFAULT '{}';

-- Add falling stars theme
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS falling_stars_theme TEXT DEFAULT 'default';

-- Add personalized note fields
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS personalized_note_enabled BOOLEAN DEFAULT false;

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS personalized_note_text TEXT DEFAULT '';

-- Add comments
COMMENT ON COLUMN businesses.ai_button_enabled IS 'Default: Whether AI generation button is enabled for new prompt pages';
COMMENT ON COLUMN businesses.fix_grammar_enabled IS 'Default: Whether grammar fix button is enabled for new prompt pages';
COMMENT ON COLUMN businesses.recent_reviews_scope IS 'Default: Scope for recent reviews display (current_page or all_pages)';
COMMENT ON COLUMN businesses.recent_reviews_count IS 'Default: Number of recent reviews to display';
COMMENT ON COLUMN businesses.kickstarters_background_design IS 'Default: Whether kickstarters have background design';
COMMENT ON COLUMN businesses.emoji_sentiment_selected IS 'Default: Selected emoji sentiments';
COMMENT ON COLUMN businesses.falling_stars_theme IS 'Default: Theme for falling stars animation';
COMMENT ON COLUMN businesses.personalized_note_enabled IS 'Default: Whether personalized note is enabled';
COMMENT ON COLUMN businesses.personalized_note_text IS 'Default: Text for personalized note';