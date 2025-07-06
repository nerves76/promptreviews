-- Add emoji feedback header fields to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS emoji_feedback_popup_header text DEFAULT 'How can we Improve?';

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS emoji_feedback_page_header text DEFAULT 'Your feedback helps us grow';

-- Add emoji feedback header fields to business_locations table  
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_feedback_popup_header text DEFAULT 'How can we Improve?';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_feedback_page_header text DEFAULT 'Your feedback helps us grow';

-- Update default values for existing fields to match user requirements
UPDATE prompt_pages 
SET emoji_sentiment_question = 'How was Your Experience?' 
WHERE emoji_sentiment_question IS NULL OR emoji_sentiment_question = '';

UPDATE prompt_pages 
SET emoji_thank_you_message = 'Thank you for your feedback. It''s important to us.' 
WHERE emoji_thank_you_message IS NULL OR emoji_thank_you_message = '';

UPDATE business_locations 
SET emoji_sentiment_question = 'How was Your Experience?' 
WHERE emoji_sentiment_question IS NULL OR emoji_sentiment_question = '';

UPDATE business_locations 
SET emoji_thank_you_message = 'Thank you for your feedback. It''s important to us.' 
WHERE emoji_thank_you_message IS NULL OR emoji_thank_you_message = '';

-- Add comments to describe the new columns
COMMENT ON COLUMN prompt_pages.emoji_feedback_popup_header IS 'Header text shown in the choice modal for negative sentiment users';
COMMENT ON COLUMN prompt_pages.emoji_feedback_page_header IS 'Header text shown on the feedback form page';
COMMENT ON COLUMN business_locations.emoji_feedback_popup_header IS 'Header text shown in the choice modal for negative sentiment users';
COMMENT ON COLUMN business_locations.emoji_feedback_page_header IS 'Header text shown on the feedback form page'; 