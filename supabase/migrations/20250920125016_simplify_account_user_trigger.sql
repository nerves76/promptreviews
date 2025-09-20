-- Simplify ensure_account_user trigger to reduce complexity
-- Remove triple user ID detection in favor of simpler approach

CREATE OR REPLACE FUNCTION ensure_account_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Prefer created_by field if explicitly set
    v_user_id := NEW.created_by;

    -- If no created_by, try to get authenticated user
    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            -- auth.uid() not available in this context
            v_user_id := NULL;
        END;
    END IF;

    -- If we have a user ID, create the account_user link
    IF v_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO account_users (account_id, user_id, role, created_at)
            VALUES (NEW.id, v_user_id, 'owner', NOW())
            ON CONFLICT (account_id, user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- Log warning but don't fail the trigger
            RAISE WARNING 'Could not create account_user link: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (no changes to trigger itself)
DROP TRIGGER IF EXISTS ensure_account_user_trigger ON accounts;
CREATE TRIGGER ensure_account_user_trigger
    AFTER INSERT ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION ensure_account_user();