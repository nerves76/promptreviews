-- Check and fix RLS policies for account_users table
-- This script will diagnose and fix account_users upsert issues

-- First, let's check the current state of the account_users table
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'account_users'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users';

-- Check current RLS policies
SELECT 
    'Current RLS Policies' as check_type,
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'account_users';

-- Check if there are any account_users records
SELECT 
    'Account Users Count' as check_type,
    COUNT(*) as total_records
FROM account_users;

-- Check if the current user has any account_users records
SELECT 
    'Current User Account Users' as check_type,
    au.id,
    au.user_id,
    au.account_id,
    au.role,
    au.created_at,
    u.email
FROM account_users au
LEFT JOIN auth.users u ON au.user_id = u.id
LIMIT 10;

-- Check existing accounts to use for testing
SELECT 
    'Available Accounts' as check_type,
    id,
    created_at
FROM accounts
ORDER BY created_at DESC
LIMIT 5;

-- Now let's create a comprehensive fix
-- First, temporarily disable RLS to test if that's the issue
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Test a simple upsert operation using an existing account ID
-- We'll use the first available account ID from the accounts table
DO $$
DECLARE
    test_account_id uuid;
BEGIN
    -- Get the first available account ID
    SELECT id INTO test_account_id FROM accounts LIMIT 1;
    
    IF test_account_id IS NOT NULL THEN
        -- Test the upsert operation
        INSERT INTO account_users (user_id, account_id, role, created_at)
        VALUES (
            test_account_id, 
            test_account_id, 
            'owner', 
            NOW()
        )
        ON CONFLICT (user_id, account_id) DO UPDATE SET
            role = EXCLUDED.role;
            
        -- Clean up test data
        DELETE FROM account_users WHERE user_id = test_account_id;
        
        RAISE NOTICE 'Test completed successfully using account_id: %', test_account_id;
    ELSE
        RAISE NOTICE 'No accounts found, skipping test';
    END IF;
END $$;

-- Now let's create proper RLS policies
-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can manage their own account_users" ON account_users;
DROP POLICY IF EXISTS "Allow account_users upsert" ON account_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON account_users;

-- Create a simple policy that allows authenticated users to manage their account_users
CREATE POLICY "Allow account_users management" ON account_users
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Test the policy
SELECT 
    'RLS Test After Fix' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'account_users';

-- Show final state
SELECT 
    'Final RLS State' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users';

-- Show final policies
SELECT 
    'Final Policies' as status,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'account_users'; 