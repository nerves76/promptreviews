-- Add automatic account creation trigger
-- This replaces the API-based account creation with a reliable database trigger

-- Create function to handle new user account creation
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER AS $$
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
  );

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.account_users TO authenticated; 