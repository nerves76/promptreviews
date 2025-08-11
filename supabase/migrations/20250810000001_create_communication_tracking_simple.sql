-- Communication Tracking System - Simplified Version
-- This migration creates tables for tracking email/SMS communications and follow-up reminders

-- Communication records table
CREATE TABLE IF NOT EXISTS public.communication_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    prompt_page_id uuid,
    
    -- Communication details
    communication_type text NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    subject text, -- For emails
    message_content text NOT NULL,
    
    -- Metadata
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    
    -- Tracking data
    user_agent text,
    ip_address inet,
    
    -- Add constraints
    CONSTRAINT communication_type_check CHECK (communication_type IN ('email', 'sms')),
    CONSTRAINT status_check CHECK (status IN ('draft', 'sent', 'failed'))
);

-- Follow-up reminders table
CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    communication_record_id uuid NOT NULL,
    account_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    
    -- Reminder details
    reminder_type text NOT NULL,
    reminder_date timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    
    -- Optional message override
    custom_message text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    
    -- Add constraints
    CONSTRAINT reminder_type_check CHECK (reminder_type IN ('1_week', '2_weeks', '3_weeks', '1_month', '2_months', '3_months', '4_months', '5_months', '6_months')),
    CONSTRAINT reminder_status_check CHECK (status IN ('pending', 'sent', 'completed', 'cancelled'))
);

-- Communication templates table for default messages
CREATE TABLE IF NOT EXISTS public.communication_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL,
    
    -- Template details
    name text NOT NULL,
    communication_type text NOT NULL,
    template_type text NOT NULL,
    
    -- Content
    subject_template text, -- For emails, supports variables like {{business_name}}
    message_template text NOT NULL, -- Supports variables
    
    -- Status
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    
    -- Add constraints
    CONSTRAINT template_communication_type_check CHECK (communication_type IN ('email', 'sms')),
    CONSTRAINT template_type_check CHECK (template_type IN ('initial', 'follow_up'))
);

-- Add foreign key references (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts') THEN
        ALTER TABLE public.communication_records 
        ADD CONSTRAINT communication_records_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
        
        ALTER TABLE public.follow_up_reminders 
        ADD CONSTRAINT follow_up_reminders_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
        
        ALTER TABLE public.communication_templates 
        ADD CONSTRAINT communication_templates_account_id_fkey 
        FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        ALTER TABLE public.communication_records 
        ADD CONSTRAINT communication_records_contact_id_fkey 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
        
        ALTER TABLE public.follow_up_reminders 
        ADD CONSTRAINT follow_up_reminders_contact_id_fkey 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompt_pages') THEN
        ALTER TABLE public.communication_records 
        ADD CONSTRAINT communication_records_prompt_page_id_fkey 
        FOREIGN KEY (prompt_page_id) REFERENCES public.prompt_pages(id) ON DELETE SET NULL;
    END IF;
    
    -- Add communication_records foreign key to follow_up_reminders
    ALTER TABLE public.follow_up_reminders 
    ADD CONSTRAINT follow_up_reminders_communication_record_id_fkey 
    FOREIGN KEY (communication_record_id) REFERENCES public.communication_records(id) ON DELETE CASCADE;
    
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL; -- Ignore if constraint already exists
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_records_account_id ON public.communication_records(account_id);
CREATE INDEX IF NOT EXISTS idx_communication_records_contact_id ON public.communication_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_communication_records_prompt_page_id ON public.communication_records(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_communication_records_status ON public.communication_records(status);
CREATE INDEX IF NOT EXISTS idx_communication_records_sent_at ON public.communication_records(sent_at);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_account_id ON public.follow_up_reminders(account_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_contact_id ON public.follow_up_reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_status ON public.follow_up_reminders(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_reminder_date ON public.follow_up_reminders(reminder_date);

CREATE INDEX IF NOT EXISTS idx_communication_templates_account_id ON public.communication_templates(account_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON public.communication_templates(communication_type, template_type);

-- Add RLS policies
ALTER TABLE public.communication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- Communication records policies
DO $$
BEGIN
    -- Check if account_users table exists for RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_users') THEN
        CREATE POLICY "Users can view their own communication records" ON public.communication_records
            FOR SELECT USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can insert their own communication records" ON public.communication_records
            FOR INSERT WITH CHECK (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update their own communication records" ON public.communication_records
            FOR UPDATE USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        -- Follow-up reminders policies
        CREATE POLICY "Users can view their own follow-up reminders" ON public.follow_up_reminders
            FOR SELECT USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can insert their own follow-up reminders" ON public.follow_up_reminders
            FOR INSERT WITH CHECK (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can update their own follow-up reminders" ON public.follow_up_reminders
            FOR UPDATE USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        -- Communication templates policies
        CREATE POLICY "Users can view their own communication templates" ON public.communication_templates
            FOR SELECT USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );

        CREATE POLICY "Users can manage their own communication templates" ON public.communication_templates
            FOR ALL USING (
                account_id IN (
                    SELECT account_id FROM public.account_users 
                    WHERE user_id = auth.uid()
                )
            );
    END IF;

EXCEPTION 
    WHEN duplicate_object THEN 
        NULL; -- Ignore if policy already exists
END $$;

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_communication_records_updated_at') THEN
        CREATE TRIGGER update_communication_records_updated_at
            BEFORE UPDATE ON public.communication_records
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_follow_up_reminders_updated_at') THEN
        CREATE TRIGGER update_follow_up_reminders_updated_at
            BEFORE UPDATE ON public.follow_up_reminders
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_communication_templates_updated_at') THEN
        CREATE TRIGGER update_communication_templates_updated_at
            BEFORE UPDATE ON public.communication_templates
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;