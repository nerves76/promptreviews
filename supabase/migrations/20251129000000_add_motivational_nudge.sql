-- Add motivational nudge feature to prompt_pages
-- This optional module displays a motivational sentence below the review input

ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS motivational_nudge_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS motivational_nudge_text TEXT DEFAULT 'Your review helps us get found online and hold our own against bigger brands';

COMMENT ON COLUMN prompt_pages.motivational_nudge_enabled IS 'Whether the motivational nudge is displayed on the prompt page';
COMMENT ON COLUMN prompt_pages.motivational_nudge_text IS 'The motivational text shown to encourage users to submit reviews';
