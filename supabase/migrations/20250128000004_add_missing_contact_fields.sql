-- Add missing contact fields that are expected by the UI
-- These fields are referenced in CSV uploads but don't exist in the database

-- Add address-related columns
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Add business_name column (separate from company name)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add performance indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city);
CREATE INDEX IF NOT EXISTS idx_contacts_state ON contacts(state);
CREATE INDEX IF NOT EXISTS idx_contacts_country ON contacts(country);
CREATE INDEX IF NOT EXISTS idx_contacts_business_name ON contacts(business_name);
CREATE INDEX IF NOT EXISTS idx_contacts_postal_code ON contacts(postal_code);

-- Add composite index for address searches
CREATE INDEX IF NOT EXISTS idx_contacts_location ON contacts(city, state, country);

-- Update any existing RLS policies to include new columns (if needed)
-- Note: RLS is currently disabled for contacts table, will be re-enabled in next migration 