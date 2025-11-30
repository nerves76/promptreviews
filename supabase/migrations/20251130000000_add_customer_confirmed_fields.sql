-- Add customer confirmation fields to review_submissions table
-- This allows tracking whether customers confirmed their review was helpful or needed assistance

-- Add customer_confirmed column with CHECK constraint
ALTER TABLE review_submissions
ADD COLUMN customer_confirmed TEXT CHECK (customer_confirmed IN ('confirmed', 'needs_help'));

-- Add customer_confirmed_at timestamp column
ALTER TABLE review_submissions
ADD COLUMN customer_confirmed_at TIMESTAMPTZ;

-- Add partial index for efficient queries on confirmed reviews
CREATE INDEX idx_review_submissions_customer_confirmed
ON review_submissions (customer_confirmed)
WHERE customer_confirmed IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN review_submissions.customer_confirmed IS 'Customer confirmation status: "confirmed" if review was helpful, "needs_help" if customer needs assistance';
COMMENT ON COLUMN review_submissions.customer_confirmed_at IS 'Timestamp when customer provided confirmation feedback';
