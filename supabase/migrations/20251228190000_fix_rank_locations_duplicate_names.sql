-- Fix duplicate "United States" and state names in rank_locations canonical_name
-- The data was imported with concatenation errors like:
-- "Seattle,Washington,United States, Washington,United States, United States"
-- Should be: "Seattle, Washington, United States"

-- Step 1: Fix triple "United States" occurrences
UPDATE rank_locations
SET canonical_name = REPLACE(canonical_name, ', United States, United States, United States', ', United States')
WHERE canonical_name LIKE '%, United States, United States, United States%';

-- Step 2: Fix double "United States" occurrences
UPDATE rank_locations
SET canonical_name = REPLACE(canonical_name, ', United States, United States', ', United States')
WHERE canonical_name LIKE '%, United States, United States%';

-- Step 3: Fix duplicate state patterns like "Washington,United States, Washington,United States"
-- This handles the pattern: State,Country, State,Country -> State, Country
UPDATE rank_locations
SET canonical_name = REGEXP_REPLACE(
  canonical_name,
  ',([A-Za-z ]+),United States, \1,United States',
  ', \1, United States',
  'g'
)
WHERE canonical_name ~ ',([A-Za-z ]+),United States, \1,United States';

-- Step 4: Fix missing spaces after commas (e.g., "Seattle,Washington" -> "Seattle, Washington")
UPDATE rank_locations
SET canonical_name = REGEXP_REPLACE(canonical_name, ',([A-Za-z])', ', \1', 'g')
WHERE canonical_name ~ ',[A-Za-z]';

-- Step 5: Clean up any remaining double spaces
UPDATE rank_locations
SET canonical_name = REGEXP_REPLACE(canonical_name, '  +', ' ', 'g')
WHERE canonical_name LIKE '%  %';

-- Also fix keywords table that may have stored malformed location names
-- Step 6: Fix triple "United States" in keywords
UPDATE keywords
SET search_volume_location_name = REPLACE(search_volume_location_name, ', United States, United States, United States', ', United States')
WHERE search_volume_location_name LIKE '%, United States, United States, United States%';

-- Step 7: Fix double "United States" in keywords
UPDATE keywords
SET search_volume_location_name = REPLACE(search_volume_location_name, ', United States, United States', ', United States')
WHERE search_volume_location_name LIKE '%, United States, United States%';

-- Step 8: Fix duplicate state patterns in keywords
UPDATE keywords
SET search_volume_location_name = REGEXP_REPLACE(
  search_volume_location_name,
  ',([A-Za-z ]+),United States, \1,United States',
  ', \1, United States',
  'g'
)
WHERE search_volume_location_name ~ ',([A-Za-z ]+),United States, \1,United States';

-- Step 9: Fix missing spaces after commas in keywords
UPDATE keywords
SET search_volume_location_name = REGEXP_REPLACE(search_volume_location_name, ',([A-Za-z])', ', \1', 'g')
WHERE search_volume_location_name ~ ',[A-Za-z]';

-- Step 10: Clean up double spaces in keywords
UPDATE keywords
SET search_volume_location_name = REGEXP_REPLACE(search_volume_location_name, '  +', ' ', 'g')
WHERE search_volume_location_name LIKE '%  %';
