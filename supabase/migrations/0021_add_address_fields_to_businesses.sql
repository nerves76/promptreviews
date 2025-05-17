-- Add address fields to businesses table for future location support
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_zip TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT;

-- Optionally, add comments for clarity
COMMENT ON COLUMN businesses.address_street IS 'Primary street address of the business';
COMMENT ON COLUMN businesses.address_city IS 'Primary city of the business';
COMMENT ON COLUMN businesses.address_state IS 'Primary state/province of the business';
COMMENT ON COLUMN businesses.address_zip IS 'Primary ZIP/postal code of the business';
COMMENT ON COLUMN businesses.address_country IS 'Primary country of the business'; 