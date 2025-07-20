-- Create table for tracking Google API rate limits
-- This helps prevent rate limit errors by tracking the last API call timestamp

CREATE TABLE google_api_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE, -- e.g., 'google-business-profile'
  last_api_call_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE google_api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write all records
CREATE POLICY "Service role can manage rate limits" ON google_api_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Add index for faster lookups
CREATE INDEX idx_google_api_rate_limits_project_id ON google_api_rate_limits(project_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_api_rate_limits_updated_at 
    BEFORE UPDATE ON google_api_rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial record for google-business-profile
INSERT INTO google_api_rate_limits (project_id, last_api_call_at) 
VALUES ('google-business-profile', NOW() - INTERVAL '2 minutes')
ON CONFLICT (project_id) DO NOTHING; 