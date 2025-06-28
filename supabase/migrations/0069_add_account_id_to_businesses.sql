-- Add account_id column to businesses table
-- This migration adds the account_id column that the application expects

-- Add account_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' 
        AND table_schema = 'public' 
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN account_id UUID;
        RAISE NOTICE 'Added account_id column to businesses table';
    END IF;
END $$;

-- Update existing rows to set account_id = id (assuming id references auth.users)
-- This is a temporary fix - ideally we'd get the account_id from the accounts table
UPDATE public.businesses 
SET account_id = id 
WHERE account_id IS NULL;

-- Make account_id NOT NULL after setting values
ALTER TABLE public.businesses 
ALTER COLUMN account_id SET NOT NULL;

-- Add foreign key constraint to accounts table
ALTER TABLE public.businesses 
ADD CONSTRAINT fk_businesses_account_id 
FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Create index on account_id for performance
CREATE INDEX IF NOT EXISTS idx_businesses_account_id ON public.businesses(account_id);

-- Update RLS policies to use account_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
CREATE POLICY "Users can view their own business profile"
  ON public.businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au 
      WHERE au.account_id = businesses.account_id 
      AND au.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
CREATE POLICY "Users can update their own business profile"
  ON public.businesses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au 
      WHERE au.account_id = businesses.account_id 
      AND au.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
CREATE POLICY "Users can create their own business profile"
  ON public.businesses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au 
      WHERE au.account_id = businesses.account_id 
      AND au.user_id = auth.uid()
    )
  ); 