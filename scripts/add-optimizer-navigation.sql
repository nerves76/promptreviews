-- Add Google Biz Optimizer navigation structure
-- This script adds the main parent and all 13 child article links

-- First, insert the parent item
INSERT INTO navigation (id, title, href, icon_name, order_index, visibility, is_active)
VALUES (
  gen_random_uuid(),
  'Google Biz Optimizer™',
  '/google-biz-optimizer',
  'TrendingUp',
  100, -- Adjust order as needed
  ARRAY['docs', 'help'],
  true
)
ON CONFLICT DO NOTHING
RETURNING id AS parent_id;

-- Store parent ID for child inserts
-- Note: In practice, you'll need to get the parent_id from the above insert

-- For now, let's create a temp variable approach
DO $$
DECLARE
  parent_uuid uuid;
BEGIN
  -- Get or create parent
  INSERT INTO navigation (title, href, icon_name, order_index, visibility, is_active)
  VALUES (
    'Google Biz Optimizer™',
    '/google-biz-optimizer',
    'TrendingUp',
    100,
    ARRAY['docs', 'help'],
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO parent_uuid;

  -- If already exists, get its ID
  IF parent_uuid IS NULL THEN
    SELECT id INTO parent_uuid
    FROM navigation
    WHERE href = '/google-biz-optimizer';
  END IF;

  -- Insert Metrics section children
  INSERT INTO navigation (parent_id, title, href, icon_name, order_index, visibility, is_active)
  VALUES
    (parent_uuid, 'Total Reviews Impact', '/google-biz-optimizer/metrics/total-reviews', 'Star', 1, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Average Rating Psychology', '/google-biz-optimizer/metrics/average-rating', 'Star', 2, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Review Growth Trends', '/google-biz-optimizer/metrics/review-trends', 'TrendingUp', 3, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Monthly Review Patterns', '/google-biz-optimizer/metrics/monthly-patterns', 'BarChart3', 4, ARRAY['docs', 'help'], true),

  -- Insert Optimization section children
    (parent_uuid, 'SEO Score Factors', '/google-biz-optimizer/optimization/seo-score', 'Search', 5, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Business Categories', '/google-biz-optimizer/optimization/categories', 'CheckCircle', 6, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Services & Descriptions', '/google-biz-optimizer/optimization/services', 'Lightbulb', 7, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Photo Strategy', '/google-biz-optimizer/optimization/photos', 'Image', 8, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Quick Wins', '/google-biz-optimizer/optimization/quick-wins', 'CheckCircle', 9, ARRAY['docs', 'help'], true),

  -- Insert Engagement section children
    (parent_uuid, 'Review Response Templates', '/google-biz-optimizer/engagement/review-responses', 'MessageSquare', 10, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Q&A Management', '/google-biz-optimizer/engagement/questions-answers', 'Users', 11, ARRAY['docs', 'help'], true),
    (parent_uuid, 'Google Posts Strategy', '/google-biz-optimizer/engagement/posts', 'Globe', 12, ARRAY['docs', 'help'], true),

  -- Insert Performance section children
    (parent_uuid, 'Customer Actions Analysis', '/google-biz-optimizer/performance/customer-actions', 'Phone', 13, ARRAY['docs', 'help'], true)
  ON CONFLICT DO NOTHING;

END $$;
