-- Add structured business values (name + description pairs) to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_values JSONB DEFAULT '[]';
