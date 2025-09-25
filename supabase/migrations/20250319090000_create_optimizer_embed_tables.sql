-- Google Biz Optimizer embed lead + session infrastructure

-- Ensure crypto helpers are available for uuid + hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Leads captured from the embed experience
CREATE TABLE IF NOT EXISTS optimizer_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  business_name TEXT,
  google_maps_url TEXT,
  source_business VARCHAR(100) DEFAULT 'promptreviews',
  source_domain VARCHAR(255),
  lead_segment VARCHAR(50),
  business_size VARCHAR(50),
  industry VARCHAR(80),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  referrer_url TEXT,
  lead_score INTEGER,
  lead_status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_analysis_date TIMESTAMPTZ,
  pdf_downloaded BOOLEAN DEFAULT FALSE,
  pdf_download_date TIMESTAMPTZ,
  signed_up_for_trial BOOLEAN DEFAULT FALSE,
  trial_start_date TIMESTAMPTZ,
  converted_to_customer BOOLEAN DEFAULT FALSE,
  customer_conversion_date TIMESTAMPTZ,
  google_account_email VARCHAR(255),
  place_id VARCHAR(255),
  location_name TEXT,
  location_address TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_optimizer_leads_email_source ON optimizer_leads(email, source_business);
CREATE INDEX IF NOT EXISTS idx_optimizer_leads_created_at ON optimizer_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimizer_leads_lead_segment ON optimizer_leads(lead_segment);
CREATE INDEX IF NOT EXISTS idx_optimizer_leads_converted ON optimizer_leads(converted_to_customer);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION set_optimizer_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_optimizer_leads_updated_at ON optimizer_leads;
CREATE TRIGGER trg_optimizer_leads_updated_at
BEFORE UPDATE ON optimizer_leads
FOR EACH ROW EXECUTE FUNCTION set_optimizer_leads_updated_at();

-- Session storage for temporary JWT access tokens
CREATE TABLE IF NOT EXISTS optimizer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token_hash CHAR(64) UNIQUE NOT NULL,
  session_scope JSONB DEFAULT '{}'::jsonb,
  session_key_version VARCHAR(32) DEFAULT 'v1',
  email VARCHAR(255),
  lead_id UUID REFERENCES optimizer_leads(id) ON DELETE SET NULL,
  google_access_token_cipher TEXT,
  google_refresh_token_cipher TEXT,
  google_token_iv TEXT,
  google_token_key_version VARCHAR(32),
  google_token_expires_at TIMESTAMPTZ,
  api_calls_count INTEGER DEFAULT 0,
  last_api_call_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 minutes') NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_optimizer_sessions_expires_at ON optimizer_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_optimizer_sessions_email ON optimizer_sessions(email);

-- Enable RLS and restrict mutations to the service role
ALTER TABLE optimizer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimizer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optimizer_leads_service_role_full" ON optimizer_leads;
CREATE POLICY "optimizer_leads_service_role_full" ON optimizer_leads
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "optimizer_sessions_service_role_full" ON optimizer_sessions;
CREATE POLICY "optimizer_sessions_service_role_full" ON optimizer_sessions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow read access for active sessions matching the hashed token value passed in headers
DROP POLICY IF EXISTS "optimizer_leads_session_read" ON optimizer_leads;
CREATE POLICY "optimizer_leads_session_read" ON optimizer_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM optimizer_sessions os
      WHERE os.email = optimizer_leads.email
        AND os.expires_at > NOW()
        AND os.session_token_hash = encode(digest(COALESCE(current_setting('request.header.x-session-token', true), ''), 'sha256'), 'hex')
    )
  );
