-- Google Business Scheduling Tables

-- Enums ------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'google_business_scheduled_post_kind') THEN
    CREATE TYPE public.google_business_scheduled_post_kind AS ENUM ('post', 'photo');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'google_business_scheduled_post_status') THEN
    CREATE TYPE public.google_business_scheduled_post_status AS ENUM (
      'pending',
      'processing',
      'completed',
      'partial_success',
      'failed',
      'cancelled'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'google_business_scheduled_post_result_status') THEN
    CREATE TYPE public.google_business_scheduled_post_result_status AS ENUM (
      'pending',
      'processing',
      'success',
      'failed'
    );
  END IF;
END
$$;

-- Main scheduled posts table --------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_business_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_kind public.google_business_scheduled_post_kind NOT NULL DEFAULT 'post',
  post_type TEXT,
  content JSONB,
  caption TEXT,
  scheduled_date DATE NOT NULL,
  timezone TEXT NOT NULL,
  selected_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.google_business_scheduled_post_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_google_business_scheduled_posts_post_type
    CHECK (
      (post_kind = 'post' AND post_type IS NOT NULL)
      OR (post_kind = 'photo' AND post_type IS NULL)
      OR (post_kind = 'post' AND post_type IS NULL)
    )
);

COMMENT ON TABLE public.google_business_scheduled_posts IS 'Scheduled Google Business posts and photo uploads queued for daily processing.';
COMMENT ON COLUMN public.google_business_scheduled_posts.media_paths IS 'Array of Supabase storage objects (bucket, path, size, mime, publicUrl, checksum, originalName).';
COMMENT ON COLUMN public.google_business_scheduled_posts.selected_locations IS 'JSON array of locations { id, name } for UI rendering and auditing.';

CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_posts_account
  ON public.google_business_scheduled_posts (account_id);

CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_posts_status_date
  ON public.google_business_scheduled_posts (status, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_posts_user
  ON public.google_business_scheduled_posts (user_id);

-- Results table ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_business_scheduled_post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID NOT NULL REFERENCES public.google_business_scheduled_posts(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  location_name TEXT,
  status public.google_business_scheduled_post_result_status NOT NULL DEFAULT 'pending',
  published_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  google_resource_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.google_business_scheduled_post_results IS 'Per-location execution details for scheduled Google Business actions.';

CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_post_results_post
  ON public.google_business_scheduled_post_results (scheduled_post_id);

CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_post_results_location
  ON public.google_business_scheduled_post_results (location_id);

-- RLS -------------------------------------------------------------------
ALTER TABLE public.google_business_scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_business_scheduled_post_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their Google Business scheduled posts"
  ON public.google_business_scheduled_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = google_business_scheduled_posts.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their Google Business scheduled posts"
  ON public.google_business_scheduled_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = google_business_scheduled_posts.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their Google Business scheduled posts"
  ON public.google_business_scheduled_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = google_business_scheduled_posts.account_id
        AND au.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = google_business_scheduled_posts.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their Google Business scheduled posts"
  ON public.google_business_scheduled_posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = google_business_scheduled_posts.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their Google Business scheduled post results"
  ON public.google_business_scheduled_post_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.google_business_scheduled_posts sp
      JOIN public.account_users au ON au.account_id = sp.account_id
      WHERE sp.id = google_business_scheduled_post_results.scheduled_post_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their Google Business scheduled post results"
  ON public.google_business_scheduled_post_results
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.google_business_scheduled_posts sp
      JOIN public.account_users au ON au.account_id = sp.account_id
      WHERE sp.id = google_business_scheduled_post_results.scheduled_post_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert Google Business scheduled post results"
  ON public.google_business_scheduled_post_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.google_business_scheduled_posts sp
      JOIN public.account_users au ON au.account_id = sp.account_id
      WHERE sp.id = google_business_scheduled_post_results.scheduled_post_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete Google Business scheduled post results"
  ON public.google_business_scheduled_post_results
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.google_business_scheduled_posts sp
      JOIN public.account_users au ON au.account_id = sp.account_id
      WHERE sp.id = google_business_scheduled_post_results.scheduled_post_id
        AND au.user_id = auth.uid()
    )
  );

-- Triggers ---------------------------------------------------------------
CREATE TRIGGER update_google_business_scheduled_posts_updated_at
  BEFORE UPDATE ON public.google_business_scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_business_scheduled_post_results_updated_at
  BEFORE UPDATE ON public.google_business_scheduled_post_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
