-- Add account_name column to google_business_locations table
-- This stores the full account identifier (accounts/{id}) to avoid API calls during posting

ALTER TABLE google_business_locations 
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN google_business_locations.account_name IS 'Full Google Business Profile account identifier (accounts/{id})';

-- Create index for better performance when querying by account
CREATE INDEX IF NOT EXISTS idx_google_business_locations_account_name ON google_business_locations(account_name); 