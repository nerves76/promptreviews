-- Add "short_simple" to template_type categories

-- Drop the existing CHECK constraint
ALTER TABLE public.communication_templates
DROP CONSTRAINT IF EXISTS communication_templates_template_type_check;

-- Add updated CHECK constraint with short_simple
ALTER TABLE public.communication_templates
ADD CONSTRAINT communication_templates_template_type_check
CHECK (template_type IN ('initial_ask', 'follow_up', 'on_behalf_of', 'thank_you', 'short_simple'));

-- Update column comment
COMMENT ON COLUMN public.communication_templates.template_type IS
'Template category: initial_ask (first request), follow_up (reminder), on_behalf_of (third party), thank_you (gratitude-focused), short_simple (brief messages)';
