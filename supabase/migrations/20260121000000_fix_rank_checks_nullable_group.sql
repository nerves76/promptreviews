-- Fix rank_checks table to allow manual single-keyword checks
-- group_id should be nullable for checks that don't belong to a scheduled group

-- Make group_id nullable
ALTER TABLE rank_checks ALTER COLUMN group_id DROP NOT NULL;

-- Add location and device columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rank_checks' AND column_name = 'location_code') THEN
    ALTER TABLE rank_checks ADD COLUMN location_code INT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rank_checks' AND column_name = 'location_name') THEN
    ALTER TABLE rank_checks ADD COLUMN location_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rank_checks' AND column_name = 'device') THEN
    ALTER TABLE rank_checks ADD COLUMN device TEXT CHECK (device IN ('desktop', 'mobile'));
  END IF;
END $$;

COMMENT ON COLUMN rank_checks.group_id IS 'Optional reference to a rank keyword group. NULL for manual single-keyword checks.';
COMMENT ON COLUMN rank_checks.location_code IS 'DataForSEO location code used for this check';
COMMENT ON COLUMN rank_checks.location_name IS 'Location name for display (e.g., "Portland, Oregon, United States")';
COMMENT ON COLUMN rank_checks.device IS 'Device type: desktop or mobile';
