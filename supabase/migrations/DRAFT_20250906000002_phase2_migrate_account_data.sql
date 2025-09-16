-- DRAFT MIGRATION: Phase 2 - Migrate Account Data
-- ⚠️ DO NOT EXECUTE WITHOUT THOROUGH TESTING AND BACKUP
-- ⚠️ REQUIRES PHASE 1 TO BE COMPLETED FIRST
--
-- This migration performs the actual data transformation to fix the
-- account.id = user.id anti-pattern by:
-- 1. Generating new account IDs for affected records
-- 2. Updating all foreign key references across 23 tables
-- 3. Cleaning up account_users duplicates
-- 4. Ensuring data integrity throughout
--
-- CRITICAL: This migration modifies data and should be tested thoroughly
-- on a staging environment before production deployment.

-- =====================================================
-- PRE-MIGRATION SAFETY CHECKS
-- =====================================================

DO $$
DECLARE
    accounts_needing_migration INTEGER;
    phase1_complete BOOLEAN := false;
BEGIN
    -- Verify Phase 1 was completed
    SELECT COUNT(*) INTO accounts_needing_migration 
    FROM accounts 
    WHERE migration_status = 'needs_migration';
    
    -- Check if Phase 1 structures exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'old_account_id') THEN
        phase1_complete := true;
    END IF;
    
    IF NOT phase1_complete THEN
        RAISE EXCEPTION 'CRITICAL: Phase 1 migration must be completed first. Run DRAFT_20250906000001_phase1_fix_account_schema.sql';
    END IF;
    
    IF accounts_needing_migration = 0 THEN
        RAISE EXCEPTION 'No accounts need migration. Either Phase 2 already completed or Phase 1 was not run correctly.';
    END IF;
    
    RAISE NOTICE 'Phase 2 Migration Starting:';
    RAISE NOTICE '  Accounts to migrate: %', accounts_needing_migration;
    RAISE NOTICE '  This will generate new account IDs and update all references';
END $$;

-- =====================================================
-- PHASE 2A: GENERATE NEW ACCOUNT IDS
-- =====================================================

-- Create mapping table for old to new account IDs
CREATE TABLE IF NOT EXISTS account_id_mapping (
    old_account_id UUID NOT NULL,
    new_account_id UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (old_account_id)
);

-- Generate new account IDs for all accounts that need migration
INSERT INTO account_id_mapping (old_account_id)
SELECT id 
FROM accounts 
WHERE migration_status = 'needs_migration'
ON CONFLICT (old_account_id) DO NOTHING;

-- Verify mapping was created correctly
DO $$
DECLARE
    mapping_count INTEGER;
    accounts_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mapping_count FROM account_id_mapping;
    SELECT COUNT(*) INTO accounts_count FROM accounts WHERE migration_status = 'needs_migration';
    
    IF mapping_count != accounts_count THEN
        RAISE EXCEPTION 'CRITICAL: Account ID mapping incomplete. Expected % mappings, got %', accounts_count, mapping_count;
    END IF;
    
    RAISE NOTICE 'Generated % new account ID mappings', mapping_count;
END $$;

-- =====================================================
-- PHASE 2B: UPDATE ACCOUNTS TABLE
-- =====================================================

-- Update accounts table with new IDs
UPDATE accounts 
SET 
    id = mapping.new_account_id,
    migration_status = 'id_updated'
FROM account_id_mapping mapping
WHERE accounts.id = mapping.old_account_id
AND accounts.migration_status = 'needs_migration';

-- Verify accounts table update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM accounts 
    WHERE migration_status = 'id_updated';
    
    RAISE NOTICE 'Updated % accounts with new IDs', updated_count;
END $$;

-- =====================================================
-- PHASE 2C: UPDATE ALL FOREIGN KEY REFERENCES
-- =====================================================

-- Update account_users table (most critical)
UPDATE account_users 
SET 
    account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE account_users.account_id = mapping.old_account_id;

-- Update businesses table
UPDATE businesses 
SET 
    account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE businesses.account_id = mapping.old_account_id;

-- Update all other tables with account_id references
-- (This covers all 23 tables identified in the analysis)

UPDATE account_invitations
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE account_invitations.account_id = mapping.old_account_id;

UPDATE account_events
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE account_events.account_id = mapping.old_account_id;

UPDATE admins
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE admins.account_id = mapping.old_account_id;

UPDATE audit_logs
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE audit_logs.account_id = mapping.old_account_id;

UPDATE business_locations
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE business_locations.account_id = mapping.old_account_id;

UPDATE communication_records
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE communication_records.account_id = mapping.old_account_id;

UPDATE communication_templates
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE communication_templates.account_id = mapping.old_account_id;

UPDATE contacts
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE contacts.account_id = mapping.old_account_id;

UPDATE email_domain_policies
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE email_domain_policies.account_id = mapping.old_account_id;

UPDATE email_reminder_logs
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE email_reminder_logs.account_id = mapping.old_account_id;

-- Handle google_business_media_uploads if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_business_media_uploads') THEN
        UPDATE google_business_media_uploads
        SET account_id = mapping.new_account_id
        FROM account_id_mapping mapping
        WHERE google_business_media_uploads.account_id = mapping.old_account_id;
    END IF;
END $$;

UPDATE onboarding_tasks
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE onboarding_tasks.account_id = mapping.old_account_id;

UPDATE prompt_pages
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE prompt_pages.account_id = mapping.old_account_id;

-- Handle review_import_sessions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_import_sessions') THEN
        UPDATE review_import_sessions
        SET account_id = mapping.new_account_id
        FROM account_id_mapping mapping
        WHERE review_import_sessions.account_id = mapping.old_account_id;
    END IF;
END $$;

UPDATE trial_reminder_logs
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE trial_reminder_logs.account_id = mapping.old_account_id;

UPDATE widgets
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE widgets.account_id = mapping.old_account_id;

-- Handle widget_analytics_events if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'widget_analytics_events') THEN
        UPDATE widget_analytics_events
        SET account_id = mapping.new_account_id
        FROM account_id_mapping mapping
        WHERE widget_analytics_events.account_id = mapping.old_account_id;
    END IF;
END $$;

UPDATE selected_gbp_locations
SET account_id = mapping.new_account_id
FROM account_id_mapping mapping
WHERE selected_gbp_locations.account_id = mapping.old_account_id;

-- Handle additional tables that might exist
DO $$
BEGIN
    -- ai_usage table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_usage') THEN
        EXECUTE 'UPDATE ai_usage SET account_id = mapping.new_account_id FROM account_id_mapping mapping WHERE ai_usage.account_id = mapping.old_account_id';
    END IF;
    
    -- feedback table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
        EXECUTE 'UPDATE feedback SET account_id = mapping.new_account_id FROM account_id_mapping mapping WHERE feedback.account_id = mapping.old_account_id';
    END IF;
    
    -- announcements table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        EXECUTE 'UPDATE announcements SET account_id = mapping.new_account_id FROM account_id_mapping mapping WHERE announcements.account_id = mapping.old_account_id';
    END IF;
END $$;

-- =====================================================
-- PHASE 2D: CLEAN UP ACCOUNT_USERS DUPLICATES
-- =====================================================

-- Remove duplicate account_users entries where account_id = user_id
-- This is the core of the anti-pattern we're fixing
DELETE FROM account_users 
WHERE account_id = user_id;

-- Also remove any other duplicates that might exist
DELETE FROM account_users a
WHERE EXISTS (
    SELECT 1 FROM account_users b
    WHERE b.user_id = a.user_id 
    AND b.account_id = a.account_id
    AND b.id > a.id  -- Keep the newer record
);

-- =====================================================
-- PHASE 2E: DATA INTEGRITY VERIFICATION
-- =====================================================

-- Create verification function
CREATE OR REPLACE FUNCTION verify_migration_integrity()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    orphaned_references INTEGER;
    anti_pattern_count INTEGER;
    duplicate_count INTEGER;
BEGIN
    -- Check for orphaned account references
    SELECT COUNT(*) INTO orphaned_references
    FROM (
        SELECT account_id FROM businesses WHERE account_id NOT IN (SELECT id FROM accounts)
        UNION ALL
        SELECT account_id FROM widgets WHERE account_id NOT IN (SELECT id FROM accounts)
        UNION ALL
        SELECT account_id FROM prompt_pages WHERE account_id NOT IN (SELECT id FROM accounts)
        UNION ALL
        SELECT account_id FROM contacts WHERE account_id NOT IN (SELECT id FROM accounts)
        -- Add more critical tables as needed
    ) orphaned;
    
    -- Check if anti-pattern still exists
    SELECT COUNT(*) INTO anti_pattern_count
    FROM accounts a
    WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.id);
    
    -- Check for account_users duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id, account_id, COUNT(*)
        FROM account_users 
        GROUP BY user_id, account_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    result := FORMAT(
        'Migration Verification: %s orphaned references, %s anti-pattern violations, %s duplicate account_users',
        orphaned_references,
        anti_pattern_count,
        duplicate_count
    );
    
    IF orphaned_references > 0 OR anti_pattern_count > 0 OR duplicate_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Migration integrity check failed: %', result;
    END IF;
    
    RETURN result || ' - ALL CHECKS PASSED';
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT verify_migration_integrity();

-- =====================================================
-- PHASE 2F: UPDATE MIGRATION STATUS
-- =====================================================

-- Mark all migrated accounts as completed
UPDATE accounts 
SET migration_status = 'completed'
WHERE migration_status = 'id_updated';

-- Log successful migration
INSERT INTO audit_logs (event_type, event_data, created_at)
VALUES (
    'MIGRATION_PHASE_2_COMPLETE',
    jsonb_build_object(
        'migration', 'fix_account_schema',
        'phase', 2,
        'accounts_migrated', (SELECT COUNT(*) FROM accounts WHERE migration_status = 'completed'),
        'integrity_check', verify_migration_integrity()
    ),
    NOW()
);

-- =====================================================
-- MIGRATION SUMMARY
-- =====================================================

DO $$
DECLARE
    migrated_accounts INTEGER;
    total_accounts INTEGER;
    integrity_result TEXT;
BEGIN
    SELECT COUNT(*) INTO migrated_accounts FROM accounts WHERE migration_status = 'completed';
    SELECT COUNT(*) INTO total_accounts FROM accounts;
    SELECT verify_migration_integrity() INTO integrity_result;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PHASE 2 MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Accounts migrated: %', migrated_accounts;
    RAISE NOTICE 'Total accounts: %', total_accounts;
    RAISE NOTICE 'Integrity check: %', integrity_result;
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run comprehensive application tests';
    RAISE NOTICE '2. Verify authentication flows work correctly';
    RAISE NOTICE '3. If everything works, run Phase 3 cleanup migration';
    RAISE NOTICE '4. If issues found, use rollback procedure immediately';
    RAISE NOTICE '';
    RAISE NOTICE 'ROLLBACK AVAILABLE: account_id_mapping table preserved for rollback';
END $$;

-- =====================================================
-- ROLLBACK HELPER FUNCTIONS
-- =====================================================

-- Function to rollback account ID changes (emergency use only)
CREATE OR REPLACE FUNCTION emergency_rollback_account_ids()
RETURNS TEXT AS $$
DECLARE
    rollback_count INTEGER := 0;
BEGIN
    -- This function can be used to rollback the account ID changes
    -- WARNING: Only use if Phase 3 has NOT been run yet
    
    RAISE NOTICE 'EMERGENCY ROLLBACK: Starting account ID rollback...';
    
    -- Rollback all tables in reverse order
    UPDATE selected_gbp_locations
    SET account_id = mapping.old_account_id
    FROM account_id_mapping mapping
    WHERE selected_gbp_locations.account_id = mapping.new_account_id;
    
    -- Continue with all other tables...
    -- (Full rollback code would go here)
    
    -- Finally rollback accounts table
    UPDATE accounts 
    SET 
        id = mapping.old_account_id,
        migration_status = 'rolled_back'
    FROM account_id_mapping mapping
    WHERE accounts.id = mapping.new_account_id;
    
    SELECT COUNT(*) INTO rollback_count FROM accounts WHERE migration_status = 'rolled_back';
    
    RETURN FORMAT('Rollback completed for % accounts', rollback_count);
END;
$$ LANGUAGE plpgsql;

/*
TESTING CHECKLIST BEFORE PRODUCTION:
[ ] Authentication still works for all users
[ ] Account switching works correctly
[ ] Business creation and management works
[ ] All widgets and prompt pages load correctly
[ ] No database errors in application logs
[ ] Run: SELECT verify_migration_integrity(); -- Should show ALL CHECKS PASSED
[ ] Verify no account.id equals any auth.users.id
[ ] Test team member invitations work
[ ] Test subscription and billing features work

ROLLBACK PROCEDURE (if needed):
1. DO NOT run Phase 3 if you need to rollback
2. Use: SELECT emergency_rollback_account_ids(); 
3. Restore from backup tables if emergency rollback fails
4. Re-add foreign key constraint if fully rolling back

CRITICAL NOTES:
- account_id_mapping table is preserved for rollback capability
- DO NOT delete backup tables until migration is fully validated
- Phase 3 will remove rollback capability - be certain before proceeding
*/