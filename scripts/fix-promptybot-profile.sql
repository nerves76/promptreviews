-- Fix Promptybot profile and business
-- Run this in Supabase SQL Editor to update existing Promptybot data

-- Update community profile
UPDATE community_profiles
SET
  display_name_override = 'Prompty',
  business_name_override = 'Prompt Reviews'
WHERE username = 'prompty-bot';

-- Ensure business exists with logo
INSERT INTO businesses (account_id, name, logo_url)
SELECT
  a.id,
  'Prompt Reviews',
  '/images/prompty-icon-prompt-reviews.png'
FROM accounts a
WHERE a.email = 'promptybot@promptreviews.app'
  AND NOT EXISTS (
    SELECT 1 FROM businesses b WHERE b.account_id = a.id
  );

-- Update existing business if it exists
UPDATE businesses
SET
  name = 'Prompt Reviews',
  logo_url = '/images/prompty-icon-prompt-reviews.png'
WHERE account_id IN (
  SELECT id FROM accounts WHERE email = 'promptybot@promptreviews.app'
);
