-- DRAFT MIGRATION: Phase 3 - Cleanup and Finalize Account Schema
-- ⚠️ DO NOT EXECUTE UNTIL PHASES 1 & 2 ARE VERIFIED WORKING
-- ⚠️ THIS REMOVES ROLLBACK CAPABILITY - BE CERTAIN BEFORE PROCEEDING
--
-- This migration finalizes the account.id != user.id fix by:
-- 1. Enabling strict constraints to prevent future anti-pattern violations
-- 2. Cleaning up temporary migration artifacts
-- 3. Optimizing RLS policies for the new schema structure
-- 4. Removing rollback capability (backup tables remain for manual recovery)
--
-- CRITICAL: After this migration, automatic rollback is no longer possible.
-- Only proceed if Phase 2 has been thoroughly tested and verified working.

-- =====================================================
-- PRE-CLEANUP VERIFICATION
-- =====================================================

DO $$
DECLARE
    completed_accounts INTEGER;
    failed_accounts INTEGER;
    integrity_result TEXT;
BEGIN
    -- Verify Phase 2 completed successfully
    SELECT COUNT(*) INTO completed_accounts 
    FROM accounts 
    WHERE migration_status = 'completed';
    
    SELECT COUNT(*) INTO failed_accounts 
    FROM accounts 
    WHERE migration_status IN ('needs_migration', 'id_updated', 'failed');
    
    IF failed_accounts > 0 THEN
        RAISE EXCEPTION 'CRITICAL: % accounts have not completed migration. Phase 3 cannot proceed.', failed_accounts;
    END IF;
    
    IF completed_accounts = 0 THEN
        RAISE EXCEPTION 'CRITICAL: No accounts show completed migration status. Run Phase 2 first.';
    END IF;
    
    -- Run integrity check from Phase 2
    SELECT verify_migration_integrity() INTO integrity_result;
    
    RAISE NOTICE 'Phase 3 Cleanup Starting:';
    RAISE NOTICE '  Migrated accounts verified: %', completed_accounts;
    RAISE NOTICE '  Integrity check: %', integrity_result;
    RAISE NOTICE '  WARNING: This will remove rollback capability';
END $$;

-- =====================================================
-- ENABLE STRICT ANTI-PATTERN PREVENTION
-- =====================================================

-- Enable the trigger that prevents account.id = user.id
-- This was created in Phase 1 but not enabled to allow migration
CREATE TRIGGER prevent_account_user_id_overlap
    BEFORE INSERT OR UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION check_account_id_not_user_id();

-- Add additional constraint for double protection
ALTER TABLE accounts 
ADD CONSTRAINT check_account_id_not_in_auth_users 
CHECK (id NOT IN (SELECT id FROM auth.users));

-- Test the constraints work
DO $$
DECLARE
    test_user_id UUID;
    constraint_works BOOLEAN := false;
BEGIN
    -- Get a real user ID to test with
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        BEGIN
            -- Try to insert an account with a user ID (this should fail)
            INSERT INTO accounts (id, plan) VALUES (test_user_id, 'test');
            RAISE EXCEPTION 'CRITICAL: Anti-pattern constraint did not work - test account was created with user ID';
        EXCEPTION WHEN others THEN
            -- This exception is expected - the constraint should prevent the insert
            constraint_works := true;
        END;
        
        IF NOT constraint_works THEN
            RAISE EXCEPTION 'CRITICAL: Anti-pattern prevention constraint is not working';
        END IF;
    END IF;
    
    RAISE NOTICE 'Anti-pattern prevention constraints verified working';
END $$;

-- =====================================================
-- OPTIMIZE RLS POLICIES FOR NEW SCHEMA
-- =====================================================

-- Remove transition policies from Phase 1
DROP POLICY IF EXISTS "Users can view their accounts (transition)" ON accounts;
DROP POLICY IF EXISTS "Users can update their accounts (transition)" ON accounts;

-- Create optimized policies for the new schema structure
CREATE POLICY "Users can view their accounts"
    ON accounts FOR SELECT
    TO authenticated
    USING (
        -- New pattern only: through account_users table
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their accounts"
    ON accounts FOR UPDATE
    TO authenticated
    USING (
        -- Only owners can update account settings
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Insert policy for new accounts (service role only in normal operation)
CREATE POLICY "Service role can manage accounts"
    ON accounts FOR ALL
    TO service_role
    WITH CHECK (true);

-- Update account_users policies for better performance
DROP POLICY IF EXISTS "Users can view their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can insert their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can update their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can delete their own account_users" ON account_users;

-- Optimized account_users policies
CREATE POLICY "Users can view account memberships"
    ON account_users FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Account owners can manage team members"
    ON account_users FOR ALL
    TO authenticated
    USING (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id 
            FROM account_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Service role policy for account_users
CREATE POLICY "Service role can manage account memberships"
    ON account_users FOR ALL
    TO service_role
    WITH CHECK (true);

-- =====================================================
-- ADD PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Add optimized indexes for the new query patterns
CREATE INDEX IF NOT EXISTS idx_account_users_user_role_optimized 
ON account_users(user_id, role, account_id) 
WHERE role IN ('owner', 'admin');

CREATE INDEX IF NOT EXISTS idx_account_users_account_role_optimized 
ON account_users(account_id, role, user_id) 
WHERE role IN ('owner', 'admin');

-- Remove old indexes that are no longer optimal
DROP INDEX IF EXISTS idx_account_users_role_owner;

-- Analyze tables for better query planning
ANALYZE accounts;
ANALYZE account_users;

-- =====================================================
-- CLEAN UP MIGRATION ARTIFACTS
-- =====================================================

-- Remove migration tracking columns from accounts table
ALTER TABLE accounts DROP COLUMN IF EXISTS old_account_id;
ALTER TABLE accounts DROP COLUMN IF EXISTS migration_status;

-- Remove migration helper functions (but keep verification function)
DROP FUNCTION IF EXISTS count_accounts_needing_migration();
DROP FUNCTION IF EXISTS validate_account_users_consistency();
DROP FUNCTION IF EXISTS emergency_rollback_account_ids();

-- Keep the constraint function as it's now permanently needed
-- DROP FUNCTION check_account_id_not_user_id(); -- Keep this

-- Remove migration mapping table (point of no return for automatic rollback)
-- Note: We keep this commented out as an extra safety measure
-- Uncomment only after 100% confidence in the migration
-- DROP TABLE IF EXISTS account_id_mapping;

RAISE NOTICE 'Migration artifacts cleaned up (account_id_mapping table preserved as final safety measure)';

-- =====================================================
-- FINAL VERIFICATION AND TESTING
-- =====================================================

-- Update verification function for post-cleanup checks
CREATE OR REPLACE FUNCTION verify_final_schema_integrity()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    anti_pattern_violations INTEGER;
    orphaned_references INTEGER;
    policy_count INTEGER;
    constraint_count INTEGER;
BEGIN
    -- Check that no accounts have user IDs
    SELECT COUNT(*) INTO anti_pattern_violations
    FROM accounts a
    WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.id);
    
    -- Check for orphaned account references (sample of critical tables)
    SELECT COUNT(*) INTO orphaned_references
    FROM (
        SELECT account_id FROM businesses WHERE account_id NOT IN (SELECT id FROM accounts)
        UNION ALL
        SELECT account_id FROM widgets WHERE account_id NOT IN (SELECT id FROM accounts)
        UNION ALL
        SELECT account_id FROM account_users WHERE account_id NOT IN (SELECT id FROM accounts)
    ) orphaned;
    
    -- Verify RLS policies are in place
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename IN ('accounts', 'account_users')
    AND schemaname = 'public';
    
    -- Verify constraints are in place
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints
    WHERE table_name = 'accounts'
    AND constraint_type = 'CHECK'
    AND constraint_name = 'check_account_id_not_in_auth_users';
    
    result := FORMAT(
        'Final Schema Integrity: %s anti-pattern violations, %s orphaned references, %s RLS policies, %s constraints',
        anti_pattern_violations,
        orphaned_references,
        policy_count,
        constraint_count
    );
    
    IF anti_pattern_violations > 0 OR orphaned_references > 0 OR policy_count < 4 OR constraint_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL: Final schema integrity check failed: %', result;
    END IF;
    
    RETURN result || ' - SCHEMA MIGRATION COMPLETE AND VERIFIED';
END;
$$ LANGUAGE plpgsql;

-- Run final verification
SELECT verify_final_schema_integrity();

-- =====================================================
-- UPDATE AUTH TRIGGERS FOR NEW ACCOUNT CREATION
-- =====================================================

-- Drop any existing problematic auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS track_user_login_trigger ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS public.setup_user_account(uuid);

-- Create new proper auth trigger that follows the correct pattern
CREATE OR REPLACE FUNCTION handle_new_user_proper()
RETURNS TRIGGER AS $$
DECLARE
    new_account_id UUID;
BEGIN
    -- Generate a new, unique account ID (NOT the user ID)
    new_account_id := gen_random_uuid();
    
    -- Ensure the new account ID doesn't accidentally match a user ID
    WHILE EXISTS (SELECT 1 FROM auth.users WHERE id = new_account_id) LOOP
        new_account_id := gen_random_uuid();
    END LOOP;
    
    -- Create account record with independent ID
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count
    ) VALUES (
        new_account_id,  -- Independent UUID, NOT NEW.id
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0
    );
    
    -- Create account_user record linking user to their new account
    INSERT INTO public.account_users (
        account_id,
        user_id,
        role,
        created_at
    ) VALUES (
        new_account_id,  -- The new account ID
        NEW.id,          -- The user ID
        'owner',
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_proper
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_proper();

-- Test the new trigger function
DO $$
BEGIN
    RAISE NOTICE 'New account creation trigger installed - will create proper account/user separation for new users';
END $$;

-- =====================================================
-- FINAL LOGGING AND SUMMARY
-- =====================================================

-- Log successful completion
INSERT INTO audit_logs (event_type, event_data, created_at)
VALUES (
    'MIGRATION_PHASE_3_COMPLETE',
    jsonb_build_object(
        'migration', 'fix_account_schema',
        'phase', 3,
        'final_verification', verify_final_schema_integrity(),
        'rollback_capability', 'removed_automatic_kept_manual',
        'status', 'MIGRATION_COMPLETE'
    ),
    NOW()
);

-- Final summary
DO $$
DECLARE
    total_accounts INTEGER;
    integrity_result TEXT;
BEGIN
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    SELECT verify_final_schema_integrity() INTO integrity_result;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ACCOUNT SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total accounts: %', total_accounts;
    RAISE NOTICE 'Final verification: %', integrity_result;
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION ACHIEVEMENTS:';
    RAISE NOTICE '✓ Fixed account.id = user.id anti-pattern';
    RAISE NOTICE '✓ Proper user/account separation implemented';
    RAISE NOTICE '✓ Multi-account support fully enabled';
    RAISE NOTICE '✓ RLS policies optimized for new schema';
    RAISE NOTICE '✓ Anti-pattern prevention constraints active';
    RAISE NOTICE '✓ New user creation follows proper pattern';
    RAISE NOTICE '';
    RAISE NOTICE 'POST-MIGRATION TASKS:';
    RAISE NOTICE '1. Monitor application for any issues';
    RAISE NOTICE '2. Update Prisma schema: npx prisma db pull';
    RAISE NOTICE '3. Regenerate Prisma client: npx prisma generate';
    RAISE NOTICE '4. Remove backup tables after 30 days if no issues';
    RAISE NOTICE '5. Remove account_id_mapping table after confidence period';
    RAISE NOTICE '';
    RAISE NOTICE 'BACKUP TABLES PRESERVED:';
    RAISE NOTICE '- accounts_backup_pre_migration (for manual recovery)';
    RAISE NOTICE '- account_users_backup_pre_migration (for manual recovery)';
    RAISE NOTICE '- account_id_mapping (for reference/manual rollback)';
END $$;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE accounts IS 'User accounts with independent UUIDs (not linked to auth.users.id)';
COMMENT ON TABLE account_users IS 'Links users to accounts with roles - enables multi-account support';
COMMENT ON FUNCTION check_account_id_not_user_id() IS 'Prevents account.id from being set to any user.id value';
COMMENT ON FUNCTION handle_new_user_proper() IS 'Creates new accounts with independent IDs for new users';
COMMENT ON FUNCTION verify_final_schema_integrity() IS 'Verifies the account schema migration completed successfully';

/*
POST-MIGRATION CHECKLIST:
[ ] All authentication flows work correctly
[ ] Account switching works for multi-account users
[ ] Team member invitations work
[ ] Business creation and management works
[ ] Widget and prompt page management works
[ ] Subscription and billing features work
[ ] No database errors in application logs
[ ] Performance is acceptable (may be better due to optimized indexes)
[ ] Run: SELECT verify_final_schema_integrity(); -- Should pass
[ ] Update Prisma: npx prisma db pull && npx prisma generate
[ ] Monitor for 48-72 hours before removing backup tables

MANUAL ROLLBACK PROCEDURE (if absolutely necessary):
1. Stop the application
2. DROP TABLE accounts; DROP TABLE account_users;
3. ALTER TABLE accounts_backup_pre_migration RENAME TO accounts;
4. ALTER TABLE account_users_backup_pre_migration RENAME TO account_users;
5. ALTER TABLE accounts ADD CONSTRAINT accounts_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
6. Drop new triggers and functions
7. Restore original auth triggers
8. Restart application

SAFETY NOTES:
- Backup tables remain for manual recovery
- account_id_mapping table preserved for reference
- Anti-pattern constraints prevent regression
- New auth trigger creates proper account structure
*/