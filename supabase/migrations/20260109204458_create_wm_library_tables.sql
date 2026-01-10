-- Work Manager Task Library Tables
-- Provides a browsable library of pre-defined SEO and AI visibility tasks

-- Library Tasks: The master library of SEO tasks
CREATE TABLE wm_library_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,           -- Step-by-step how-to
  education TEXT,              -- Why this matters / learning content

  -- Taxonomy: Category (exactly 1)
  category TEXT NOT NULL,      -- 'research' | 'search_visibility' | 'ai_visibility' | 'local_visibility' | 'fix_issues' | 'track_maintain'

  -- Taxonomy: Tags (arrays)
  goals TEXT[] DEFAULT '{}',           -- 1-2 goal tags
  page_types TEXT[] DEFAULT '{}',      -- 0-2 page type tags (on-site)
  offsite_sources TEXT[] DEFAULT '{}', -- 0-2 off-site source tags

  -- Taxonomy: Difficulty & Time (exactly 1 each)
  difficulty TEXT NOT NULL,    -- 'easy' | 'medium' | 'advanced'
  time_estimate TEXT NOT NULL, -- '5_15_min' | '15_45_min' | '45_120_min' | 'multi_step'

  -- Relevant tools in the app
  relevant_tools JSONB DEFAULT '[]',  -- [{name: "Keyword Research", route: "/dashboard/research/keywords"}]

  -- Admin
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Library Packs: Curated collections of tasks
CREATE TABLE wm_library_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                   -- Icon name (e.g., 'FaRocket')

  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: Links packs to tasks
CREATE TABLE wm_library_pack_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES wm_library_packs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES wm_library_tasks(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,

  UNIQUE(pack_id, task_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_wm_library_tasks_category ON wm_library_tasks(category);
CREATE INDEX idx_wm_library_tasks_difficulty ON wm_library_tasks(difficulty);
CREATE INDEX idx_wm_library_tasks_is_active ON wm_library_tasks(is_active);
CREATE INDEX idx_wm_library_tasks_sort_order ON wm_library_tasks(sort_order);

CREATE INDEX idx_wm_library_packs_is_active ON wm_library_packs(is_active);
CREATE INDEX idx_wm_library_packs_sort_order ON wm_library_packs(sort_order);

CREATE INDEX idx_wm_library_pack_tasks_pack_id ON wm_library_pack_tasks(pack_id);
CREATE INDEX idx_wm_library_pack_tasks_task_id ON wm_library_pack_tasks(task_id);

-- Updated at trigger for library tasks
CREATE TRIGGER update_wm_library_tasks_updated_at
  BEFORE UPDATE ON wm_library_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for library packs
CREATE TRIGGER update_wm_library_packs_updated_at
  BEFORE UPDATE ON wm_library_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: These tables are read-only for regular users.
-- No RLS needed since library content is public/shared across all accounts.
-- Admin management will be done via direct database access or future admin UI.
