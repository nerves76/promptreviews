-- Disable the auth trigger that might be causing authentication issues
-- This is a temporary fix to isolate the problem

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user(); 