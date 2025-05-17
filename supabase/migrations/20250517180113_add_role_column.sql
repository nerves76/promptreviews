-- Add role column to prompt_pages table
ALTER TABLE public.prompt_pages
ADD COLUMN IF NOT EXISTS role TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.prompt_pages.role IS 'Role/Position of the reviewer';
