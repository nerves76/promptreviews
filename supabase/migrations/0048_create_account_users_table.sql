-- Create account_users table for multi-user account support
-- This allows multiple users to belong to the same account/business

CREATE TABLE IF NOT EXISTS public.account_users (
  account_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (account_id, user_id)
);

-- Enable RLS
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for account_users
CREATE POLICY "Users can view their own account memberships"
  ON public.account_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Account owners can manage account users"
  ON public.account_users FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Insert current users into account_users table
-- This ensures existing businesses have their owners properly linked
INSERT INTO public.account_users (account_id, user_id, role)
SELECT DISTINCT account_id, account_id, 'owner'
FROM public.businesses
WHERE account_id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Update RLS policies for businesses table to use account_users
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;

CREATE POLICY "Users can view their account's businesses"
  ON public.businesses FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account's businesses"
  ON public.businesses FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create businesses for their account"
  ON public.businesses FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.account_users WHERE user_id = auth.uid()
    )
  ); 