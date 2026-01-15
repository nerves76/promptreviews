-- Drop the overly restrictive unique constraint on communication_templates
-- This constraint prevents creating multiple templates with the same
-- (account_id, communication_type, template_type, is_default) combination,
-- but we need multiple initial/follow_up templates per type for default templates

-- The constraint was created unnamed, so PostgreSQL auto-generated a name
-- We need to find and drop it dynamically

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find the constraint name from the information schema
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.communication_templates'::regclass
      AND contype = 'u'  -- unique constraint
      AND array_length(conkey, 1) = 4;  -- has 4 columns (the problematic one)

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.communication_templates DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No matching constraint found to drop';
    END IF;
END $$;

-- Now create a partial unique index that only enforces uniqueness for DEFAULT templates
-- This allows multiple non-default templates while ensuring only one default per category
CREATE UNIQUE INDEX IF NOT EXISTS communication_templates_unique_default
ON public.communication_templates (account_id, communication_type)
WHERE is_default = true;

-- This ensures:
-- 1. Each account can have only ONE default email template
-- 2. Each account can have only ONE default SMS template
-- 3. Accounts can have UNLIMITED non-default templates
