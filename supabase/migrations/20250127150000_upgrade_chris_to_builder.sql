-- Upgrade Chris's account to builder plan for testing
UPDATE accounts 
SET 
  plan = 'builder',
  max_contacts = 1000,
  max_prompt_pages = 10
WHERE user_id = 'a5442dee-9478-4714-9c02-b7a74c1128d1'; 