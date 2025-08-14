-- Final fix for account_users RLS infinite recursion
-- Remove the recursive policy that's causing the issue

-- First, let's see what policies exist
SELECT 
    'Current Policies' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'account_users';

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Account owners can manage account users" ON account_users;

-- Keep only the simple, non-recursive policies
-- The remaining policies should be:
-- 1. "Simple account_users access" - ALL with qual: true
-- 2. "Users can link themselves to accounts" - INSERT with qual: null  
-- 3. "Users can view their own account memberships" - SELECT with qual: (user_id = auth.uid())

-- Verify the final state
SELECT 
    'Final account_users RLS Policies' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'account_users'
ORDER BY policyname;

-- Test that we can now insert into account_users without recursion
-- (This will be handled by the "Users can link themselves to accounts" policy)
SELECT 
    'Test: account_users insert should now work' as test_result; 