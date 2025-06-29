-- Fix RLS policies on businesses table
-- Enable RLS and create proper policies for business creation and access

-- First, enable RLS on businesses table
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.businesses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.businesses;
DROP POLICY IF EXISTS "Enable update for users based on account_id" ON public.businesses;
DROP POLICY IF EXISTS "Enable delete for users based on account_id" ON public.businesses;

-- Create policy for reading businesses - users can read businesses in their account
CREATE POLICY "Enable read access for authenticated users" ON public.businesses
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM account_users 
            WHERE account_id = businesses.account_id
        )
    );

-- Create policy for inserting businesses - users can create businesses in their account
CREATE POLICY "Enable insert for authenticated users" ON public.businesses
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM account_users 
            WHERE account_id = businesses.account_id
        )
    );

-- Create policy for updating businesses - users can update businesses in their account
CREATE POLICY "Enable update for users based on account_id" ON public.businesses
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM account_users 
            WHERE account_id = businesses.account_id
        )
    );

-- Create policy for deleting businesses - users can delete businesses in their account
CREATE POLICY "Enable delete for users based on account_id" ON public.businesses
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM account_users 
            WHERE account_id = businesses.account_id
        )
    ); 