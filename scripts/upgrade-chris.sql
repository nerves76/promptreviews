-- Upgrade Chris's account to builder plan
UPDATE accounts 
SET 
  plan = 'builder',
  max_contacts = 1000,
  max_prompt_pages = 10
WHERE user_id = 'a5442dee-9478-4714-9c02-b7a74c1128d1';

-- Verify the update
SELECT user_id, plan, max_contacts, max_prompt_pages 
FROM accounts 
WHERE user_id = 'a5442dee-9478-4714-9c02-b7a74c1128d1'; 