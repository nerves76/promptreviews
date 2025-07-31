-- Add location_photo_url column to business_locations table
-- This column allows locations to have their own photo/featured image

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS location_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN business_locations.location_photo_url IS 'URL to the location-specific featured photo/image'; 