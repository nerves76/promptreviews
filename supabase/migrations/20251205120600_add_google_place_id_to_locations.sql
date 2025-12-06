-- Add Google Place ID column to google_business_locations
-- This stores the actual Google Place ID (ChIJ...) used for rank tracking
-- as opposed to the GBP location ID (locations/123...)

ALTER TABLE google_business_locations 
ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Add latitude/longitude columns for the business location
ALTER TABLE google_business_locations 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Add index for quick Place ID lookups
CREATE INDEX IF NOT EXISTS idx_google_business_locations_place_id 
ON google_business_locations(google_place_id) WHERE google_place_id IS NOT NULL;

COMMENT ON COLUMN google_business_locations.google_place_id IS 'Google Maps Place ID (ChIJ...) for this location, used for rank tracking';
COMMENT ON COLUMN google_business_locations.lat IS 'Latitude of the business location';
COMMENT ON COLUMN google_business_locations.lng IS 'Longitude of the business location';
