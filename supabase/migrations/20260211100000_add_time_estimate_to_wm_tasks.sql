-- Add time estimate field to wm_tasks
-- Stores estimate in minutes (nullable, most tasks won't have one)
ALTER TABLE wm_tasks ADD COLUMN IF NOT EXISTS time_estimate_minutes INTEGER DEFAULT NULL;
