-- Migration: Restrict critical_function_health view to service_role only
-- Date: 2025-10-02
-- Description: Fixes global data leak in critical_function_health view which exposed platform-wide operational telemetry to all authenticated users

-- ============================================================================
-- CRITICAL_FUNCTION_HEALTH VIEW - Remove authenticated access
-- ============================================================================

-- Revoke access from authenticated users
-- This view aggregates GLOBAL success/error counts for every "critical function" across the entire platform
-- It's meant for internal admin dashboards only, not for individual customers
REVOKE SELECT ON critical_function_health FROM authenticated;
REVOKE SELECT ON critical_function_health FROM anon;
REVOKE SELECT ON critical_function_health FROM public;

-- Grant to service_role only (for admin API routes)
GRANT SELECT ON critical_function_health TO service_role;

-- Update comment to clarify access restrictions
COMMENT ON VIEW critical_function_health IS 'INTERNAL ADMIN ONLY: Global critical function health metrics across all tenants (function names, failure rates, average runtime). Access restricted to service_role. Query via authenticated admin API routes that check permissions before using service role.';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Security Issue Fixed:
-- BEFORE: critical_function_health had GRANT SELECT ... TO authenticated
-- This exposed global platform operational telemetry to ANY logged-in user:
--   - function_name (critical function names across all accounts)
--   - total_calls (call counts across ALL accounts)
--   - error_count (error counts across ALL accounts)
--   - success_count (success counts across ALL accounts)
--   - error_rate_percent (global error rates)
--   - avg_duration_ms (average runtime across ALL accounts)
--
-- AFTER: Only service_role can SELECT from this view
-- Admin routes must use service role client after checking caller is an admin
--
-- Admin UI at /admin/critical-monitoring must use API route /api/admin/critical-monitoring
-- which verifies admin status before querying the view with service role.
