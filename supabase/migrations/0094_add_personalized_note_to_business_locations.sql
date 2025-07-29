-- Add personalized note fields to business_locations table
-- This allows locations to have their own personalized note popup settings

-- Personalized note fields
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS show_friendly_note boolean DEFAULT false;

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS friendly_note text DEFAULT '';

-- Add comments for clarity
COMMENT ON COLUMN business_locations.show_friendly_note IS 'Whether to show the personalized note popup for this location';
COMMENT ON COLUMN business_locations.friendly_note IS 'The personalized note text to display in the popup'; 