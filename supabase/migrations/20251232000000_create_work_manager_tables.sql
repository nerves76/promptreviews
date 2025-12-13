-- Work Manager Tables
-- Feature for agencies to manage tasks across client accounts

-- Create enum types for Work Manager
CREATE TYPE wm_task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE wm_task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE wm_action_type AS ENUM (
  'note',
  'status_change',
  'assignment_change',
  'priority_change',
  'due_date_change',
  'created',
  'updated'
);

-- wm_boards: One board per account that has Work Manager enabled
CREATE TABLE wm_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT, -- Optional custom name, defaults to account/business name in UI
  status_labels JSONB DEFAULT '{"backlog": "Backlog", "todo": "To Do", "in_progress": "In Progress", "review": "Review", "done": "Done"}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One board per account
  UNIQUE(account_id)
);

-- wm_tasks: Individual task records
CREATE TABLE wm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES wm_boards(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, -- Denormalized for RLS
  title TEXT NOT NULL,
  description TEXT,
  status wm_task_status NOT NULL DEFAULT 'backlog',
  priority wm_task_priority DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for wm_tasks
CREATE INDEX idx_wm_tasks_board_id ON wm_tasks(board_id);
CREATE INDEX idx_wm_tasks_account_id ON wm_tasks(account_id);
CREATE INDEX idx_wm_tasks_status ON wm_tasks(status);
CREATE INDEX idx_wm_tasks_assigned_to ON wm_tasks(assigned_to);
CREATE INDEX idx_wm_tasks_due_date ON wm_tasks(due_date);
CREATE INDEX idx_wm_tasks_sort_order ON wm_tasks(sort_order);

-- wm_task_actions: Activity log for tasks
CREATE TABLE wm_task_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES wm_tasks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  activity_type wm_action_type NOT NULL,
  content TEXT, -- For notes
  metadata JSONB, -- For structured data like {from_status, to_status}
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for wm_task_actions
CREATE INDEX idx_wm_task_actions_task_id ON wm_task_actions(task_id);
CREATE INDEX idx_wm_task_actions_account_id ON wm_task_actions(account_id);
CREATE INDEX idx_wm_task_actions_created_at ON wm_task_actions(created_at);

-- Updated at trigger for wm_boards
CREATE OR REPLACE FUNCTION update_wm_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wm_boards_updated_at
  BEFORE UPDATE ON wm_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_wm_boards_updated_at();

-- Updated at trigger for wm_tasks
CREATE OR REPLACE FUNCTION update_wm_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_wm_tasks_updated_at
  BEFORE UPDATE ON wm_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_wm_tasks_updated_at();

-- Row Level Security

-- Enable RLS
ALTER TABLE wm_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE wm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wm_task_actions ENABLE ROW LEVEL SECURITY;

-- wm_boards policies
CREATE POLICY "Users can view boards for their accounts" ON wm_boards
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards for their accounts" ON wm_boards
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update boards for their accounts" ON wm_boards
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete boards for their accounts" ON wm_boards
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- wm_tasks policies
CREATE POLICY "Users can view tasks for their accounts" ON wm_tasks
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their accounts" ON wm_tasks
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks for their accounts" ON wm_tasks
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks for their accounts" ON wm_tasks
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- wm_task_actions policies
CREATE POLICY "Users can view task actions for their accounts" ON wm_task_actions
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create task actions for their accounts" ON wm_task_actions
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE wm_boards IS 'Work Manager boards - one per account for agency task management';
COMMENT ON TABLE wm_tasks IS 'Work Manager tasks - individual work items on a board';
COMMENT ON TABLE wm_task_actions IS 'Work Manager task activity log - tracks changes and notes';
COMMENT ON COLUMN wm_boards.status_labels IS 'Custom labels for status columns: backlog, todo, in_progress, review, done';
COMMENT ON COLUMN wm_tasks.sort_order IS 'Order within a status column for drag-and-drop';
