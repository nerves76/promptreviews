-- Verify and fix business_creation_complete for accounts that have businesses

-- First, let's see what we have
DO $$
BEGIN
    RAISE NOTICE 'Checking accounts that have businesses but business_creation_complete is false...';
END $$;

-- Show accounts needing update
SELECT
    a.id,
    a.email,
    a.plan,
    a.business_creation_complete,
    COUNT(b.id) as business_count
FROM accounts a
LEFT JOIN businesses b ON b.account_id = a.id
WHERE a.business_creation_complete = false
    AND EXISTS (
        SELECT 1 FROM businesses b2
        WHERE b2.account_id = a.id
    )
GROUP BY a.id, a.email, a.plan, a.business_creation_complete;

-- Fix accounts that have businesses but business_creation_complete is false
UPDATE accounts
SET
    business_creation_complete = true,
    updated_at = NOW()
WHERE business_creation_complete = false
    AND EXISTS (
        SELECT 1 FROM businesses b
        WHERE b.account_id = accounts.id
    );

-- Report results
DO $$
DECLARE
    updated_count INT;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Fixed business_creation_complete for % accounts', updated_count;
END $$;

-- Verify the fix - show all accounts with their business status
SELECT
    a.id,
    COALESCE(a.email, 'no-email') as email,
    a.plan,
    a.business_creation_complete,
    a.is_free_account,
    COUNT(b.id) as business_count,
    CASE
        WHEN a.plan = 'no_plan' AND a.business_creation_complete = true THEN 'Should show pricing modal'
        WHEN a.plan = 'no_plan' AND a.business_creation_complete = false THEN 'Should redirect to create business'
        ELSE 'No action needed'
    END as expected_behavior
FROM accounts a
LEFT JOIN businesses b ON b.account_id = a.id
WHERE a.plan = 'no_plan' OR (a.plan IS NULL)
GROUP BY a.id, a.email, a.plan, a.business_creation_complete, a.is_free_account
ORDER BY a.created_at DESC;