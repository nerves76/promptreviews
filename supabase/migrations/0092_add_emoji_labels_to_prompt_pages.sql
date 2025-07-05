-- Add missing emoji_labels field to prompt_pages table
-- This field is needed for emoji sentiment functionality

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS emoji_labels text[] DEFAULT ARRAY['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated']; 