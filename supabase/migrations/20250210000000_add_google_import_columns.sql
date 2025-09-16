-- Add columns for Google Business Profile review imports
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS google_review_id text,
  ADD COLUMN IF NOT EXISTS imported_from_google boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS star_rating integer,
  ADD COLUMN IF NOT EXISTS contact_id uuid;

-- Add foreign key constraint for contact_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_review_submissions_contact_id' 
        AND table_name = 'review_submissions'
    ) THEN
        ALTER TABLE public.review_submissions 
        ADD CONSTRAINT fk_review_submissions_contact_id 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add columns for contacts table to track Google imports
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS imported_from_google boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_submissions_google_review_id ON public.review_submissions(google_review_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_imported_from_google ON public.review_submissions(imported_from_google);
CREATE INDEX IF NOT EXISTS idx_review_submissions_contact_id ON public.review_submissions(contact_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_star_rating ON public.review_submissions(star_rating);
CREATE INDEX IF NOT EXISTS idx_contacts_imported_from_google ON public.contacts(imported_from_google);

-- Add unique constraint on google_review_id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_submissions_google_review_id_unique 
  ON public.review_submissions(google_review_id) 
  WHERE google_review_id IS NOT NULL;