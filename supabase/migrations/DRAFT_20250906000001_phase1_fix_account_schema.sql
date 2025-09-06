-- DRAFT MIGRATION: Phase 1 - Fix Account Schema Structure
-- ⚠️ DO NOT EXECUTE WITHOUT THOROUGH TESTING
-- 
-- This migration fixes the account.id = user.id anti-pattern by restructuring 
-- the accounts table to use independent UUIDs and preparing for data migration.
--
-- PHASE 1: Schema preparation (zero-downtime changes)
-- - Remove foreign key constraint from accounts.id to auth.users.id
-- - Add backup columns for migration tracking
-- - Create new constraints that prevent account.id = user.id
-- - Update RLS policies to handle transition period

-- =====================================================
-- BACKUP EXISTING DATA STRUCTURE
-- =====================================================

-- Create backup of current accounts structure
CREATE TABLE IF NOT EXISTS accounts_backup_pre_migration AS 
SELECT * FROM accounts;

-- Create backup of current account_users structure  
CREATE TABLE IF NOT EXISTS account_users_backup_pre_migration AS
SELECT * FROM account_users;

-- Add migration tracking columns
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS old_account_id UUID;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'pending';

-- Track which accounts need ID changes (where account.id = user.id from auth.users)
UPDATE accounts SET 
    old_account_id = id,
    migration_status = 'needs_migration'
WHERE id IN (SELECT id FROM auth.users);

-- =====================================================
-- REMOVE PROBLEMATIC FOREIGN KEY CONSTRAINT
-- =====================================================

-- Remove the foreign key constraint that forces accounts.id = auth.users.id
-- This is what's causing the anti-pattern
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_id_fkey;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS fk_accounts_users;

-- Verify no direct reference exists
DO $$
BEGIN
    -- Check if any constraints still link accounts.id to auth.users.id
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'accounts' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint on accounts.id still exists - migration cannot proceed';
    END IF;
END $$;

-- =====================================================
-- ADD NEW CONSTRAINTS TO PREVENT ANTI-PATTERN
-- =====================================================

-- Create constraint function to prevent account.id = user.id pattern
CREATE OR REPLACE FUNCTION check_account_id_not_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent setting account.id to any existing auth.users.id
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'Account ID cannot be the same as a user ID. This violates the separation of accounts and users.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce constraint (will be removed after migration)
-- Currently disabled for existing data, will be enabled after cleanup
-- CREATE TRIGGER prevent_account_user_id_overlap
--     BEFORE INSERT OR UPDATE ON accounts
--     FOR EACH ROW EXECUTE FUNCTION check_account_id_not_user_id();

-- =====================================================
-- UPDATE RLS POLICIES FOR TRANSITION PERIOD
-- =====================================================

-- Create transitional RLS policies that work with both old and new patterns
-- These will be simplified after migration is complete

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own account" ON accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON accounts;
DROP POLICY IF EXISTS "Users can insert their own account" ON accounts;
DROP POLICY IF EXISTS "Service role can create accounts" ON accounts;

-- Create transition policies that handle both patterns
CREATE POLICY "Users can view their accounts (transition)"
    ON accounts FOR SELECT
    TO authenticated
    USING (
        -- Current pattern: account.id = auth.uid()
        auth.uid() = id
        OR 
        -- New pattern: through account_users table
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their accounts (transition)"
    ON accounts FOR UPDATE
    TO authenticated
    USING (
        -- Current pattern: account.id = auth.uid()
        auth.uid() = id
        OR 
        -- New pattern: through account_users table (owners only)
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    )
    WITH CHECK (
        -- Same check for updates
        auth.uid() = id
        OR 
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Service role policy (unchanged)
CREATE POLICY "Service role can access accounts"
    ON accounts FOR ALL
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE DURING MIGRATION
-- =====================================================

-- Add indexes to support transition queries
CREATE INDEX IF NOT EXISTS idx_accounts_old_account_id ON accounts(old_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_migration_status ON accounts(migration_status);

-- Improve account_users performance during migration
CREATE INDEX IF NOT EXISTS idx_account_users_role_owner ON account_users(user_id, role) WHERE role = 'owner';

-- =====================================================
-- CREATE DATA MIGRATION HELPER FUNCTIONS
-- =====================================================

-- Function to count accounts that need migration
CREATE OR REPLACE FUNCTION count_accounts_needing_migration()
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_result 
    FROM accounts 
    WHERE migration_status = 'needs_migration';
    
    RETURN count_result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate account_users consistency
CREATE OR REPLACE FUNCTION validate_account_users_consistency()
RETURNS TEXT AS $$
DECLARE
    inconsistent_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    -- Check for account_users where account_id = user_id (the anti-pattern)
    SELECT COUNT(*) INTO inconsistent_count
    FROM account_users 
    WHERE account_id = user_id;
    
    -- Check for duplicate user-account relationships
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, account_id, COUNT(*)
        FROM account_users 
        GROUP BY user_id, account_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RETURN FORMAT(
        'Validation Results: %s records with account_id=user_id, %s duplicate relationships',
        inconsistent_count,
        duplicate_count
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION AND LOGGING
-- =====================================================

-- Log migration start
INSERT INTO audit_logs (event_type, event_data, created_at)
VALUES (
    'MIGRATION_PHASE_1_START',
    jsonb_build_object(
        'migration', 'fix_account_schema',
        'phase', 1,
        'accounts_needing_migration', count_accounts_needing_migration(),
        'validation', validate_account_users_consistency()
    ),
    NOW()
);

-- =====================================================
-- SAFETY CHECKS AND COMMENTS
-- =====================================================

-- Verify the migration setup
DO $$
DECLARE
    accounts_to_migrate INTEGER;
    total_accounts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    SELECT COUNT(*) INTO accounts_to_migrate FROM accounts WHERE migration_status = 'needs_migration';
    
    RAISE NOTICE 'Phase 1 Migration Setup Complete:';
    RAISE NOTICE '  Total accounts: %', total_accounts;
    RAISE NOTICE '  Accounts needing new IDs: %', accounts_to_migrate;
    RAISE NOTICE '  Foreign key constraint removed from accounts.id';
    RAISE NOTICE '  Backup tables created: accounts_backup_pre_migration, account_users_backup_pre_migration';
    RAISE NOTICE '  Ready for Phase 2 data migration';
    
    -- Safety check: ensure we have backups
    IF NOT EXISTS (SELECT 1 FROM accounts_backup_pre_migration LIMIT 1) THEN
        RAISE EXCEPTION 'CRITICAL: accounts backup table is empty - migration aborted';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM account_users_backup_pre_migration LIMIT 1) THEN
        RAISE EXCEPTION 'CRITICAL: account_users backup table is empty - migration aborted';
    END IF;
END $$;

-- =====================================================
-- NEXT STEPS
-- =====================================================

/*
NEXT STEPS FOR PHASE 2:
1. Run DRAFT_20250906000002_phase2_migrate_account_data.sql
2. This will:
   - Generate new UUIDs for accounts where account.id = user.id
   - Update all foreign key references across 23 tables
   - Clean up account_users duplicates
   - Verify data integrity

ROLLBACK PROCEDURE:
If this migration needs to be rolled back:
1. Restore accounts table: DROP TABLE accounts; ALTER TABLE accounts_backup_pre_migration RENAME TO accounts;
2. Restore account_users table: DROP TABLE account_users; ALTER TABLE account_users_backup_pre_migration RENAME TO account_users;
3. Re-add foreign key constraint: ALTER TABLE accounts ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

TESTING CHECKLIST:
[ ] Verify existing authentication still works
[ ] Verify account switching still works  
[ ] Verify business creation still works
[ ] Run: SELECT count_accounts_needing_migration(); -- Should return count > 0
[ ] Run: SELECT validate_account_users_consistency(); -- Should show issues to fix
*/