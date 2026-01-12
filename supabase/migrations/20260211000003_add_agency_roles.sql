-- Add agency roles to account_users and account_invitations
-- Agency managers don't count toward client's max_users limit (like support role)

-- Update account_users role constraint to include agency roles
ALTER TABLE account_users DROP CONSTRAINT IF EXISTS account_users_role_check;
ALTER TABLE account_users ADD CONSTRAINT account_users_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'support', 'agency_manager', 'agency_billing_manager'));

-- Update account_invitations role constraint to include agency roles
ALTER TABLE account_invitations DROP CONSTRAINT IF EXISTS account_invitations_role_check;
ALTER TABLE account_invitations ADD CONSTRAINT account_invitations_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'support', 'agency_manager', 'agency_billing_manager'));

-- Add comments explaining the new roles
COMMENT ON CONSTRAINT account_users_role_check ON account_users IS
  'Valid roles: owner, admin, member, support (internal), agency_manager (agency access, no billing), agency_billing_manager (agency access with billing)';
