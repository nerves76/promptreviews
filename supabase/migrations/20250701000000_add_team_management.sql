-- Add team management functionality
-- This migration adds user limits and invitation system for team management

-- Add max_users column to accounts table
ALTER TABLE accounts 
ADD COLUMN max_users INTEGER DEFAULT 1;

-- Set plan-based user limits
UPDATE accounts SET max_users = 
  CASE 
    WHEN plan = 'grower' THEN 1
    WHEN plan = 'builder' THEN 3  
    WHEN plan = 'maven' THEN 5
    ELSE 1
  END;

-- Create account_invitations table
CREATE TABLE account_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique invitations per account/email combination
  UNIQUE(account_id, email)
);

-- Add indexes for performance
CREATE INDEX idx_account_invitations_account_id ON account_invitations(account_id);
CREATE INDEX idx_account_invitations_token ON account_invitations(token);
CREATE INDEX idx_account_invitations_email ON account_invitations(email);
CREATE INDEX idx_account_invitations_expires_at ON account_invitations(expires_at);

-- RLS policies for account_invitations
ALTER TABLE account_invitations ENABLE ROW LEVEL SECURITY;

-- Allow account owners to view invitations for their account
CREATE POLICY "Account owners can view invitations" ON account_invitations
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to create invitations
CREATE POLICY "Account owners can create invitations" ON account_invitations
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to update invitations (cancel them)
CREATE POLICY "Account owners can update invitations" ON account_invitations
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow account owners to delete invitations
CREATE POLICY "Account owners can delete invitations" ON account_invitations
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow users to view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email" ON account_invitations
  FOR SELECT USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Allow users to update invitations sent to their email (accept them)
CREATE POLICY "Users can accept invitations sent to their email" ON account_invitations
  FOR UPDATE USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Function to get current user count for an account
CREATE OR REPLACE FUNCTION get_account_user_count(account_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM account_users 
    WHERE account_id = account_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account can add more users
CREATE OR REPLACE FUNCTION can_add_user_to_account(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT get_account_user_count(account_uuid) < max_users
    FROM accounts 
    WHERE id = account_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 