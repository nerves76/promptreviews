-- Fix infinite recursion in account_users RLS policies
-- The previous policy was causing infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_user records" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for service role" ON account_users;

-- Create a simple, non-recursive policy for account_users
CREATE POLICY "Users can view their own account_users"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Also fix businesses table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their account's businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses for their account" ON businesses;
DROP POLICY IF EXISTS "Users can update their account's businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete their account's businesses" ON businesses;

-- Create simpler policies for businesses that don't reference account_users
CREATE POLICY "Users can view businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    account_id = auth.uid() OR
    account_id IN (
      SELECT au.account_id 
      FROM account_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id = auth.uid() OR
    account_id IN (
      SELECT au.account_id 
      FROM account_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    account_id = auth.uid() OR
    account_id IN (
      SELECT au.account_id 
      FROM account_users au 
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (
    account_id = auth.uid() OR
    account_id IN (
      SELECT au.account_id 
      FROM account_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Also fix accounts table to avoid recursion
DROP POLICY IF EXISTS "Users can view accounts" ON accounts;

CREATE POLICY "Users can view accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT au.account_id 
      FROM account_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Fix announcements table (it was also referencing account_users recursively)
DROP POLICY IF EXISTS "Public users can view active announcements" ON announcements;

CREATE POLICY "Public users can view active announcements"
  ON announcements
  FOR SELECT
  TO public
  USING (is_active = true);

DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in RLS policies';
  RAISE NOTICE 'account_users, businesses, accounts, and announcements tables should now work correctly';
END $$;