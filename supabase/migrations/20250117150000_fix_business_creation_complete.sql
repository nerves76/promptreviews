-- Fix business_creation_complete flag for accounts that already have businesses
-- This ensures the pricing modal shows for accounts with no_plan that have completed business creation

-- Update all accounts that have businesses to set business_creation_complete = true
UPDATE accounts a
SET
    business_creation_complete = true,
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.account_id = a.id
)
AND (a.business_creation_complete IS NULL OR a.business_creation_complete = false);

-- Log the update
DO $$
DECLARE
    updated_count INT;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated business_creation_complete for % accounts that have businesses', updated_count;
END $$;