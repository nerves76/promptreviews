-- Migration: Drop the admins table
-- This table is no longer needed as admin status is now stored in accounts.is_admin

-- Drop the admins table
DROP TABLE IF EXISTS admins CASCADE;

-- Note: The CASCADE will automatically drop:
-- - All foreign key constraints referencing this table
-- - All indexes on this table
-- - All RLS policies on this table (already updated in previous migration)
