-- Fix Admin Analytics Access Issue
-- 
-- Problem: Analytics page redirects to dashboard because admin status check fails
-- Root cause: RLS policies prevent browser client from reading admins table
-- 
-- This migration:
-- 1. Updates RLS policies to allow authenticated users to check admin status
-- 2. Ensures there is at least one admin user in the system

-- Drop existing policies that might be restrictive
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Allow admin checking" ON admins;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;

-- Create a policy that allows authenticated users to read admins table
-- This is necessary for the isAdmin() function to work from the browser
CREATE POLICY "Allow authenticated users to check admin status" ON admins
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Keep the existing restrictive policies for INSERT/UPDATE/DELETE
-- (These should already exist from the previous migration)

-- Add a default admin user if none exist
-- This will use the first user in the system as the initial admin
DO $$
DECLARE
  first_user_id UUID;
  admin_count INTEGER;
BEGIN
  -- Check if any admins already exist
  SELECT COUNT(*) INTO admin_count FROM admins;
  
  -- If no admins exist, create one from the first user
  IF admin_count = 0 THEN
    -- Get the first user (by creation date)
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If we found a user, make them an admin
    IF first_user_id IS NOT NULL THEN
      INSERT INTO admins (account_id) 
      VALUES (first_user_id);
      
      RAISE NOTICE 'Created admin user with account_id: %', first_user_id;
    ELSE
      RAISE NOTICE 'No users found to make admin';
    END IF;
  ELSE
    RAISE NOTICE 'Admin users already exist, count: %', admin_count;
  END IF;
END $$;