-- Fix account visibility for the account switcher
-- The inner join on accounts is failing due to restrictive RLS policies

-- Drop existing overly complex policy
DROP POLICY IF EXISTS "Users can view accounts" ON accounts;

-- Create a simpler policy that allows users to see accounts they belong to
CREATE POLICY "Users can view their accounts" ON accounts
    FOR SELECT USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- Also ensure account_users policies allow proper access
DROP POLICY IF EXISTS "Users can view own account memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view their memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view their account memberships" ON account_users;

-- Simpler policy for account_users
CREATE POLICY "Users view own memberships" ON account_users
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Debug: Check if relationships exist
DO $$
DECLARE
    v_count integer;
    v_user_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count FROM account_users;
    RAISE NOTICE 'Total account_users records: %', v_count;

    SELECT COUNT(DISTINCT user_id) INTO v_user_count FROM account_users;
    RAISE NOTICE 'Users with account relationships: %', v_user_count;

    -- Show a sample of relationships for debugging
    FOR v_count IN
        SELECT COUNT(*) as cnt, user_id
        FROM account_users
        GROUP BY user_id
        HAVING COUNT(*) > 1
        LIMIT 5
    LOOP
        RAISE NOTICE 'User % has multiple accounts', v_count;
    END LOOP;
END $$;