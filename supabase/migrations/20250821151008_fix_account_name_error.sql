-- Fix the "record new has no field account_name" error
-- Add only the account_name column and simplify the trigger

-- Add the missing account_name column to account_users
ALTER TABLE public.account_users 
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.account_users.account_name IS 'Display name of the account owner (first_name + last_name or email)';

-- Fix the trigger to only set columns that exist
DROP FUNCTION IF EXISTS trigger_populate_account_user_fields() CASCADE;

CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_account_name TEXT;
    v_user_email TEXT;
    v_business_name TEXT;
BEGIN
    -- CRITICAL: Only run on account_users table
    IF TG_TABLE_NAME != 'account_users' THEN
        RETURN NEW;
    END IF;
    
    -- For UPDATE operations, check what changed
    IF TG_OP = 'UPDATE' THEN
        -- If only business_name changed and nothing else, just return
        -- This prevents the recursion issue
        IF OLD.business_name IS DISTINCT FROM NEW.business_name AND
           OLD.account_id = NEW.account_id AND
           OLD.user_id = NEW.user_id AND
           OLD.role = NEW.role THEN
            RETURN NEW;
        END IF;
    END IF;
    
    -- Fetch account data including the concatenated name
    SELECT 
        COALESCE(a.first_name || ' ' || a.last_name, a.email),
        b.name
    INTO 
        v_account_name,
        v_business_name
    FROM accounts a
    LEFT JOIN businesses b ON b.account_id = a.id
    WHERE a.id = NEW.account_id;
    
    -- Get user email from auth.users
    SELECT email INTO v_user_email
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    -- Only update fields that exist in account_users table
    IF v_account_name IS NOT NULL THEN
        NEW.account_name := v_account_name;
    END IF;
    
    IF v_user_email IS NOT NULL THEN
        NEW.user_email := v_user_email;
    END IF;
    
    -- For business_name, keep the NEW value if it was explicitly set
    IF NEW.business_name IS NULL AND v_business_name IS NOT NULL THEN
        NEW.business_name := v_business_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER populate_account_user_fields_trigger
    BEFORE INSERT OR UPDATE ON account_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Populate existing rows with account_name
UPDATE public.account_users au
SET account_name = COALESCE(a.first_name || ' ' || a.last_name, a.email)
FROM public.accounts a
WHERE au.account_id = a.id
AND au.account_name IS NULL;

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed account_name error - added account_name column and simplified trigger';
END $$;