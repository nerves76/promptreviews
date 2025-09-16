-- Add emoji sentiment and other module fields to business_locations table
-- This allows locations to have their own emoji sentiment settings

-- Emoji sentiment fields
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_sentiment_enabled boolean DEFAULT false;

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_sentiment_question text DEFAULT 'How was your experience?';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_feedback_message text DEFAULT 'How can we improve?';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_thank_you_message text DEFAULT 'Thank you for your feedback. It''s important to us.';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS emoji_labels text[] DEFAULT ARRAY['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'];

-- Other module fields
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS falling_enabled boolean DEFAULT false;

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS falling_icon text DEFAULT 'star';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS offer_enabled boolean DEFAULT false;

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS offer_title text DEFAULT '';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS offer_body text DEFAULT '';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS offer_url text DEFAULT '';

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS ai_review_enabled boolean DEFAULT true; 