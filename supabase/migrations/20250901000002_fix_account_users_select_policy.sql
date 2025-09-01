-- Fix account_users SELECT policy to allow users to always see their own records
-- Date: 2025-09-01
-- 
-- This migration fixes the issue where users can't fetch their accounts after signup
-- The problem was in the account_users SELECT policy which had complex logic
-- that could fail during initial account creation.

-- Drop the existing SELECT policy on account_users
DROP POLICY IF EXISTS "account_users_select_policy" ON public.account_users;

-- Create a simpler, more reliable SELECT policy
-- Users should ALWAYS be able to see records where they are the user
CREATE POLICY "account_users_select_policy" ON public.account_users
FOR SELECT TO authenticated
USING (
  -- User can ALWAYS see their own relationships
  user_id = auth.uid()
);

-- Also ensure the INSERT policy allows self-insertion properly
DROP POLICY IF EXISTS "account_users_insert_policy" ON public.account_users;

CREATE POLICY "account_users_insert_policy" ON public.account_users
FOR INSERT TO authenticated
WITH CHECK (
  -- Users can create their own relationships (important for signup flow)
  user_id = auth.uid()
  OR
  -- Account owners can add team members
  account_id IN (
    SELECT au.account_id 
    FROM public.account_users au
    WHERE au.user_id = auth.uid() 
    AND au.role = 'owner'
  )
);

-- Ensure the accounts SELECT policy is also simplified for reliability
DROP POLICY IF EXISTS "accounts_select_policy" ON public.accounts;

CREATE POLICY "accounts_select_policy" ON public.accounts
FOR SELECT TO authenticated
USING (
  -- User can see their own account (backward compatibility for user_id = account_id)
  id = auth.uid() 
  OR 
  -- User can see accounts they're linked to via account_users (using EXISTS for better performance)
  EXISTS (
    SELECT 1
    FROM public.account_users au
    WHERE au.account_id = id
    AND au.user_id = auth.uid()
  )
);

-- Add a comment explaining the critical nature of these policies
COMMENT ON POLICY "account_users_select_policy" ON public.account_users IS 
'Critical policy for auth flow - users must ALWAYS be able to see their own account_user records';

COMMENT ON POLICY "accounts_select_policy" ON public.accounts IS 
'Allows users to see accounts they have access to via account_users table';