-- Migration: Enhance Invitation Tracking
-- Adds better tracking for invitation lifecycle management

-- Add updated_at column for tracking invitation modifications
ALTER TABLE account_invitations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Set initial updated_at values for existing records
UPDATE account_invitations 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add updated_at default for future records
ALTER TABLE account_invitations 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add index for cleanup queries (find expired invitations efficiently)
CREATE INDEX IF NOT EXISTS idx_account_invitations_cleanup 
ON account_invitations(expires_at, accepted_at) 
WHERE accepted_at IS NULL;

-- Add index for resend queries (find pending invitations by account)
CREATE INDEX IF NOT EXISTS idx_account_invitations_pending 
ON account_invitations(account_id, accepted_at, expires_at) 
WHERE accepted_at IS NULL;

-- Add function to automatically set updated_at on row updates
CREATE OR REPLACE FUNCTION update_account_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_account_invitations_updated_at ON account_invitations;
CREATE TRIGGER trigger_account_invitations_updated_at
    BEFORE UPDATE ON account_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_account_invitations_updated_at();

-- Add helpful comments
COMMENT ON COLUMN account_invitations.updated_at IS 'Timestamp when invitation was last modified (resent, etc.)';
COMMENT ON INDEX idx_account_invitations_cleanup IS 'Optimizes expired invitation cleanup queries';
COMMENT ON INDEX idx_account_invitations_pending IS 'Optimizes pending invitation queries for management UI'; 