-- Add account_id to google business profile tables for multi-account support

-- 1. Add column to google_business_profiles
ALTER TABLE google_business_profiles
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- 2. Drop unique constraint on user_id (will replace with account-based constraint)
ALTER TABLE google_business_profiles
  DROP CONSTRAINT IF EXISTS google_business_profiles_user_id_key;

-- 3. CRITICAL: Cannot reliably backfill account_id for existing connections
-- We don't know which account the user was "in" when they connected Google.
-- The safest approach is to DELETE existing connections and require re-authorization.
-- This prevents cross-account token leakage.

-- Option 1 (SAFEST - RECOMMENDED): Delete existing Google Business connections
-- Users will need to reconnect, but tokens will be properly scoped
DELETE FROM google_business_profiles WHERE account_id IS NULL;

-- Option 2 (if you want to preserve connections): Assign to user's first/primary account
-- WARNING: This may assign tokens to the wrong account if user connected while in a different account
-- Uncomment below if you prefer to keep existing connections:
/*
UPDATE google_business_profiles gbp
SET account_id = (
  SELECT account_id
  FROM account_users au
  WHERE au.user_id = gbp.user_id
  ORDER BY CASE au.role
    WHEN 'owner' THEN 0
    WHEN 'admin' THEN 1
    ELSE 2
  END,
  au.created_at ASC
  LIMIT 1
)
WHERE account_id IS NULL;
*/

-- 4. Ensure account_id is not null for any remaining rows
-- Since we deleted rows without account_id, this should not affect any data
-- But we add a safety check just in case
DO $$
BEGIN
  -- Only set NOT NULL if there are no NULL values
  IF NOT EXISTS (SELECT 1 FROM google_business_profiles WHERE account_id IS NULL) THEN
    ALTER TABLE google_business_profiles ALTER COLUMN account_id SET NOT NULL;
  ELSE
    RAISE EXCEPTION 'Cannot set account_id to NOT NULL - some rows still have NULL account_id. Please investigate.';
  END IF;
END $$;

-- 5. Add unique constraint per account
ALTER TABLE google_business_profiles
  ADD CONSTRAINT google_business_profiles_account_id_key UNIQUE (account_id);

-- 6. Add index to speed up account lookups
CREATE INDEX IF NOT EXISTS idx_google_business_profiles_account_id
  ON google_business_profiles(account_id);

-- 7. Update RLS policies to enforce account membership
DROP POLICY IF EXISTS "Users can view their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can insert their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can update their own Google Business Profile data" ON google_business_profiles;
DROP POLICY IF EXISTS "Users can delete their own Google Business Profile data" ON google_business_profiles;

CREATE POLICY "Users can view Google Business Profile data for their accounts"
  ON google_business_profiles FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Google Business Profile data for their accounts"
  ON google_business_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Google Business Profile data for their accounts"
  ON google_business_profiles FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Google Business Profile data for their accounts"
  ON google_business_profiles FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

-- Repeat for google_business_locations
ALTER TABLE google_business_locations
  ADD COLUMN IF NOT EXISTS account_id uuid;

ALTER TABLE google_business_locations
  DROP CONSTRAINT IF EXISTS google_business_locations_user_id_location_id_key;

-- Backfill account_id from profiles table first (if profiles were preserved)
UPDATE google_business_locations gbl
SET account_id = (
  SELECT account_id
  FROM google_business_profiles gbp
  WHERE gbp.user_id = gbl.user_id
  LIMIT 1
)
WHERE account_id IS NULL AND EXISTS (
  SELECT 1 FROM google_business_profiles gbp WHERE gbp.user_id = gbl.user_id
);

-- Delete orphaned locations that have no corresponding profile
-- This happens when we deleted the profile above
DELETE FROM google_business_locations WHERE account_id IS NULL;

-- Set NOT NULL constraint with safety check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM google_business_locations WHERE account_id IS NULL) THEN
    ALTER TABLE google_business_locations ALTER COLUMN account_id SET NOT NULL;
  ELSE
    RAISE EXCEPTION 'Cannot set account_id to NOT NULL - some location rows still have NULL account_id. Please investigate.';
  END IF;
END $$;

ALTER TABLE google_business_locations
  ADD CONSTRAINT google_business_locations_account_location UNIQUE (account_id, location_id);

CREATE INDEX IF NOT EXISTS idx_google_business_locations_account_id
  ON google_business_locations(account_id);

DROP POLICY IF EXISTS "Users can view their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can insert their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can update their own Google Business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can delete their own Google Business locations" ON google_business_locations;

CREATE POLICY "Users can view Google Business locations for their accounts"
  ON google_business_locations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Google Business locations for their accounts"
  ON google_business_locations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update Google Business locations for their accounts"
  ON google_business_locations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Google Business locations for their accounts"
  ON google_business_locations FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

-- Update comments to document new behaviour
COMMENT ON COLUMN google_business_profiles.account_id IS 'Account that owns this Google Business connection';
COMMENT ON COLUMN google_business_locations.account_id IS 'Account that owns this Google Business location';

-- Update google_api_rate_limits to be account-scoped
ALTER TABLE google_api_rate_limits
  ADD COLUMN IF NOT EXISTS account_id uuid;

ALTER TABLE google_api_rate_limits
  DROP CONSTRAINT IF EXISTS google_api_rate_limits_project_id_key;

-- Backfill from google_business_profiles if connection still exists
UPDATE google_api_rate_limits garl
SET account_id = (
  SELECT account_id
  FROM google_business_profiles gbp
  WHERE gbp.user_id = garl.user_id
  LIMIT 1
)
WHERE account_id IS NULL AND EXISTS (
  SELECT 1 FROM google_business_profiles gbp WHERE gbp.user_id = garl.user_id
);

-- Delete orphaned rate limit records (connection was deleted)
DELETE FROM google_api_rate_limits WHERE account_id IS NULL;

-- Set NOT NULL with safety check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM google_api_rate_limits WHERE account_id IS NULL) THEN
    ALTER TABLE google_api_rate_limits ALTER COLUMN account_id SET NOT NULL;
  ELSE
    RAISE EXCEPTION 'Cannot set account_id to NOT NULL - some rate limit rows still have NULL account_id.';
  END IF;
END $$;

ALTER TABLE google_api_rate_limits
  ADD CONSTRAINT google_api_rate_limits_project_account_unique UNIQUE (project_id, account_id);

CREATE INDEX IF NOT EXISTS idx_google_api_rate_limits_account_project
  ON google_api_rate_limits(account_id, project_id);

-- Update review reminder settings/logs to be account-scoped
ALTER TABLE review_reminder_settings
  ADD COLUMN IF NOT EXISTS account_id uuid;

ALTER TABLE review_reminder_logs
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- Backfill account_id from google business profiles (if connection still exists)
UPDATE review_reminder_settings rrs
SET account_id = (
  SELECT account_id FROM google_business_profiles gbp
  WHERE gbp.user_id = rrs.user_id
  LIMIT 1
)
WHERE account_id IS NULL AND EXISTS (
  SELECT 1 FROM google_business_profiles gbp WHERE gbp.user_id = rrs.user_id
);

-- Delete reminder settings without a corresponding Google Business connection
-- These are orphaned records from deleted connections
DELETE FROM review_reminder_settings WHERE account_id IS NULL;

-- Backfill reminder logs from settings
UPDATE review_reminder_logs rrl
SET account_id = (
  SELECT account_id FROM review_reminder_settings rrs
  WHERE rrs.user_id = rrl.user_id
  LIMIT 1
)
WHERE account_id IS NULL AND EXISTS (
  SELECT 1 FROM review_reminder_settings rrs WHERE rrs.user_id = rrl.user_id
);

-- Delete orphaned reminder logs
DELETE FROM review_reminder_logs WHERE account_id IS NULL;

-- Set NOT NULL constraints with safety checks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM review_reminder_settings WHERE account_id IS NULL) THEN
    ALTER TABLE review_reminder_settings ALTER COLUMN account_id SET NOT NULL;
  ELSE
    RAISE EXCEPTION 'Cannot set account_id to NOT NULL on review_reminder_settings - some rows still have NULL.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM review_reminder_logs WHERE account_id IS NULL) THEN
    ALTER TABLE review_reminder_logs ALTER COLUMN account_id SET NOT NULL;
  ELSE
    RAISE EXCEPTION 'Cannot set account_id to NOT NULL on review_reminder_logs - some rows still have NULL.';
  END IF;
END $$;

ALTER TABLE review_reminder_settings
  DROP CONSTRAINT IF EXISTS review_reminder_settings_user_id_key;

ALTER TABLE review_reminder_settings
  ADD CONSTRAINT review_reminder_settings_account_unique UNIQUE (account_id);

DROP POLICY IF EXISTS "Users can view their own reminder settings" ON review_reminder_settings;
DROP POLICY IF EXISTS "Users can insert their own reminder settings" ON review_reminder_settings;
DROP POLICY IF EXISTS "Users can update their own reminder settings" ON review_reminder_settings;

CREATE POLICY "Users can view reminder settings for their accounts" ON review_reminder_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reminder settings for their accounts" ON review_reminder_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update reminder settings for their accounts" ON review_reminder_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view their own reminder logs" ON review_reminder_logs;
CREATE POLICY "Users can view reminder logs for their accounts" ON review_reminder_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_id
        AND au.user_id = auth.uid()
    )
  );

COMMENT ON COLUMN review_reminder_settings.account_id IS 'Account that owns these reminder settings';
COMMENT ON COLUMN review_reminder_logs.account_id IS 'Account associated with this reminder log entry';
