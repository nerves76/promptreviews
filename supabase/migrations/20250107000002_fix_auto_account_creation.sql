-- Fix automatic account creation trigger
-- This version handles errors gracefully and doesn't block user creation

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_account();

-- Create improved function with error handling
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Use exception handling to prevent blocking user creation
  BEGIN
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
      has_seen_welcome,
      review_notifications_enabled,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      'no_plan',
      NOW(),
      NOW() + INTERVAL '14 days',
      false,
      0,
      0,
      false,
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING; -- Don't fail if account already exists

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
    ) ON CONFLICT (user_id, account_id) DO NOTHING; -- Don't fail if record already exists

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Failed to create account for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs AFTER user creation to avoid blocking
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.account_users TO authenticated; 