-- Create sidebar favorites table for storing pinned navigation items per account
CREATE TABLE IF NOT EXISTS public.sidebar_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  nav_item_path VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate favorites per account
  CONSTRAINT unique_account_favorite UNIQUE (account_id, nav_item_path)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sidebar_favorites_account ON public.sidebar_favorites(account_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_favorites_order ON public.sidebar_favorites(account_id, display_order);

-- Enable RLS
ALTER TABLE public.sidebar_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access favorites for accounts they belong to
CREATE POLICY "Users can view own account favorites" ON public.sidebar_favorites
  FOR SELECT
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account favorites" ON public.sidebar_favorites
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account favorites" ON public.sidebar_favorites
  FOR UPDATE
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account favorites" ON public.sidebar_favorites
  FOR DELETE
  USING (
    account_id IN (
      SELECT au.account_id FROM public.account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.sidebar_favorites IS 'Stores user-pinned navigation items in the sidebar, per account';
