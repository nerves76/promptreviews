-- Add retry_count to batch run items for automatic retry of transient failures
-- Items will be retried up to 2 times (3 total attempts) before being marked as permanently failed

ALTER TABLE llm_batch_run_items
ADD COLUMN retry_count INT NOT NULL DEFAULT 0;

ALTER TABLE rank_batch_run_items
ADD COLUMN retry_count INT NOT NULL DEFAULT 0;
