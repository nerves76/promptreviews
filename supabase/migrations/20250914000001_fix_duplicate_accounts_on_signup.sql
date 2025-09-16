-- Fix duplicate accounts being created on signup
-- This migration consolidates account creation to a single trigger

-- First, drop the old trigger that doesn't check for existing accounts
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Keep only the newer trigger that has proper existence checks
-- The handle_new_user_account function from 20250131000010 already has:
-- 1. IF NOT EXISTS check for accounts table
-- 2. IF NOT EXISTS check for account_users table
-- 3. Handles both INSERT and UPDATE events

-- Ensure the correct trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();