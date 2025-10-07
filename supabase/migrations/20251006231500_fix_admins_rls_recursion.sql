-- Fix infinite recursion in admins table RLS policies
-- The previous policies created infinite loops by checking the admins table
-- while trying to read from the admins table

-- Drop the recursive policies
DROP POLICY IF EXISTS "Only admins can view admins" ON admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Only admins can update admins" ON admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON admins;

-- Create new non-recursive SELECT policy
-- Users can check their own admin status without recursion
CREATE POLICY "Users can view their own admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (account_id = auth.uid());

-- Create service role policy for admin management
-- Only service role (backend) can create/update/delete admins
CREATE POLICY "Service role can manage admins"
  ON admins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
