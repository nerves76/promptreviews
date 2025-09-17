-- Emergency fix for account_users access issues
-- Make policies more permissive to allow users to access the system

-- Drop all existing policies on account_users
DROP POLICY IF EXISTS "Users can view their account memberships" ON account_users;
DROP POLICY IF EXISTS "Users can join accounts" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage members" ON account_users;
DROP POLICY IF EXISTS "Account owners can remove members" ON account_users;

-- Create a simple, permissive policy for reading account_users
-- Users can see all their own account memberships
CREATE POLICY "Users can view own account memberships" ON account_users
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Drop and recreate accounts policies
DROP POLICY IF EXISTS "Users can view accounts they belong to" ON accounts;
DROP POLICY IF EXISTS "Account owners and admins can update" ON accounts;
DROP POLICY IF EXISTS "Users can create accounts" ON accounts;

-- Very permissive read policy for accounts during onboarding
CREATE POLICY "Users can view accounts" ON accounts
    FOR SELECT USING (
        -- Can see accounts they belong to
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
        OR
        -- Can see accounts with their user ID (legacy)
        id = auth.uid()
        OR
        -- If user has no accounts, allow viewing (for onboarding)
        NOT EXISTS (
            SELECT 1
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

-- Allow all authenticated users to create accounts
CREATE POLICY "Users can create accounts" ON accounts
    FOR INSERT WITH CHECK (true);

-- Allow users to update accounts they own
CREATE POLICY "Users can update owned accounts" ON accounts
    FOR UPDATE USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Ensure the trigger handles NULL user contexts gracefully
CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Try to get user ID from auth context
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        -- If auth.uid() fails, try JWT claims
        BEGIN
            v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
        EXCEPTION WHEN OTHERS THEN
            -- If both fail, just return (service role context)
            RETURN NEW;
        END;
    END;

    -- Only create account_user if we have a valid user_id
    IF v_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (NEW.id, v_user_id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- Log but don't fail the trigger
            RAISE WARNING 'Could not create account_user: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS ensure_account_user_trigger ON accounts;
CREATE TRIGGER ensure_account_user_trigger
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_account_user();