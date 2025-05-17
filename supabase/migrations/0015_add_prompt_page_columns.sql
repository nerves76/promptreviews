-- Add missing columns to prompt_pages table
ALTER TABLE public.prompt_pages
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS outcomes TEXT,
ADD COLUMN IF NOT EXISTS custom_incentive TEXT,
ADD COLUMN IF NOT EXISTS services_offered TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS title TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.prompt_pages.first_name IS 'First name of the reviewer';
COMMENT ON COLUMN public.prompt_pages.last_name IS 'Last name of the reviewer';
COMMENT ON COLUMN public.prompt_pages.project_type IS 'Type of project or service provided';
COMMENT ON COLUMN public.prompt_pages.outcomes IS 'Outcomes or results of the project';
COMMENT ON COLUMN public.prompt_pages.custom_incentive IS 'Custom incentive for leaving a review';
COMMENT ON COLUMN public.prompt_pages.services_offered IS 'Array of services offered';
COMMENT ON COLUMN public.prompt_pages.status IS 'Status of the prompt page (draft/published)';
COMMENT ON COLUMN public.prompt_pages.title IS 'Title of the prompt page'; 