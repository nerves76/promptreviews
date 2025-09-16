-- Fix account and business linking issues
-- This ensures users are properly linked to their accounts and businesses

-- Temporarily disable the trigger if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'populate_account_user_fields_trigger'
    ) THEN
        ALTER TABLE account_users DISABLE TRIGGER populate_account_user_fields_trigger;
    END IF;
END $$;

-- First, ensure all authenticated users have their accounts properly linked in account_users
DO $$
DECLARE
    user_record RECORD;
    account_record RECORD;
BEGIN
    -- Loop through all auth users
    FOR user_record IN 
        SELECT id, email, raw_user_meta_data
        FROM auth.users
        WHERE confirmed_at IS NOT NULL
    LOOP
        -- Find or create account for this user
        SELECT * INTO account_record
        FROM accounts
        WHERE email = user_record.email
        OR user_id = user_record.id
        OR id = user_record.id
        LIMIT 1;
        
        IF account_record.id IS NOT NULL THEN
            -- Ensure account_users link exists
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (account_record.id, user_record.id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
            
            -- Also ensure the account has the correct user_id
            UPDATE accounts 
            SET user_id = user_record.id
            WHERE id = account_record.id
            AND user_id IS NULL;
        ELSE
            -- Create account if it doesn't exist
            INSERT INTO accounts (
                id,
                email,
                user_id,
                plan,
                trial_start,
                trial_end,
                created_at,
                updated_at,
                first_name,
                last_name
            ) VALUES (
                user_record.id,
                user_record.email,
                user_record.id,
                'no_plan',
                NOW(),
                NOW() + INTERVAL '14 days',
                NOW(),
                NOW(),
                COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
                COALESCE(user_record.raw_user_meta_data->>'last_name', '')
            ) ON CONFLICT (id) DO NOTHING;
            
            -- Create account_users link
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (user_record.id, user_record.id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- Ensure businesses are properly linked to accounts
-- Update any businesses that might have lost their account_id
UPDATE businesses b
SET account_id = a.id
FROM accounts a
WHERE b.account_id IS NULL
AND a.business_name = b.name
AND a.id IS NOT NULL;

-- Verify data integrity
DO $$
DECLARE
    orphaned_businesses INTEGER;
    users_without_accounts INTEGER;
    accounts_without_users INTEGER;
BEGIN
    -- Count orphaned businesses
    SELECT COUNT(*) INTO orphaned_businesses
    FROM businesses
    WHERE account_id IS NULL;
    
    -- Count users without account links
    SELECT COUNT(*) INTO users_without_accounts
    FROM auth.users u
    WHERE confirmed_at IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.user_id = u.id
    );
    
    -- Count accounts without user links
    SELECT COUNT(*) INTO accounts_without_users  
    FROM accounts a
    WHERE NOT EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = a.id
    );
    
    RAISE NOTICE 'Data integrity check:';
    RAISE NOTICE '  Orphaned businesses: %', orphaned_businesses;
    RAISE NOTICE '  Users without accounts: %', users_without_accounts;
    RAISE NOTICE '  Accounts without users: %', accounts_without_users;
END $$;

-- Re-enable the trigger if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'populate_account_user_fields_trigger'
    ) THEN
        ALTER TABLE account_users ENABLE TRIGGER populate_account_user_fields_trigger;
    END IF;
END $$;

-- Only update readable fields if columns exist
DO $$
BEGIN
    -- Check if the columns exist before trying to update them
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'account_users' 
        AND column_name = 'account_name'
    ) THEN
        UPDATE account_users au
        SET 
            account_name = COALESCE(a.first_name || ' ' || a.last_name, a.email),
            account_email = a.email,
            first_name = a.first_name,
            last_name = a.last_name,
            business_name = b.name
        FROM accounts a
        LEFT JOIN businesses b ON b.account_id = a.id
        WHERE au.account_id = a.id;
    END IF;
END $$;

-- Add comment
COMMENT ON SCHEMA public IS 'Fixed account-business-user relationships after function restoration';