-- Fix capitalization of "How can we Improve?" to "How can we improve?" in existing records
-- This corrects the default value that was previously set with incorrect capitalization

UPDATE prompt_pages 
SET emoji_feedback_popup_header = 'How can we improve?' 
WHERE emoji_feedback_popup_header = 'How can we Improve?';

UPDATE business_locations 
SET emoji_feedback_popup_header = 'How can we improve?' 
WHERE emoji_feedback_popup_header = 'How can we Improve?';

-- Add comment to document the fix
COMMENT ON COLUMN prompt_pages.emoji_feedback_popup_header IS 'Header text shown in the choice modal for negative sentiment users - fixed capitalization';
COMMENT ON COLUMN business_locations.emoji_feedback_popup_header IS 'Header text shown in the choice modal for negative sentiment users - fixed capitalization'; 