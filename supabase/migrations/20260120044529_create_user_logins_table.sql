-- Create user_logins table to track login events for admin monitoring
CREATE TABLE IF NOT EXISTS user_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  is_new_user BOOLEAN DEFAULT FALSE,
  login_type TEXT DEFAULT 'email' CHECK (login_type IN ('email', 'google', 'magic_link', 'password'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logins_login_at ON user_logins(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_logins_email ON user_logins(email);

-- Enable RLS
ALTER TABLE user_logins ENABLE ROW LEVEL SECURITY;

-- Only admins can view login logs (via service role or admin check)
-- Regular users cannot access this table
CREATE POLICY "Only service role can access user_logins"
  ON user_logins
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Comment on table
COMMENT ON TABLE user_logins IS 'Tracks user login events for admin monitoring';
