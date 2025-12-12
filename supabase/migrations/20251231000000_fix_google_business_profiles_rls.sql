-- Fix RLS policies on google_business_profiles
-- The existing policies had a bug where au.account_id = au.account_id (always true)
-- instead of au.account_id = google_business_profiles.account_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert Google Business Profile data for their account" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update Google Business Profile data for their account" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete Google Business Profile data for their account" ON google_business_profiles;

-- Recreate SELECT policy with correct join condition
CREATE POLICY "Users can view Google Business Profile data for their accounts" ON google_business_profiles
  FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
      AND au.user_id = auth.uid()
    ))
  );

-- Recreate INSERT policy with correct join condition
CREATE POLICY "Users can insert Google Business Profile data for their account" ON google_business_profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
      AND au.user_id = auth.uid()
    ))
  );

-- Recreate UPDATE policy with correct join condition
CREATE POLICY "Users can update Google Business Profile data for their account" ON google_business_profiles
  FOR UPDATE
  USING (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
      AND au.user_id = auth.uid()
    ))
  );

-- Recreate DELETE policy with correct join condition
CREATE POLICY "Users can delete Google Business Profile data for their account" ON google_business_profiles
  FOR DELETE
  USING (
    (auth.uid() = user_id)
    OR
    (EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
      AND au.user_id = auth.uid()
    ))
  );
