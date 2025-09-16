-- The issue might be that when businesses is updated, it triggers an update on account_users,
-- which then has a trigger that tries to reference account_name on the NEW record (which is businesses)

-- First, let's check what triggers are on account_users
DO $$
DECLARE
    trig RECORD;
BEGIN
    RAISE NOTICE '=== TRIGGERS ON ACCOUNT_USERS TABLE ===';
    FOR trig IN 
        SELECT 
            t.tgname as trigger_name,
            p.proname as function_name
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'account_users'::regclass
        AND NOT t.tgisinternal
        ORDER BY t.tgname
    LOOP
        RAISE NOTICE 'Trigger: % (Function: %)', trig.trigger_name, trig.function_name;
    END LOOP;
END $$;

-- The problem is likely in the trigger_update_account_users_business_name function
-- Let's replace it with a safer version that doesn't trigger other updates

DROP FUNCTION IF EXISTS trigger_update_account_users_business_name() CASCADE;

CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if name actually changed
    IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
        -- Use a direct UPDATE without triggering cascades
        -- This prevents the populate_account_user_fields trigger from firing
        PERFORM 1 FROM account_users 
        WHERE account_id = NEW.account_id;
        
        IF FOUND THEN
            -- Temporarily disable triggers on account_users for this update
            -- This prevents infinite recursion and the account_name error
            UPDATE pg_trigger 
            SET tgenabled = 'D' 
            WHERE tgname = 'populate_account_user_fields_trigger' 
            AND tgrelid = 'account_users'::regclass;
            
            -- Do the update
            UPDATE account_users
            SET business_name = NEW.name
            WHERE account_id = NEW.account_id;
            
            -- Re-enable the trigger
            UPDATE pg_trigger 
            SET tgenabled = 'O' 
            WHERE tgname = 'populate_account_user_fields_trigger' 
            AND tgrelid = 'account_users'::regclass;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_account_users_business_name_trigger ON businesses;
CREATE TRIGGER update_account_users_business_name_trigger
    AFTER UPDATE OF name ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_users_business_name();

-- Alternative approach: Modify the populate_account_user_fields trigger to not fire on business_name updates
DROP FUNCTION IF EXISTS trigger_populate_account_user_fields() CASCADE;

CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- CRITICAL: Only run on account_users table
    IF TG_TABLE_NAME != 'account_users' THEN
        RETURN NEW;
    END IF;
    
    -- Skip if this is just a business_name update (coming from businesses trigger)
    IF TG_OP = 'UPDATE' AND OLD.business_name IS DISTINCT FROM NEW.business_name 
       AND OLD.account_id = NEW.account_id 
       AND OLD.user_id = NEW.user_id THEN
        -- Just a business name update, don't populate other fields
        RETURN NEW;
    END IF;
    
    -- Populate fields from accounts and businesses
    SELECT 
        COALESCE(a.first_name || ' ' || a.last_name, a.email),
        a.email,
        a.first_name,
        a.last_name,
        b.name
    INTO 
        NEW.account_name,
        NEW.account_email,
        NEW.first_name,
        NEW.last_name,
        NEW.business_name
    FROM accounts a
    LEFT JOIN businesses b ON b.account_id = a.id
    WHERE a.id = NEW.account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on account_users
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users;
CREATE TRIGGER populate_account_user_fields_trigger
    BEFORE INSERT OR UPDATE ON account_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Migration complete
DO $$
BEGIN
    RAISE NOTICE 'Fixed cascading trigger issue that was causing account_name error';
END $$;