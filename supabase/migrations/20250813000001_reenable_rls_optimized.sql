-- Re-enable RLS policies with performance optimizations
-- Date: 2025-08-13
-- 
-- This migration re-enables RLS on critical tables with optimized policies
-- for better performance while maintaining security
--
-- Strategy:
-- 1. Create optimized indexes for RLS policy lookups
-- 2. Use simpler, faster RLS policies
-- 3. Enable RLS incrementally with testing

-- =====================================================
-- STEP 1: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Index for account_users lookups (most common RLS check)
CREATE INDEX IF NOT EXISTS idx_account_users_user_id 
ON public.account_users(user_id);

CREATE INDEX IF NOT EXISTS idx_account_users_account_id 
ON public.account_users(account_id);

CREATE INDEX IF NOT EXISTS idx_account_users_user_account 
ON public.account_users(user_id, account_id);

-- Index for accounts table
CREATE INDEX IF NOT EXISTS idx_accounts_id 
ON public.accounts(id);

CREATE INDEX IF NOT EXISTS idx_accounts_is_admin 
ON public.accounts(is_admin) 
WHERE is_admin = true; -- Partial index for admin checks

-- Index for businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_account_id 
ON public.businesses(account_id);

-- =====================================================
-- STEP 2: CREATE OPTIMIZED RLS POLICIES
-- =====================================================

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
DROP POLICY IF EXISTS "Service role has full access to accounts" ON public.accounts;

-- Optimized policy: Users can view accounts they belong to
CREATE POLICY "Users can view accounts they belong to"
ON public.accounts
FOR SELECT
USING (
  -- User owns the account OR is a member
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM public.account_users
    WHERE account_users.user_id = auth.uid()
    AND account_users.account_id = accounts.id
  )
);

-- Optimized policy: Users can update accounts they own
CREATE POLICY "Users can update accounts they own"
ON public.accounts
FOR UPDATE
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1 FROM public.account_users
    WHERE account_users.user_id = auth.uid()
    AND account_users.account_id = accounts.id
    AND account_users.role = 'owner'
  )
);

-- Service role bypass for system operations
CREATE POLICY "Service role has full access to accounts"
ON public.accounts
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- STEP 3: ENABLE RLS ON ACCOUNT_USERS TABLE
-- =====================================================

ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their account relationships" ON public.account_users;
DROP POLICY IF EXISTS "Account owners can manage users" ON public.account_users;
DROP POLICY IF EXISTS "Service role has full access to account_users" ON public.account_users;

-- Users can view their own relationships
CREATE POLICY "Users can view their account relationships"
ON public.account_users
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.account_users au2
    WHERE au2.user_id = auth.uid()
    AND au2.account_id = account_users.account_id
  )
);

-- Account owners can manage account users
CREATE POLICY "Account owners can manage account users"
ON public.account_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.account_users au
    WHERE au.user_id = auth.uid()
    AND au.account_id = account_users.account_id
    AND au.role = 'owner'
  )
);

-- Service role bypass
CREATE POLICY "Service role has full access to account_users"
ON public.account_users
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- STEP 4: ENABLE RLS ON BUSINESSES TABLE
-- =====================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view businesses for their accounts" ON public.businesses;
DROP POLICY IF EXISTS "Users can manage businesses for owned accounts" ON public.businesses;
DROP POLICY IF EXISTS "Service role has full access to businesses" ON public.businesses;

-- Users can view businesses for their accounts
CREATE POLICY "Users can view businesses for their accounts"
ON public.businesses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.account_users
    WHERE account_users.user_id = auth.uid()
    AND account_users.account_id = businesses.account_id
  )
);

-- Users can manage businesses for accounts they own
CREATE POLICY "Users can manage businesses for owned accounts"
ON public.businesses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.account_users
    WHERE account_users.user_id = auth.uid()
    AND account_users.account_id = businesses.account_id
    AND account_users.role IN ('owner', 'admin')
  )
);

-- Service role bypass
CREATE POLICY "Service role has full access to businesses"
ON public.businesses
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTION FOR PERFORMANCE
-- =====================================================

-- Create a fast function to check if user has access to account
CREATE OR REPLACE FUNCTION public.user_has_account_access(
  user_id uuid,
  account_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.account_users
    WHERE account_users.user_id = $1
    AND account_users.account_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create index on the function for better performance
CREATE INDEX IF NOT EXISTS idx_user_account_access 
ON public.account_users (user_id, account_id);

-- =====================================================
-- STEP 6: VERIFY RLS STATUS
-- =====================================================

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('accounts', 'account_users', 'businesses');

-- =====================================================
-- STEP 7: ADD MONITORING COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view accounts they belong to" ON public.accounts 
IS 'Optimized policy using direct ID comparison and indexed EXISTS clause';

COMMENT ON POLICY "Users can view their account relationships" ON public.account_users 
IS 'Allows users to see all relationships for accounts they belong to';

COMMENT ON POLICY "Users can view businesses for their accounts" ON public.businesses 
IS 'Uses indexed account_users lookup for performance';

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================
-- To rollback this migration, run:
-- ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;