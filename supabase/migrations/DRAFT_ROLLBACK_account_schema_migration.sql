-- DRAFT ROLLBACK MIGRATION: Complete Rollback for Account Schema Migration
-- ⚠️ EMERGENCY USE ONLY - THOROUGHLY TEST BEFORE EXECUTION
-- ⚠️ THIS WILL UNDO ALL ACCOUNT SCHEMA IMPROVEMENTS
--
-- This migration provides complete rollback capability for the account schema
-- migration (Phases 1, 2, and 3). Use only if critical issues are discovered
-- that cannot be resolved through forward fixes.
--
-- ROLLBACK SCOPE:
-- - Restores original accounts table structure (account.id = user.id)
-- - Restores original account_users table
-- - Removes all new constraints and triggers
-- - Restores original RLS policies
-- - Reverts to original auth trigger behavior
--
-- WARNING: This rollback will lose any benefits of the migration and restore
-- the problematic account.id = user.id anti-pattern.

-- =====================================================
-- PRE-ROLLBACK SAFETY CHECKS
-- =====================================================

DO $$
DECLARE
    backup_exists BOOLEAN := false;
    mapping_exists BOOLEAN := false;
    current_accounts INTEGER;
BEGIN
    -- Check if backup tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts_backup_pre_migration') THEN
        backup_exists := true;
    END IF;
    
    -- Check if mapping table exists (for partial rollback)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_id_mapping') THEN
        mapping_exists := true;
    END IF;
    
    SELECT COUNT(*) INTO current_accounts FROM accounts;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EMERGENCY ROLLBACK STARTING';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Backup tables available: %', backup_exists;
    RAISE NOTICE 'Mapping table available: %', mapping_exists;
    RAISE NOTICE 'Current accounts count: %', current_accounts;
    RAISE NOTICE '';
    
    IF NOT backup_exists THEN
        RAISE EXCEPTION 'CRITICAL: No backup tables found. Cannot safely rollback migration.';
    END IF;
    
    RAISE NOTICE 'WARNING: This rollback will restore the account.id = user.id anti-pattern';
    RAISE NOTICE 'Proceeding with rollback in 3 seconds...';
    
    -- Brief pause for final consideration
    PERFORM pg_sleep(3);
END $$;

-- =====================================================
-- LOG ROLLBACK START
-- =====================================================

INSERT INTO audit_logs (event_type, event_data, created_at)
VALUES (
    'MIGRATION_ROLLBACK_START',
    jsonb_build_object(
        'migration', 'fix_account_schema',
        'rollback_reason', 'emergency_rollback',
        'rollback_timestamp', NOW()
    ),
    NOW()
);

-- =====================================================
-- STEP 1: REMOVE NEW CONSTRAINTS AND TRIGGERS
-- =====================================================

-- Remove anti-pattern prevention constraints
DROP TRIGGER IF EXISTS prevent_account_user_id_overlap ON accounts;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS check_account_id_not_in_auth_users;

-- Remove new auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created_proper ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_proper();

-- Remove new constraint function
DROP FUNCTION IF EXISTS check_account_id_not_user_id();

-- Remove verification functions
DROP FUNCTION IF EXISTS verify_migration_integrity();
DROP FUNCTION IF EXISTS verify_final_schema_integrity();

RAISE NOTICE 'Removed new constraints and triggers';

-- =====================================================
-- STEP 2: DROP NEW RLS POLICIES
-- =====================================================

-- Drop optimized RLS policies
DROP POLICY IF EXISTS "Users can view their accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update their accounts" ON accounts;
DROP POLICY IF EXISTS "Service role can manage accounts" ON accounts;

DROP POLICY IF EXISTS "Users can view account memberships" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage team members" ON account_users;
DROP POLICY IF EXISTS "Service role can manage account memberships" ON account_users;

-- Drop any transition policies that might still exist
DROP POLICY IF EXISTS "Users can view their accounts (transition)" ON accounts;
DROP POLICY IF EXISTS "Users can update their accounts (transition)" ON accounts;

RAISE NOTICE 'Removed new RLS policies';

-- =====================================================
-- STEP 3: RESTORE ORIGINAL TABLE STRUCTURE
-- =====================================================

-- Disable RLS temporarily for data restoration
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Create current data backup for rollback verification
CREATE TABLE accounts_pre_rollback_backup AS SELECT * FROM accounts;
CREATE TABLE account_users_pre_rollback_backup AS SELECT * FROM account_users;

-- Drop current tables
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS account_users CASCADE;

-- Restore original tables from backup
ALTER TABLE accounts_backup_pre_migration RENAME TO accounts;
ALTER TABLE account_users_backup_pre_migration RENAME TO account_users;

-- Re-enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Restored original table structures from backup';

-- =====================================================
-- STEP 4: RESTORE ORIGINAL FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Re-add the original foreign key constraint that enforces account.id = user.id
ALTER TABLE accounts 
ADD CONSTRAINT accounts_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

RAISE NOTICE 'Restored original foreign key constraints (account.id = user.id pattern)';

-- =====================================================
-- STEP 5: RESTORE ORIGINAL RLS POLICIES
-- =====================================================

-- Restore simple original RLS policies
CREATE POLICY "Users can view their own account"
    ON accounts FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own account"
    ON accounts FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own account"
    ON accounts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can create accounts"
    ON accounts FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Restore original account_users policies
CREATE POLICY "Users can view their own account_users"
    ON account_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own account_users"
    ON account_users FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own account_users"
    ON account_users FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own account_users"
    ON account_users FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

RAISE NOTICE 'Restored original RLS policies';

-- =====================================================
-- STEP 6: RESTORE ORIGINAL AUTH TRIGGER
-- =====================================================

-- Restore original auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create account record with user.id as account.id (original anti-pattern)
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count
    ) VALUES (
        NEW.id,  -- This is the anti-pattern we're restoring
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0
    );
    
    -- Create account_user record with account_id = user_id (anti-pattern)
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        NEW.id,  -- account_id = user_id (anti-pattern)
        NEW.id,  -- user_id
        'owner',
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore original auth trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE 'Restored original auth trigger (with anti-pattern behavior)';

-- =====================================================
-- STEP 7: CLEANUP MIGRATION ARTIFACTS
-- =====================================================

-- Remove migration-specific indexes
DROP INDEX IF EXISTS idx_accounts_old_account_id;
DROP INDEX IF EXISTS idx_accounts_migration_status;
DROP INDEX IF EXISTS idx_account_users_user_role_optimized;
DROP INDEX IF EXISTS idx_account_users_account_role_optimized;

-- Remove migration tables
DROP TABLE IF EXISTS account_id_mapping;
DROP TABLE IF EXISTS accounts_pre_rollback_backup;
DROP TABLE IF EXISTS account_users_pre_rollback_backup;

RAISE NOTICE 'Cleaned up migration artifacts';

-- =====================================================
-- STEP 8: VERIFY ROLLBACK INTEGRITY
-- =====================================================

-- Create rollback verification function
CREATE OR REPLACE FUNCTION verify_rollback_integrity()
RETURNS TEXT AS $$
DECLARE
    anti_pattern_count INTEGER;
    total_accounts INTEGER;
    foreign_key_exists BOOLEAN := false;
    trigger_exists BOOLEAN := false;
BEGIN
    -- Count accounts that follow the anti-pattern (this should be all of them now)
    SELECT COUNT(*) INTO anti_pattern_count
    FROM accounts a
    WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.id);
    
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    
    -- Check if foreign key constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'accounts' 
        AND constraint_name = 'accounts_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        foreign_key_exists := true;
    END IF;
    
    -- Check if original trigger exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_table = 'users'
    ) THEN
        trigger_exists := true;
    END IF;
    
    RETURN FORMAT(
        'Rollback Verification: %s/%s accounts follow anti-pattern, FK exists: %s, Trigger exists: %s',
        anti_pattern_count,
        total_accounts,
        foreign_key_exists,
        trigger_exists
    );
END;
$$ LANGUAGE plpgsql;

-- Run verification
DO $$
DECLARE
    verification_result TEXT;
BEGIN
    SELECT verify_rollback_integrity() INTO verification_result;
    RAISE NOTICE 'Rollback verification: %', verification_result;
END $$;

-- =====================================================
-- FINAL LOGGING AND SUMMARY
-- =====================================================

-- Log rollback completion
INSERT INTO audit_logs (event_type, event_data, created_at)
VALUES (
    'MIGRATION_ROLLBACK_COMPLETE',
    jsonb_build_object(
        'migration', 'fix_account_schema',
        'rollback_verification', verify_rollback_integrity(),
        'rollback_completed_at', NOW(),
        'status', 'ROLLED_BACK_TO_ORIGINAL_SCHEMA'
    ),
    NOW()
);

-- Final summary
DO $$
DECLARE
    total_accounts INTEGER;
    verification_result TEXT;
BEGIN
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    SELECT verify_rollback_integrity() INTO verification_result;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ROLLBACK COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total accounts: %', total_accounts;
    RAISE NOTICE 'Verification: %', verification_result;
    RAISE NOTICE '';
    RAISE NOTICE 'ROLLBACK RESULTS:';
    RAISE NOTICE '✓ Restored original accounts table structure';
    RAISE NOTICE '✓ Restored original account_users table';
    RAISE NOTICE '✓ Restored account.id = user.id anti-pattern';
    RAISE NOTICE '✓ Restored original RLS policies';
    RAISE NOTICE '✓ Restored original auth trigger';
    RAISE NOTICE '✓ Removed migration constraints and optimizations';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: The following issues are now restored:';
    RAISE NOTICE '⚠ account.id = user.id anti-pattern is active again';
    RAISE NOTICE '⚠ Multi-account support is limited';
    RAISE NOTICE '⚠ Complex RLS policy dependency chains restored';
    RAISE NOTICE '⚠ Performance optimizations removed';
    RAISE NOTICE '';
    RAISE NOTICE 'POST-ROLLBACK TASKS:';
    RAISE NOTICE '1. Update Prisma schema: npx prisma db pull';
    RAISE NOTICE '2. Regenerate Prisma client: npx prisma generate';
    RAISE NOTICE '3. Test all authentication flows';
    RAISE NOTICE '4. Monitor application for stability';
    RAISE NOTICE '5. Consider addressing root cause that required rollback';
END $$;

-- Remove rollback verification function
DROP FUNCTION verify_rollback_integrity();

/*
POST-ROLLBACK VERIFICATION CHECKLIST:
[ ] Authentication flows work correctly
[ ] Account switching works (limited functionality restored)
[ ] Business creation and management works
[ ] Widget and prompt page management works
[ ] Team member functionality works
[ ] No database errors in application logs
[ ] Update Prisma: npx prisma db pull && npx prisma generate
[ ] All accounts have account.id = user.id pattern
[ ] Foreign key constraint accounts_id_fkey exists
[ ] Original auth trigger on_auth_user_created exists

KNOWN ISSUES RESTORED BY ROLLBACK:
- account.id = user.id anti-pattern limits multi-account support
- Complex RLS policy chains may cause performance issues
- Team member management may have edge cases
- Account isolation is not as robust as the new schema

RECOMMENDATIONS AFTER ROLLBACK:
1. Identify and fix the root cause that required rollback
2. Test the migration more thoroughly on staging
3. Consider implementing the migration in smaller, safer steps
4. Monitor for the original issues that the migration was meant to solve

CRITICAL NOTE:
This rollback restores all the original database design issues that the
migration was intended to fix. It should only be used as an emergency
measure, and the underlying problems should be addressed properly.
*/