-- Temporarily disable the auth trigger to fix login issues
-- This is an emergency fix for production

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Add a comment to track this change
COMMENT ON TABLE auth.users IS 'Auth trigger temporarily disabled on 2025-08-14 to fix login issues';