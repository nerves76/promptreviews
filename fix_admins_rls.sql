-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Only admins can update admins" ON admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON admins;

-- Create simpler policies that allow admin checking
CREATE POLICY "Allow admin checking" ON admins
  FOR SELECT USING (true);

CREATE POLICY "Allow admin management" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE account_id = auth.uid()
    )
  ); 