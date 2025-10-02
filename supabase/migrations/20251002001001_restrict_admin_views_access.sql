-- Migration: Restrict admin views to service_role only
-- Date: 2025-10-02
-- Description: Fixes global data leak in reactivation_metrics view which exposed platform-wide stats to all authenticated users

-- ============================================================================
-- REACTIVATION_METRICS VIEW - Remove authenticated access
-- ============================================================================

-- Revoke access from authenticated users
-- This view shows GLOBAL reactivation statistics across ALL accounts (total counts, averages)
-- It's meant for internal admin dashboards only, not for individual customers
REVOKE SELECT ON reactivation_metrics FROM authenticated;
REVOKE SELECT ON reactivation_metrics FROM anon;
REVOKE SELECT ON reactivation_metrics FROM public;

-- Grant to service_role only (for admin API routes)
GRANT SELECT ON reactivation_metrics TO service_role;

-- Update comment to clarify access restrictions
COMMENT ON VIEW reactivation_metrics IS 'INTERNAL ADMIN ONLY: Global account reactivation metrics across all tenants. Access restricted to service_role. Query via authenticated admin API routes that check permissions before using service role.';

-- ============================================================================
-- ACCOUNT_USERS_READABLE VIEW - Check and restrict if needed
-- ============================================================================

-- This view joins account_users with auth.users (cross-schema) and businesses
-- It exposes user emails and business details
-- Check if it has proper access controls

-- Revoke any overly permissive grants
REVOKE SELECT ON account_users_readable FROM authenticated;
REVOKE SELECT ON account_users_readable FROM anon;
REVOKE SELECT ON account_users_readable FROM public;

-- Grant to service_role only
GRANT SELECT ON account_users_readable TO service_role;

-- Update comment to clarify this is for admin use
COMMENT ON VIEW account_users_readable IS 'INTERNAL ADMIN ONLY: Account users with email and business details from joined tables. Access restricted to service_role. Query via authenticated admin API routes that check permissions.';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Security Issue Fixed:
-- BEFORE: reactivation_metrics had GRANT SELECT ... TO authenticated
-- This exposed global platform statistics to ANY logged-in user:
--   - total_reactivations (count across ALL accounts)
--   - avg_days_to_return (average across ALL accounts)
--   - max_reactivations_per_user (max across ALL accounts)
--   - reactivations_last_30_days (global count)
--   - reactivations_last_7_days (global count)
--
-- AFTER: Only service_role can SELECT from these views
-- Admin routes must use service role client after checking caller is an admin
--
-- If per-tenant metrics are needed in the future, create a new view/function
-- that filters by account_id and uses proper RLS-friendly patterns.
