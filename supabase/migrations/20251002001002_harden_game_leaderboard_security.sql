-- Migration: Harden game leaderboard security
-- Date: 2025-10-02
-- Description: Add tampering protection, PII privacy, rate limiting, and score validation

-- ============================================================================
-- GAME_LEADERBOARD TABLE - Add missing UPDATE/DELETE protection
-- ============================================================================

-- Prevent updates and deletes from public (only via admin with service_role)
CREATE POLICY "Prevent public updates on game_leaderboard"
    ON game_leaderboard
    FOR UPDATE
    USING (false);

CREATE POLICY "Prevent public deletes on game_leaderboard"
    ON game_leaderboard
    FOR DELETE
    USING (false);

-- ============================================================================
-- GAME_SCORES TABLE - Fix PII exposure and add protections
-- ============================================================================

-- Revoke direct SELECT access (force use of public_leaderboard view which masks emails)
-- The view already masks emails and limits to top 100 scores
REVOKE SELECT ON game_scores FROM anon;
REVOKE SELECT ON game_scores FROM authenticated;

-- The public_leaderboard view is already granted SELECT in migration 0179
-- Verify it's accessible
GRANT SELECT ON public_leaderboard TO anon, authenticated;

-- ============================================================================
-- RATE LIMITING - Add DB-level submission throttling
-- ============================================================================

-- Add function to check recent submission count from same IP
CREATE OR REPLACE FUNCTION check_game_score_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INTEGER;
    rate_limit_window INTERVAL := '5 minutes';
    max_submissions INTEGER := 10;
BEGIN
    -- Only check if IP address is provided
    IF NEW.ip_address IS NOT NULL THEN
        -- Count recent submissions from this IP
        SELECT COUNT(*)
        INTO recent_count
        FROM game_scores
        WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - rate_limit_window;

        -- Enforce rate limit
        IF recent_count >= max_submissions THEN
            RAISE EXCEPTION 'Rate limit exceeded. Maximum % submissions per % minutes.',
                max_submissions, EXTRACT(EPOCH FROM rate_limit_window)/60
                USING ERRCODE = '23P01'; -- check_violation
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce rate limiting on INSERT
DROP TRIGGER IF EXISTS trigger_check_game_score_rate_limit ON game_scores;
CREATE TRIGGER trigger_check_game_score_rate_limit
    BEFORE INSERT ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION check_game_score_rate_limit();

-- ============================================================================
-- SCORE SANITY CHECKS - Prevent impossibly high scores
-- ============================================================================

-- Add function to validate score reasonableness based on game mechanics
CREATE OR REPLACE FUNCTION validate_game_score()
RETURNS TRIGGER AS $$
DECLARE
    max_possible_score INTEGER;
    max_score_per_level INTEGER := 10000; -- Adjust based on actual game mechanics
BEGIN
    -- Calculate maximum theoretically possible score for the level reached
    max_possible_score := NEW.level_reached * max_score_per_level;

    -- Check if score exceeds reasonable bounds
    IF NEW.score > max_possible_score THEN
        RAISE EXCEPTION 'Score % exceeds maximum possible score % for level %',
            NEW.score, max_possible_score, NEW.level_reached
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    -- Additional sanity check: score should generally increase with level
    -- Allow some flexibility but flag obvious cheating (high score on level 1)
    IF NEW.level_reached = 1 AND NEW.score > 5000 THEN
        RAISE EXCEPTION 'Score too high for level 1'
            USING ERRCODE = '23514';
    END IF;

    -- Check play time is reasonable (not too fast to be humanly possible)
    -- Minimum 10 seconds per level seems reasonable
    IF NEW.play_time_seconds > 0 AND NEW.play_time_seconds < (NEW.level_reached * 10) THEN
        RAISE WARNING 'Suspiciously fast completion time: % seconds for level %',
            NEW.play_time_seconds, NEW.level_reached;
        -- Log but don't block - could be legitimate speedrun
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to validate scores on INSERT
DROP TRIGGER IF EXISTS trigger_validate_game_score ON game_scores;
CREATE TRIGGER trigger_validate_game_score
    BEFORE INSERT ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION validate_game_score();

-- ============================================================================
-- DAILY SUBMISSION LIMITS - Prevent spam from same IP
-- ============================================================================

-- Add function to limit submissions per IP per day
CREATE OR REPLACE FUNCTION check_daily_submission_limit()
RETURNS TRIGGER AS $$
DECLARE
    daily_count INTEGER;
    max_daily_submissions INTEGER := 50; -- Max 50 scores per IP per day
BEGIN
    -- Only check if IP address is provided
    IF NEW.ip_address IS NOT NULL THEN
        -- Count submissions from this IP in last 24 hours
        SELECT COUNT(*)
        INTO daily_count
        FROM game_scores
        WHERE ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '24 hours';

        -- Enforce daily limit
        IF daily_count >= max_daily_submissions THEN
            RAISE EXCEPTION 'Daily submission limit exceeded. Maximum % submissions per 24 hours.',
                max_daily_submissions
                USING ERRCODE = '23P01';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for daily limit check
DROP TRIGGER IF EXISTS trigger_check_daily_submission_limit ON game_scores;
CREATE TRIGGER trigger_check_daily_submission_limit
    BEFORE INSERT ON game_scores
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_submission_limit();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE game_leaderboard IS 'Game leaderboard with RLS enabled. Public read/insert only. UPDATE/DELETE restricted to service_role.';
COMMENT ON TABLE game_scores IS 'Game scores with full security hardening. Direct SELECT revoked - use public_leaderboard view instead. Rate limiting and score validation enforced via triggers.';

-- Summary of security improvements:
-- 1. game_leaderboard: Added UPDATE/DELETE prevention (was missing)
-- 2. game_scores: Revoked direct SELECT to hide emails/IPs (use public_leaderboard view)
-- 3. Rate limiting: Max 10 submissions per 5 minutes per IP (DB-enforced)
-- 4. Daily limits: Max 50 submissions per 24 hours per IP
-- 5. Score validation: Prevents impossibly high scores based on level reached
-- 6. Speed checks: Warns about suspiciously fast completion times
