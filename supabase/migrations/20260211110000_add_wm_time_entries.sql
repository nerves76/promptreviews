-- Add time entries table for work manager
-- Allows agencies to log time spent on tasks for billing and reporting

-- New table: wm_time_entries
CREATE TABLE wm_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES wm_tasks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wm_time_entries_task_id ON wm_time_entries(task_id);
CREATE INDEX idx_wm_time_entries_account_id ON wm_time_entries(account_id);

-- RLS policies
ALTER TABLE wm_time_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: account members can view all entries for their account
CREATE POLICY "Account members can view time entries"
  ON wm_time_entries FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- INSERT: account members can create time entries
CREATE POLICY "Account members can create time entries"
  ON wm_time_entries FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- UPDATE: only own entries
CREATE POLICY "Users can update own time entries"
  ON wm_time_entries FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- DELETE: only own entries
CREATE POLICY "Users can delete own time entries"
  ON wm_time_entries FOR DELETE
  USING (created_by = auth.uid());

-- Add show_time_to_client toggle to wm_boards
ALTER TABLE wm_boards ADD COLUMN IF NOT EXISTS show_time_to_client BOOLEAN NOT NULL DEFAULT false;
