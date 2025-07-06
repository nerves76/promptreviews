-- Add is_admin column to accounts table for simpler admin management
ALTER TABLE accounts ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set existing admin accounts to true (you can modify these emails as needed)
UPDATE accounts 
SET is_admin = TRUE 
WHERE email IN ('chris@diviner.agency', 'nerves76@gmail.com');

-- Create index for faster admin checks
CREATE INDEX idx_accounts_is_admin ON accounts(is_admin) WHERE is_admin = TRUE;

-- Add comment
COMMENT ON COLUMN accounts.is_admin IS 'Simple boolean flag to identify admin users'; 