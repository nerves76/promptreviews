-- Fix emoji_sentiment_selected column type in businesses table
-- Drop the existing column if it exists with wrong type
ALTER TABLE businesses 
DROP COLUMN IF EXISTS emoji_sentiment_selected;

-- Add it back as JSON array
ALTER TABLE businesses 
ADD COLUMN emoji_sentiment_selected JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN businesses.emoji_sentiment_selected IS 'Default: Selected emoji sentiments as JSON array';