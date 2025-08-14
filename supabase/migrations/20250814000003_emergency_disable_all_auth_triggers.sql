-- EMERGENCY: Disable ALL auth triggers to fix login
-- This completely removes all triggers on auth.users table

DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Drop all triggers on auth.users table
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.tgname;
    END LOOP;
END $$;

-- Ensure basic account exists for existing users
-- This is a safety check that doesn't require triggers
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id, email FROM auth.users WHERE confirmed_at IS NOT NULL
    LOOP
        -- Create account if it doesn't exist
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
            user_rec.id,
            user_rec.email,
            'no_plan',
            NOW(),
            NOW() + INTERVAL '14 days',
            NOW(),
            NOW(),
            user_rec.id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.accounts WHERE id = user_rec.id
        );
        
        -- Create account_users link if it doesn't exist
        INSERT INTO public.account_users (
            account_id,
            user_id,
            role,
            created_at
        )
        SELECT
            user_rec.id,
            user_rec.id,
            'owner',
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.account_users 
            WHERE user_id = user_rec.id AND account_id = user_rec.id
        );
    END LOOP;
END $$;

-- Add comment to track this emergency fix
COMMENT ON TABLE auth.users IS 'ALL triggers disabled on 2025-08-14 due to login errors. Manual account creation in place.';