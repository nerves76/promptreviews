-- Update star_rating column to support half-star ratings (e.g., 3.5, 4.5)
-- Change from INTEGER to NUMERIC(2,1) to allow one decimal place

ALTER TABLE public.widget_reviews 
DROP CONSTRAINT IF EXISTS widget_reviews_star_rating_check;

ALTER TABLE public.widget_reviews 
ALTER COLUMN star_rating TYPE NUMERIC(2,1);

-- Add new constraint to ensure rating is between 1.0 and 5.0 with 0.5 increments
ALTER TABLE public.widget_reviews 
ADD CONSTRAINT widget_reviews_star_rating_check 
CHECK (
    star_rating >= 1.0 
    AND star_rating <= 5.0 
    AND (star_rating * 2) = FLOOR(star_rating * 2)
);

-- The last part of the CHECK ensures only whole numbers and .5 values are allowed
-- (star_rating * 2) = FLOOR(star_rating * 2) means:
-- 3.5 * 2 = 7 = FLOOR(7) ✓
-- 3.3 * 2 = 6.6 ≠ FLOOR(6.6) = 6 ✗