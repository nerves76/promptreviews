-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_account_id ON admins(account_id);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert admins" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update admins" ON admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE account_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete admins" ON admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE account_id = auth.uid()
    )
  );

-- Note: Admin users will be added manually or through the admin interface
-- Remove the hardcoded insert to avoid conflicts 