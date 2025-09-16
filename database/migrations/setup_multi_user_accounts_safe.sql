-- Setup multi-user account structure (Safe version)
-- This script creates the account_users table and updates RLS policies
-- It only inserts users that actually exist in auth.users

-- Create account_users table for multi-user account support
CREATE TABLE IF NOT EXISTS public.account_users (
  account_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (account_id, user_id)
);

-- Enable RLS on account_users
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for account_users
DROP POLICY IF EXISTS "Users can view their own account memberships" ON public.account_users;
CREATE POLICY "Users can view their own account memberships"
  ON public.account_users FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Account owners can manage account users" ON public.account_users;
CREATE POLICY "Account owners can manage account users"
  ON public.account_users FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Insert current users into account_users table (only if they exist in auth.users)
-- This ensures existing businesses have their owners properly linked
INSERT INTO public.account_users (account_id, user_id, role)
SELECT DISTINCT b.account_id, b.account_id, 'owner'
FROM public.businesses b
INNER JOIN auth.users u ON b.account_id = u.id
WHERE b.account_id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Also insert users from accounts table if they exist in auth.users
INSERT INTO public.account_users (account_id, user_id, role)
SELECT a.id, a.id, 'owner'
FROM public.accounts a
INNER JOIN auth.users u ON a.id = u.id
WHERE a.id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Update RLS policies for businesses table to use account_users
-- But fall back to account_id = auth.uid() if no account_users entry exists
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their account's businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their account's businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create businesses for their account" ON public.businesses;

CREATE POLICY "Users can view their account's businesses"
  ON public.businesses FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

CREATE POLICY "Users can update their account's businesses"
  ON public.businesses FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

CREATE POLICY "Users can create businesses for their account"
  ON public.businesses FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
    OR account_id = auth.uid()
  );

-- Show the created policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('businesses', 'account_users') AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Show account_users data
SELECT account_id, user_id, role, created_at 
FROM public.account_users 
ORDER BY created_at; 