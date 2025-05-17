-- Create prompt_page_events table for tracking various events
CREATE TABLE IF NOT EXISTS public.prompt_page_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_page_id UUID REFERENCES public.prompt_pages(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    platform TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompt_page_events_prompt_page_id ON public.prompt_page_events(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_prompt_page_events_event_type ON public.prompt_page_events(event_type);
CREATE INDEX IF NOT EXISTS idx_prompt_page_events_created_at ON public.prompt_page_events(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_page_events_platform ON public.prompt_page_events(platform);

-- Add RLS policies
ALTER TABLE public.prompt_page_events ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users
CREATE POLICY "Users can insert their own events"
    ON public.prompt_page_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow select for authenticated users
CREATE POLICY "Users can view their own events"
    ON public.prompt_page_events
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comments
COMMENT ON TABLE public.prompt_page_events IS 'Tracks various events related to prompt pages (views, AI generations, etc.)';
COMMENT ON COLUMN public.prompt_page_events.event_type IS 'Type of event (page_view, ai_generate, etc.)';
COMMENT ON COLUMN public.prompt_page_events.metadata IS 'Additional event data stored as JSON';
COMMENT ON COLUMN public.prompt_page_events.platform IS 'Platform where the event occurred'; 