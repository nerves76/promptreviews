-- Fix team account access by updating RLS policies
-- Team members need access to accounts they belong to via account_users table

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;

-- Create new policies that allow team access
-- Users can view accounts they belong to (either own or team accounts)
CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    id = auth.uid() OR 
    id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update accounts they belong to as owner
CREATE POLICY "Users can update accounts they own" ON public.accounts
  FOR UPDATE USING (
    id = auth.uid() OR 
    id IN (
      SELECT account_id FROM account_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Add comment explaining the fix
COMMENT ON TABLE public.accounts IS 'Account information - RLS allows access to owned accounts and team accounts user belongs to'; 