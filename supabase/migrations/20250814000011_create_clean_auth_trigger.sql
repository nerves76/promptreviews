-- Create a clean auth trigger for new user account creation
-- This one has NO GRANT to postgres role

CREATE OR REPLACE FUNCTION handle_new_user_clean()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process confirmed users
  IF NEW.confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create account if doesn't exist
  INSERT INTO public.accounts (
    id,
    email,
    plan,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    user_id,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'no_plan',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  ) ON CONFLICT (id) DO NOTHING;

  -- Create account_users link if doesn't exist
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
  ) ON CONFLICT (user_id, account_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but always return NEW to not block auth
    RAISE WARNING 'Error in handle_new_user_clean: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- IMPORTANT: Only grant to roles that exist in Supabase production
-- NO 'postgres' role!
REVOKE ALL ON FUNCTION handle_new_user_clean() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION handle_new_user_clean() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_clean() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user_clean() TO service_role;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_clean
  AFTER INSERT OR UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user_clean();

-- Add comment
COMMENT ON FUNCTION handle_new_user_clean() IS 'Clean auth handler - no postgres role grants, handles new user account creation';