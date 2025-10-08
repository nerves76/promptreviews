-- ============================================
-- Add business_name_override to community_profiles
-- ============================================
-- Allows users to override which business name appears in community
-- Useful when user has multiple accounts and wants to choose which business to represent

ALTER TABLE community_profiles
ADD COLUMN business_name_override TEXT;

COMMENT ON COLUMN community_profiles.business_name_override IS 'Optional override for business name display (if user has multiple accounts)';

-- Update get_user_display_identity function to use business_name_override
CREATE OR REPLACE FUNCTION get_user_display_identity(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_username TEXT;
    v_display_override TEXT;
    v_business_name TEXT;
    v_result TEXT;
BEGIN
    -- Get username, display override, and business override from community profile
    SELECT username, display_name_override, business_name_override
    INTO v_username, v_display_override, v_business_name
    FROM community_profiles
    WHERE user_id = p_user_id;

    -- If no business override, get user's primary business name (first account)
    IF v_business_name IS NULL THEN
        SELECT a.business_name
        INTO v_business_name
        FROM accounts a
        JOIN account_users au ON au.account_id = a.id
        WHERE au.user_id = p_user_id
        ORDER BY au.created_at ASC
        LIMIT 1;
    END IF;

    -- Build display name
    IF v_display_override IS NOT NULL AND v_business_name IS NOT NULL THEN
        -- "Display Name (username) • Business Name"
        v_result := v_display_override || ' (' || v_username || ') • ' || v_business_name;
    ELSIF v_display_override IS NOT NULL THEN
        -- "Display Name (username)"
        v_result := v_display_override || ' (' || v_username || ')';
    ELSIF v_business_name IS NOT NULL THEN
        -- "username • Business Name"
        v_result := v_username || ' • ' || v_business_name;
    ELSE
        -- Just username
        v_result := v_username;
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_user_display_identity IS 'Returns formatted display name: "Username • Business Name" or "Display Name (username) • Business" - uses business_name_override if set';

-- Log migration
DO $$
BEGIN
    RAISE NOTICE 'Added business_name_override column to community_profiles';
    RAISE NOTICE 'Updated get_user_display_identity function to use override';
END $$;
