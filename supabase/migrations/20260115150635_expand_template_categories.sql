-- Expand template_type to support more categories
-- Categories: initial_ask, follow_up, on_behalf_of, thank_you

-- First, drop the existing CHECK constraint
ALTER TABLE public.communication_templates
DROP CONSTRAINT IF EXISTS communication_templates_template_type_check;

-- Migrate existing data to new category names
UPDATE public.communication_templates
SET template_type = 'initial_ask'
WHERE template_type = 'initial';

-- Add the new CHECK constraint with expanded values
ALTER TABLE public.communication_templates
ADD CONSTRAINT communication_templates_template_type_check
CHECK (template_type IN ('initial_ask', 'follow_up', 'on_behalf_of', 'thank_you'));

-- Add comment explaining the categories
COMMENT ON COLUMN public.communication_templates.template_type IS
'Template category: initial_ask (first request), follow_up (reminder), on_behalf_of (third party sending for business), thank_you (gratitude-focused)';
