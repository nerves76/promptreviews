/**
 * Migration: Fix Account Users RLS Policies
 * 
 * This migration ensures that team invitation acceptance can properly create
 * account_users relationships by fixing RLS policies and permissions.
 */

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their account relationships" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage team members" ON account_users;
DROP POLICY IF EXISTS "Users can insert themselves into accounts via invitations" ON account_users;

-- Create comprehensive RLS policies for account_users table

-- Allow users to view their own account relationships
CREATE POLICY "Users can view their account relationships" ON account_users
  FOR SELECT USING (user_id = auth.uid());

-- Allow account owners to view all team members in their accounts
CREATE POLICY "Account owners can view team members" ON account_users
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to manage team members (insert, update, delete)
CREATE POLICY "Account owners can manage team members" ON account_users
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- CRITICAL: Allow users to insert themselves into accounts when accepting invitations
-- This policy allows users to add themselves to accounts if they have a valid invitation
CREATE POLICY "Users can accept invitations" ON account_users
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM account_invitations 
      WHERE account_id = account_users.account_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND accepted_at IS NULL
      AND expires_at > NOW()
    )
  );

-- Allow service role to bypass all restrictions for system operations
CREATE POLICY "Service role can manage all account_users" ON account_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure the table has RLS enabled
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON account_users TO authenticated;
GRANT SELECT ON account_invitations TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Users can accept invitations" ON account_users IS 
'Allows users to add themselves to accounts when they have valid, unexpired invitations. Critical for team invitation acceptance flow.';

COMMENT ON POLICY "Service role can manage all account_users" ON account_users IS 
'Allows service role client to bypass RLS restrictions for system operations like invitation acceptance fallbacks.';

-- Create index to improve invitation lookup performance
CREATE INDEX IF NOT EXISTS idx_account_invitations_email_account_expires 
ON account_invitations(email, account_id, expires_at) 
WHERE accepted_at IS NULL; 