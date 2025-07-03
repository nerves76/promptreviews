-- Ensure max_users column exists and is properly populated
-- This is a safety migration to fix any accounts that might be missing the max_users value

-- Add max_users column if it doesn't exist (safe operation)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1;

-- Update any accounts that have NULL max_users based on their plan
UPDATE accounts 
SET max_users = 
  CASE 
    WHEN plan = 'grower' THEN 1
    WHEN plan = 'builder' THEN 3  
    WHEN plan = 'maven' THEN 5
    WHEN plan = 'community_champion' THEN 5
    ELSE 1
  END
WHERE max_users IS NULL OR max_users = 0;

-- Ensure all accounts have at least 1 max_user
UPDATE accounts 
SET max_users = 1 
WHERE max_users IS NULL OR max_users < 1;

-- Create index on max_users for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_accounts_max_users ON accounts(max_users);

-- Add comment
COMMENT ON COLUMN accounts.max_users IS 'Maximum number of users allowed for this account based on plan';