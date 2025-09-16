-- Aggressive fix for the account_name error on businesses table
-- This completely removes and recreates all triggers to ensure no incorrect references

-- Step 1: Drop ALL triggers on businesses table
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'businesses'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON businesses CASCADE', trig.tgname);
        RAISE NOTICE 'Dropped trigger % from businesses table', trig.tgname;
    END LOOP;
END $$;

-- Step 2: Drop and recreate the populate_account_user_fields function with safety checks
DROP FUNCTION IF EXISTS trigger_populate_account_user_fields() CASCADE;

CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- CRITICAL: This function should ONLY run on account_users table
  -- Check table name to prevent errors
  IF TG_TABLE_NAME != 'account_users' THEN
    RAISE EXCEPTION 'trigger_populate_account_user_fields can only be used on account_users table, not %', TG_TABLE_NAME;
  END IF;
  
  -- Only populate if we have the right columns
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Get account info
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate ONLY the necessary triggers on businesses table

-- 3a. Updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at_businesses ON businesses;
CREATE TRIGGER handle_updated_at_businesses
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 3b. Business name sync trigger
CREATE OR REPLACE FUNCTION trigger_update_account_users_business_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update business_name in account_users when business name changes
  -- This function should NEVER reference account_name
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE account_users
    SET business_name = NEW.name
    WHERE account_id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_account_users_business_name_trigger ON businesses;
CREATE TRIGGER update_account_users_business_name_trigger
  AFTER UPDATE OF name ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_account_users_business_name();

-- Step 4: Ensure populate_account_user_fields trigger is ONLY on account_users
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users CASCADE;
CREATE TRIGGER populate_account_user_fields_trigger
  BEFORE INSERT OR UPDATE ON account_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_populate_account_user_fields();

-- Step 5: Verify final state
DO $$
DECLARE
    trig RECORD;
    has_wrong_trigger BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '=== Final trigger configuration ===';
    RAISE NOTICE 'Triggers on businesses table:';
    
    FOR trig IN 
        SELECT t.tgname, p.proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'businesses'::regclass
        AND NOT t.tgisinternal
    LOOP
        RAISE NOTICE '  - % (function: %)', trig.tgname, trig.proname;
        
        -- Check for wrong trigger
        IF trig.proname = 'trigger_populate_account_user_fields' THEN
            has_wrong_trigger := TRUE;
            RAISE WARNING 'ERROR: populate_account_user_fields is still on businesses table!';
        END IF;
    END LOOP;
    
    IF NOT has_wrong_trigger THEN
        RAISE NOTICE 'SUCCESS: No incorrect triggers found on businesses table';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Triggers on account_users table:';
    FOR trig IN 
        SELECT t.tgname, p.proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE t.tgrelid = 'account_users'::regclass
        AND NOT t.tgisinternal
    LOOP
        RAISE NOTICE '  - % (function: %)', trig.tgname, trig.proname;
    END LOOP;
END $$;

-- Migration complete
-- The businesses table now has only the correct triggers:
-- 1. handle_updated_at_businesses - for updating timestamps
-- 2. update_account_users_business_name_trigger - for syncing business names
-- The populate_account_user_fields trigger is ONLY on account_users table