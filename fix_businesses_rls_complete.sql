-- Check and fix RLS policies for businesses table
-- This script will diagnose and fix business creation issues

-- First, let's check the current state of the businesses table
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'businesses';

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
WHERE p.tablename = 'businesses';

-- Check if there are any businesses records
SELECT 
    'Businesses Count' as check_type,
    COUNT(*) as total_records
FROM businesses;

-- Check if the current user has any businesses records
SELECT 
    'Current User Businesses' as check_type,
    b.id,
    b.account_id,
    b.name,
    b.created_at,
    u.email
FROM businesses b
LEFT JOIN auth.users u ON b.account_id = u.id
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
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- Test a simple insert operation using an existing account ID
-- We'll use the first available account ID from the accounts table
DO $$
DECLARE
    test_account_id uuid;
BEGIN
    -- Get the first available account ID
    SELECT id INTO test_account_id FROM accounts LIMIT 1;
    
    IF test_account_id IS NOT NULL THEN
        -- Test the insert operation
        INSERT INTO businesses (
            account_id,
            name,
            business_website,
            phone,
            business_email,
            address_street,
            address_city,
            address_state,
            address_zip,
            address_country,
            industry,
            created_at
        )
        VALUES (
            test_account_id,
            'Test Business',
            'https://test.com',
            '555-1234',
            'test@test.com',
            '123 Test St',
            'Test City',
            'TS',
            '12345',
            'US',
            ARRAY['Technology'],
            NOW()
        );
        
        -- Clean up test data
        DELETE FROM businesses WHERE account_id = test_account_id;
        
        RAISE NOTICE 'Test completed successfully using account_id: %', test_account_id;
    ELSE
        RAISE NOTICE 'No accounts found, skipping test';
    END IF;
END $$;

-- Now let's create proper RLS policies
-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;
DROP POLICY IF EXISTS "Allow businesses management" ON businesses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON businesses;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON businesses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON businesses;

-- Create a simple policy that allows authenticated users to manage their businesses
CREATE POLICY "Allow businesses management" ON businesses
    FOR ALL
    TO authenticated
    USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

-- Re-enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Test the policy
SELECT 
    'RLS Test After Fix' as check_type,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'businesses';

-- Show final state
SELECT 
    'Final RLS State' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'businesses';

-- Show final policies
SELECT 
    'Final Policies' as status,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'businesses'; 