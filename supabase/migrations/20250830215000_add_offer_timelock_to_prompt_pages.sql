-- Add offer_timelock column to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS offer_timelock BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN prompt_pages.offer_timelock IS 'Enable 3-minute countdown timer for special offers on this prompt page';