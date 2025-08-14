-- Fix account_users table to ensure all users are properly linked to their accounts
-- This is the root cause of the business detection issue

DO $$
DECLARE
    account_record RECORD;
    link_count INTEGER := 0;
BEGIN
    -- For each account, ensure there's an account_users entry
    FOR account_record IN 
        SELECT a.*
        FROM accounts a
        WHERE a.user_id IS NOT NULL  -- Only accounts that have a user_id
        AND NOT EXISTS (
            SELECT 1 FROM account_users au
            WHERE au.account_id = a.id
            AND au.user_id = a.user_id
        )
    LOOP
        -- Create the missing account_users link
        INSERT INTO account_users (
            account_id,
            user_id,
            role,
            created_at
        ) VALUES (
            account_record.id,
            account_record.user_id,
            'owner',  -- They own their own account
            NOW()
        ) ON CONFLICT (account_id, user_id) DO NOTHING;
        
        link_count := link_count + 1;
        RAISE NOTICE 'Created account_users link for account: % (user: %)', 
            account_record.id, account_record.user_id;
    END LOOP;
    
    RAISE NOTICE 'Created % new account_users links', link_count;
    
    -- Also handle accounts where user_id is NULL but we can match by email
    FOR account_record IN 
        SELECT a.*, u.id as auth_user_id
        FROM accounts a
        INNER JOIN auth.users u ON u.email = a.email
        WHERE a.user_id IS NULL
    LOOP
        -- Update the account with the correct user_id
        UPDATE accounts 
        SET user_id = account_record.auth_user_id
        WHERE id = account_record.id;
        
        -- Create account_users link
        INSERT INTO account_users (
            account_id,
            user_id,
            role,
            created_at
        ) VALUES (
            account_record.id,
            account_record.auth_user_id,
            'owner',
            NOW()
        ) ON CONFLICT (account_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Fixed account % with user_id and created link', account_record.id;
    END LOOP;
END $$;

-- Verify the fix
DO $$
DECLARE
    orphaned_accounts INTEGER;
    orphaned_users INTEGER;
    accounts_with_business INTEGER;
BEGIN
    -- Check for accounts without account_users entries
    SELECT COUNT(*) INTO orphaned_accounts
    FROM accounts a
    WHERE NOT EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = a.id
    );
    
    -- Check for authenticated users without account_users entries
    SELECT COUNT(*) INTO orphaned_users
    FROM auth.users u
    WHERE u.confirmed_at IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.user_id = u.id
    );
    
    -- Check how many accounts have businesses
    SELECT COUNT(DISTINCT a.id) INTO accounts_with_business
    FROM accounts a
    INNER JOIN businesses b ON b.account_id = a.id;
    
    RAISE NOTICE '================================';
    RAISE NOTICE 'Account integrity check:';
    RAISE NOTICE '  Orphaned accounts (no users): %', orphaned_accounts;
    RAISE NOTICE '  Orphaned users (no accounts): %', orphaned_users;
    RAISE NOTICE '  Accounts with businesses: %', accounts_with_business;
    RAISE NOTICE '================================';
    
    IF orphaned_accounts > 0 OR orphaned_users > 0 THEN
        RAISE WARNING 'Still have orphaned records! Manual intervention may be needed.';
    ELSE
        RAISE NOTICE '✅ All users and accounts are properly linked!';
    END IF;
END $$;