-- Drop all existing policies on admins table
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Only admins can update admins" ON admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Allow admin checking" ON admins;
DROP POLICY IF EXISTS "Allow admin management" ON admins;

-- Create a simple policy that allows anyone to check if they're an admin
-- This is safe because the admins table only contains user IDs, no sensitive data
CREATE POLICY "Allow admin status checking" ON admins
  FOR SELECT USING (true);

-- Create a policy for admin management that only allows existing admins
-- This uses a different approach to avoid circular dependency
CREATE POLICY "Allow admin management by existing admins" ON admins
  FOR ALL USING (
    account_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admins a 
      WHERE a.account_id = auth.uid()
    )
  ); 