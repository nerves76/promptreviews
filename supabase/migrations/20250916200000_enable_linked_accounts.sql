-- Enable linked accounts by removing the foreign key constraint
-- and allowing multiple accounts per user

-- 1. Drop the foreign key constraint that forces accounts.id = auth.users.id
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS accounts_id_fkey;

-- 2. Enable UUID generation for new accounts
ALTER TABLE public.accounts
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Update RLS policies to use account_users membership
-- Drop existing policies that might rely on accounts.id = auth.uid()
DROP POLICY IF EXISTS "Users can view own account" ON accounts;
DROP POLICY IF EXISTS "Users can update own account" ON accounts;

-- Create new policies based on account_users membership
CREATE POLICY "Users can view accounts they belong to" ON accounts
    FOR SELECT USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Account owners and admins can update" ON accounts
    FOR UPDATE USING (
        id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- 4. Ensure account_users has proper policies
DROP POLICY IF EXISTS "Users can view own memberships" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage members" ON account_users;

CREATE POLICY "Users can view own memberships" ON account_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Account owners can manage members" ON account_users
    FOR ALL USING (
        account_id IN (
            SELECT account_id
            FROM account_users
            WHERE user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- 5. Add a trigger to ensure account creator becomes owner
CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add account_user if auth.uid() exists (not service role)
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO account_users (account_id, user_id, role, created_at)
        VALUES (NEW.id, auth.uid(), 'owner', NOW())
        ON CONFLICT (account_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_account_user_trigger ON accounts;
CREATE TRIGGER ensure_account_user_trigger
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_account_user();