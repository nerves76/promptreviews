-- Fix RLS policies for google_business_locations and google_business_profiles
-- Note: These tables only have user_id, not account_id. The original policies were correct.
-- This migration simply recreates them to ensure they exist.

-- Fix google_business_locations policies
DROP POLICY IF EXISTS "Users can view Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can insert Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can update Google Business locations for their accounts" ON google_business_locations;
DROP POLICY IF EXISTS "Users can delete Google Business locations for their accounts" ON google_business_locations;

-- Also drop the original policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can insert their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can update their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can delete their own Google Business locations" ON google_business_locations;

CREATE POLICY "Users can view their own Google Business locations"
  ON google_business_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Business locations"
  ON google_business_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Business locations"
  ON google_business_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Business locations"
  ON google_business_locations FOR DELETE
  USING (auth.uid() = user_id);

-- Fix google_business_profiles policies
DROP POLICY IF EXISTS "Users can view Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update Google Business Profile data for their accounts" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete Google Business Profile data for their accounts" ON google_business_profiles;

-- Also drop the original policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete their own Google Business Profile data" ON google_business_profiles;

CREATE POLICY "Users can view their own Google Business Profile data"
  ON google_business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Business Profile data"
  ON google_business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Business Profile data"
  ON google_business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Business Profile data"
  ON google_business_profiles FOR DELETE
  USING (auth.uid() = user_id);
