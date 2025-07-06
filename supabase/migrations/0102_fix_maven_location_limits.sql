-- Fix max_locations for maven plan accounts
-- Some accounts may not have been updated correctly in the previous migration

-- Update all maven accounts to have correct location limits
UPDATE accounts 
SET max_locations = 10
WHERE plan = 'maven' AND (max_locations IS NULL OR max_locations = 0);

-- Ensure location_count is correctly set for all accounts
UPDATE accounts 
SET location_count = (
    SELECT COUNT(*) 
    FROM business_locations bl 
    WHERE bl.account_id = accounts.id 
    AND bl.is_active = true
)
WHERE location_count IS NULL OR location_count = 0;

-- Add a comment for documentation
COMMENT ON COLUMN accounts.max_locations IS 'Maximum number of business locations allowed for this account tier'; 