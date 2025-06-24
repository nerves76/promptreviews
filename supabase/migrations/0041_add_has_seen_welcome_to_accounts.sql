-- Add has_seen_welcome column to accounts table
-- This tracks whether a user has seen the welcome popup

ALTER TABLE accounts 
ADD COLUMN has_seen_welcome BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN accounts.has_seen_welcome IS 'Tracks whether the user has seen the welcome popup on first login'; 