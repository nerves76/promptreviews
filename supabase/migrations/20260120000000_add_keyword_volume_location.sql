-- Add volume location fields to keywords
-- This tracks where search volume data was fetched from (per keyword)
-- Allows users to customize the location for volume lookups

ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS search_volume_location_code INTEGER,
ADD COLUMN IF NOT EXISTS search_volume_location_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN keywords.search_volume_location_code IS 'DataForSEO location code used for volume lookup (e.g., 2840 = USA)';
COMMENT ON COLUMN keywords.search_volume_location_name IS 'Human-readable location name for volume data (e.g., "Oregon, United States")';

-- Index for potential filtering by location
CREATE INDEX IF NOT EXISTS idx_keywords_volume_location
ON keywords(account_id, search_volume_location_code)
WHERE search_volume_location_code IS NOT NULL;
