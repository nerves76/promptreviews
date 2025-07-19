/**
 * Migration: Add Support Role for Chris
 * 
 * This migration adds a 'support' role that doesn't count against team member limits.
 * This allows Chris to be added for development and support without affecting user quotas.
 */

-- Add 'support' to the role check constraint
ALTER TABLE account_users 
DROP CONSTRAINT IF EXISTS account_users_role_check;

ALTER TABLE account_users 
ADD CONSTRAINT account_users_role_check 
CHECK (role IN ('owner', 'member', 'support'));

-- Also update account_invitations table to allow support role
ALTER TABLE account_invitations 
DROP CONSTRAINT IF EXISTS account_invitations_role_check;

ALTER TABLE account_invitations 
ADD CONSTRAINT account_invitations_role_check 
CHECK (role IN ('owner', 'member', 'support'));

-- Update the user count function to exclude support users from team limits
CREATE OR REPLACE FUNCTION get_account_user_count(account_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM account_users 
    WHERE account_id = account_uuid
    AND role != 'support' -- Exclude support users from team count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The can_add_user_to_account function will automatically use the updated count function
-- so no changes needed there

-- Add a comment to document the support role behavior
COMMENT ON COLUMN account_users.role IS 'User role: owner (full access), member (limited access), support (development/support access, does not count against team limits)';
COMMENT ON COLUMN account_invitations.role IS 'Invitation role: owner (full access), member (limited access), support (development/support access, does not count against team limits)'; 