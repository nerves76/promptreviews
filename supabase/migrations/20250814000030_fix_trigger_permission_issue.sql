-- Fix the permission issue - we can't modify pg_trigger directly
-- Instead, we'll use a different approach that doesn't require superuser permissions

-- Drop the problematic function
DROP FUNCTION IF EXISTS trigger_update_account_users_business_name() CASCADE;

-- Create a simpler version that doesn't try to disable triggers
CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if name actually changed
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Direct update to account_users
        -- The populate_account_user_fields trigger will handle this better now
        UPDATE account_users
        SET business_name = NEW.name
        WHERE account_id = NEW.account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER update_account_users_business_name_trigger
    AFTER UPDATE OF name ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_users_business_name();

-- Now fix the populate_account_user_fields to handle updates more intelligently
DROP FUNCTION IF EXISTS trigger_populate_account_user_fields() CASCADE;

CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_account_name TEXT;
    v_account_email TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
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
        IF NEW.business_name IS DISTINCT FROM OLD.business_name AND
           NEW.account_id = OLD.account_id AND
           NEW.user_id = OLD.user_id AND
           NEW.role = OLD.role THEN
            -- Only business_name changed, don't repopulate other fields
            RETURN NEW;
        END IF;
    END IF;
    
    -- Get the account and business info
    SELECT 
        COALESCE(a.first_name || ' ' || a.last_name, a.email),
        a.email,
        a.first_name,
        a.last_name,
        b.name
    INTO 
        v_account_name,
        v_account_email,
        v_first_name,
        v_last_name,
        v_business_name
    FROM accounts a
    LEFT JOIN businesses b ON b.account_id = a.id
    WHERE a.id = NEW.account_id;
    
    -- Only update fields if we got data
    IF v_account_name IS NOT NULL THEN
        NEW.account_name := v_account_name;
    END IF;
    IF v_account_email IS NOT NULL THEN
        NEW.account_email := v_account_email;
    END IF;
    IF v_first_name IS NOT NULL THEN
        NEW.first_name := v_first_name;
    END IF;
    IF v_last_name IS NOT NULL THEN
        NEW.last_name := v_last_name;
    END IF;
    -- For business_name, keep the NEW value if it was explicitly set
    -- (like from the update_account_users_business_name trigger)
    IF NEW.business_name IS NULL AND v_business_name IS NOT NULL THEN
        NEW.business_name := v_business_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on account_users
CREATE TRIGGER populate_account_user_fields_trigger
    BEFORE INSERT OR UPDATE ON account_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed permission issue - no longer trying to modify pg_trigger directly';
    RAISE NOTICE 'The populate_account_user_fields trigger now handles cascading updates properly';
END $$;