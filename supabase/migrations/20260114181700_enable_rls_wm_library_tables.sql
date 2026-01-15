-- Enable RLS on WM Library Tables
-- These tables contain read-only reference data (SEO task templates)
-- All authenticated users can read, only service_role can modify

-- Enable RLS on all three tables
ALTER TABLE wm_library_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wm_library_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wm_library_pack_tasks ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read library tasks
CREATE POLICY "Authenticated users can read library tasks"
  ON wm_library_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to read library packs
CREATE POLICY "Authenticated users can read library packs"
  ON wm_library_packs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to read library pack-task associations
CREATE POLICY "Authenticated users can read library pack tasks"
  ON wm_library_pack_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT, UPDATE, DELETE operations require service_role key (admin only)
-- No write policies are created for regular users
