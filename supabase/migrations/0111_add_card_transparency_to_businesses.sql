-- Add card transparency setting to businesses table
-- This setting will control the transparency/opacity of prompt page cards

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS card_transparency DECIMAL(3,2) DEFAULT 1.00;

-- Add comment for documentation
COMMENT ON COLUMN businesses.card_transparency IS 'Transparency level of prompt page cards (0.50 to 1.00, where 1.00 is fully opaque)';

-- Add check constraint for transparency range (minimum 0.50 to ensure text readability)
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_card_transparency;

ALTER TABLE businesses 
ADD CONSTRAINT check_card_transparency 
CHECK (card_transparency >= 0.50 AND card_transparency <= 1.00); 