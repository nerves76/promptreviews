-- Add google_email to track which Google account is connected
-- This prevents cross-contamination when switching between Prompt Reviews accounts

-- Add the google_email column to store which Google account is connected
ALTER TABLE google_business_profiles
ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Add an index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_google_business_profiles_google_email 
ON google_business_profiles(google_email);

-- Add a comment explaining the field
COMMENT ON COLUMN google_business_profiles.google_email IS 'The email address of the connected Google account to prevent cross-account token confusion';

-- Optional: Add a unique constraint to prevent the same Google account 
-- from being connected to multiple Prompt Reviews accounts
-- Commenting out for now as this might be too restrictive for teams
-- ALTER TABLE google_business_profiles
-- ADD CONSTRAINT unique_google_email UNIQUE (google_email);