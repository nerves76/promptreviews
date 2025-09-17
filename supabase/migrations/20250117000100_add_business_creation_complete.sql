-- Add business_creation_complete flag to track account setup status
ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS business_creation_complete BOOLEAN DEFAULT false;

-- Update existing accounts based on whether they have businesses
UPDATE accounts a
SET business_creation_complete = true
WHERE EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.account_id = a.id
);

-- Add comment for clarity
COMMENT ON COLUMN accounts.business_creation_complete IS
'Indicates if the account has completed business profile creation. Used to determine navigation flow: false + no_plan = create-business, true + no_plan = pricing modal';

-- Log the update results
DO $$
DECLARE
    v_updated_count integer;
    v_total_count integer;
BEGIN
    SELECT COUNT(*) INTO v_total_count FROM accounts;
    SELECT COUNT(*) INTO v_updated_count FROM accounts WHERE business_creation_complete = true;

    RAISE NOTICE 'Business creation status update complete: % of % accounts marked as complete',
        v_updated_count, v_total_count;
END $$;