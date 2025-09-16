-- Add glassmorphic styling options to businesses and widgets tables
-- This enables backdrop blur effects and thin border options for modern glass UI

-- Add backdrop blur settings to businesses table (for prompt pages)
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS card_backdrop_blur INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_border_width DECIMAL(3,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_border_color TEXT DEFAULT 'rgba(255, 255, 255, 0.2)',
ADD COLUMN IF NOT EXISTS card_glassmorphism BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN businesses.card_backdrop_blur IS 'Backdrop blur intensity in pixels (0-20, 0 means no blur)';
COMMENT ON COLUMN businesses.card_border_width IS 'Border width in pixels (0-3, supports 0.5 for thin borders)';
COMMENT ON COLUMN businesses.card_border_color IS 'Border color in any CSS format (hex, rgb, rgba)';
COMMENT ON COLUMN businesses.card_glassmorphism IS 'Enable glassmorphic effect (combines blur, transparency, and border)';

-- Add check constraints
ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_card_backdrop_blur;

ALTER TABLE businesses 
ADD CONSTRAINT check_card_backdrop_blur 
CHECK (card_backdrop_blur >= 0 AND card_backdrop_blur <= 20);

ALTER TABLE businesses 
DROP CONSTRAINT IF EXISTS check_card_border_width;

ALTER TABLE businesses 
ADD CONSTRAINT check_card_border_width 
CHECK (card_border_width >= 0 AND card_border_width <= 3);

-- Add glassmorphic settings to widgets table (stored in theme JSONB)
-- We'll handle this in the application layer since theme is already JSONB
-- But let's add a comment to document the expected structure
COMMENT ON COLUMN widgets.theme IS 'Widget theme settings including glassmorphic properties: backdropBlur (0-20), borderWidth (0-3), borderColor (CSS color), glassmorphism (boolean)';