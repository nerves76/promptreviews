-- Fix account_users RLS policies to allow proper access

-- First, drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own memberships" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage members" ON account_users;

-- Create a more permissive SELECT policy for users to see their own memberships
CREATE POLICY "Users can view their account memberships" ON account_users
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        -- Also allow viewing members of accounts you belong to
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to insert themselves into accounts (for initial setup)
CREATE POLICY "Users can join accounts" ON account_users
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Allow account owners to manage members
CREATE POLICY "Account owners can manage members" ON account_users
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );

CREATE POLICY "Account owners can remove members" ON account_users
    FOR DELETE USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Also ensure accounts table has proper policies
DROP POLICY IF EXISTS "Users can view accounts they belong to" ON accounts;
DROP POLICY IF EXISTS "Account owners and admins can update" ON accounts;

-- More permissive read policy for accounts
CREATE POLICY "Users can view accounts they belong to" ON accounts
    FOR SELECT USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
        OR
        -- Allow viewing during account creation (when no membership exists yet)
        NOT EXISTS (
            SELECT 1 FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Update policy for accounts
CREATE POLICY "Account owners and admins can update" ON accounts
    FOR UPDATE USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Allow inserting new accounts (will be linked via trigger)
CREATE POLICY "Users can create accounts" ON accounts
    FOR INSERT WITH CHECK (true);