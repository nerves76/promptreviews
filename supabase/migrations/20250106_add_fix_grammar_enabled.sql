-- Add fix_grammar_enabled column to prompt_pages table
-- This allows users to independently control grammar fixing feature

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS fix_grammar_enabled BOOLEAN DEFAULT true;

-- Add comment to document the new column
COMMENT ON COLUMN prompt_pages.fix_grammar_enabled IS 'Controls whether the "Fix My Grammar" feature is enabled for this prompt page. Defaults to true.'; 