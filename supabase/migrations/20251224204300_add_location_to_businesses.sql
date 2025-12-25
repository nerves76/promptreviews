-- Add location fields to businesses table for DataForSEO location targeting
-- These fields store the business's primary location for use as default in keyword concepts

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_code INTEGER;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Add helpful comment
COMMENT ON COLUMN businesses.location_code IS 'DataForSEO location code (e.g., 1022858 for Portland, OR)';
COMMENT ON COLUMN businesses.location_name IS 'Human-readable location name (e.g., Portland, Oregon, United States)';
