-- Create missing tables that are documented in RLS_POLICIES.md but not present in the database
-- This script creates the ai_usage table which is documented and should exist

-- =====================================================
-- CREATE AI_USAGE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

-- Enable RLS on ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for ai_usage
CREATE POLICY "Users can view their own AI usage" ON ai_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI usage" ON ai_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add foreign key constraint
ALTER TABLE ai_usage ADD CONSTRAINT fk_ai_usage_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verification query
SELECT 
    'AI Usage table created successfully' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'ai_usage'; 