-- Re-enable RLS with proper policies that support multi-account scenarios
-- Date: 2025-09-01
-- 
-- This migration re-enables Row Level Security on critical tables with policies that:
-- 1. Allow authentication to work properly
-- 2. Support multi-account switching
-- 3. Allow team invitations and collaborations
-- 4. Use service role for administrative operations

-- =====================================================
-- STEP 1: ENABLE RLS ON CRITICAL TABLES
-- =====================================================

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on account_users table  
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on businesses table (if not already enabled)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- =====================================================

-- Drop all existing policies on accounts
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
DROP POLICY IF EXISTS "Service role can access all accounts" ON public.accounts;
DROP POLICY IF EXISTS "own_account_all" ON public.accounts;

-- Drop all existing policies on account_users
DROP POLICY IF EXISTS "Users can view their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Users can update their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Service role can access all account_users" ON public.account_users;
DROP POLICY IF EXISTS "own_relationships_all" ON public.account_users;

-- Drop all existing policies on businesses
DROP POLICY IF EXISTS "account_businesses_all" ON public.businesses;
DROP POLICY IF EXISTS "Users can access businesses through account" ON public.businesses;

-- =====================================================
-- STEP 3: CREATE NEW POLICIES FOR ACCOUNTS TABLE
-- =====================================================

-- Policy 1: Users can SELECT accounts they have access to (via account_users)
CREATE POLICY "accounts_select_policy" ON public.accounts
FOR SELECT TO authenticated
USING (
  -- User can see their own account (backward compatibility)
  id = auth.uid() 
  OR 
  -- User can see accounts they're linked to via account_users
  id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Users can UPDATE accounts they own or have owner role
CREATE POLICY "accounts_update_policy" ON public.accounts
FOR UPDATE TO authenticated
USING (
  -- User owns this account (backward compatibility)
  id = auth.uid()
  OR
  -- User has owner role in this account
  id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
)
WITH CHECK (
  -- Same conditions for the updated row
  id = auth.uid()
  OR
  id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Policy 3: Allow INSERT for new account creation (handled by service role in app)
-- We need this for the auth flow to work
CREATE POLICY "accounts_insert_policy" ON public.accounts
FOR INSERT TO authenticated
WITH CHECK (
  -- Users can only create an account with their own ID
  id = auth.uid()
);

-- Policy 4: Service role bypass for administrative operations
CREATE POLICY "accounts_service_role_policy" ON public.accounts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 4: CREATE NEW POLICIES FOR ACCOUNT_USERS TABLE
-- =====================================================

-- Policy 1: Users can SELECT their own account_user records
CREATE POLICY "account_users_select_policy" ON public.account_users
FOR SELECT TO authenticated
USING (
  -- User can see their own relationships
  user_id = auth.uid()
  OR
  -- User can see other team members if they're in the same account with appropriate role
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'member')
  )
);

-- Policy 2: Users can UPDATE their own account_user records (for preferences)
CREATE POLICY "account_users_update_policy" ON public.account_users
FOR UPDATE TO authenticated
USING (
  -- User can update their own record
  user_id = auth.uid()
  OR
  -- Account owners can update team member records
  (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  )
)
WITH CHECK (
  -- Same conditions for the updated row
  user_id = auth.uid()
  OR
  (
    account_id IN (
      SELECT account_id 
      FROM public.account_users 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  )
);

-- Policy 3: Allow INSERT for new relationships (team invitations)
CREATE POLICY "account_users_insert_policy" ON public.account_users
FOR INSERT TO authenticated
WITH CHECK (
  -- Users can create their own relationships
  user_id = auth.uid()
  OR
  -- Account owners can add team members
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Policy 4: Allow DELETE for removing team members
CREATE POLICY "account_users_delete_policy" ON public.account_users
FOR DELETE TO authenticated
USING (
  -- Users can remove themselves from an account
  user_id = auth.uid()
  OR
  -- Account owners can remove team members
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Policy 5: Service role bypass for administrative operations
CREATE POLICY "account_users_service_role_policy" ON public.account_users
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 5: CREATE NEW POLICIES FOR BUSINESSES TABLE
-- =====================================================

-- Policy 1: Users can access businesses through their account relationships
CREATE POLICY "businesses_select_policy" ON public.businesses
FOR SELECT TO authenticated
USING (
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Users can modify businesses if they have appropriate role
CREATE POLICY "businesses_modify_policy" ON public.businesses
FOR ALL TO authenticated
USING (
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'member')
  )
)
WITH CHECK (
  account_id IN (
    SELECT account_id 
    FROM public.account_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'member')
  )
);

-- Policy 3: Service role bypass for administrative operations
CREATE POLICY "businesses_service_role_policy" ON public.businesses
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist for better RLS performance
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_account ON public.account_users(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON public.businesses(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_id ON public.accounts(id);

-- =====================================================
-- STEP 7: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users have proper permissions
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.account_users TO authenticated;
GRANT ALL ON public.businesses TO authenticated;

-- Ensure service role has full access
GRANT ALL ON public.accounts TO service_role;
GRANT ALL ON public.account_users TO service_role;
GRANT ALL ON public.businesses TO service_role;

-- =====================================================
-- STEP 8: ADD SAFETY CHECK FUNCTION
-- =====================================================

-- Create a function to verify RLS is working properly
CREATE OR REPLACE FUNCTION public.verify_rls_enabled()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.relname::text as table_name,
    c.relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname IN ('accounts', 'account_users', 'businesses')
  ORDER BY c.relname;
$$;

-- =====================================================
-- VERIFICATION COMMENT
-- =====================================================
-- After running this migration, verify RLS is working by:
-- 1. Testing user sign up
-- 2. Testing user sign in
-- 3. Testing account switching
-- 4. Testing team invitations
-- 5. Running: SELECT * FROM public.verify_rls_enabled();