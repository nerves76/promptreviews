-- Add new status values to prompt_page_status enum
-- This migration adds 'sent' and 'follow_up' to the existing enum

-- First, we need to add the new values to the enum type
ALTER TYPE public.prompt_page_status ADD VALUE IF NOT EXISTS 'sent' AFTER 'in_queue';
ALTER TYPE public.prompt_page_status ADD VALUE IF NOT EXISTS 'follow_up' AFTER 'sent';

-- Note: PostgreSQL doesn't allow removing enum values or changing their order
-- The final order will be: 'in_queue', 'sent', 'follow_up', 'in_progress', 'complete', 'draft'

-- Update any existing 'in_progress' records to 'sent' if needed
-- (Optional - uncomment if you want to migrate existing data)
-- UPDATE prompt_pages 
-- SET status = 'sent'
-- WHERE status = 'in_progress';