-- Migration 0082: Temporarily disable Phase 1 trigger for testing
-- This will help us identify if the trigger is causing the "Database error updating user" issue

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Keep the function but disable the trigger temporarily
-- This allows us to test signup without the trigger interfering

-- Add a comment explaining this is temporary
COMMENT ON FUNCTION public.handle_new_user() IS 'Temporarily disabled trigger - function exists but trigger is removed for testing signup issues'; 