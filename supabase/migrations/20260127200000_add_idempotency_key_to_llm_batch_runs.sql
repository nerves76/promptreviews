-- Add idempotency_key column to llm_batch_runs for credit refund tracking
ALTER TABLE llm_batch_runs ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_llm_batch_runs_idempotency
  ON llm_batch_runs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN llm_batch_runs.idempotency_key IS 'Idempotency key from credit debit transaction, used for refunds';
