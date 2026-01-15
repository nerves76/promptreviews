-- Add is_system column to distinguish system templates from user-created ones
ALTER TABLE public.communication_templates
ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Mark existing templates as system templates (they were created by the system)
-- New user-created templates will default to is_system = false
UPDATE public.communication_templates
SET is_system = true
WHERE is_system IS NULL OR is_system = false;

-- Add comment
COMMENT ON COLUMN public.communication_templates.is_system IS
'True for system-provided default templates, false for user-created custom templates';
