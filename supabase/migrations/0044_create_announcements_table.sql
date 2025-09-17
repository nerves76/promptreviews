-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for announcements (if not exists)
DROP POLICY IF EXISTS "Allow public read access to active announcements" ON announcements;
CREATE POLICY "Allow public read access to active announcements" ON announcements
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin management of announcements" ON announcements;
CREATE POLICY "Allow admin management of announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.account_id = auth.uid() 
      AND admins.id = announcements.created_by
    )
  );

-- Create RLS policies for quotes
DROP POLICY IF EXISTS "Allow public read access to active quotes" ON quotes;
CREATE POLICY "Allow public read access to active quotes" ON quotes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow admin management of quotes" ON quotes;
CREATE POLICY "Allow admin management of quotes" ON quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.account_id = auth.uid() 
      AND admins.id = quotes.created_by
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_active ON quotes(is_active); 