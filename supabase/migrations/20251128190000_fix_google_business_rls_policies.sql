-- Fix RLS policies for google_business_locations and google_business_profiles
-- Bug: au.account_id = au.account_id is always true, should compare to table's account_id

-- Fix google_business_locations policies
DROP POLICY IF EXISTS "Users can view Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can insert Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can update Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can delete Google Business locations for their accounts" ON google_business_locations;

CREATE POLICY "Users can view Google Business locations for their accounts"
  ON google_business_locations FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_locations.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Google Business locations for their accounts"
  ON google_business_locations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_locations.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Google Business locations for their accounts"
  ON google_business_locations FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_locations.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Google Business locations for their accounts"
  ON google_business_locations FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_locations.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Fix google_business_profiles policies
DROP POLICY IF EXISTS "Users can view Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete Google Business Profile data for their accounts" ON google_business_profiles;

CREATE POLICY "Users can view Google Business Profile data for their accounts"
  ON google_business_profiles FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Google Business Profile data for their accounts"
  ON google_business_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Google Business Profile data for their accounts"
  ON google_business_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Google Business Profile data for their accounts"
  ON google_business_profiles FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = google_business_profiles.account_id
        AND au.user_id = auth.uid()
    )
  );
