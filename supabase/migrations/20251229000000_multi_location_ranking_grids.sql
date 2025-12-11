-- ============================================
-- Multi-Location Local Ranking Grids
-- Enable Maven accounts to track rankings for multiple locations (up to 10)
-- Grower/Builder accounts remain single-location (1 config max)
-- ============================================

-- ============================================
-- Phase 1: Update gg_configs constraints
-- ============================================

-- Remove single-config-per-account constraint
-- This allows Maven accounts to have multiple configs
ALTER TABLE gg_configs DROP CONSTRAINT gg_configs_account_id_key;

-- Add new unique constraint: one config per account+location combo
-- This prevents duplicate configs for the same location
ALTER TABLE gg_configs
ADD CONSTRAINT gg_configs_account_location_unique
UNIQUE(account_id, google_business_location_id);

-- Add location name for display (denormalized for convenience in queries)
-- This avoids joins when displaying config list with location names
ALTER TABLE gg_configs ADD COLUMN location_name TEXT;

-- ============================================
-- Phase 2: Update gg_daily_summary constraints
-- ============================================

-- Remove old constraint (was per-account per day)
-- Now we need per-config per day since account can have multiple configs
ALTER TABLE gg_daily_summary DROP CONSTRAINT gg_daily_summary_account_id_check_date_key;

-- Add new constraint: one summary per config per day
ALTER TABLE gg_daily_summary
ADD CONSTRAINT gg_daily_summary_config_date_unique
UNIQUE(config_id, check_date);

-- ============================================
-- Backfill location_name from google_business_locations
-- ============================================
UPDATE gg_configs gc
SET location_name = gbl.location_name
FROM google_business_locations gbl
WHERE gc.google_business_location_id = gbl.id
  AND gc.location_name IS NULL;

-- ============================================
-- Add index for efficient config listing by account
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gg_configs_account_location
ON gg_configs(account_id, google_business_location_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN gg_configs.location_name IS 'Denormalized location name for display. Sync with google_business_locations on update.';
COMMENT ON CONSTRAINT gg_configs_account_location_unique ON gg_configs IS 'One ranking grid config per business location per account. Maven accounts can have up to 10.';
