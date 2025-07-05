-- Clean up any remaining problematic RLS policies on account_invitations
-- This ensures no policies try to access auth.users directly

-- Drop any policies that might access auth.users table
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Users can accept invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON account_invitations;

-- Also drop any other potentially problematic policies
DROP POLICY IF EXISTS "Allow users to view invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Allow users to accept invitations sent to their email" ON account_invitations;

-- Ensure RLS is enabled
ALTER TABLE account_invitations ENABLE ROW LEVEL SECURITY;

-- Recreate only the safe policies (these should already exist from 0085 but let's be sure)
-- These policies only access account_users table, not auth.users

-- Allow account owners to view invitations for their account
DROP POLICY IF EXISTS "Account owners can view invitations" ON account_invitations;
CREATE POLICY "Account owners can view invitations" ON account_invitations
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to create invitations
DROP POLICY IF EXISTS "Account owners can create invitations" ON account_invitations;
CREATE POLICY "Account owners can create invitations" ON account_invitations
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to update invitations (cancel them)
DROP POLICY IF EXISTS "Account owners can update invitations" ON account_invitations;
CREATE POLICY "Account owners can update invitations" ON account_invitations
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to delete invitations
DROP POLICY IF EXISTS "Account owners can delete invitations" ON account_invitations;
CREATE POLICY "Account owners can delete invitations" ON account_invitations
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Log that cleanup is complete
COMMENT ON TABLE account_invitations IS 'Team invitations table. All policies cleaned up to avoid auth.users access. User email access handled via API with admin client.'; 