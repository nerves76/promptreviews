-- Add sort_order column to prompt_pages for Kanban drag-and-drop ordering
-- This allows users to manually organize cards within each status column

-- Add the column with a default value
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Backfill existing records with sort_order based on created_at
-- This preserves current ordering (newest first)
WITH ranked_pages AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY status, account_id ORDER BY created_at DESC) as rn
  FROM prompt_pages
)
UPDATE prompt_pages
SET sort_order = ranked_pages.rn
FROM ranked_pages
WHERE prompt_pages.id = ranked_pages.id;

-- Add index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_prompt_pages_sort_order
ON prompt_pages(account_id, status, sort_order);

-- Add comment
COMMENT ON COLUMN prompt_pages.sort_order IS 'Manual sort order within each status column for Kanban view';
