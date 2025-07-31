-- Add falling_icon_color column to business_locations table
-- This column allows locations to have their own falling icon color
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS falling_icon_color TEXT DEFAULT '#fbbf24';

-- Add comment for documentation
COMMENT ON COLUMN business_locations.falling_icon_color IS 'Hex color value for the falling stars animation icons'; 