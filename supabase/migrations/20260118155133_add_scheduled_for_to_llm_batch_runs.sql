-- Add scheduled_for column to llm_batch_runs for scheduling runs at specific times
-- When scheduled_for is NULL or in the past, the cron job will process the run immediately
-- When scheduled_for is in the future, the cron job will wait until that time

ALTER TABLE llm_batch_runs
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NULL;

-- Add an index for efficient querying of scheduled runs
CREATE INDEX IF NOT EXISTS idx_llm_batch_runs_scheduled_for
ON llm_batch_runs(scheduled_for)
WHERE status IN ('pending', 'processing');

-- Add comment for documentation
COMMENT ON COLUMN llm_batch_runs.scheduled_for IS 'When the batch should start processing. NULL means start immediately.';
