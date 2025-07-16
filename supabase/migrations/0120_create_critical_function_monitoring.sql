-- Create tables for critical function monitoring

-- Table for tracking critical function errors
CREATE TABLE IF NOT EXISTS critical_function_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    prompt_page_id UUID,
    platform TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    url TEXT,
    additional_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking critical function successes  
CREATE TABLE IF NOT EXISTS critical_function_successes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    prompt_page_id UUID,
    platform TEXT,
    duration INTEGER NOT NULL, -- Duration in milliseconds
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    additional_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_critical_errors_function_time 
    ON critical_function_errors(function_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_critical_errors_user 
    ON critical_function_errors(user_id);

CREATE INDEX IF NOT EXISTS idx_critical_errors_prompt_page 
    ON critical_function_errors(prompt_page_id);

CREATE INDEX IF NOT EXISTS idx_critical_successes_function_time 
    ON critical_function_successes(function_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_critical_successes_user 
    ON critical_function_successes(user_id);

CREATE INDEX IF NOT EXISTS idx_critical_successes_prompt_page 
    ON critical_function_successes(prompt_page_id);

-- Enable Row Level Security
ALTER TABLE critical_function_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_function_successes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service role access (monitoring system)
CREATE POLICY "Service role can manage critical errors" ON critical_function_errors
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage critical successes" ON critical_function_successes  
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to view their own data
CREATE POLICY "Users can view their critical errors" ON critical_function_errors
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their critical successes" ON critical_function_successes
    FOR SELECT USING (auth.uid() = user_id);

-- Create a view for easy error rate calculation
CREATE OR REPLACE VIEW critical_function_health AS
SELECT 
    function_name,
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE errors.id IS NOT NULL) as error_count,
    COUNT(*) FILTER (WHERE successes.id IS NOT NULL) as success_count,
    ROUND(
        COUNT(*) FILTER (WHERE errors.id IS NOT NULL)::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as error_rate_percent,
    AVG(successes.duration) as avg_duration_ms
FROM (
    SELECT function_name, timestamp, id FROM critical_function_errors
    UNION ALL 
    SELECT function_name, timestamp, id FROM critical_function_successes
) combined
LEFT JOIN critical_function_errors errors ON errors.id = combined.id
LEFT JOIN critical_function_successes successes ON successes.id = combined.id  
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY function_name, DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC, function_name;

-- Grant access to the view
GRANT SELECT ON critical_function_health TO authenticated;
GRANT SELECT ON critical_function_health TO service_role; 