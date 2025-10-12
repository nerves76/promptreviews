-- Update remaining navigation icons that are currently using the default BookOpen
-- This is a follow-up to update-navigation-icons.sql to assign more specific icons

-- Account Setup pages
UPDATE navigation
SET icon_name = 'UserPlus'
WHERE title ILIKE '%account%setup%' AND icon_name = 'BookOpen';

-- Bulk Updates/Operations
UPDATE navigation
SET icon_name = 'Upload'
WHERE title ILIKE '%bulk%update%' AND icon_name = 'BookOpen';

-- Business Info pages
UPDATE navigation
SET icon_name = 'Info'
WHERE title ILIKE '%business%info%' AND icon_name = 'BookOpen';

-- Choosing a Plan
UPDATE navigation
SET icon_name = 'ShoppingCart'
WHERE title ILIKE '%choosing%plan%' AND icon_name = 'BookOpen';

-- Scheduling pages
UPDATE navigation
SET icon_name = 'Clock'
WHERE title ILIKE '%schedul%' AND icon_name = 'BookOpen';

-- Upgrades & Downgrades
UPDATE navigation
SET icon_name = 'TrendingUp'
WHERE title ILIKE '%upgrade%' OR title ILIKE '%downgrade%' AND icon_name = 'BookOpen';

-- Strategy-specific pages
UPDATE navigation
SET icon_name = 'Target'
WHERE (title ILIKE '%double%dip%' OR title ILIKE '%novelty%' OR title ILIKE '%reciprocity%')
  AND icon_name = 'BookOpen';

-- Personal Outreach
UPDATE navigation
SET icon_name = 'MessageSquare'
WHERE title ILIKE '%personal%outreach%' AND icon_name = 'BookOpen';

-- Reviews on the Fly
UPDATE navigation
SET icon_name = 'Zap'
WHERE title ILIKE '%reviews%on%the%fly%' AND icon_name = 'BookOpen';

-- Overview pages - assign based on parent context
-- For strategy overviews
UPDATE navigation
SET icon_name = 'Map'
WHERE title = 'Overview'
  AND icon_name = 'BookOpen'
  AND parent_id IN (
    SELECT id FROM navigation WHERE title ILIKE '%strateg%'
  );

-- For feature/general overviews
UPDATE navigation
SET icon_name = 'Layout'
WHERE title = 'Overview'
  AND icon_name = 'BookOpen'
  AND parent_id IN (
    SELECT id FROM navigation WHERE title ILIKE '%feature%' OR title ILIKE '%prompt%page%'
  );

-- For getting started overviews
UPDATE navigation
SET icon_name = 'Play'
WHERE title = 'Overview'
  AND icon_name = 'BookOpen'
  AND parent_id IN (
    SELECT id FROM navigation WHERE title ILIKE '%getting%start%'
  );

-- Catch any remaining Overview pages
UPDATE navigation
SET icon_name = 'FileText'
WHERE title = 'Overview' AND icon_name = 'BookOpen';

-- Update timestamp for all modified records
UPDATE navigation
SET updated_at = NOW()
WHERE icon_name IN ('UserPlus', 'Upload', 'Info', 'ShoppingCart', 'Clock', 'TrendingUp',
                    'Target', 'MessageSquare', 'Map', 'Layout', 'Play', 'FileText');

-- Show summary of remaining BookOpen icons (should be 0 or very few)
SELECT
  icon_name,
  COUNT(*) as count,
  STRING_AGG(title, ', ' ORDER BY title) as titles
FROM navigation
WHERE is_active = true AND icon_name = 'BookOpen'
GROUP BY icon_name
ORDER BY count DESC;

-- Show summary of newly assigned icons
SELECT
  icon_name,
  COUNT(*) as count,
  STRING_AGG(title, ', ' ORDER BY title) as titles
FROM navigation
WHERE is_active = true
  AND icon_name IN ('UserPlus', 'Upload', 'Info', 'ShoppingCart', 'Clock', 'TrendingUp',
                    'Target', 'MessageSquare', 'Map', 'Layout', 'Play', 'FileText')
GROUP BY icon_name
ORDER BY count DESC, icon_name;
