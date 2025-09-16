-- Add border transparency setting to businesses table
-- This allows separate control of border opacity independent of overall card transparency

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS card_border_transparency DECIMAL(3,2) DEFAULT 1.00;

-- Add comment for documentation
COMMENT ON COLUMN businesses.card_border_transparency IS 'Border opacity from 0 (transparent) to 1 (opaque)';

-- Add check constraint
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_card_border_transparency;

ALTER TABLE businesses 
ADD CONSTRAINT check_card_border_transparency 
CHECK (card_border_transparency >= 0 AND card_border_transparency <= 1);

-- Update existing border width constraint to allow up to 4px
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_card_border_width;

ALTER TABLE businesses 
ADD CONSTRAINT check_card_border_width 
CHECK (card_border_width >= 0 AND card_border_width <= 4);