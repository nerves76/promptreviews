-- Add relevant_tools to all applicable library tasks
-- Links tasks to appropriate pages in the Prompt Reviews app

-- ============================================
-- AI VISIBILITY TASKS
-- ============================================

-- Tasks with LLM Visibility tool
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE title IN (
  'Create a strong "About Us" narrative',
  'Create authoritative, factual content',
  'Establish social proof and credentials',
  'Create detailed author bios for content creators'
);

-- Structured data uses Domain Analysis
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]'
WHERE title = 'Implement comprehensive structured data';

-- FAQ content can be tracked in keyword research
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}]'
WHERE title = 'Create comprehensive FAQ content';

-- Case studies relate to reviews/testimonials
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE title = 'Write case studies with client names and results';

-- Original research ties to keyword research for topic ideas
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE title = 'Create original research or statistics others will cite';

-- LinkedIn company page optimization
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE title = 'Claim and optimize your LinkedIn company page';

-- ============================================
-- FIX ISSUES TASKS
-- ============================================

-- Most fix issues tasks relate to Domain Analysis
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]'
WHERE title IN (
  'Add HTTPS and fix mixed content',
  'Create and optimize XML sitemap',
  'Create clear site navigation',
  'Ensure your site is mobile-friendly',
  'Fix duplicate content issues',
  'Improve mobile user experience',
  'Optimize your images with alt text and compression',
  'Set up and fix redirect chains'
);

-- ============================================
-- LOCAL VISIBILITY TASKS
-- ============================================

-- Local schema and tracking
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE title = 'Add local schema markup';

-- Location pages
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}, {"name": "Keyword Research", "route": "/dashboard/research/keywords"}]'
WHERE title IN (
  'Create location pages for each service area',
  'Create location-specific content for your service area'
);

-- Local directory listings
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE title IN (
  'Get listed in industry-specific directories'
);

-- Local content creation
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE title = 'Create "Best of [City]" local content';

-- Local link building - Backlinks
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Backlinks", "route": "/dashboard/backlinks"}]'
WHERE title IN (
  'Build local links from community involvement',
  'Build relationships with local journalists and bloggers',
  'Create local partnerships for mutual linking'
);

-- ============================================
-- RESEARCH TASKS
-- ============================================

UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]'
WHERE title = 'Build brand recognition for improved CTR';

-- ============================================
-- SEARCH VISIBILITY TASKS
-- ============================================

-- Contact/conversion optimization
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE title IN (
  'Add click-to-call and easy contact options',
  'Optimize your calls-to-action (CTAs)',
  'Optimize your contact forms for conversions',
  'Optimize above-the-fold content',
  'Improve time on page with engaging content'
);

-- Schema and technical
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]'
WHERE title IN (
  'Add FAQ schema for rich results',
  'Add local service schema markup',
  'Set up proper heading structure (H1, H2, H3)',
  'Optimize service page URLs and structure'
);

-- Content creation with keyword research
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}]'
WHERE title IN (
  'Add FAQ sections to service pages',
  'Answer common customer questions as blog posts',
  'Build a content hub around your main service',
  'Create dedicated landing pages for key services',
  'Create dedicated pages for each major service',
  'Write a comprehensive guide for your main topic',
  'Write comparison content for your industry',
  'Write "How to Choose" guides for your services',
  'Create a linkable asset (guide, tool, or resource)',
  'Create video content for key services',
  'Design a visual infographic for your industry',
  'Optimize for featured snippets on question queries'
);

-- Trust signals with reviews
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Reviews", "route": "/dashboard/reviews"}]'
WHERE title IN (
  'Add trust signals throughout your site',
  'Showcase awards and recognition',
  'Display credentials and qualifications prominently'
);

-- Internal linking
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE title = 'Add internal links between related pages';

-- Meta/title optimization
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE title IN (
  'Write compelling title tags for your main pages',
  'Write meta descriptions that drive clicks',
  'Optimize meta descriptions for click motivation'
);

-- Business info
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE title IN (
  'Add real contact information and location details',
  'Add comprehensive privacy and terms pages'
);

-- Link building
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Backlinks", "route": "/dashboard/backlinks"}]'
WHERE title IN (
  'Get listed on industry resource pages',
  'Pursue guest posting on industry blogs',
  'Reclaim unlinked brand mentions',
  'Use HARO or similar services for media mentions'
);

-- ============================================
-- TRACK & MAINTAIN TASKS
-- ============================================

UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Analytics", "route": "/dashboard/analytics"}, {"name": "Keyword Research", "route": "/dashboard/research/keywords"}]'
WHERE title IN (
  'Quarterly content freshness audit',
  'Update your oldest blog posts with fresh content'
);

-- ============================================
-- FIX EXISTING TASKS WITH INCOMPLETE TOOLS
-- ============================================

-- Respond to all Google reviews should link to Google Business (where reviews are managed)
UPDATE wm_library_tasks
SET relevant_tools = '[{"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Reviews", "route": "/dashboard/reviews"}]'
WHERE title = 'Respond to all Google reviews';
