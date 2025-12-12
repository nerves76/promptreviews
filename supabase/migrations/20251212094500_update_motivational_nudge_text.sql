-- Update motivational nudge default text to remove "can" from "can find"
-- New text: "{business_name} needs your STAR POWER so more people find them online!"

ALTER TABLE prompt_pages
ALTER COLUMN motivational_nudge_text SET DEFAULT '{business_name} needs your STAR POWER so more people find them online!';
