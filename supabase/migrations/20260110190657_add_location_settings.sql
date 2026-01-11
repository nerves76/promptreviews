-- Add location-based business settings
-- These fields control how AI generates review phrases with location references

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS is_location_based BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location_aliases TEXT[] DEFAULT '{}';

COMMENT ON COLUMN businesses.is_location_based IS 'Whether to include location in AI-generated review phrases';
COMMENT ON COLUMN businesses.location_aliases IS 'City/area name variations (e.g., Portland, PDX, Rose City)';
