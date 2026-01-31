-- Add group_id to batch run tables so active-run detection is group-aware.
-- Nullable TEXT (not FK) because the value can be a UUID or the string 'ungrouped'.

ALTER TABLE llm_batch_runs ADD COLUMN group_id TEXT;
ALTER TABLE rank_batch_runs ADD COLUMN group_id TEXT;
