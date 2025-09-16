-- Simple check for account_name column in businesses table

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'businesses' 
        AND column_name = 'account_name'
    ) THEN
        RAISE WARNING '';
        RAISE WARNING '*** FOUND THE PROBLEM ***';
        RAISE WARNING 'The businesses table HAS an account_name column!';
        RAISE WARNING 'This column should not exist and is causing the error.';
        RAISE WARNING 'Dropping this column now...';
        
        -- Drop the column
        ALTER TABLE public.businesses DROP COLUMN IF EXISTS account_name;
        
        RAISE NOTICE 'Column account_name has been dropped from businesses table';
    ELSE
        RAISE NOTICE 'The businesses table does not have an account_name column (which is correct)';
    END IF;
END $$;

-- Also check and drop if it exists as a different case
ALTER TABLE public.businesses DROP COLUMN IF EXISTS "account_name";
ALTER TABLE public.businesses DROP COLUMN IF EXISTS "accountName";
ALTER TABLE public.businesses DROP COLUMN IF EXISTS "ACCOUNT_NAME";

-- List all columns to confirm
DO $$
DECLARE
    col RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Current columns in businesses table:';
    FOR col IN 
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: %', col.column_name, col.data_type;
    END LOOP;
END $$;