-- Fix businesses table by removing incorrect foreign key constraint on id column
-- This script fixes local database issues where business.id incorrectly references auth.users(id)
-- 
-- Usage: Run this script on local database when you encounter errors like:
-- "insert or update on table "businesses" violates foreign key constraint "businesses_id_fkey""
--
-- Command to run:
-- PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f scripts/fix_businesses_id_constraint_local.sql

-- Show current constraint before removal
SELECT 'Current businesses_id_fkey constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.businesses'::regclass 
AND conname = 'businesses_id_fkey';

-- Remove the incorrect foreign key constraint that links business.id to auth.users(id)
-- Business IDs should be independent unique identifiers, not tied to user IDs
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_id_fkey;

-- Verify the constraint was removed
SELECT 'Constraint removed. Remaining constraints:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.businesses'::regclass
ORDER BY conname;

SELECT 'businesses_id_fkey constraint has been removed!' as result; 