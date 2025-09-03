-- Fix analytics_events constraint to allow emoji sentiment tracking
-- This migration adds emoji_sentiment and emoji_sentiment_choice to the allowed event types

-- Drop the existing constraint
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS valid_event_type;

-- Add the updated constraint with emoji_sentiment event types
ALTER TABLE analytics_events 
ADD CONSTRAINT valid_event_type 
CHECK (event_type IN (
  'view',                    -- Page view
  'copy_submit',             -- User copied/submitted a review
  'ai_generate',             -- AI generated a review
  'login',                   -- User login
  'prompt_page_created',     -- New prompt page created
  'contacts_uploaded',       -- Contacts uploaded
  'review_submitted',        -- Review submitted to platform
  'save_for_later',          -- User saved a review for later
  'unsave_for_later',        -- User removed a saved review
  'time_spent',              -- Time spent on page
  'feature_used',            -- General feature usage tracking
  'emoji_sentiment',         -- Emoji sentiment selected
  'emoji_sentiment_choice',  -- Alternative emoji sentiment event
  'constructive_feedback'    -- Constructive feedback provided
));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT valid_event_type ON analytics_events IS 'Validates that event_type is one of the predefined types, including emoji sentiment tracking';

-- Verify constraint was created successfully
DO $$
BEGIN
  -- Test that emoji_sentiment events can be inserted
  PERFORM 1 FROM pg_constraint 
  WHERE conname = 'valid_event_type' 
  AND conrelid = 'analytics_events'::regclass;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to create valid_event_type constraint';
  END IF;
END $$;