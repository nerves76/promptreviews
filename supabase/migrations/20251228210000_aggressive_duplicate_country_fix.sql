-- More aggressive fix for duplicate "United States" in location names
-- This catches any pattern where "United States" appears more than once

-- Fix rank_locations table
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rank_locations') THEN

    -- Keep replacing until no more duplicates exist
    LOOP
      UPDATE rank_locations
      SET canonical_name = REPLACE(canonical_name, 'United States, United States', 'United States')
      WHERE canonical_name LIKE '%United States, United States%';

      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      EXIT WHEN affected_rows = 0;
    END LOOP;

    -- Also fix any without comma: "United StatesUnited States"
    UPDATE rank_locations
    SET canonical_name = REPLACE(canonical_name, 'United StatesUnited States', 'United States')
    WHERE canonical_name LIKE '%United StatesUnited States%';

  END IF;
END $$;

-- Fix keywords table
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'search_volume_location_name'
  ) THEN

    LOOP
      UPDATE keywords
      SET search_volume_location_name = REPLACE(search_volume_location_name, 'United States, United States', 'United States')
      WHERE search_volume_location_name LIKE '%United States, United States%';

      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      EXIT WHEN affected_rows = 0;
    END LOOP;

  END IF;
END $$;

-- Fix businesses table
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'location_name'
  ) THEN

    LOOP
      UPDATE businesses
      SET location_name = REPLACE(location_name, 'United States, United States', 'United States')
      WHERE location_name LIKE '%United States, United States%';

      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      EXIT WHEN affected_rows = 0;
    END LOOP;

  END IF;
END $$;
