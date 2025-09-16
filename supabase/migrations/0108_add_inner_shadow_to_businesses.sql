-- Add inner shadow settings to businesses table
-- These settings will control the inner shadow/vignette effect on prompt page cards

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS card_inner_shadow BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS card_shadow_color TEXT DEFAULT '#222222',
ADD COLUMN IF NOT EXISTS card_shadow_intensity DECIMAL(3,2) DEFAULT 0.20;

-- Add comments for documentation
COMMENT ON COLUMN businesses.card_inner_shadow IS 'Whether to show inner shadow/vignette effect on cards';
COMMENT ON COLUMN businesses.card_shadow_color IS 'Color of the inner shadow effect (hex color)';
COMMENT ON COLUMN businesses.card_shadow_intensity IS 'Intensity of the inner shadow effect (0.00 to 1.00)';

-- Add check constraint for shadow intensity
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_shadow_intensity;

ALTER TABLE businesses 
ADD CONSTRAINT check_shadow_intensity 
CHECK (card_shadow_intensity >= 0.00 AND card_shadow_intensity <= 1.00); 