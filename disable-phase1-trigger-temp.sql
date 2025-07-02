-- Temporarily disable Phase 1 trigger to test signup
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Also disable the function temporarily
DROP FUNCTION IF EXISTS public.handle_new_user();

-- This will allow us to test if the trigger is causing the signup error 