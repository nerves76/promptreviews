-- Fix account_users relationships for existing accounts
-- After removing the foreign key constraint, we need to ensure proper relationships exist

-- For all accounts where id = a user id, create the account_users relationship
INSERT INTO account_users (account_id, user_id, role, created_at)
SELECT
    a.id as account_id,
    a.id as user_id,  -- In the old schema, account.id = user.id
    'owner' as role,
    COALESCE(a.created_at, NOW()) as created_at
FROM accounts a
WHERE EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = a.id
)
AND NOT EXISTS (
    SELECT 1 FROM account_users au
    WHERE au.account_id = a.id
    AND au.user_id = a.id
)
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Also ensure any accounts with user IDs in the new UUID format have relationships
-- This handles accounts that might have been created during the transition
INSERT INTO account_users (account_id, user_id, role, created_at)
SELECT DISTINCT
    a.id as account_id,
    u.id as user_id,
    'owner' as role,
    COALESCE(a.created_at, NOW()) as created_at
FROM accounts a
CROSS JOIN auth.users u
WHERE a.email = u.email  -- Match by email
AND NOT EXISTS (
    SELECT 1 FROM account_users au
    WHERE au.account_id = a.id
    AND au.user_id = u.id
)
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Log the results for debugging
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count FROM account_users;
    RAISE NOTICE 'Total account_users relationships: %', v_count;

    SELECT COUNT(DISTINCT user_id) INTO v_count FROM account_users;
    RAISE NOTICE 'Total unique users with accounts: %', v_count;

    SELECT COUNT(DISTINCT account_id) INTO v_count FROM account_users;
    RAISE NOTICE 'Total unique accounts: %', v_count;
END $$;