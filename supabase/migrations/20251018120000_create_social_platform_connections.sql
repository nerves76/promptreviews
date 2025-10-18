-- Social Platform Connections
-- This table stores credentials and connection metadata for social platforms (Bluesky, Twitter/X, Slack)
-- Google Business Profile connections continue to use the existing google_business_profiles table

-- Enum for platform types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform_type') THEN
    CREATE TYPE public.social_platform_type AS ENUM ('bluesky', 'twitter', 'slack');
  END IF;
END
$$;

-- Enum for connection status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_connection_status') THEN
    CREATE TYPE public.social_connection_status AS ENUM ('active', 'expired', 'disconnected', 'error');
  END IF;
END
$$;

-- Main connections table
CREATE TABLE IF NOT EXISTS public.social_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform public.social_platform_type NOT NULL,

  -- Encrypted credentials (store tokens, app passwords, etc.)
  -- Structure depends on platform:
  -- Bluesky: { "identifier": "user.bsky.social", "appPassword": "xxxx-xxxx-xxxx-xxxx", "did": "did:plc:xxx" }
  -- Twitter: { "accessToken": "xxx", "refreshToken": "xxx", "expiresAt": 123456 }
  -- Slack: { "botToken": "xoxb-xxx", "teamId": "T123", "channelId": "C123" }
  credentials JSONB NOT NULL,

  -- Connection status
  status public.social_connection_status NOT NULL DEFAULT 'active',

  -- Platform-specific metadata
  -- Bluesky: { "handle": "user.bsky.social", "displayName": "User Name" }
  -- Twitter: { "username": "handle", "userId": "123" }
  -- Slack: { "teamName": "Workspace", "channelName": "#general" }
  metadata JSONB,

  -- Last validation/refresh timestamp
  last_validated_at TIMESTAMP WITH TIME ZONE,

  -- Error information (if status is 'error')
  error_message TEXT,
  error_details JSONB,

  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  -- One connection per platform per account
  CONSTRAINT unique_account_platform UNIQUE (account_id, platform)
);

-- Comments
COMMENT ON TABLE public.social_platform_connections IS 'Social platform credentials for multi-platform posting (Bluesky, Twitter/X, Slack). Google Business uses google_business_profiles.';
COMMENT ON COLUMN public.social_platform_connections.credentials IS 'Encrypted platform credentials (tokens, passwords). Structure varies by platform.';
COMMENT ON COLUMN public.social_platform_connections.metadata IS 'Platform-specific display metadata (usernames, team names, etc.). Safe to expose to UI.';
COMMENT ON COLUMN public.social_platform_connections.account_id IS 'Account that owns this connection. Enforces account isolation.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_platform_connections_account
  ON public.social_platform_connections (account_id);

CREATE INDEX IF NOT EXISTS idx_social_platform_connections_platform
  ON public.social_platform_connections (platform);

CREATE INDEX IF NOT EXISTS idx_social_platform_connections_status
  ON public.social_platform_connections (status);

CREATE INDEX IF NOT EXISTS idx_social_platform_connections_user
  ON public.social_platform_connections (user_id);

-- RLS Policies
ALTER TABLE public.social_platform_connections ENABLE ROW LEVEL SECURITY;

-- Users can view connections for their accounts
CREATE POLICY "Users can view social platform connections for their accounts"
  ON public.social_platform_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = social_platform_connections.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Users can insert connections for their accounts
CREATE POLICY "Users can insert social platform connections for their accounts"
  ON public.social_platform_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = social_platform_connections.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Users can update connections for their accounts
CREATE POLICY "Users can update social platform connections for their accounts"
  ON public.social_platform_connections
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = social_platform_connections.account_id
        AND au.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = social_platform_connections.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Users can delete connections for their accounts
CREATE POLICY "Users can delete social platform connections for their accounts"
  ON public.social_platform_connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = social_platform_connections.account_id
        AND au.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER update_social_platform_connections_updated_at
  BEFORE UPDATE ON public.social_platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
