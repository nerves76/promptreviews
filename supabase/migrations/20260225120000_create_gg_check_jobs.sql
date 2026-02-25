-- Create gg_check_jobs table for queuing manual geo-grid check requests.
-- Instead of running checks inline in the HTTP handler (which times out),
-- the check endpoint inserts a job and a background processor handles it.

CREATE TABLE gg_check_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  keyword_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  checks_performed INTEGER NOT NULL DEFAULT 0,
  total_checks INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,4) NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_idempotency_key TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_gg_check_jobs_account_id ON gg_check_jobs(account_id);
CREATE INDEX idx_gg_check_jobs_pending ON gg_check_jobs(status, created_at)
  WHERE status IN ('pending', 'processing');

-- RLS
ALTER TABLE gg_check_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gg_check_jobs_select" ON gg_check_jobs
  FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "gg_check_jobs_insert" ON gg_check_jobs
  FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "gg_check_jobs_service" ON gg_check_jobs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
