-- Add reviewer information fields to review_submissions table
ALTER TABLE public.review_submissions
ADD COLUMN reviewer_name TEXT,
ADD COLUMN reviewer_role TEXT,
ADD COLUMN review_content TEXT,
ADD COLUMN review_group_id UUID DEFAULT gen_random_uuid();

-- Add comments
COMMENT ON COLUMN public.review_submissions.reviewer_name IS 'Name of the reviewer (required)';
COMMENT ON COLUMN public.review_submissions.reviewer_role IS 'Role/Position/Occupation of the reviewer (optional)';
COMMENT ON COLUMN public.review_submissions.review_content IS 'The actual review content submitted';
COMMENT ON COLUMN public.review_submissions.review_group_id IS 'Groups multiple reviews from the same user';

-- Add constraint to ensure reviewer_name is provided
ALTER TABLE public.review_submissions
ADD CONSTRAINT reviewer_name_required CHECK (reviewer_name IS NOT NULL AND reviewer_name != '');

-- Create index for review grouping
CREATE INDEX IF NOT EXISTS idx_review_submissions_group_id 
    ON public.review_submissions(review_group_id);

-- Add function to automatically group reviews from same user
CREATE OR REPLACE FUNCTION group_reviews()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new review group, generate a new group_id
    IF NEW.review_group_id IS NULL THEN
        NEW.review_group_id = gen_random_uuid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically group reviews
CREATE TRIGGER group_reviews_trigger
    BEFORE INSERT ON public.review_submissions
    FOR EACH ROW
    EXECUTE FUNCTION group_reviews(); 