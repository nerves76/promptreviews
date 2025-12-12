-- Update the default motivational nudge text to include business name variable
ALTER TABLE prompt_pages 
ALTER COLUMN motivational_nudge_text 
SET DEFAULT '{business_name} needs your STAR POWER so more people find them online!';

-- Update existing pages that still have the old default text
UPDATE prompt_pages 
SET motivational_nudge_text = '{business_name} needs your STAR POWER so more people find them online!' 
WHERE motivational_nudge_text = 'Your review helps us get found online and hold our own against bigger brands';
