-- Update default free responses from 10 to 50
ALTER TABLE surveys ALTER COLUMN free_responses_remaining SET DEFAULT 50;

-- Update any existing surveys that still have the old default of 10
UPDATE surveys SET free_responses_remaining = 50 WHERE free_responses_remaining = 10;
