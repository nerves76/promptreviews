-- Migration: Add per-user notification dismissals
-- This allows users to dismiss notifications independently without affecting other users

-- Create the notification_dismissals table
CREATE TABLE IF NOT EXISTS public.notification_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only dismiss a notification once
  UNIQUE(notification_id, user_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notification_dismissals_user_notification
  ON public.notification_dismissals(user_id, notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_dismissals_notification
  ON public.notification_dismissals(notification_id);

-- Enable RLS
ALTER TABLE public.notification_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own dismissals
CREATE POLICY "Users can view their own dismissals"
  ON public.notification_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own dismissals
CREATE POLICY "Users can create their own dismissals"
  ON public.notification_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own dismissals (to "un-dismiss")
CREATE POLICY "Users can delete their own dismissals"
  ON public.notification_dismissals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE public.notification_dismissals IS 'Tracks which notifications each user has dismissed, allowing per-user dismissal without affecting other users';
