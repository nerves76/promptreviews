-- Fix duplicate "United States" in businesses.location_name
-- Same issue as rank_locations - data was imported with concatenation errors

-- Fix businesses table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'location_name'
  ) THEN

    -- Step 1: Fix triple "United States" occurrences
    UPDATE businesses
    SET location_name = REPLACE(location_name, ', United States, United States, United States', ', United States')
    WHERE location_name LIKE '%, United States, United States, United States%';

    -- Step 2: Fix double "United States" occurrences
    UPDATE businesses
    SET location_name = REPLACE(location_name, ', United States, United States', ', United States')
    WHERE location_name LIKE '%, United States, United States%';

    -- Step 3: Fix duplicate state patterns like "Washington,United States, Washington,United States"
    UPDATE businesses
    SET location_name = REGEXP_REPLACE(
      location_name,
      ',([A-Za-z ]+),United States, \1,United States',
      ', \1, United States',
      'g'
    )
    WHERE location_name ~ ',([A-Za-z ]+),United States, \1,United States';

    -- Step 4: Fix missing spaces after commas
    UPDATE businesses
    SET location_name = REGEXP_REPLACE(location_name, ',([A-Za-z])', ', \1', 'g')
    WHERE location_name ~ ',[A-Za-z]';

    -- Step 5: Clean up double spaces
    UPDATE businesses
    SET location_name = REGEXP_REPLACE(location_name, '  +', ' ', 'g')
    WHERE location_name LIKE '%  %';

  END IF;
END $$;
