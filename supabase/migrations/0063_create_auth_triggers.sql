-- Create triggers to automatically create account and account_user records when users sign up
-- This fixes the "Database error granting user" issue

-- =====================================================
-- CREATE TRIGGER FUNCTION FOR NEW USERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create account record
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count
    ) VALUES (
        NEW.id,
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0
    );
    
    -- Create account_user record
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        NEW.id,
        NEW.id,
        'owner',
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER ON AUTH.USERS
-- =====================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ADD COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates account and account_user records when a new user signs up'; 