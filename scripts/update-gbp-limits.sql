-- Script to update Google Business Profile location limits for specific accounts
-- Similar to how we handle prompt page limits

-- Example: Increase GBP location limit for a specific account
-- Replace 'ACCOUNT_ID_HERE' with the actual account ID

-- View current limits for an account
SELECT 
  id,
  plan,
  max_gbp_locations,
  max_prompt_pages,
  max_contacts
FROM accounts
WHERE id = 'ACCOUNT_ID_HERE';

-- Update GBP location limit for a specific account
-- UPDATE accounts 
-- SET max_gbp_locations = 20  -- Set to desired limit
-- WHERE id = 'ACCOUNT_ID_HERE';

-- Update limits for multiple accounts at once
-- UPDATE accounts 
-- SET max_gbp_locations = 15
-- WHERE id IN ('account_id_1', 'account_id_2', 'account_id_3');

-- Reset to plan defaults
-- UPDATE accounts 
-- SET max_gbp_locations = CASE 
--     WHEN plan = 'maven' THEN 10
--     WHEN plan = 'builder' THEN 5
--     ELSE 0
--   END
-- WHERE id = 'ACCOUNT_ID_HERE';

-- Find accounts that might need higher limits (those with many locations)
-- This query will work once the selected_gbp_locations table exists
-- SELECT 
--   a.id,
--   a.plan,
--   a.max_gbp_locations,
--   COUNT(s.location_id) as selected_locations
-- FROM accounts a
-- LEFT JOIN selected_gbp_locations s ON s.account_id = a.id
-- GROUP BY a.id, a.plan, a.max_gbp_locations
-- HAVING COUNT(s.location_id) >= a.max_gbp_locations;