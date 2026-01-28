-- Migration: Add idempotency_key to rank_batch_runs for credit refunds
-- Purpose: Track the original debit idempotency key so we can issue refunds for failed checks

ALTER TABLE rank_batch_runs
  ADD COLUMN idempotency_key TEXT;

-- Index for looking up by idempotency key
CREATE INDEX idx_rank_batch_runs_idempotency ON rank_batch_runs(idempotency_key)
WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN rank_batch_runs.idempotency_key IS 'Original credit debit idempotency key for issuing refunds on failed checks';
