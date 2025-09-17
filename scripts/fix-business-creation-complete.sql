-- Direct SQL to check and fix business_creation_complete for your accounts

-- First, let's see the current state
SELECT
    a.id,
    a.business_name,
    a.plan,
    a.business_creation_complete,
    a.is_free_account,
    CASE
        WHEN b.id IS NOT NULL THEN 'Has Business'
        ELSE 'No Business'
    END as business_status,
    b.name as business_entity_name
FROM accounts a
LEFT JOIN businesses b ON b.account_id = a.id
WHERE a.email = 'boltro3000@gmail.com'
ORDER BY a.created_at DESC;

-- Now update accounts that have businesses but business_creation_complete is false
UPDATE accounts a
SET
    business_creation_complete = true,
    updated_at = NOW()
WHERE a.email = 'boltro3000@gmail.com'
AND EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.account_id = a.id
)
AND (a.business_creation_complete IS FALSE OR a.business_creation_complete IS NULL);

-- Verify the update
SELECT
    a.id,
    a.business_name,
    a.plan,
    a.business_creation_complete,
    COUNT(b.id) as business_count
FROM accounts a
LEFT JOIN businesses b ON b.account_id = a.id
WHERE a.email = 'boltro3000@gmail.com'
GROUP BY a.id, a.business_name, a.plan, a.business_creation_complete
ORDER BY a.created_at DESC;