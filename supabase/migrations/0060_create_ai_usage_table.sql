-- Create ai_usage table that is documented in RLS_POLICIES.md but missing from database
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at);

-- Enable RLS on ai_usage
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for ai_usage
CREATE POLICY "Users can view their own AI usage" ON public.ai_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own AI usage" ON public.ai_usage
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add foreign key constraint
ALTER TABLE public.ai_usage ADD CONSTRAINT fk_ai_usage_user_id 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; 