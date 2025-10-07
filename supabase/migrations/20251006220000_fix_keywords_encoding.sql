-- Fix double-encoded keywords in businesses table
-- Clean up any malformed keyword data from previous migration

-- First, handle businesses.keywords that got double-encoded
UPDATE businesses
SET keywords = ARRAY[]::TEXT[]
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
  AND keywords::text LIKE '%{\\"%';

-- For any remaining non-empty keywords, clean them up
-- This handles cases where keywords were stored as JSON-stringified arrays
UPDATE businesses
SET keywords = (
  SELECT array_agg(trim(both '"' from elem))
  FROM unnest(keywords) AS elem
  WHERE trim(both '"' from elem) != ''
)
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0;

-- Remove empty string elements
UPDATE businesses
SET keywords = (
  SELECT array_agg(elem)
  FROM unnest(keywords) AS elem
  WHERE elem != '' AND elem IS NOT NULL
)
WHERE keywords IS NOT NULL;

-- Set NULL arrays to empty arrays
UPDATE businesses
SET keywords = ARRAY[]::TEXT[]
WHERE keywords IS NULL;

-- Do the same for prompt_pages.keywords
UPDATE prompt_pages
SET keywords = ARRAY[]::TEXT[]
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0
  AND keywords::text LIKE '%{\\"%';

UPDATE prompt_pages
SET keywords = (
  SELECT array_agg(trim(both '"' from elem))
  FROM unnest(keywords) AS elem
  WHERE trim(both '"' from elem) != ''
)
WHERE keywords IS NOT NULL
  AND array_length(keywords, 1) > 0;

UPDATE prompt_pages
SET keywords = (
  SELECT array_agg(elem)
  FROM unnest(keywords) AS elem
  WHERE elem != '' AND elem IS NOT NULL
)
WHERE keywords IS NOT NULL;

UPDATE prompt_pages
SET keywords = ARRAY[]::TEXT[]
WHERE keywords IS NULL;
