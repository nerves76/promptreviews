-- Add card_placeholder_color column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS card_placeholder_color TEXT DEFAULT '#9CA3AF';

-- Update existing records with a default value
UPDATE businesses 
SET card_placeholder_color = '#9CA3AF'
WHERE card_placeholder_color IS NULL;