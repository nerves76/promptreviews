-- Fix account creation flow for users without existing accounts

-- Update the trigger to handle both authenticated and service role contexts
CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user ID from different contexts
    IF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSIF current_setting('request.jwt.claims', true)::json->>'sub' IS NOT NULL THEN
        v_user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
    ELSE
        -- In service role context, we might not have user info
        -- Skip creating account_user in this case
        RETURN NEW;
    END IF;

    -- Create account_user relationship if we have a user ID
    IF v_user_id IS NOT NULL THEN
        INSERT INTO account_users (account_id, user_id, role, created_at)
        VALUES (NEW.id, v_user_id, 'owner', NOW())
        ON CONFLICT (account_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS ensure_account_user_trigger ON accounts;
CREATE TRIGGER ensure_account_user_trigger
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_account_user();

-- For existing accounts without proper account_users entries, create them
-- This helps fix any orphaned accounts from before
INSERT INTO account_users (account_id, user_id, role, created_at)
SELECT
    a.id as account_id,
    a.id as user_id,  -- Legacy: account.id used to equal user.id
    'owner' as role,
    COALESCE(a.created_at, NOW()) as created_at
FROM accounts a
LEFT JOIN account_users au ON au.account_id = a.id
WHERE au.account_id IS NULL
  AND a.id IN (SELECT id FROM auth.users)  -- Only for accounts where id matches a user id
ON CONFLICT (account_id, user_id) DO NOTHING;