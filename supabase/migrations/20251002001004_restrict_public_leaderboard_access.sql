-- Migration: Restrict public_leaderboard view to service_role only
-- Date: 2025-10-02
-- Description: Prevents direct database access to leaderboard, forcing use of rate-limited API endpoint

-- ============================================================================
-- PUBLIC_LEADERBOARD VIEW - Remove public access
-- ============================================================================

-- Revoke direct access from all public roles
-- While the view is INTENDED for public display, it should only be accessed through
-- the /api/game/leaderboard endpoint which provides rate limiting and caching
REVOKE SELECT ON public_leaderboard FROM anon;
REVOKE SELECT ON public_leaderboard FROM authenticated;
REVOKE SELECT ON public_leaderboard FROM public;

-- Grant to service_role only (for API endpoints)
GRANT SELECT ON public_leaderboard TO service_role;

-- Update comment to clarify access restrictions
COMMENT ON VIEW public_leaderboard IS 'Public game leaderboard view with masked emails. Access restricted to service_role. Query via /api/game/leaderboard endpoint which provides rate limiting and caching. Direct client access prevented to avoid scraping and abuse.';

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

-- Security Improvement:
-- BEFORE: public_leaderboard had GRANT SELECT ... TO anon, authenticated
-- This allowed:
--   - Unlimited direct queries from any Supabase client
--   - No rate limiting or abuse prevention
--   - Potential scraping of all leaderboard data
--   - Potential DDoS via expensive queries
--
-- AFTER: Only service_role can SELECT from this view
-- Access controlled through /api/game/leaderboard endpoint which:
--   - Provides rate limiting (prevent scraping)
--   - Can implement caching (reduce DB load)
--   - Limits result size (max 100 records)
--   - Enables monitoring and abuse detection
--
-- The leaderboard data is still PUBLIC, but access is now controlled and rate-limited
-- through the API layer rather than allowing unrestricted direct database queries.
