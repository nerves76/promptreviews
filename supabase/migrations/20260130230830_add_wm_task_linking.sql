-- Add linking columns to wm_tasks for agency work manager
-- Allows agency tasks to link to client tasks for syncing

ALTER TABLE wm_tasks
  ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES wm_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Constraint: both must be null or both non-null
ALTER TABLE wm_tasks
  ADD CONSTRAINT chk_linked_task_consistency
    CHECK (
      (linked_task_id IS NULL AND linked_account_id IS NULL)
      OR (linked_task_id IS NOT NULL AND linked_account_id IS NOT NULL)
    );

-- Indexes for linked columns (filtered, WHERE NOT NULL)
CREATE INDEX IF NOT EXISTS idx_wm_tasks_linked_task_id
  ON wm_tasks(linked_task_id) WHERE linked_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wm_tasks_linked_account_id
  ON wm_tasks(linked_account_id) WHERE linked_account_id IS NOT NULL;

-- Prevent duplicate links (one agency task per linked client task)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wm_tasks_unique_linked_task
  ON wm_tasks(linked_task_id) WHERE linked_task_id IS NOT NULL;

COMMENT ON COLUMN wm_tasks.linked_task_id IS 'FK to client task this agency task is linked to';
COMMENT ON COLUMN wm_tasks.linked_account_id IS 'FK to client account that owns the linked task';
