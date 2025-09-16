-- Fix the "record new has no field account_name" error when updating businesses
-- This error occurs because populate_account_user_fields trigger is incorrectly attached to businesses table

-- First, drop ALL triggers from businesses table that shouldn't be there
DO $$
DECLARE
    trig RECORD;
BEGIN
    -- Find and drop any populate_account_user_fields trigger on businesses
    FOR trig IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'businesses'::regclass 
        AND tgname LIKE '%populate_account_user%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON businesses', trig.tgname);
        RAISE NOTICE 'Dropped trigger % from businesses table', trig.tgname;
    END LOOP;
END $$;

-- Ensure the populate_account_user_fields trigger is ONLY on account_users table
DROP TRIGGER IF EXISTS populate_account_user_fields_trigger ON account_users;

-- Recreate the trigger function to be safe and only work with account_users columns
CREATE OR REPLACE FUNCTION trigger_populate_account_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only populate fields that exist in account_users table
  IF TG_TABLE_NAME = 'account_users' THEN
    -- Get account info
    SELECT 
      COALESCE(a.first_name || ' ' || a.last_name, a.email) as account_name,
      a.email as account_email,
      a.first_name,
      a.last_name,
      b.name as business_name
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

-- Create the trigger ONLY on account_users
CREATE TRIGGER populate_account_user_fields_trigger
  BEFORE INSERT OR UPDATE ON account_users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_populate_account_user_fields();

-- List all triggers on businesses table for verification
DO $$
DECLARE
    trig RECORD;
BEGIN
    RAISE NOTICE 'Triggers on businesses table after cleanup:';
    FOR trig IN 
        SELECT tgname, proname 
        FROM pg_trigger t
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE tgrelid = 'businesses'::regclass
        AND NOT tgisinternal
    LOOP
        RAISE NOTICE '  - % (function: %)', trig.tgname, trig.proname;
    END LOOP;
END $$;

-- The businesses table should only have these triggers:
-- 1. handle_updated_at_businesses (for updated_at timestamp)
-- 2. update_account_users_business_name_trigger (for syncing business name to account_users)
-- It should NOT have populate_account_user_fields_trigger

COMMENT ON FUNCTION trigger_populate_account_user_fields() IS 'Populates readable fields in account_users table - should ONLY be used on account_users, never on businesses';