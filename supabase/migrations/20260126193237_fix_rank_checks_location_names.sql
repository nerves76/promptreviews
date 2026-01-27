-- Fix duplicate "United States" and missing spaces in rank_checks.location_name
-- The data was stored with formatting issues like:
-- "Portland, OR,United States, United States" or "Seattle,Washington,United States"
-- Should be: "Portland, OR, United States" or "Seattle, Washington, United States"

-- Step 1: Fix triple "United States" occurrences
UPDATE rank_checks
SET location_name = REPLACE(location_name, ', United States, United States, United States', ', United States')
WHERE location_name LIKE '%, United States, United States, United States%';

-- Step 2: Fix double "United States" occurrences (with proper comma-space)
UPDATE rank_checks
SET location_name = REPLACE(location_name, ', United States, United States', ', United States')
WHERE location_name LIKE '%, United States, United States%';

-- Step 3: Fix double "United States" without proper spacing (,United States, United States)
UPDATE rank_checks
SET location_name = REPLACE(location_name, ',United States, United States', ', United States')
WHERE location_name LIKE '%,United States, United States%';

-- Step 4: Fix missing spaces after commas (e.g., "OR,United States" -> "OR, United States")
UPDATE rank_checks
SET location_name = REGEXP_REPLACE(location_name, ',([A-Za-z])', ', \1', 'g')
WHERE location_name ~ ',[A-Za-z]';

-- Step 5: Clean up any remaining double spaces
UPDATE rank_checks
SET location_name = REGEXP_REPLACE(location_name, '  +', ' ', 'g')
WHERE location_name LIKE '%  %';

-- Also fix gg_configs.location_name if it has similar issues
UPDATE gg_configs
SET location_name = REPLACE(location_name, ', United States, United States, United States', ', United States')
WHERE location_name LIKE '%, United States, United States, United States%';

UPDATE gg_configs
SET location_name = REPLACE(location_name, ', United States, United States', ', United States')
WHERE location_name LIKE '%, United States, United States%';

UPDATE gg_configs
SET location_name = REPLACE(location_name, ',United States, United States', ', United States')
WHERE location_name LIKE '%,United States, United States%';

UPDATE gg_configs
SET location_name = REGEXP_REPLACE(location_name, ',([A-Za-z])', ', \1', 'g')
WHERE location_name ~ ',[A-Za-z]';
