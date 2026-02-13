-- Add account-level survey response pool
-- Replaces per-survey free_responses_remaining with a shared account pool

-- 1. Add column with default for new accounts (free/no_plan = 100)
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS survey_responses_remaining INT NOT NULL DEFAULT 100;

-- 2. Set initial values based on each account's current plan
UPDATE accounts SET survey_responses_remaining = CASE
  WHEN plan IN ('grower') THEN 500
  WHEN plan IN ('builder', 'accelerator') THEN 2000
  WHEN plan IN ('maven') THEN 10000
  WHEN plan IN ('enterprise') THEN 50000
  ELSE 100  -- free, no_plan, trial, null
END;

-- 3. Create atomic decrement function
CREATE OR REPLACE FUNCTION decrement_account_survey_responses(account_uuid UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  new_value INT;
BEGIN
  UPDATE accounts
  SET survey_responses_remaining = survey_responses_remaining - 1
  WHERE id = account_uuid
    AND survey_responses_remaining > 0
  RETURNING survey_responses_remaining INTO new_value;

  IF NOT FOUND THEN
    RETURN -1;  -- signals no capacity
  END IF;

  RETURN new_value;
END;
$$;

-- 4. Create atomic increment function (for purchasing response packs)
CREATE OR REPLACE FUNCTION increment_account_survey_responses(account_uuid UUID, amount INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  new_value INT;
BEGIN
  UPDATE accounts
  SET survey_responses_remaining = survey_responses_remaining + amount
  WHERE id = account_uuid
  RETURNING survey_responses_remaining INTO new_value;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN new_value;
END;
$$;
