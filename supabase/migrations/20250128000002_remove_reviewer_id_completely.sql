-- Remove reviewer_id column completely from businesses table
-- This migration properly removes all dependencies before dropping the column

-- Step 1: Drop the foreign key constraint that references reviewer_id
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_owner_id_fkey;

-- Step 2: Drop any indexes that might reference reviewer_id
DROP INDEX IF EXISTS idx_businesses_reviewer_id;

-- Step 3: Drop RLS policies that reference reviewer_id
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can create their own business profile" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;

-- Step 4: Now drop the reviewer_id column
ALTER TABLE public.businesses DROP COLUMN IF EXISTS reviewer_id;

-- Step 5: Create new RLS policies that use account_id instead (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'businesses' 
    AND policyname = 'Users can view their account''s businesses'
  ) THEN
    CREATE POLICY "Users can view their account's businesses"
      ON public.businesses FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM account_users au
          WHERE au.account_id = businesses.account_id
          AND au.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'businesses' 
    AND policyname = 'Users can update their account''s businesses'
  ) THEN
    CREATE POLICY "Users can update their account's businesses"
      ON public.businesses FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM account_users au
          WHERE au.account_id = businesses.account_id
          AND au.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'businesses' 
    AND policyname = 'Users can create businesses for their account'
  ) THEN
    CREATE POLICY "Users can create businesses for their account"
      ON public.businesses FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM account_users au
          WHERE au.account_id = businesses.account_id
          AND au.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Step 6: Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'businesses'; 