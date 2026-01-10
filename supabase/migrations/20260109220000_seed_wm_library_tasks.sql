-- Seed Work Manager Library Tasks
-- These tasks incorporate insights from Google's leaked ranking documents
-- and current SEO best practices for local and small businesses.

-- Helper function to get pack ID by name
CREATE OR REPLACE FUNCTION get_pack_id(pack_name TEXT) RETURNS UUID AS $$
  SELECT id FROM wm_library_packs WHERE name = pack_name LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================================
-- SEO STARTER PACK - Foundational tasks for SEO beginners
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 1
('Research your primary keywords',
'Identify 5-10 main keywords that potential customers use to find businesses like yours.',
'1. Brainstorm terms customers might search for your services
2. Use Google''s autocomplete by typing your service and seeing suggestions
3. Check "People also ask" boxes in Google results
4. Look at competitor websites for keyword ideas
5. Prioritize keywords by relevance and search intent',
'Google''s leaked documents confirm that matching user search intent is critical. The algorithm tracks whether users find what they''re looking for (called "NavBoost"). Targeting the right keywords means your content satisfies searchers, which Google rewards with better rankings.',
'research',
ARRAY['Discover keyword phrases', 'Improve rankings for keyword'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}]',
1),

-- Task 2
('Write compelling title tags for your main pages',
'Create unique, keyword-rich title tags for your homepage and key service pages.',
'1. Keep titles under 60 characters to avoid truncation
2. Put your primary keyword near the beginning
3. Include your brand name (separated by | or -)
4. Make it compelling - this is your headline in search results
5. Each page needs a unique title - no duplicates',
'Title tags are one of the strongest on-page ranking signals. Google''s leaked documents show they use title match as a ranking factor. But equally important: your title is what people see in search results. A compelling title improves click-through rate, and those clicks (NavBoost signals) further boost your rankings.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Improve click-through rate'],
ARRAY['Homepage', 'Service page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
2),

-- Task 3
('Write meta descriptions that drive clicks',
'Create compelling meta descriptions for your main pages that encourage searchers to click.',
'1. Keep under 155 characters
2. Include your target keyword naturally
3. Write a clear value proposition - why click?
4. Include a call to action when appropriate
5. Make each description unique to the page',
'While meta descriptions aren''t a direct ranking factor, they heavily influence click-through rate. Google''s NavBoost system tracks user clicks from search results. Pages that get more clicks tend to rank higher. Your meta description is your sales pitch in search results - make it count.',
'search_visibility',
ARRAY['Improve click-through rate', 'Improve traffic'],
ARRAY['Homepage', 'Service page', 'Location page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
3),

-- Task 4
('Set up proper heading structure (H1, H2, H3)',
'Organize your page content with a clear heading hierarchy.',
'1. Use exactly ONE H1 per page (your main title)
2. Use H2s for main sections
3. Use H3s for subsections under H2s
4. Include keywords naturally in headings
5. Make headings descriptive and scannable',
'Proper heading structure helps Google understand your content hierarchy and what your page is about. The leaked documents reveal Google parses page structure to understand content relationships. Clear headings also improve user experience - visitors can quickly scan and find what they need, reducing bounce rate.',
'search_visibility',
ARRAY['Improve site structure', 'Improve rankings for keyword'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
4),

-- Task 5
('Add internal links between related pages',
'Connect your pages with strategic internal links to help users and Google navigate your site.',
'1. Link service pages to related blog posts
2. Link blog posts to relevant service pages
3. Use descriptive anchor text (not "click here")
4. Ensure every page is reachable within 3 clicks from homepage
5. Add contextual links within content, not just navigation',
'Internal linking is one of the most underused SEO tactics. Google''s crawler follows internal links to discover and understand your site. The leaked documents show that internal PageRank (link equity) flows through your site. Strategic internal links help your important pages rank better by directing authority to them.',
'search_visibility',
ARRAY['Improve site structure', 'Improve rankings for keyword'],
ARRAY['Site-wide', 'Blog post'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
5),

-- Task 6
('Optimize your images with alt text and compression',
'Improve page speed and accessibility by optimizing images properly.',
'1. Compress images before uploading (aim for under 200KB)
2. Use descriptive file names (kitchen-remodel-portland.jpg not IMG_1234.jpg)
3. Add alt text that describes what''s in the image
4. Include keywords in alt text when natural
5. Use modern formats like WebP when possible',
'Page speed directly affects rankings and user experience. Google''s Core Web Vitals are confirmed ranking factors. Large, unoptimized images are the #1 cause of slow pages. Alt text helps Google understand image content and improves accessibility - both factors Google rewards.',
'fix_issues',
ARRAY['Improve traffic', 'Improve site structure'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
6),

-- Task 7
('Claim and verify your Google Business Profile',
'Set up or claim your Google Business Profile to appear in local search results and Google Maps.',
'1. Go to business.google.com
2. Search for your business or click "Add your business"
3. Choose the correct business category
4. Add your complete address (or service area if you go to customers)
5. Complete the verification process (usually postcard or phone)',
'For local businesses, your Google Business Profile is often more important than your website for local searches. It''s what appears in the "map pack" - those 3 listings that show prominently in local searches. Without a verified profile, you''re invisible in local search.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
7),

-- Task 8
('Add your business to the main citation directories',
'List your business on key directories to build local authority.',
'1. Create profiles on: Yelp, Facebook, Apple Maps, Bing Places
2. Ensure NAP (Name, Address, Phone) is EXACTLY consistent
3. Use the same business name format everywhere
4. Add complete information including hours and description
5. Upload quality photos to each listing',
'Citations (directory listings) are still a local ranking factor. Google cross-references your business information across the web. Consistent NAP information builds trust and authority. The leaked documents confirm Google uses "site authority" as a ranking factor - citations contribute to this.',
'local_visibility',
ARRAY['Increase authority', 'Optimize Google Business'],
ARRAY[]::TEXT[],
ARRAY['Directories / Citations'],
'easy',
'45_120_min',
'[{"name": "Business Profile", "route": "/dashboard/business-profile"}]',
8);

-- ============================================================================
-- SERVICE PAGE GROWTH PACK - Optimize pages that drive revenue
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 9
('Research keywords for each service you offer',
'Find the specific terms people search for when looking for each of your services.',
'1. Create a list of all services you offer
2. Research 3-5 keyword variations for each service
3. Check search volume and competition
4. Look for long-tail variations (e.g., "emergency plumber near me")
5. Note commercial intent keywords (these convert better)',
'Service pages are your money pages - they''re where conversions happen. Google''s leaked documents show they differentiate between informational and transactional queries. Service-focused keywords often have higher commercial intent, meaning searchers are ready to buy. Targeting these specifically is more valuable than generic keywords.',
'research',
ARRAY['Discover keyword phrases', 'Get more leads'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}]',
10),

-- Task 10
('Create dedicated pages for each major service',
'Build individual pages for each service instead of listing everything on one page.',
'1. Create one page per major service offering
2. Write at least 500 words of unique content per page
3. Include the service keyword in URL, title, H1
4. Add specific details: process, pricing factors, timeline
5. Include a clear call-to-action',
'Google prefers topically-focused pages over jack-of-all-trades pages. A dedicated "Kitchen Remodeling" page will outrank a generic "Our Services" page for kitchen remodeling searches. The leaked documents reveal Google assesses "page quality" at the individual page level. Give each service the focused attention it deserves.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Get more leads'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
11),

-- Task 11
('Add customer testimonials to service pages',
'Place relevant customer reviews and testimonials on your service pages.',
'1. Collect testimonials specific to each service
2. Include customer name and location (city) when permitted
3. Place testimonials near the call-to-action
4. Use schema markup for reviews
5. Include before/after photos when applicable',
'Testimonials serve two purposes: they build trust with visitors AND provide fresh, relevant content that Google values. The leaked documents show Google tracks "user engagement" signals. Pages with testimonials typically have higher engagement and conversion rates. Real customer language also naturally includes keywords people actually use.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "Reviews", "route": "/dashboard/reviews"}]',
12),

-- Task 12
('Add FAQ sections to service pages',
'Answer common questions about each service directly on the page.',
'1. List 5-10 common questions customers ask about this service
2. Write clear, helpful answers
3. Use FAQ schema markup for potential rich results
4. Include pricing questions when appropriate
5. Link to related services or blog posts in answers',
'FAQ sections accomplish multiple goals: they answer searcher questions (improving engagement), target long-tail keywords naturally, and can appear as rich results in search. Google''s "People Also Ask" feature pulls from FAQ content. The leaked documents suggest user satisfaction (finding answers) is a key ranking signal.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Improve traffic'],
ARRAY['Service page', 'FAQ page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
13),

-- Task 13
('Optimize service page URLs and structure',
'Create clean, keyword-rich URLs for your service pages.',
'1. Use format: yoursite.com/services/service-name
2. Keep URLs short and descriptive
3. Use hyphens between words, not underscores
4. Include your target keyword in the URL
5. Avoid dates, numbers, or parameters in URLs',
'URL structure matters more than many realize. Google''s leaked documents confirm they use URL components for understanding page content. Clean URLs also improve click-through rate - people trust readable URLs more. A well-structured URL hierarchy also helps Google understand your site organization.',
'search_visibility',
ARRAY['Improve site structure', 'Improve rankings for keyword'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
14),

-- Task 14
('Add local service schema markup',
'Implement structured data to help Google understand your service offerings.',
'1. Use LocalBusiness or more specific type (Plumber, Electrician, etc.)
2. Add Service schema for each service offered
3. Include service area information
4. Add price range when applicable
5. Test with Google''s Rich Results Test tool',
'Schema markup is how you speak directly to Google in a language it understands. While not a direct ranking factor, it enables rich results that dramatically improve click-through rate. Local service schema helps Google understand what you offer and where you offer it. This is especially important for AI-powered search features.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Improve mentions in LLMs'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'advanced',
'45_120_min',
'[]',
15);

-- ============================================================================
-- CONTENT GROWTH PACK - Build authority through content
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 15
('Create a content calendar for your blog',
'Plan your blog content strategically around keywords and customer questions.',
'1. Identify 12 blog topic ideas (one per month minimum)
2. Map topics to target keywords
3. Balance educational content with promotional
4. Plan seasonal or timely content in advance
5. Schedule writing and publishing dates',
'Consistent content creation is one of the most reliable ways to grow organic traffic. Google''s leaked documents reveal they track content freshness and publishing frequency. A content calendar keeps you consistent - sporadic publishing doesn''t build authority. Regular content also gives you more internal linking opportunities.',
'research',
ARRAY['Improve traffic', 'Discover keyword phrases'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}]',
20),

-- Task 16
('Write a comprehensive guide for your main topic',
'Create a definitive, long-form resource on your primary service or expertise.',
'1. Choose your most important topic
2. Write 2,000+ words covering all aspects
3. Include original insights from your experience
4. Add images, examples, and practical tips
5. Update annually to keep it fresh',
'Comprehensive content outperforms thin content. Google''s leaked documents mention "originality" and "effort" as quality signals. Long-form guides also attract backlinks naturally - people link to definitive resources. This type of content establishes you as an authority, which aligns with Google''s emphasis on E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Increase authority'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'advanced',
'multi_step',
'[]',
21),

-- Task 17
('Update your oldest blog posts with fresh content',
'Refresh outdated content to improve rankings and provide better value.',
'1. Identify posts older than 12 months
2. Check if information is still accurate
3. Add new sections, examples, or data
4. Update the publication date after substantial changes
5. Improve internal linking to newer content',
'Content freshness is a confirmed ranking factor in Google''s leaked documents. They specifically track "last significant update" for pages. Updating old content is often more effective than creating new content - the page already has authority and links. A meaningful update can give rankings a significant boost.',
'track_maintain',
ARRAY['Improve rankings for keyword', 'Improve traffic'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
22),

-- Task 18
('Create location-specific content for your service area',
'Write content targeting specific cities or neighborhoods you serve.',
'1. List the cities/areas in your service area
2. Create content relevant to each area (not just duplicate pages)
3. Include local landmarks, neighborhoods, and references
4. Address location-specific challenges or needs
5. Build internal links between location content',
'Local content helps you rank for "[service] in [city]" searches, which have high commercial intent. The key is making each page genuinely unique and valuable - not just swapping city names. Google''s documents show they can detect thin/duplicate content. Authentic local content that mentions real local details performs better.',
'local_visibility',
ARRAY['Improve rankings for keyword', 'Get more leads'],
ARRAY['Location page', 'Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
23),

-- Task 19
('Answer common customer questions as blog posts',
'Turn frequently asked questions into helpful blog content.',
'1. Review emails, calls, and chats for common questions
2. Choose questions with search potential
3. Write thorough, helpful answers (500+ words)
4. Include related questions in the same post
5. Link to relevant service pages',
'Question-based content directly matches how people search. The "People Also Ask" feature in Google shows the algorithm understands question intent. The leaked documents reveal Google tracks whether users find answers to their queries. When your content directly answers questions, users are satisfied and Google notices.',
'search_visibility',
ARRAY['Improve traffic', 'Improve rankings for keyword'],
ARRAY['Blog post', 'FAQ page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
24),

-- Task 20
('Build a content hub around your main service',
'Create interconnected content that establishes topical authority.',
'1. Identify your main service/topic as the hub
2. Create 5-10 supporting articles on subtopics
3. Link all supporting content to the main hub page
4. Link between related supporting articles
5. Keep expanding the hub over time',
'Topical authority means covering a subject comprehensively. Google''s leaked documents mention "site focus" as a quality signal. A content hub demonstrates expertise through depth, not just breadth. This structure also creates strong internal linking that helps your main pages rank better.',
'search_visibility',
ARRAY['Increase authority', 'Improve site structure'],
ARRAY['Blog post', 'Service page'],
ARRAY[]::TEXT[],
'advanced',
'multi_step',
'[]',
25);

-- ============================================================================
-- CTR BOOST PACK - Get more clicks from search results
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 21
('Improve titles for your top-traffic pages',
'Optimize title tags on pages already getting impressions to increase clicks.',
'1. Check Search Console for pages with high impressions but low CTR
2. Analyze what competitors'' titles look like
3. Add power words, numbers, or current year
4. Test including emotional hooks
5. Keep your target keyword in the title',
'This is one of the highest-ROI SEO tasks. NavBoost, revealed in Google''s leaked documents, uses click-through rate as a ranking signal. If you''re getting impressions but not clicks, you''re leaving both traffic AND rankings on the table. A better title can improve CTR by 20-30%, which compounds into better rankings.',
'search_visibility',
ARRAY['Improve click-through rate', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]',
30),

-- Task 22
('Add FAQ schema for rich results',
'Implement FAQ structured data to take up more space in search results.',
'1. Add FAQ section to key pages if not present
2. Write 3-5 genuine Q&A pairs
3. Implement FAQ schema markup
4. Test with Rich Results Test tool
5. Monitor Search Console for rich result impressions',
'FAQ rich results can dramatically increase your visibility in search results. Your listing takes up more vertical space, pushing competitors down. The leaked documents show Google values structured data for understanding content. Rich results typically see 2-3x higher CTR than standard listings.',
'search_visibility',
ARRAY['Improve click-through rate', 'Improve traffic'],
ARRAY['Service page', 'FAQ page'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
31),

-- Task 23
('Optimize meta descriptions for click motivation',
'Rewrite meta descriptions to compel action, not just describe content.',
'1. Focus on benefits, not features
2. Include a clear value proposition
3. Add urgency or social proof when appropriate
4. Include a subtle call-to-action
5. Match the search intent (informational vs. transactional)',
'Your meta description is a 155-character advertisement. While not a ranking factor itself, CTR definitely is (per NavBoost in the leaked documents). Think about what makes YOU click on results. Usually it''s a description that promises to solve your specific problem or clearly has what you need.',
'search_visibility',
ARRAY['Improve click-through rate', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
32),

-- Task 24
('Build brand recognition for improved CTR',
'Increase branded searches and recognition so people choose your listing.',
'1. Ensure consistent branding across all platforms
2. Encourage happy customers to search for you by name
3. Engage on social media to increase brand familiarity
4. Consider local sponsorships or community involvement
5. Ask for reviews mentioning your business name',
'Google''s leaked documents reveal that branded searches are a significant quality signal. When people search for your business by name and click, it signals trust. Over time, this helps ALL your pages rank better. People also click more on brands they recognize in search results, creating a virtuous cycle.',
'research',
ARRAY['Improve click-through rate', 'Increase authority'],
ARRAY['Site-wide'],
ARRAY['Social Profiles', 'PR / Mentions'],
'medium',
'multi_step',
'[]',
33),

-- Task 25
('Optimize for featured snippets on question queries',
'Structure content to win position zero for question-based searches.',
'1. Identify question keywords you already rank for (positions 2-10)
2. Add a clear, concise answer in the first paragraph
3. Use the question as an H2 or H3 heading
4. Follow the answer with supporting details
5. Use lists, tables, or steps when appropriate',
'Featured snippets appear above the #1 result, capturing significant clicks. Google pulls these from pages that clearly and concisely answer the query. The leaked documents show Google assesses "answer quality" for certain queries. Formatting your content to be "snippet-friendly" can jump you above competitors.',
'search_visibility',
ARRAY['Improve click-through rate', 'Improve rankings for keyword'],
ARRAY['Blog post', 'FAQ page'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
34),

-- Task 26
('Add review stars to your search listings',
'Implement review schema to show star ratings in search results.',
'1. Add aggregate review schema to key pages
2. Collect genuine reviews to include in the schema
3. Include review count and average rating
4. Test implementation with Rich Results Test
5. Keep review data current and accurate',
'Star ratings in search results dramatically increase CTR - some studies show 30%+ improvement. People trust visual indicators of quality. The schema markup tells Google about your reviews, making them eligible to display. Combined with NavBoost (CTR signals), this creates a powerful ranking boost.',
'search_visibility',
ARRAY['Improve click-through rate', 'Get more leads'],
ARRAY['Service page', 'Homepage'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[{"name": "Reviews", "route": "/dashboard/reviews"}]',
35);

-- ============================================================================
-- TECHNICAL CLEANUP PACK - Fix issues hurting your rankings
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 27
('Fix Core Web Vitals issues',
'Improve page speed metrics that Google uses as ranking factors.',
'1. Test your site at pagespeed.web.dev
2. Address the largest issues first (usually images)
3. Enable browser caching
4. Minimize render-blocking resources
5. Consider a CDN for static assets',
'Core Web Vitals (LCP, FID, CLS) are confirmed ranking factors. Google''s leaked documents show they use Chrome data to assess real-world performance. Slow sites not only rank worse - they lose visitors. Each second of delay can reduce conversions by 7%. This affects both rankings and revenue.',
'fix_issues',
ARRAY['Improve traffic', 'Improve site structure'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'advanced',
'multi_step',
'[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]',
40),

-- Task 28
('Find and fix broken links',
'Identify and repair broken internal and external links on your site.',
'1. Use a crawler tool to find 404 errors
2. Check Google Search Console for crawl errors
3. Fix or redirect broken internal links
4. Update or remove broken external links
5. Set up a custom 404 page with navigation',
'Broken links create dead ends for both users and search engines. Google''s crawler gets frustrated by repeated 404s. The leaked documents mention "crawl budget" - wasted crawls on broken links mean less attention on your good pages. It also signals poor maintenance, which affects quality perception.',
'fix_issues',
ARRAY['Improve site structure', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]',
41),

-- Task 29
('Ensure your site is mobile-friendly',
'Optimize your site for mobile users and mobile-first indexing.',
'1. Test at search.google.com/test/mobile-friendly
2. Ensure text is readable without zooming
3. Make buttons and links easily tappable
4. Check that content doesn''t require horizontal scrolling
5. Verify forms work well on mobile',
'Google uses mobile-first indexing - they primarily look at your mobile site for rankings. The leaked documents confirm mobile usability signals. Over 60% of searches are on mobile. If your site is hard to use on phones, you''re losing most of your potential traffic and customers.',
'fix_issues',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
42),

-- Task 30
('Set up and fix redirect chains',
'Clean up redirects to preserve link equity and improve crawling.',
'1. Identify redirect chains (A→B→C should be A→C)
2. Update old internal links to point directly
3. Ensure redirects use 301 (permanent) not 302
4. Check for redirect loops
5. Update any external links you control',
'Redirect chains waste crawl budget and dilute link equity. Each hop in a chain loses some ranking power. Google''s documents mention following redirects but preferring direct paths. Clean redirects ensure the authority from backlinks flows directly to your pages.',
'fix_issues',
ARRAY['Improve site structure', 'Increase authority'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'advanced',
'45_120_min',
'[]',
43),

-- Task 31
('Add HTTPS and fix mixed content',
'Ensure your site is fully secure with no insecure resources.',
'1. Verify your site loads on HTTPS
2. Check for mixed content warnings in browser console
3. Update any HTTP resources to HTTPS
4. Set up HTTP to HTTPS redirects
5. Update internal links to use HTTPS',
'HTTPS is a confirmed ranking factor. Google actively warns users about insecure sites. Mixed content (some resources on HTTP) can break functionality and trigger warnings. The leaked documents show security signals matter. Beyond SEO, customers trust and convert better on secure sites.',
'fix_issues',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
44),

-- Task 32
('Create and optimize XML sitemap',
'Ensure Google can find and prioritize all your important pages.',
'1. Generate or update your XML sitemap
2. Include only indexable, valuable pages
3. Set appropriate priority and change frequency
4. Submit to Google Search Console
5. Keep sitemap updated as you add/remove pages',
'Your sitemap is a roadmap for search engines. It helps Google discover pages, especially new ones. The leaked documents mention sitemap signals for understanding site structure. A well-organized sitemap that prioritizes important pages helps Google allocate crawl budget effectively.',
'fix_issues',
ARRAY['Improve site structure', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
45),

-- Task 33
('Fix duplicate content issues',
'Identify and resolve pages with duplicate or very similar content.',
'1. Search for your own content in quotes to find duplicates
2. Use canonical tags to indicate preferred versions
3. Consolidate similar pages when possible
4. Differentiate location pages with unique content
5. Check for www/non-www and HTTP/HTTPS duplicates',
'Duplicate content confuses Google about which page to rank. The leaked documents reveal Google clusters similar pages and chooses one. If you have duplicates, you''re competing with yourself. Canonical tags tell Google which version you prefer. Unique, valuable content on each page is always the best solution.',
'fix_issues',
ARRAY['Improve rankings for keyword', 'Improve site structure'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'advanced',
'45_120_min',
'[]',
46);

-- ============================================================================
-- LOCAL VISIBILITY PACK - Dominate local search
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 34
('Fully optimize your Google Business Profile',
'Complete every field and feature in your GBP for maximum visibility.',
'1. Add complete business description (750 characters)
2. Select all relevant categories (primary + secondary)
3. Add all services with descriptions
4. Upload 10+ high-quality photos
5. Set accurate hours including special hours',
'Your Google Business Profile is arguably more important than your website for local searches. Google''s local algorithm heavily weighs GBP completeness and activity. The leaked documents show local signals are distinct from organic signals. A fully optimized GBP dramatically improves your map pack visibility.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'45_120_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
50),

-- Task 35
('Build a review generation system',
'Create a consistent process for collecting customer reviews.',
'1. Identify the best point in customer journey to ask
2. Create a simple, direct review request message
3. Make leaving a review as easy as possible (direct links)
4. Train your team to ask happy customers
5. Follow up with non-responders once',
'Reviews are a top local ranking factor. Google''s leaked documents confirm review signals (quantity, quality, recency) impact rankings. Beyond SEO, 87% of consumers read reviews. Fresh, positive reviews drive both rankings and conversions. Consistency is key - aim for steady reviews, not bursts.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'medium',
'15_45_min',
'[{"name": "Prompt Pages", "route": "/prompt-pages"}, {"name": "Reviews", "route": "/dashboard/reviews"}]',
51),

-- Task 36
('Respond to all Google reviews',
'Reply to every review to show engagement and customer care.',
'1. Respond to new reviews within 24-48 hours
2. Thank positive reviewers specifically for their feedback
3. Address negative reviews professionally and constructively
4. Offer to resolve issues offline when needed
5. Include keywords naturally when appropriate',
'Review responses signal business engagement to Google. The leaked documents suggest owner response rate is a factor. Responses also influence future customers - they''re reading how you handle feedback. 89% of consumers read business responses to reviews. Professional responses to negative reviews often impress more than the complaint deters.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'5_15_min',
'[{"name": "Reviews", "route": "/dashboard/reviews"}]',
52),

-- Task 37
('Create location pages for each service area',
'Build dedicated pages for each city or area you serve.',
'1. Create one page per major city/area you serve
2. Include unique, locally-relevant content
3. Add local testimonials when available
4. Include local landmarks, neighborhoods, or references
5. Add proper LocalBusiness schema with service area',
'Location pages help you rank for "[service] in [city]" searches. Each page should be genuinely useful to someone in that area - not just the city name swapped. Google''s documents show they detect thin location pages. Include local content, local reviews, and specific information about serving that area.',
'local_visibility',
ARRAY['Improve rankings for keyword', 'Get more leads'],
ARRAY['Location page'],
ARRAY[]::TEXT[],
'medium',
'multi_step',
'[]',
53),

-- Task 38
('Get listed in industry-specific directories',
'Find and claim listings in directories specific to your industry.',
'1. Search for "[your industry] directory" to find relevant sites
2. Claim or create listings on industry-specific directories
3. Ensure consistent NAP information
4. Complete all profile fields thoroughly
5. Seek out local chamber of commerce listings',
'Industry-specific directories carry more weight than general directories. Google''s leaked documents mention "topical relevance" in various contexts. A link from a plumbing directory to a plumber is more valuable than from a generic business directory. These also serve as citations that validate your business.',
'local_visibility',
ARRAY['Increase authority', 'Improve rankings for keyword'],
ARRAY[]::TEXT[],
ARRAY['Directories / Citations'],
'medium',
'45_120_min',
'[]',
54),

-- Task 39
('Add local schema markup',
'Implement LocalBusiness structured data on your website.',
'1. Add LocalBusiness schema to your homepage and contact page
2. Include NAP, hours, and geo coordinates
3. Add service area markup if applicable
4. Include payment methods and price range
5. Test with Rich Results Test',
'Local schema helps Google understand your business information precisely. It reinforces your NAP consistency and business details. The leaked documents show Google uses structured data for entity understanding. This markup also enables rich results in local searches and voice search responses.',
'local_visibility',
ARRAY['Optimize Google Business', 'Improve mentions in LLMs'],
ARRAY['Homepage', 'Contact page'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[]',
55),

-- Task 40
('Build local links from community involvement',
'Earn backlinks through local sponsorships, events, and organizations.',
'1. Sponsor local sports teams, events, or charities
2. Join local business associations with member directories
3. Participate in community events for press coverage
4. Partner with complementary local businesses
5. Offer expertise for local news stories',
'Local links are the most valuable links for local businesses. Google''s leaked documents confirm link quality and relevance matter. A link from your local newspaper or chamber of commerce is worth more than random directories. These links also drive referral traffic from your actual customer base.',
'local_visibility',
ARRAY['Increase authority', 'Get links and mentions'],
ARRAY[]::TEXT[],
ARRAY['Backlinks', 'PR / Mentions'],
'medium',
'multi_step',
'[]',
56);

-- ============================================================================
-- AI VISIBILITY STARTER PACK - Get recommended by AI assistants
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 41
('Build brand mentions across the web',
'Get your business mentioned on relevant websites, forums, and publications.',
'1. Contribute helpful answers in online communities (Reddit, Quora, forums)
2. Guest post on industry blogs with natural mentions
3. Get quoted in industry publications
4. Participate in podcasts or interviews
5. Create shareable content others will reference',
'AI models like ChatGPT and Claude learn from web content. When your brand is mentioned positively across many trusted sources, AI assistants are more likely to recommend you. Unlike links, mentions don''t need to link back - AI reads and understands context. Think about what content AI would learn from.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions', 'Social Profiles'],
'medium',
'multi_step',
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]',
60),

-- Task 42
('Create authoritative, factual content',
'Write content that demonstrates expertise and includes verifiable facts.',
'1. Include statistics and data with sources
2. Reference industry standards and best practices
3. Share original research or insights from your experience
4. Update content regularly for accuracy
5. Cite authoritative sources when making claims',
'AI models prioritize reliable, factual information. Content that demonstrates expertise and backs claims with evidence is more likely to be referenced. The E-E-A-T framework (Experience, Expertise, Authoritativeness, Trust) that Google uses aligns with what AI models consider reliable. Be the source AI trusts.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY['Blog post', 'Service page'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
61),

-- Task 43
('Implement comprehensive structured data',
'Use schema markup to help AI understand your business precisely.',
'1. Add Organization schema with complete details
2. Implement LocalBusiness schema
3. Add Service schema for each service
4. Include FAQ schema for common questions
5. Use HowTo schema for process content',
'Structured data creates a clear, machine-readable representation of your business. While AI models read natural language, structured data provides unambiguous facts. This helps AI assistants give accurate information about your business - services, hours, contact info, and capabilities.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Improve site structure'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'advanced',
'45_120_min',
'[]',
62),

-- Task 44
('Establish social proof and credentials',
'Build credible third-party validation that AI can reference.',
'1. Collect and showcase industry certifications
2. Display association memberships prominently
3. List awards or recognition received
4. Include credentials in your About page
5. Encourage reviews on multiple platforms',
'AI assistants evaluate trustworthiness based on signals across the web. Certifications, awards, and association memberships provide objective credibility signals. Reviews on multiple platforms (not just Google) create a broader trust footprint. AI is more likely to recommend businesses with verifiable credentials.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY['About page', 'Homepage'],
ARRAY['Directories / Citations', 'Google Business Profile'],
'easy',
'15_45_min',
'[]',
63),

-- Task 45
('Create comprehensive FAQ content',
'Answer every question a potential customer might ask.',
'1. List 20+ questions customers commonly ask
2. Write thorough, helpful answers
3. Organize by category or topic
4. Use natural, conversational language
5. Include questions AI assistants might receive',
'AI assistants often need to answer specific questions about services. If your website comprehensively answers these questions, AI can draw from your content. Think about what someone might ask ChatGPT about your type of service, then ensure your content answers those queries thoroughly.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Improve traffic'],
ARRAY['FAQ page', 'Service page'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
64),

-- Task 46
('Ensure consistent business information everywhere',
'Verify your NAP and business details are identical across all platforms.',
'1. Create a master document with exact business information
2. Audit all directory listings for consistency
3. Check social profiles for accurate info
4. Verify Google Business Profile matches website
5. Update any inconsistencies immediately',
'AI models cross-reference information from multiple sources. Inconsistencies create confusion about what''s accurate. When your business information is consistent everywhere, AI has higher confidence in the facts. This is especially important for contact information and service details.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Optimize Google Business'],
ARRAY['Site-wide'],
ARRAY['Google Business Profile', 'Directories / Citations', 'Social Profiles'],
'easy',
'45_120_min',
'[{"name": "Business Profile", "route": "/dashboard/business-profile"}]',
65);

-- ============================================================================
-- ONLINE VISIBILITY MAINTENANCE PACK - Keep rankings strong
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 47
('Monthly ranking check and analysis',
'Track your keyword positions and identify opportunities or issues.',
'1. Check rankings for your target keywords
2. Note any significant changes (up or down)
3. Investigate drops - check for algorithm updates
4. Identify new ranking opportunities from data
5. Adjust strategy based on trends',
'Regular monitoring catches problems early. Google''s algorithm updates constantly - the leaked documents reference continuous ranking adjustments. A sudden drop might indicate a technical issue, algorithm change, or competitor action. Monthly checks let you respond quickly rather than wondering why traffic dropped months later.',
'track_maintain',
ARRAY['Improve rankings for keyword', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Analytics", "route": "/dashboard/analytics"}]',
70),

-- Task 48
('Quarterly content freshness audit',
'Review and update your most important pages every quarter.',
'1. List your top 10 most important pages
2. Check each for outdated information
3. Update statistics, dates, and references
4. Add new sections addressing recent developments
5. Refresh images or examples as needed',
'Content freshness is a confirmed ranking signal in Google''s leaked documents. They track "last significant update" for pages. Regular updates tell Google your content is maintained and current. This is especially important for topics where information changes - pricing, processes, regulations, etc.',
'track_maintain',
ARRAY['Improve rankings for keyword', 'Improve traffic'],
ARRAY['Service page', 'Blog post', 'Homepage'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
71),

-- Task 49
('Weekly review monitoring and response',
'Stay on top of new reviews across all platforms.',
'1. Check for new reviews on all platforms weekly
2. Respond to all reviews within 48 hours
3. Address negative feedback constructively
4. Thank positive reviewers genuinely
5. Track review velocity and overall rating trends',
'Consistent review management affects local rankings and conversions. Google''s leaked documents suggest review recency matters. Fresh reviews signal an active, current business. Weekly monitoring ensures you catch and respond to reviews promptly - especially important for negative reviews where fast response limits damage.',
'track_maintain',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'5_15_min',
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Google Business", "route": "/dashboard/google-business"}]',
72),

-- Task 50
('Monthly competitor check',
'Monitor what competitors are doing and identify opportunities.',
'1. Check rankings for shared keywords
2. Review competitor websites for new content
3. Look at their recent reviews and ratings
4. Note any new backlinks they''ve earned
5. Identify gaps you could fill',
'SEO is relative - you rank compared to competitors. If they''re improving while you stay static, you''ll lose ground. Monthly competitor checks reveal their strategies and help you stay ahead. You might find content topics they''re missing, link opportunities they''ve found, or issues they''re having that you can avoid.',
'track_maintain',
ARRAY['Improve rankings for keyword', 'Discover keyword phrases'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'15_45_min',
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]',
73),

-- Task 51
('Annual technical SEO audit',
'Comprehensive check of all technical SEO factors once per year.',
'1. Run a full site crawl for technical issues
2. Check Core Web Vitals and page speed
3. Verify mobile responsiveness
4. Audit redirects and fix chains/loops
5. Review and clean up XML sitemap',
'Technical issues creep in over time. New pages, plugins, and updates can introduce problems. An annual deep audit catches issues that accumulate gradually. The leaked documents show Google uses many technical signals. A clean technical foundation ensures your content quality shines through.',
'track_maintain',
ARRAY['Improve site structure', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'advanced',
'multi_step',
'[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]',
74),

-- Task 52
('Monthly Google Business updates',
'Keep your GBP active with regular posts and updates.',
'1. Create 2-4 Google Business posts per month
2. Update photos seasonally or with new work
3. Add any new services offered
4. Update special hours for holidays
5. Check and update Q&A section',
'GBP activity signals a current, engaged business. Google''s local algorithm favors profiles with recent activity. Regular posts keep you visible in local searches and give potential customers fresh information. It takes just a few minutes weekly but significantly impacts local visibility.',
'track_maintain',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Social Posting", "route": "/dashboard/social-posting"}]',
75),

-- Task 53
('Quarterly backlink profile review',
'Check your backlinks for quality and new opportunities.',
'1. Review new backlinks acquired
2. Check for toxic or spammy links to disavow
3. Identify successful link sources to replicate
4. Look for broken backlinks to reclaim
5. Note competitor links you could pursue',
'Link quality matters more than quantity - this is abundantly clear from Google''s leaked documents. Regular backlink review helps you understand what''s working and catch problems. A toxic link pointing to your site can hurt rankings. Proactive management keeps your link profile healthy.',
'track_maintain',
ARRAY['Increase authority', 'Get links and mentions'],
ARRAY[]::TEXT[],
ARRAY['Backlinks'],
'medium',
'45_120_min',
'[{"name": "Backlinks", "route": "/dashboard/backlinks"}]',
76),

-- Task 54
('Semi-annual AI visibility check',
'Test how AI assistants describe and recommend your business.',
'1. Ask ChatGPT about businesses in your category + location
2. Ask for recommendations in your service area
3. Note if you''re mentioned and how accurately
4. Compare to competitor mentions
5. Identify gaps in information AI has about you',
'AI assistants are becoming a significant source of recommendations. Understanding how AI perceives your business helps you optimize for this growing channel. If AI has inaccurate information, you need to update your web presence. Regular checks help you track progress in AI visibility.',
'track_maintain',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]',
77);

-- ============================================================================
-- Link tasks to their respective packs
-- ============================================================================

-- SEO Starter Pack (tasks 1-8)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('SEO Starter Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 1 AND 8;

-- Service Page Growth Pack (tasks 9-14)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Service Page Growth Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 10 AND 15;

-- Content Growth Pack (tasks 15-20)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Content Growth Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 20 AND 25;

-- CTR Boost Pack (tasks 21-26)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('CTR Boost Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 30 AND 35;

-- Technical Cleanup Pack (tasks 27-33)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Technical Cleanup Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 40 AND 46;

-- Local Visibility Pack (tasks 34-40)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Local Visibility Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 50 AND 56;

-- AI Visibility Starter Pack (tasks 41-46)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('AI Visibility Starter Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 60 AND 65;

-- Online Visibility Maintenance Pack (tasks 47-54)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Online Visibility Maintenance Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order BETWEEN 70 AND 77;

-- Clean up helper function
DROP FUNCTION IF EXISTS get_pack_id(TEXT);
