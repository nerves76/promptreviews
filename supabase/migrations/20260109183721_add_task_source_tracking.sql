-- Add source tracking fields to wm_tasks
-- Tracks where tasks originated from (e.g., GBP suggestions, manual creation)

ALTER TABLE wm_tasks
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_reference TEXT DEFAULT NULL;

-- Index for querying tasks by source type
CREATE INDEX IF NOT EXISTS idx_wm_tasks_source_type ON wm_tasks(source_type)
  WHERE source_type IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN wm_tasks.source_type IS 'Source of task creation: manual, gbp_suggestion, etc.';
COMMENT ON COLUMN wm_tasks.source_reference IS 'Reference ID from source system (e.g., GBP suggestion ID)';
