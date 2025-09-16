-- Add missing columns to review_submissions table
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS emoji_sentiment_selection character varying(32),
  ADD COLUMN IF NOT EXISTS first_name character varying(100),
  ADD COLUMN IF NOT EXISTS last_name character varying(100),
  ADD COLUMN IF NOT EXISTS email character varying(255),
  ADD COLUMN IF NOT EXISTS phone character varying(50),
  ADD COLUMN IF NOT EXISTS prompt_page_type text,
  ADD COLUMN IF NOT EXISTS review_type text,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS platform_url text,
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- Add foreign key constraint for business_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_review_submissions_business_id' 
        AND table_name = 'review_submissions'
    ) THEN
        ALTER TABLE public.review_submissions 
        ADD CONSTRAINT fk_review_submissions_business_id 
        FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_submissions_business_id ON public.review_submissions(business_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_verified ON public.review_submissions(verified);
CREATE INDEX IF NOT EXISTS idx_review_submissions_email ON public.review_submissions(email);
CREATE INDEX IF NOT EXISTS idx_review_submissions_review_type ON public.review_submissions(review_type); 