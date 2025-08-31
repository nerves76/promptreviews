-- Add timelock field for special offers
-- This adds a 3-minute timer to the offer banner to give users time to write a review

-- Add to businesses table (default settings)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS default_offer_timelock BOOLEAN DEFAULT false;

-- Add to prompt_pages table (per-page settings)
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS offer_timelock BOOLEAN DEFAULT false;

-- Add to business_locations table (per-location settings)
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS offer_timelock BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN businesses.default_offer_timelock IS 'Default: Whether to add a 3-minute timer to offer banners for new prompt pages';
COMMENT ON COLUMN prompt_pages.offer_timelock IS 'Whether to add a 3-minute timer to the offer banner';
COMMENT ON COLUMN business_locations.offer_timelock IS 'Whether to add a 3-minute timer to the offer banner for this location';