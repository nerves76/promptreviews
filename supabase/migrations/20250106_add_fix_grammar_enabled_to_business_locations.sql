-- Add fix_grammar_enabled column to business_locations table
ALTER TABLE business_locations 
ADD COLUMN fix_grammar_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN business_locations.fix_grammar_enabled IS 'Controls whether the "Fix My Grammar" feature is enabled for this location. Defaults to true.'; 