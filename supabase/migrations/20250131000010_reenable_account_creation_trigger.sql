-- Re-enable automatic account creation trigger
-- This fixes the setup error by ensuring accounts are created when users sign up

-- Create function to handle new user account creation
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if user is confirmed
  IF NEW.confirmed_at IS NOT NULL THEN
    -- Check if account already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      -- Create account record
      INSERT INTO public.accounts (
        id,
        email,
        first_name,
        last_name,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count,
        review_notifications_enabled,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0,
        true,
        NOW(),
        NOW()
      );
    END IF;

    -- Check if account_users record already exists
    IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = NEW.id AND account_id = NEW.id) THEN
      -- Create account_users record
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
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table for both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.account_users TO authenticated; 