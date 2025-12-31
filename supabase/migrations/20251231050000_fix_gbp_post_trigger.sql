-- Fix the trigger function to use valid enum value 'completed' instead of invalid 'published'
-- The original trigger was trying to compare status = 'published' but the enum doesn't have that value

CREATE OR REPLACE FUNCTION trigger_gbp_post_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only count when status changes to 'completed' (previously incorrectly used 'published')
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    PERFORM increment_metric('total_gbp_posts_published', 1);
  END IF;
  RETURN NEW;
END;
$$;

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed trigger_gbp_post_published to use valid enum value completed instead of published';
END $$;
