-- NUCLEAR OPTION: Disable ALL auth triggers to allow login
-- We'll handle account creation manually in the application

-- Drop ALL triggers on auth.users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- Ensure accounts exist for all current users
DO $$
DECLARE
    user_rec RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR user_rec IN 
        SELECT id, email, raw_user_meta_data, confirmed_at 
        FROM auth.users 
        WHERE confirmed_at IS NOT NULL
    LOOP
        -- Create account if missing
        INSERT INTO public.accounts (
            id,
            email,
            plan,
            trial_start,
            trial_end,
            created_at,
            updated_at,
            user_id
        ) VALUES (
            user_rec.id,
            COALESCE(user_rec.email, ''),
            'no_plan',
            COALESCE(user_rec.confirmed_at, NOW()),
            COALESCE(user_rec.confirmed_at, NOW()) + INTERVAL '14 days',
            COALESCE(user_rec.confirmed_at, NOW()),
            NOW(),
            user_rec.id
        ) ON CONFLICT (id) DO UPDATE
        SET updated_at = NOW();
        
        -- Create account_users link if missing
        INSERT INTO public.account_users (
            account_id,
            user_id,
            role,
            created_at
        ) VALUES (
            user_rec.id,
            user_rec.id,
            'owner',
            COALESCE(user_rec.confirmed_at, NOW())
        ) ON CONFLICT (user_id, account_id) DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Processed % users', v_count;
END $$;

-- Create a simple function that can be called manually (no trigger)
CREATE OR REPLACE FUNCTION ensure_user_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create account if missing
    INSERT INTO public.accounts (
        id,
        email,
        plan,
        trial_start,
        trial_end,
        created_at,
        updated_at,
        user_id
    )
    SELECT
        u.id,
        COALESCE(u.email, ''),
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW(),
        u.id
    FROM auth.users u
    WHERE u.id = p_user_id
    ON CONFLICT (id) DO NOTHING;
    
    -- Create account_users link if missing
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        p_user_id,
        p_user_id,
        'owner',
        NOW()
    ) ON CONFLICT (user_id, account_id) DO NOTHING;
END;
$$;

-- Grant execute to authenticated users only (no postgres!)
REVOKE ALL ON FUNCTION ensure_user_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_user_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_account(uuid) TO service_role;

-- Add comment
COMMENT ON FUNCTION ensure_user_account(uuid) IS 'Manual account creation - no triggers, no postgres grants';

-- Log the state
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass 
    AND tgisinternal = false;
    
    RAISE NOTICE 'Auth triggers remaining: %', trigger_count;
END $$;