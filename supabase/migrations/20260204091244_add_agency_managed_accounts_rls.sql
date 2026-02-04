-- Add RLS policy to allow agency owners/admins to SELECT their managed client accounts
-- This fixes the issue where agency-created clients show on agency dashboard
-- but don't appear in the account switcher dropdown

-- Policy: Agency owners can view accounts they manage
CREATE POLICY "Agency owners can view managed client accounts"
  ON accounts FOR SELECT
  TO authenticated
  USING (
    -- Check if the viewing user is an owner/admin of the agency that manages this account
    managing_agncy_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = accounts.managing_agncy_id
        AND au.user_id = auth.uid()
        AND au.role IN ('owner', 'admin')
    )
  );

-- Add a comment explaining this policy
COMMENT ON POLICY "Agency owners can view managed client accounts" ON accounts IS
  'Allows agency owners and admins to SELECT client accounts where managing_agncy_id points to their agency';
