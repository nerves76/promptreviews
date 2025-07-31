-- Fix services_offered column type to match application usage
-- The application saves services as JSON arrays, but the column was created as text

-- First, create a backup of existing data by converting text to jsonb
UPDATE businesses 
SET services_offered = CASE 
  WHEN services_offered IS NULL THEN NULL
  WHEN services_offered = '' THEN '[]'::jsonb
  WHEN services_offered LIKE '[%]' THEN services_offered::jsonb
  ELSE ('["' || services_offered || '"]')::jsonb
END
WHERE services_offered IS NOT NULL;

-- Change the column type from text to jsonb
ALTER TABLE businesses 
ALTER COLUMN services_offered TYPE jsonb USING services_offered::jsonb;

-- Add comment to clarify the column purpose
COMMENT ON COLUMN businesses.services_offered IS 'JSON array of services offered by the business'; 