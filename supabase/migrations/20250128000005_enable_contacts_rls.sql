-- Re-enable Row Level Security for contacts table
-- This migration creates proper security policies for multi-tenant access

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contacts for their accounts" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for their accounts" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts for their accounts" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their accounts" ON contacts;

-- Create SELECT policy - users can view contacts for accounts they have access to
CREATE POLICY "Users can view contacts for their accounts"
ON contacts FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid()
  )
);

-- Create INSERT policy - users can create contacts for accounts they have access to
CREATE POLICY "Users can insert contacts for their accounts"
ON contacts FOR INSERT
TO authenticated
WITH CHECK (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid()
  )
);

-- Create UPDATE policy - users can update contacts for accounts they have access to
CREATE POLICY "Users can update contacts for their accounts"
ON contacts FOR UPDATE
TO authenticated
USING (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid()
  )
);

-- Create DELETE policy - users can delete contacts for accounts they have access to
CREATE POLICY "Users can delete contacts for their accounts"
ON contacts FOR DELETE
TO authenticated
USING (
  account_id IN (
    SELECT account_id 
    FROM account_users 
    WHERE user_id = auth.uid()
  )
);

-- Add performance index for RLS policies
CREATE INDEX IF NOT EXISTS idx_contacts_account_id_rls ON contacts(account_id);

-- Add index for account_users lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_account_users_user_account ON account_users(user_id, account_id); 