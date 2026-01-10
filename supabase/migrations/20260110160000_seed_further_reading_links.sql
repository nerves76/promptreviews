-- Add further reading links to library tasks
-- Links from Moz, Search Engine Land, Search Engine Journal, and Google

-- Title tag tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Title Tag SEO: When to Include Your Brand and/or Boilerplate", "url": "https://moz.com/blog/title-tag-seo", "source": "Moz"},
  {"title": "Title Tags: A Complete Guide", "url": "https://www.searchenginejournal.com/on-page-seo/title-tags/", "source": "Search Engine Journal"},
  {"title": "How to Write Title Tags for SEO", "url": "https://developers.google.com/search/docs/appearance/title-link", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%title tag%' OR title ILIKE '%page title%';

-- Meta description tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Meta Descriptions: A Complete Guide", "url": "https://moz.com/learn/seo/meta-description", "source": "Moz"},
  {"title": "How to Write Meta Descriptions", "url": "https://www.searchenginejournal.com/on-page-seo/meta-descriptions/", "source": "Search Engine Journal"},
  {"title": "Control your snippets in search results", "url": "https://developers.google.com/search/docs/appearance/snippet", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%meta description%';

-- Internal linking tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Internal Links: The Ultimate Guide", "url": "https://moz.com/learn/seo/internal-link", "source": "Moz"},
  {"title": "Internal Linking Strategy: The Complete Guide", "url": "https://www.searchenginejournal.com/internal-links-seo/", "source": "Search Engine Journal"},
  {"title": "How Google Crawls Links", "url": "https://developers.google.com/search/docs/crawling-indexing/links-crawlable", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%internal link%';

-- Schema/structured data tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Schema Markup for SEO: The Complete Guide", "url": "https://moz.com/learn/seo/schema-structured-data", "source": "Moz"},
  {"title": "Structured Data: The Ultimate Guide", "url": "https://www.searchenginejournal.com/technical-seo/structured-data/", "source": "Search Engine Journal"},
  {"title": "Introduction to structured data markup", "url": "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%schema%' OR title ILIKE '%structured data%';

-- Local SEO / Google Business Profile tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "The Essential Guide to Local SEO", "url": "https://moz.com/learn/seo/local", "source": "Moz"},
  {"title": "Google Business Profile Optimization Guide", "url": "https://www.searchenginejournal.com/google-business-profile-optimization/", "source": "Search Engine Journal"},
  {"title": "Get started with your Business Profile", "url": "https://support.google.com/business/answer/10515606", "source": "Google Business Profile Help"}
]'::jsonb WHERE title ILIKE '%google business%' OR title ILIKE '%local seo%' OR title ILIKE '%GBP%' OR title ILIKE '%NAP%';

-- Keyword research tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Keyword Research: The Definitive Guide", "url": "https://moz.com/beginners-guide-to-seo/keyword-research", "source": "Moz"},
  {"title": "How to Do Keyword Research for SEO", "url": "https://www.searchenginejournal.com/keyword-research/", "source": "Search Engine Journal"},
  {"title": "Understand what people are searching for", "url": "https://developers.google.com/search/docs/fundamentals/get-started-developers", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%keyword research%' OR title ILIKE '%keyword analysis%';

-- Content optimization tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "On-Page SEO: The Complete Guide", "url": "https://moz.com/learn/seo/on-page-factors", "source": "Moz"},
  {"title": "Content Optimization: The Complete Guide", "url": "https://www.searchenginejournal.com/on-page-seo/content-optimization/", "source": "Search Engine Journal"},
  {"title": "Creating helpful, reliable, people-first content", "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%content optim%' OR title ILIKE '%optimize content%';

-- Backlink tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Link Building: The Definitive Guide", "url": "https://moz.com/beginners-guide-to-link-building", "source": "Moz"},
  {"title": "Link Building Strategies That Work", "url": "https://www.searchenginejournal.com/link-building-guide/", "source": "Search Engine Journal"},
  {"title": "Qualify your outbound links", "url": "https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%backlink%' OR title ILIKE '%link building%' OR title ILIKE '%guest post%';

-- Image optimization tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Image SEO: The Complete Guide", "url": "https://moz.com/learn/seo/image-optimization", "source": "Moz"},
  {"title": "Image SEO: A Complete Optimization Guide", "url": "https://www.searchenginejournal.com/on-page-seo/image-optimization/", "source": "Search Engine Journal"},
  {"title": "Google image SEO best practices", "url": "https://developers.google.com/search/docs/appearance/google-images", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%image%' AND (title ILIKE '%alt%' OR title ILIKE '%optim%' OR title ILIKE '%seo%');

-- FAQ tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "FAQ Schema Markup Guide", "url": "https://moz.com/blog/faq-schema", "source": "Moz"},
  {"title": "FAQ Schema: What It Is & How to Implement It", "url": "https://www.searchenginejournal.com/technical-seo/faq-schema/", "source": "Search Engine Journal"},
  {"title": "FAQ structured data", "url": "https://developers.google.com/search/docs/appearance/structured-data/faqpage", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%FAQ%';

-- Reviews tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Review Snippet Guidelines", "url": "https://developers.google.com/search/docs/appearance/structured-data/review-snippet", "source": "Google Search Central"},
  {"title": "How Online Reviews Impact Local SEO", "url": "https://moz.com/blog/online-reviews-local-seo", "source": "Moz"},
  {"title": "Online Review Statistics Every Marketer Should Know", "url": "https://www.searchenginejournal.com/online-review-statistics/", "source": "Search Engine Journal"}
]'::jsonb WHERE title ILIKE '%review%' AND title NOT ILIKE '%peer review%';

-- Core Web Vitals / Page speed tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Core Web Vitals: A Complete Guide", "url": "https://moz.com/learn/seo/core-web-vitals", "source": "Moz"},
  {"title": "Core Web Vitals: What They Are & How to Improve Them", "url": "https://www.searchenginejournal.com/core-web-vitals-guide/", "source": "Search Engine Journal"},
  {"title": "Understanding Core Web Vitals", "url": "https://developers.google.com/search/docs/appearance/core-web-vitals", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%core web vitals%' OR title ILIKE '%page speed%' OR title ILIKE '%site speed%';

-- Mobile optimization tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Mobile SEO: The Definitive Guide", "url": "https://moz.com/learn/seo/mobile-optimization", "source": "Moz"},
  {"title": "Mobile SEO: A Complete Guide", "url": "https://www.searchenginejournal.com/technical-seo/mobile-seo/", "source": "Search Engine Journal"},
  {"title": "Mobile-first indexing best practices", "url": "https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%mobile%';

-- AI / LLM visibility tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "How to Optimize for AI Search Engines", "url": "https://www.searchenginejournal.com/ai-search-optimization/", "source": "Search Engine Journal"},
  {"title": "E-E-A-T: What It Is and Why It Matters", "url": "https://moz.com/learn/seo/google-eat", "source": "Moz"},
  {"title": "Creating helpful content for AI understanding", "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%AI visibility%' OR title ILIKE '%LLM%' OR title ILIKE '%ChatGPT%' OR category = 'ai_visibility';

-- Sitemap tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "The Complete Guide to XML Sitemaps", "url": "https://moz.com/learn/seo/sitemaps", "source": "Moz"},
  {"title": "XML Sitemaps: The Complete Guide", "url": "https://www.searchenginejournal.com/technical-seo/xml-sitemaps/", "source": "Search Engine Journal"},
  {"title": "Build and submit a sitemap", "url": "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%sitemap%';

-- Robots.txt tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Robots.txt: The Complete Guide", "url": "https://moz.com/learn/seo/robotstxt", "source": "Moz"},
  {"title": "Robots.txt: What It Is & How to Use It", "url": "https://www.searchenginejournal.com/technical-seo/robots-txt/", "source": "Search Engine Journal"},
  {"title": "Introduction to robots.txt", "url": "https://developers.google.com/search/docs/crawling-indexing/robots/intro", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%robots.txt%' OR title ILIKE '%robots txt%';

-- Canonical URL tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Canonical URLs: A Beginners Guide", "url": "https://moz.com/learn/seo/canonicalization", "source": "Moz"},
  {"title": "Canonical Tags: A Complete Guide", "url": "https://www.searchenginejournal.com/technical-seo/canonical-tags/", "source": "Search Engine Journal"},
  {"title": "Consolidate duplicate URLs", "url": "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%canonical%';

-- Header/heading tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Header Tags for SEO: Best Practices", "url": "https://moz.com/learn/seo/on-page-factors", "source": "Moz"},
  {"title": "Heading Tags: How to Use Them for SEO", "url": "https://www.searchenginejournal.com/on-page-seo/header-tags/", "source": "Search Engine Journal"},
  {"title": "Control your title links in search results", "url": "https://developers.google.com/search/docs/appearance/title-link", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%header%' OR title ILIKE '%heading%' OR title ILIKE '%H1%';

-- URL optimization tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "URL Structure Best Practices", "url": "https://moz.com/learn/seo/url", "source": "Moz"},
  {"title": "URL Structure: SEO Best Practices", "url": "https://www.searchenginejournal.com/technical-seo/url-structure/", "source": "Search Engine Journal"},
  {"title": "Keep a simple URL structure", "url": "https://developers.google.com/search/docs/crawling-indexing/url-structure", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%URL%' AND (title ILIKE '%optim%' OR title ILIKE '%structure%');

-- Service page tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Service Pages: How to Write and Optimize", "url": "https://moz.com/blog/service-page-optimization", "source": "Moz"},
  {"title": "How to Write Service Pages That Rank", "url": "https://www.searchenginejournal.com/service-pages-seo/", "source": "Search Engine Journal"},
  {"title": "Service structured data", "url": "https://developers.google.com/search/docs/appearance/structured-data/local-business", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%service page%';

-- Blog / content marketing tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Blog SEO: The Complete Guide", "url": "https://moz.com/blog/blog-seo-guide", "source": "Moz"},
  {"title": "Content Marketing & SEO Strategy", "url": "https://www.searchenginejournal.com/content-marketing-guide/", "source": "Search Engine Journal"},
  {"title": "Creating helpful content for people", "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%blog%' OR title ILIKE '%content marketing%' OR title ILIKE '%editorial%';

-- Competitor analysis tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Competitive Analysis for SEO", "url": "https://moz.com/blog/competitive-analysis-for-seo", "source": "Moz"},
  {"title": "How to Do an SEO Competitor Analysis", "url": "https://www.searchenginejournal.com/seo-competitor-analysis/", "source": "Search Engine Journal"},
  {"title": "Understand your competition", "url": "https://developers.google.com/search/docs/fundamentals/get-started-developers", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%competitor%' OR title ILIKE '%competitive%';

-- Citation / Directory tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Local Citations: The Complete Guide", "url": "https://moz.com/learn/seo/local-citations", "source": "Moz"},
  {"title": "Local Citations: What They Are & Why They Matter", "url": "https://www.searchenginejournal.com/local-citations/", "source": "Search Engine Journal"},
  {"title": "Get your business on Google", "url": "https://support.google.com/business/answer/2911778", "source": "Google Business Profile Help"}
]'::jsonb WHERE title ILIKE '%citation%' OR title ILIKE '%director%' OR title ILIKE '%listing%';

-- Social media tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Social Media and SEO: Does Social Media Impact SEO?", "url": "https://moz.com/blog/social-media-seo", "source": "Moz"},
  {"title": "Social Media SEO: How Social Signals Affect Rankings", "url": "https://www.searchenginejournal.com/social-media-seo/", "source": "Search Engine Journal"},
  {"title": "Use social link previews", "url": "https://developers.google.com/search/docs/appearance/publication-events", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%social media%' OR title ILIKE '%social profile%';

-- Analytics / tracking tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "Google Analytics 4: The Complete Guide", "url": "https://moz.com/blog/google-analytics-4-guide", "source": "Moz"},
  {"title": "How to Use Google Analytics for SEO", "url": "https://www.searchenginejournal.com/google-analytics-seo/", "source": "Search Engine Journal"},
  {"title": "Google Search Console Help", "url": "https://support.google.com/webmasters/answer/9128668", "source": "Google Search Console Help"}
]'::jsonb WHERE title ILIKE '%analytics%' OR title ILIKE '%tracking%' OR title ILIKE '%search console%';

-- 404 / broken links tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "How to Find and Fix Broken Links", "url": "https://moz.com/learn/seo/external-link", "source": "Moz"},
  {"title": "Broken Link Building: Complete Guide", "url": "https://www.searchenginejournal.com/broken-link-building/", "source": "Search Engine Journal"},
  {"title": "Fix 404 errors", "url": "https://support.google.com/webmasters/answer/35120", "source": "Google Search Console Help"}
]'::jsonb WHERE title ILIKE '%404%' OR title ILIKE '%broken link%';

-- HTTPS / Security tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "HTTPS: Why Should Sites Switch?", "url": "https://moz.com/blog/https-seo-checklist", "source": "Moz"},
  {"title": "HTTPS as a Ranking Signal", "url": "https://www.searchenginejournal.com/https-seo/", "source": "Search Engine Journal"},
  {"title": "Secure your site with HTTPS", "url": "https://developers.google.com/search/docs/crawling-indexing/http-https", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%HTTPS%' OR title ILIKE '%SSL%' OR title ILIKE '%security%';

-- E-E-A-T / Authority tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "E-E-A-T: What It Is and Why It Matters", "url": "https://moz.com/learn/seo/google-eat", "source": "Moz"},
  {"title": "E-E-A-T: The Complete Guide", "url": "https://www.searchenginejournal.com/google-e-e-a-t/", "source": "Search Engine Journal"},
  {"title": "Creating helpful, reliable content", "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%E-E-A-T%' OR title ILIKE '%EEAT%' OR title ILIKE '%authority%' OR title ILIKE '%expertise%';

-- About page / Team page tasks
UPDATE wm_library_tasks SET further_reading = '[
  {"title": "About Page Best Practices for SEO", "url": "https://moz.com/blog/seo-guide-to-about-us-pages", "source": "Moz"},
  {"title": "How to Write an About Page That Converts", "url": "https://www.searchenginejournal.com/about-page-optimization/", "source": "Search Engine Journal"},
  {"title": "Showcase your expertise", "url": "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", "source": "Google Search Central"}
]'::jsonb WHERE title ILIKE '%about page%' OR title ILIKE '%team page%' OR title ILIKE '%author%';
