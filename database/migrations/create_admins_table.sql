-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Insert the first admin (you)
INSERT INTO admins (account_id) 
VALUES ('f3fa0bb0-feab-4501-8644-c0ca579da96d')
ON CONFLICT (account_id) DO NOTHING; 