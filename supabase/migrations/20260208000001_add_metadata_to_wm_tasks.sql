-- Add metadata JSONB column to wm_tasks for storing provider/concept tags
ALTER TABLE wm_tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_wm_tasks_metadata ON wm_tasks USING GIN (metadata);
