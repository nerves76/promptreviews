-- Create cron execution logs table for monitoring cron job runs
CREATE TABLE cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  duration_ms INTEGER,
  summary JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_cron_logs_job_name ON cron_execution_logs(job_name);
CREATE INDEX idx_cron_logs_started_at ON cron_execution_logs(started_at DESC);
CREATE INDEX idx_cron_logs_status ON cron_execution_logs(status);

-- Add constraint for valid status values
ALTER TABLE cron_execution_logs
  ADD CONSTRAINT cron_logs_status_check
  CHECK (status IN ('running', 'success', 'error'));

-- RLS policies (admin only)
ALTER TABLE cron_execution_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for cron jobs to write)
CREATE POLICY "Service role has full access to cron logs"
  ON cron_execution_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE cron_execution_logs IS 'Logs execution history of cron jobs for monitoring and debugging';
