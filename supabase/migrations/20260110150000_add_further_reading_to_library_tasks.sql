-- Add further_reading column to wm_library_tasks
-- Stores array of external resource links (Moz, Search Engine Land, etc.)

ALTER TABLE wm_library_tasks
ADD COLUMN IF NOT EXISTS further_reading JSONB DEFAULT '[]';

-- Comment for documentation
COMMENT ON COLUMN wm_library_tasks.further_reading IS 'Array of external resource links: [{title: string, url: string, source: string}]';
