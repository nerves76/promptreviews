-- Add prompt page default settings columns to businesses table
-- These columns store the default values that will be applied to new prompt pages

-- Emoji Sentiment Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS emoji_sentiment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emoji_sentiment_question TEXT DEFAULT 'How was your experience?',
ADD COLUMN IF NOT EXISTS emoji_feedback_message TEXT DEFAULT 'Please tell us more about your experience',
ADD COLUMN IF NOT EXISTS emoji_thank_you_message TEXT DEFAULT 'Thank you for your feedback!',
ADD COLUMN IF NOT EXISTS emoji_feedback_popup_header TEXT DEFAULT 'How can we improve?',
ADD COLUMN IF NOT EXISTS emoji_feedback_page_header TEXT DEFAULT 'Your feedback helps us grow';

-- Falling Stars Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS falling_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS falling_icon TEXT DEFAULT 'star',
ADD COLUMN IF NOT EXISTS falling_icon_color TEXT DEFAULT '#FFD700';

-- Friendly Note Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS show_friendly_note BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS friendly_note TEXT DEFAULT '';

-- Recent Reviews Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS recent_reviews_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recent_reviews_scope TEXT DEFAULT 'current_page';

-- AI Settings
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_button_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fix_grammar_enabled BOOLEAN DEFAULT false;

-- Special Offer Settings (default_offer_enabled was missing)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS default_offer_enabled BOOLEAN DEFAULT false;

-- Add comments to document these columns
COMMENT ON COLUMN businesses.emoji_sentiment_enabled IS 'Default: Whether emoji sentiment is enabled for new prompt pages';
COMMENT ON COLUMN businesses.emoji_sentiment_question IS 'Default: Question to ask users for emoji sentiment';
COMMENT ON COLUMN businesses.emoji_feedback_message IS 'Default: Message shown when collecting feedback';
COMMENT ON COLUMN businesses.emoji_thank_you_message IS 'Default: Thank you message after feedback';
COMMENT ON COLUMN businesses.emoji_feedback_popup_header IS 'Default: Header for feedback popup';
COMMENT ON COLUMN businesses.emoji_feedback_page_header IS 'Default: Header for feedback page';

COMMENT ON COLUMN businesses.falling_enabled IS 'Default: Whether falling stars animation is enabled for new prompt pages';
COMMENT ON COLUMN businesses.falling_icon IS 'Default: Icon to use for falling animation';
COMMENT ON COLUMN businesses.falling_icon_color IS 'Default: Color for falling icons';

COMMENT ON COLUMN businesses.show_friendly_note IS 'Default: Whether friendly note is enabled for new prompt pages';
COMMENT ON COLUMN businesses.friendly_note IS 'Default: Text for the friendly note';

COMMENT ON COLUMN businesses.recent_reviews_enabled IS 'Default: Whether recent reviews section is enabled for new prompt pages';
COMMENT ON COLUMN businesses.recent_reviews_scope IS 'Default: Scope for recent reviews (current_page or all_pages)';

COMMENT ON COLUMN businesses.ai_button_enabled IS 'Default: Whether AI generation button is enabled for new prompt pages';
COMMENT ON COLUMN businesses.fix_grammar_enabled IS 'Default: Whether grammar fixing is enabled for new prompt pages';

COMMENT ON COLUMN businesses.default_offer_enabled IS 'Default: Whether special offer is enabled for new prompt pages';