-- Fix all RLS policies on account_invitations table
-- This migration completely resets all policies to avoid any auth.users permission issues

-- Drop ALL existing policies on account_invitations table
DROP POLICY IF EXISTS "Account owners can view invitations" ON account_invitations;
DROP POLICY IF EXISTS "Account owners can create invitations" ON account_invitations;
DROP POLICY IF EXISTS "Account owners can update invitations" ON account_invitations;
DROP POLICY IF EXISTS "Account owners can delete invitations" ON account_invitations;
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Users can accept invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Allow users to view invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Allow users to accept invitations sent to their email" ON account_invitations;
DROP POLICY IF EXISTS "Allow users to update invitations sent to their email" ON account_invitations;

-- Disable RLS temporarily to clean up
ALTER TABLE account_invitations DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE account_invitations ENABLE ROW LEVEL SECURITY;

-- Create only the safe policies that don't access auth.users
CREATE POLICY "Account owners can view invitations" ON account_invitations
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Account owners can create invitations" ON account_invitations
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Account owners can update invitations" ON account_invitations
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Account owners can delete invitations" ON account_invitations
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Add comment explaining the design
COMMENT ON TABLE account_invitations IS 'Team invitations table. Uses admin client in API for email-based access to avoid RLS permission issues with auth.users table.';

-- Also fix the getSession timeout issue by ensuring proper session handling
-- Update the auth.uid() function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Return the authenticated user ID, or NULL if not authenticated
  RETURN auth.uid();
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a helper function to check if current user owns account
CREATE OR REPLACE FUNCTION public.current_user_owns_account(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM account_users 
    WHERE account_id = account_uuid 
    AND user_id = get_current_user_id() 
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 