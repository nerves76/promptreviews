-- Work Manager Resources and Links
-- Adds resources table, links table, and task-resource linking

-- Resources (reference cards, similar to tasks but for storing info)
CREATE TABLE wm_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES wm_boards(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Links (attachable to tasks OR resources)
CREATE TABLE wm_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES wm_tasks(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES wm_resources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Exactly one of task_id or resource_id must be set
  CONSTRAINT wm_links_task_or_resource CHECK (
    (task_id IS NOT NULL AND resource_id IS NULL) OR
    (task_id IS NULL AND resource_id IS NOT NULL)
  )
);

-- Task-Resource linking (junction table for bidirectional linking)
CREATE TABLE wm_task_resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES wm_tasks(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES wm_resources(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, resource_id)
);

-- Indexes for performance
CREATE INDEX idx_wm_resources_board_id ON wm_resources(board_id);
CREATE INDEX idx_wm_resources_account_id ON wm_resources(account_id);
CREATE INDEX idx_wm_resources_category ON wm_resources(category);
CREATE INDEX idx_wm_links_task_id ON wm_links(task_id);
CREATE INDEX idx_wm_links_resource_id ON wm_links(resource_id);
CREATE INDEX idx_wm_task_resource_links_task_id ON wm_task_resource_links(task_id);
CREATE INDEX idx_wm_task_resource_links_resource_id ON wm_task_resource_links(resource_id);

-- RLS Policies for wm_resources
ALTER TABLE wm_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resources for their accounts"
  ON wm_resources FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create resources for their accounts"
  ON wm_resources FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update resources for their accounts"
  ON wm_resources FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete resources for their accounts"
  ON wm_resources FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- RLS Policies for wm_links
ALTER TABLE wm_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for their accounts"
  ON wm_links FOR SELECT
  USING (
    (task_id IS NOT NULL AND task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
    OR
    (resource_id IS NOT NULL AND resource_id IN (
      SELECT id FROM wm_resources WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can create links for their accounts"
  ON wm_links FOR INSERT
  WITH CHECK (
    (task_id IS NOT NULL AND task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
    OR
    (resource_id IS NOT NULL AND resource_id IN (
      SELECT id FROM wm_resources WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can delete links for their accounts"
  ON wm_links FOR DELETE
  USING (
    (task_id IS NOT NULL AND task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
    OR
    (resource_id IS NOT NULL AND resource_id IN (
      SELECT id FROM wm_resources WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    ))
  );

-- RLS Policies for wm_task_resource_links
ALTER TABLE wm_task_resource_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task-resource links for their accounts"
  ON wm_task_resource_links FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create task-resource links for their accounts"
  ON wm_task_resource_links FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete task-resource links for their accounts"
  ON wm_task_resource_links FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM wm_tasks WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Updated_at trigger for resources
CREATE TRIGGER set_wm_resources_updated_at
  BEFORE UPDATE ON wm_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
