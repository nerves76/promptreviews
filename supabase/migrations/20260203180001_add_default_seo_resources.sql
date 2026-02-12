-- Add default SEO resources to all existing boards
-- These resources help users get started with SEO learning

-- Insert default resources for each existing board
INSERT INTO wm_resources (board_id, account_id, title, description, category, priority, tags, sort_order)
SELECT
  b.id as board_id,
  b.account_id,
  'Beginner''s Guide to SEO' as title,
  'A comprehensive guide to SEO fundamentals by Moz - perfect for learning the basics of search engine optimization.' as description,
  'guide' as category,
  'medium' as priority,
  ARRAY['seo', 'learning', 'fundamentals']::text[] as tags,
  1 as sort_order
FROM wm_boards b
WHERE NOT EXISTS (
  SELECT 1 FROM wm_resources r
  WHERE r.board_id = b.id AND r.title = 'Beginner''s Guide to SEO'
);

INSERT INTO wm_resources (board_id, account_id, title, description, category, priority, tags, sort_order)
SELECT
  b.id as board_id,
  b.account_id,
  'Search Engine Journal' as title,
  'Leading SEO and digital marketing publication with news, guides, and industry insights.' as description,
  'reference' as category,
  'medium' as priority,
  ARRAY['seo', 'news', 'publication']::text[] as tags,
  2 as sort_order
FROM wm_boards b
WHERE NOT EXISTS (
  SELECT 1 FROM wm_resources r
  WHERE r.board_id = b.id AND r.title = 'Search Engine Journal'
);

INSERT INTO wm_resources (board_id, account_id, title, description, category, priority, tags, sort_order)
SELECT
  b.id as board_id,
  b.account_id,
  'Search Engine Land' as title,
  'Industry news source covering SEO, SEM, and search marketing topics.' as description,
  'reference' as category,
  'medium' as priority,
  ARRAY['seo', 'news', 'publication']::text[] as tags,
  3 as sort_order
FROM wm_boards b
WHERE NOT EXISTS (
  SELECT 1 FROM wm_resources r
  WHERE r.board_id = b.id AND r.title = 'Search Engine Land'
);

-- Now add links to each of these resources
-- Moz Beginner's Guide link
INSERT INTO wm_links (resource_id, name, url)
SELECT
  r.id,
  'Moz Beginner''s Guide to SEO' as name,
  'https://moz.com/beginners-guide-to-seo' as url
FROM wm_resources r
WHERE r.title = 'Beginner''s Guide to SEO'
AND NOT EXISTS (
  SELECT 1 FROM wm_links l
  WHERE l.resource_id = r.id AND l.url = 'https://moz.com/beginners-guide-to-seo'
);

-- Search Engine Journal link
INSERT INTO wm_links (resource_id, name, url)
SELECT
  r.id,
  'Search Engine Journal' as name,
  'https://www.searchenginejournal.com' as url
FROM wm_resources r
WHERE r.title = 'Search Engine Journal'
AND NOT EXISTS (
  SELECT 1 FROM wm_links l
  WHERE l.resource_id = r.id AND l.url = 'https://www.searchenginejournal.com'
);

-- Search Engine Land link
INSERT INTO wm_links (resource_id, name, url)
SELECT
  r.id,
  'Search Engine Land' as name,
  'https://searchengineland.com' as url
FROM wm_resources r
WHERE r.title = 'Search Engine Land'
AND NOT EXISTS (
  SELECT 1 FROM wm_links l
  WHERE l.resource_id = r.id AND l.url = 'https://searchengineland.com'
);
