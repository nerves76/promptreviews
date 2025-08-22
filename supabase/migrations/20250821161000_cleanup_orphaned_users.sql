-- Clean up any orphaned users that don't have corresponding accounts
-- This can happen when account creation fails but user creation succeeded

DO $$
DECLARE
    orphaned_user RECORD;
    user_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for orphaned users without accounts...';
    
    -- Find users that don't have accounts
    FOR orphaned_user IN 
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN public.accounts a ON a.id = u.id
        WHERE a.id IS NULL
        AND u.email IS NOT NULL
    LOOP
        user_count := user_count + 1;
        RAISE NOTICE 'Found orphaned user: % (email: %, created: %)', 
            orphaned_user.id, orphaned_user.email, orphaned_user.created_at;
        
        -- Try to create an account for this user
        BEGIN
            INSERT INTO public.accounts (
                id,
                user_id,
                email,
                first_name,
                last_name,
                plan,
                trial_start,
                trial_end,
                is_free_account,
                custom_prompt_page_count,
                contact_count,
                review_notifications_enabled
            )
            SELECT 
                u.id,
                u.id,
                u.email,
                COALESCE(u.raw_user_meta_data->>'first_name', ''),
                COALESCE(u.raw_user_meta_data->>'last_name', ''),
                'no_plan',
                NOW(),
                NOW() + INTERVAL '14 days',
                false,
                0,
                0,
                true
            FROM auth.users u
            WHERE u.id = orphaned_user.id;
            
            RAISE NOTICE 'Created account for orphaned user: %', orphaned_user.email;
            
            -- Also ensure account_users record exists
            INSERT INTO public.account_users (account_id, user_id, role, created_at)
            VALUES (orphaned_user.id, orphaned_user.id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create account for user %: %', orphaned_user.email, SQLERRM;
            -- If we can't create an account, we might want to delete the orphaned user
            -- But let's not do that automatically - just report it
        END;
    END LOOP;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No orphaned users found';
    ELSE
        RAISE NOTICE 'Processed % orphaned users', user_count;
    END IF;
END $$;

-- Also check for accounts without corresponding users (shouldn't happen but let's check)
DO $$
DECLARE
    orphaned_account RECORD;
    account_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for orphaned accounts without users...';
    
    FOR orphaned_account IN 
        SELECT a.id, a.email
        FROM public.accounts a
        LEFT JOIN auth.users u ON u.id = a.id
        WHERE u.id IS NULL
    LOOP
        account_count := account_count + 1;
        RAISE NOTICE 'Found orphaned account: % (email: %)', 
            orphaned_account.id, orphaned_account.email;
        -- These should probably be deleted but let's just report them
    END LOOP;
    
    IF account_count = 0 THEN
        RAISE NOTICE 'No orphaned accounts found';
    ELSE
        RAISE NOTICE 'Found % orphaned accounts', account_count;
    END IF;
END $$;