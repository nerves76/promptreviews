-- Fix: When a linked client task is deleted, ON DELETE SET NULL only nullifies
-- linked_task_id but leaves linked_account_id non-NULL, violating the
-- chk_linked_task_consistency constraint. This trigger ensures both columns
-- are nullified together.

CREATE OR REPLACE FUNCTION fn_wm_tasks_sync_linked_nulls()
RETURNS TRIGGER AS $$
BEGIN
  -- If linked_task_id was set to NULL (e.g. by FK cascade) but linked_account_id is not,
  -- null out linked_account_id to maintain the consistency constraint.
  IF NEW.linked_task_id IS NULL AND NEW.linked_account_id IS NOT NULL THEN
    NEW.linked_account_id := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire BEFORE UPDATE so the row is fixed before the constraint is checked
CREATE TRIGGER trg_wm_tasks_sync_linked_nulls
  BEFORE UPDATE ON wm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION fn_wm_tasks_sync_linked_nulls();
