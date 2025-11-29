-- Create keyword set tables for review keyword monitoring
CREATE TABLE IF NOT EXISTS public.keyword_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  scope_type text NOT NULL DEFAULT 'account',
  scope_payload jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keyword_sets_account_id
  ON public.keyword_sets(account_id);

CREATE TABLE IF NOT EXISTS public.keyword_set_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_set_id uuid NOT NULL REFERENCES public.keyword_sets(id) ON DELETE CASCADE,
  phrase text NOT NULL,
  normalized_phrase text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_set_terms_unique_phrase
  ON public.keyword_set_terms(keyword_set_id, normalized_phrase);

CREATE TABLE IF NOT EXISTS public.keyword_set_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_set_id uuid NOT NULL REFERENCES public.keyword_sets(id) ON DELETE CASCADE,
  google_business_location_id uuid NOT NULL REFERENCES public.google_business_locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_set_locations_unique
  ON public.keyword_set_locations(keyword_set_id, google_business_location_id);

-- Store per-review keyword matches
CREATE TABLE IF NOT EXISTS public.review_keyword_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.review_submissions(id) ON DELETE CASCADE,
  keyword_term_id uuid NOT NULL REFERENCES public.keyword_set_terms(id) ON DELETE CASCADE,
  keyword_set_id uuid NOT NULL REFERENCES public.keyword_sets(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  google_business_location_id uuid REFERENCES public.google_business_locations(id) ON DELETE SET NULL,
  google_location_id text,
  google_location_name text,
  matched_phrase text NOT NULL,
  matched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_review_keyword_matches_unique
  ON public.review_keyword_matches(review_id, keyword_term_id);

CREATE INDEX IF NOT EXISTS idx_review_keyword_matches_account
  ON public.review_keyword_matches(account_id, matched_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_keyword_matches_location
  ON public.review_keyword_matches(google_business_location_id);

-- Track GBP location metadata on review submissions
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS google_business_location_id uuid REFERENCES public.google_business_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS google_location_id text,
  ADD COLUMN IF NOT EXISTS google_location_name text;

CREATE INDEX IF NOT EXISTS idx_review_submissions_gbp_location
  ON public.review_submissions(google_business_location_id);

CREATE INDEX IF NOT EXISTS idx_review_submissions_google_location_id
  ON public.review_submissions(google_location_id);
