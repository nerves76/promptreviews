-- Re-enable RLS with a simple policy
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow admin status checking" ON admins;
DROP POLICY IF EXISTS "Allow admin management by existing admins" ON admins;

-- Create a simple policy that allows SELECT for admin checking
CREATE POLICY "Allow admin checking" ON admins
  FOR SELECT USING (true);

-- Create a policy for admin management (only admins can modify)
CREATE POLICY "Allow admin management" ON admins
  FOR ALL USING (account_id = auth.uid()); 