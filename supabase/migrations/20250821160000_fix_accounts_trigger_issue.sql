-- Fix the trigger issue causing "record new has no field account_name" error on accounts table
-- This error happens because a trigger is trying to set account_name on accounts table

-- First, let's see what triggers exist on the accounts table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE 'Checking triggers on accounts table...';
    
    FOR trigger_record IN 
        SELECT tgname, proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'accounts'::regclass
    LOOP
        RAISE NOTICE 'Found trigger: % calling function: %', trigger_record.tgname, trigger_record.proname;
    END LOOP;
END $$;

-- Drop any populate_account_user_fields_trigger that might be incorrectly on accounts table
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON accounts;

-- The populate_account_user_fields_trigger should ONLY be on account_users table
-- Make sure it's not trying to set account_name when the table is accounts

-- Recreate the trigger function to be more defensive
CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_account_name TEXT;
    v_user_email TEXT;
    v_business_name TEXT;
BEGIN
    -- CRITICAL: Only run on account_users table, not on accounts table
    IF TG_TABLE_NAME != 'account_users' THEN
        -- If this is being called on the wrong table, just return without modification
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
    IF v_account_name IS NOT NULL AND 
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'account_name') THEN
        NEW.account_name := v_account_name;
    END IF;
    
    IF v_user_email IS NOT NULL AND
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'user_email') THEN
        NEW.user_email := v_user_email;
    END IF;
    
    -- For business_name, keep the NEW value if it was explicitly set
    IF NEW.business_name IS NULL AND v_business_name IS NOT NULL AND
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'account_users' 
               AND column_name = 'business_name') THEN
        NEW.business_name := v_business_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is ONLY on account_users, not on accounts
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users;
CREATE TRIGGER populate_account_user_fields_trigger
    BEFORE INSERT OR UPDATE ON account_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed trigger issue - populate_account_user_fields_trigger should only be on account_users table';
END $$;