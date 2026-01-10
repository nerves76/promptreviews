-- Enhance task descriptions with more thorough, educational content
-- Making descriptions more comprehensive with best practices and context

-- Task: Write meta descriptions that drive clicks
UPDATE wm_library_tasks
SET description = 'Meta descriptions are the 155-character snippets that appear below your page title in search results. While not a direct ranking factor, they heavily influence whether someone clicks on your listing. Think of them as your ad copy for organic search. A compelling meta description should: clearly state what the page offers, include your target keyword naturally, create urgency or curiosity, and end with an implied or explicit call-to-action. Avoid duplicate descriptions across pages and never leave them blank - Google will pull random text from your page instead.'
WHERE title = 'Write meta descriptions that drive clicks';

-- Task: Write compelling title tags for your main pages
UPDATE wm_library_tasks
SET description = 'Title tags are HTML elements that define the title of your webpage and appear as the clickable headline in search results. They''re one of the most important on-page SEO factors. Best practices: keep under 60 characters to avoid truncation, place your primary keyword near the beginning, include your brand name (usually at the end), make each title unique across your site, and write for humans first - a compelling title gets more clicks. Format example: "Primary Keyword - Secondary Keyword | Brand Name". Avoid keyword stuffing or generic titles like "Home" or "Services".'
WHERE title = 'Write compelling title tags for your main pages';

-- Task: Research your primary keywords
UPDATE wm_library_tasks
SET description = 'Keyword research is the foundation of SEO - it tells you exactly what words and phrases your potential customers type into Google. Without this, you''re guessing what to optimize for. Start with "seed keywords" (basic terms for your services), then expand using Google''s autocomplete, "People Also Ask" boxes, and competitor analysis. Focus on search intent: informational keywords (people learning), navigational (looking for specific sites), and transactional (ready to buy). For local businesses, include location modifiers. Prioritize keywords with reasonable search volume that you can realistically rank for.'
WHERE title = 'Research your primary keywords';

-- Task: Set up proper heading structure (H1, H2, H3)
UPDATE wm_library_tasks
SET description = 'Heading tags (H1-H6) create a hierarchical structure that helps both users and search engines understand your content. The H1 is your main title - use exactly one per page containing your primary keyword. H2s divide your content into major sections, H3s create subsections under H2s, and so on. This structure is like an outline: H1 is the title, H2s are chapters, H3s are sections within chapters. Proper hierarchy improves accessibility (screen readers use headings for navigation), helps Google understand topic relationships, and makes your content scannable for users who skim.'
WHERE title = 'Set up proper heading structure (H1, H2, H3)';

-- Task: Add internal links between related pages
UPDATE wm_library_tasks
SET description = 'Internal linking connects your pages together, helping users navigate and distributing "link equity" (ranking power) throughout your site. Every page should link to related content using descriptive anchor text - the clickable words should describe what the linked page is about (not "click here"). Link from high-authority pages (like your homepage) to important pages you want to rank. Create content clusters where related blog posts link to a main "pillar" page. Ensure every page is reachable within 3 clicks from your homepage. Internal links also help Google discover and understand the relationships between your content.'
WHERE title = 'Add internal links between related pages';

-- Task: Optimize your images with alt text and compression
UPDATE wm_library_tasks
SET description = 'Images often account for 50%+ of page weight, making them critical for site speed - a confirmed ranking factor. Compress images before uploading (tools like TinyPNG can reduce file size by 70%+ without visible quality loss). Use modern formats like WebP when possible. Alt text serves two purposes: it describes images for visually impaired users using screen readers (accessibility), and it helps Google understand image content. Write alt text that accurately describes what''s in the image, naturally including keywords when relevant. Also use descriptive file names (kitchen-remodel-portland.jpg, not IMG_1234.jpg).'
WHERE title = 'Optimize your images with alt text and compression';

-- Task: Claim and verify your Google Business Profile
UPDATE wm_library_tasks
SET description = 'Your Google Business Profile (GBP) is often more important than your website for local searches. It''s what appears in the "Local Pack" - those 3 business listings with the map that dominate local search results. An unclaimed or incomplete profile means you''re invisible in local search. Verification typically happens via postcard, phone, or email. Once verified, you control your business information, can respond to reviews, post updates, and access insights about how customers find you. For service-area businesses, you can hide your address while still appearing in relevant local searches.'
WHERE title = 'Claim and verify your Google Business Profile';

-- Task: Add your business to the main citation directories
UPDATE wm_library_tasks
SET description = 'Citations are mentions of your business name, address, and phone number (NAP) on other websites - primarily directories like Yelp, Facebook, Apple Maps, and Bing Places. They''re a local ranking factor because Google cross-references your information across the web to verify accuracy and legitimacy. The key is consistency: your NAP must be exactly the same everywhere (including formatting like "Street" vs "St."). Start with the major platforms, then industry-specific directories. Inconsistent citations confuse Google and can hurt your local rankings. Use your legal business name and a local phone number, not toll-free.'
WHERE title = 'Add your business to the main citation directories';

-- Task: Research keywords for each service you offer
UPDATE wm_library_tasks
SET description = 'Each service you offer has its own set of keywords with different search volumes, competition levels, and intent. "Plumbing services" is broad and competitive; "tankless water heater installation [city]" is specific and likely to convert. Map out every service, then research 3-5 keyword variations for each. Look for long-tail keywords (longer, more specific phrases) - they have less competition and higher conversion rates because they match specific needs. Include modifiers like "near me," "cost," "best," and your city/region. This research directly informs your service page content strategy.'
WHERE title = 'Research keywords for each service you offer';

-- Task: Create dedicated pages for each major service
UPDATE wm_library_tasks
SET description = 'A single "Services" page listing everything you do is an SEO mistake. Each major service deserves its own dedicated page that can rank for service-specific keywords. A page focused entirely on "Emergency Plumbing" will outrank a generic services page for that search. Each service page should have: a unique, keyword-optimized title and URL, at least 500 words of helpful content, details about your process/approach, pricing information or factors, FAQs specific to that service, testimonials from relevant customers, and a clear call-to-action. This depth signals expertise to both Google and potential customers.'
WHERE title = 'Create dedicated pages for each major service';

-- Task: Add customer testimonials to service pages
UPDATE wm_library_tasks
SET description = 'Testimonials serve multiple purposes: they provide social proof that builds trust, they add fresh and relevant content to your pages, and they often naturally include keywords your customers actually use. Place testimonials strategically near calls-to-action where visitors are making decisions. The most effective testimonials include the customer''s name and location (city), describe a specific problem you solved, and mention results achieved. If possible, match testimonials to relevant services - a kitchen remodel testimonial on your kitchen remodeling page is more persuasive than generic praise.'
WHERE title = 'Add customer testimonials to service pages';

-- Task: Add FAQ sections to service pages
UPDATE wm_library_tasks
SET description = 'FAQ sections accomplish multiple SEO goals simultaneously. They answer the exact questions potential customers are searching for, which can trigger Google''s "People Also Ask" feature. They target long-tail keywords naturally through question-and-answer format. They provide comprehensive content that keeps visitors on your page longer. And with FAQ schema markup, they can appear as rich results that take up more space in search listings. Compile real questions from customers, sales calls, and emails. Include pricing questions, timeline questions, and comparison questions. Each answer should be thorough but scannable.'
WHERE title = 'Add FAQ sections to service pages';

-- Task: Create a content calendar for your blog
UPDATE wm_library_tasks
SET description = 'Random, sporadic blogging doesn''t build authority - consistent, strategic content does. A content calendar maps out what you''ll publish and when, ensuring you cover important topics and maintain publishing momentum. Start by listing all the questions your customers ask, problems they face, and topics related to your services. Map these to target keywords. Plan a mix of content types: how-to guides, industry news commentary, case studies, and seasonal content. Aim for at least 1-2 quality posts per month minimum. Consistency matters more than frequency - it''s better to publish twice monthly reliably than weekly sporadically.'
WHERE title = 'Create a content calendar for your blog';

-- Task: Write a comprehensive guide for your main topic
UPDATE wm_library_tasks
SET description = 'Comprehensive, authoritative guides establish topical expertise and attract backlinks naturally. This is your "pillar content" - a definitive resource on your most important topic. Aim for 2,000+ words that cover every angle: what it is, why it matters, how it works, common mistakes, best practices, costs/timeline, and FAQs. Include original insights from your experience that competitors can''t replicate. Add images, videos, or infographics to enhance value. Update annually to maintain freshness. This type of content ranks for dozens of related keywords and serves as an internal linking hub for related posts.'
WHERE title = 'Write a comprehensive guide for your main topic';

-- Task: Update your oldest blog posts with fresh content
UPDATE wm_library_tasks
SET description = 'Content freshness is a ranking factor - Google prefers updated, current information. But creating new content isn''t always the best approach. Older posts often have existing authority, backlinks, and rankings that new content lacks. Updating them preserves this value while improving quality. Review posts older than 12-18 months: update statistics and examples, add new sections addressing recent developments, improve formatting and readability, update internal links to newer content, and refresh the publication date (after substantial changes). A meaningful update can revive traffic to a declining post within weeks.'
WHERE title = 'Update your oldest blog posts with fresh content';

-- Task: Improve titles for your top-traffic pages
UPDATE wm_library_tasks
SET description = 'This is one of the highest-ROI SEO tasks you can do. Find pages that get impressions but have below-average click-through rates (CTR) in Google Search Console. These pages are ranking but not getting clicked - the title or description isn''t compelling enough. Test improvements: add numbers ("7 Ways to..."), include the current year, use power words (essential, proven, complete), or add brackets [2024 Guide]. Even a 20% CTR improvement on a page with 10,000 monthly impressions means 2,000 more clicks - and improved CTR is itself a ranking signal that can boost your position further.'
WHERE title = 'Improve titles for your top-traffic pages';

-- Task: Add FAQ schema for rich results
UPDATE wm_library_tasks
SET description = 'FAQ schema markup tells Google exactly which content on your page is Q&A format, making it eligible for rich results that can dramatically increase your search visibility. Rich results show your FAQs directly in the search listing, taking up more space and pushing competitors down. Implementation requires adding JSON-LD structured data to your page (your developer can help, or use a CMS plugin). Only mark up genuine FAQ content visible on the page - hiding FAQ content violates Google''s guidelines. Test your implementation with Google''s Rich Results Test tool before and after.'
WHERE title = 'Add FAQ schema for rich results';

-- Task: Fix Core Web Vitals issues
UPDATE wm_library_tasks
SET description = 'Core Web Vitals are Google''s metrics for user experience: LCP (Largest Contentful Paint) measures loading speed, FID (First Input Delay) measures interactivity, and CLS (Cumulative Layout Shift) measures visual stability. They''re confirmed ranking factors. Test at PageSpeed Insights or Search Console. Common fixes: compress and lazy-load images (biggest impact for most sites), enable browser caching, minimize render-blocking JavaScript, use a Content Delivery Network (CDN), and reserve space for ads/images to prevent layout shifts. Aim for "Good" scores (green) on all metrics for mobile, where most searches happen.'
WHERE title = 'Fix Core Web Vitals issues';

-- Task: Fully optimize your Google Business Profile
UPDATE wm_library_tasks
SET description = 'A complete GBP dramatically outperforms incomplete ones. Fill every field: write a compelling 750-character description using relevant keywords naturally, select accurate primary and secondary categories, add all services with descriptions and prices where applicable, upload 10+ high-quality photos (exterior, interior, team, work samples), set accurate hours including special holiday hours, and complete all attributes (payment methods, accessibility, amenities). Add products if applicable. The more complete your profile, the more signals Google has to match you with relevant searches. Incomplete profiles suggest inactive businesses.'
WHERE title = 'Fully optimize your Google Business Profile';

-- Task: Build a review generation system
UPDATE wm_library_tasks
SET description = 'Reviews are a top local ranking factor and heavily influence conversion rates - 87% of consumers read reviews for local businesses. Don''t leave reviews to chance; create a systematic process. Identify the optimal moment to ask (usually right after delivering value), create a simple request (email, text, or in-person script), and make leaving a review effortless with a direct link to your Google review form. Train your team to recognize and ask happy customers. Follow up once with non-responders. Aim for steady, consistent reviews rather than bursts - sudden spikes look unnatural to Google.'
WHERE title = 'Build a review generation system';

-- Task: Respond to all Google reviews
UPDATE wm_library_tasks
SET description = 'Review responses signal engagement to Google and strongly influence potential customers reading your reviews. Respond to every review within 24-48 hours. For positive reviews: thank them specifically for what they mentioned, personalize your response, and subtly reinforce your value. For negative reviews: apologize for their experience (even if you disagree), take accountability, offer to resolve the issue offline, and stay professional - remember, your response is really for future customers watching how you handle problems. Include relevant keywords naturally when appropriate, but prioritize authentic, helpful responses.'
WHERE title = 'Respond to all Google reviews';

-- Task: Build brand mentions across the web
UPDATE wm_library_tasks
SET description = 'AI assistants like ChatGPT learn from web content, so your presence across trusted sources influences whether AI recommends you. Unlike traditional SEO where you need links, AI visibility comes from mentions - even unlinked ones. Contribute thoughtful answers on Reddit and Quora (where your expertise is relevant), seek guest posting opportunities on industry blogs, get quoted in articles as an expert source, participate in podcasts, and create content others want to reference. Focus on helpful, authoritative contributions rather than promotional content. The more your business is mentioned positively in credible contexts, the more AI learns to trust and recommend you.'
WHERE title = 'Build brand mentions across the web';

-- Task: Create authoritative, factual content
UPDATE wm_library_tasks
SET description = 'AI models prioritize reliable, verifiable information when making recommendations. Content that demonstrates expertise with backed-up claims is more likely to be referenced. Include statistics with sources, cite industry standards, reference studies or data, and share original insights from your direct experience. Update content regularly to maintain accuracy - AI models learn from current web content. Avoid vague claims or unsubstantiated superlatives. The E-E-A-T framework (Experience, Expertise, Authoritativeness, Trust) that Google uses aligns closely with what makes AI trust content. Be the authoritative source in your niche.'
WHERE title = 'Create authoritative, factual content';

-- Task: Get active on Reddit in your industry subreddits
UPDATE wm_library_tasks
SET description = 'Reddit is one of the primary training sources for AI models, making it uniquely valuable for AI visibility. Find subreddits related to your industry and local area. The key is genuine participation - Reddit users quickly identify and downvote self-promotion. Answer questions thoroughly, share expertise generously, and only mention your business when directly relevant and helpful. Build karma and reputation over months. When you do mention your business in helpful contexts, that association (your business name + positive, expert content) becomes part of what AI models learn. Never spam or use fake accounts - it destroys credibility.'
WHERE title = 'Get active on Reddit in your industry subreddits';

-- Task: Optimize your calls-to-action (CTAs)
UPDATE wm_library_tasks
SET description = 'CTAs are the buttons, links, and prompts that guide visitors toward conversion. Weak CTAs like "Submit" or "Learn More" don''t motivate action. Effective CTAs are specific, benefit-oriented, and create urgency: "Get Your Free Quote," "Schedule Your Consultation," "See Pricing." Use contrasting colors that stand out from your page design. Place CTAs above the fold and after key content sections - don''t make visitors scroll to find how to contact you. On mobile, CTAs should be thumb-friendly (at least 44x44 pixels). Test different wording - small changes can significantly impact conversion rates.'
WHERE title = 'Optimize your calls-to-action (CTAs)';

-- Task: Add trust signals throughout your site
UPDATE wm_library_tasks
SET description = 'Trust signals reduce the perceived risk of doing business with you. Display prominently: professional licenses and certifications, industry association memberships, insurance and bonding information, years in business, number of customers served, and any awards or recognition. Place security badges near forms and payment areas. Show real photos of your team (not stock photos). Include your physical address and local phone number. For service businesses, display your service vehicle or uniformed team. Trust signals work because they provide third-party validation - anyone can claim to be great, but credentials prove it.'
WHERE title = 'Add trust signals throughout your site';

-- Task: Monthly ranking check and analysis
UPDATE wm_library_tasks
SET description = 'SEO isn''t set-and-forget - rankings fluctuate constantly due to algorithm updates, competitor actions, and content freshness decay. Monthly monitoring catches problems before they become crises. Track rankings for your target keywords, noting significant changes. Investigate drops: check for technical issues, review recent algorithm updates, analyze competitor changes. Look for new opportunities in keywords where you''re close to page one. Review Search Console for crawl errors, manual actions, or security issues. Compare traffic trends month-over-month and year-over-year. Document your findings and adjust strategy accordingly.'
WHERE title = 'Monthly ranking check and analysis';

-- Task: Quarterly content freshness audit
UPDATE wm_library_tasks
SET description = 'Content decay is real - information becomes outdated, competitors publish better content, and Google notices when pages aren''t maintained. Quarterly audits prevent this. Review your top 10-20 pages: update statistics, screenshots, and examples; add new sections addressing recent industry changes; refresh internal links to point to newer content; improve formatting based on current best practices; update publication dates after substantial changes. Pay special attention to evergreen content that should remain accurate over time. A well-maintained page maintains rankings; a neglected page slowly loses them.'
WHERE title = 'Quarterly content freshness audit';

-- Task: Create video content for key services
UPDATE wm_library_tasks
SET description = 'Video dramatically increases engagement - visitors spend 88% more time on pages with video. Google owns YouTube and increasingly features video in search results. You don''t need professional production: authentic videos shot on a smartphone often perform better than polished corporate videos. Create 1-3 minute videos explaining your services, showcasing completed work, answering common questions, or featuring customer testimonials. Upload to YouTube with keyword-optimized titles and descriptions, then embed on relevant website pages. Video also provides content for social media and email marketing.'
WHERE title = 'Create video content for key services';

-- Task: Write comparison content for your industry
UPDATE wm_library_tasks
SET description = 'Comparison searches indicate high purchase intent - someone searching "contractor vs handyman for bathroom remodel" is close to making a decision. Create content comparing options your customers evaluate: your service vs. DIY, different service levels, your approach vs. common alternatives. Be balanced and honest - obviously biased comparisons damage credibility. Include comparison tables for scannability. You can include yourself as one option, but focus on genuinely helping the reader make the right choice, even if that''s not always you. This builds trust and positions you as a helpful expert rather than a pushy salesperson.'
WHERE title = 'Write comparison content for your industry';

-- Task: Create "Best of [City]" local content
UPDATE wm_library_tasks
SET description = 'Local "best of" lists attract searches, earn links, and establish local authority. Create guides like "Best Coffee Shops in [Your City]" or "Top Family Activities in [Your Area]" - topics related to your customers'' interests. Be genuinely helpful: include real recommendations, not just businesses that pay you. Include competitors if they deserve it - this actually increases credibility. Add original photos and insights. Local bloggers and news sites often link to quality local guides. This content also demonstrates local expertise to Google, supporting your local SEO efforts for your core business.'
WHERE title = 'Create "Best of [City]" local content';

-- Task: Analyze competitor backlinks for opportunities
UPDATE wm_library_tasks
SET description = 'Your competitors'' backlinks reveal proven opportunities. If a site links to them, they might link to you too. Use backlink analysis tools to export competitor link profiles, then look for patterns: which directories are they listed in that you''re not? Which blogs feature them? Which local organizations link to them? Industry directories and association memberships are often easy wins. Resource pages and local sponsorships reveal opportunities. Guest posting targets become apparent. You''re not copying their strategy - you''re learning what works in your space and finding opportunities you''ve missed.'
WHERE title = 'Analyze competitor backlinks for opportunities';

-- Task: Create a linkable asset (guide, tool, or resource)
UPDATE wm_library_tasks
SET description = 'The best backlinks come naturally when you create something genuinely worth linking to. This could be: a comprehensive guide that becomes the go-to resource on a topic, a useful calculator or tool (cost estimators, comparison tools), original research with interesting data, an infographic visualizing complex information, or a curated resource list. The key is creating something so useful that other websites want to share it with their audiences. A great linkable asset can earn links for years. Focus on topics where you have unique expertise or data that competitors can''t easily replicate.'
WHERE title = 'Create a linkable asset (guide, tool, or resource)';

-- Task: Create detailed author bios for content creators
UPDATE wm_library_tasks
SET description = 'Google''s quality guidelines emphasize E-E-A-T: Experience, Expertise, Authoritativeness, and Trust. Author bios directly address this by showing who creates your content and why they''re qualified. Create individual bio pages for anyone who writes content: include credentials, certifications, years of experience, areas of expertise, and relevant accomplishments. Add professional photos. Link to social profiles and other publications. Link author bios from every piece of content they create. For AI visibility, clear author credentials help establish your content as trustworthy and authoritative.'
WHERE title = 'Create detailed author bios for content creators';

-- Task: Reduce bounce rate on key landing pages
UPDATE wm_library_tasks
SET description = 'Bounce rate measures visitors who leave without interacting - high bounce rates signal that your page didn''t meet visitor expectations. For landing pages, this often means slow load times, mismatched content (they searched for X but found Y), poor design, or unclear value proposition. Improvements: ensure your headline immediately matches search intent, add a compelling above-the-fold value proposition, speed up page load times, use engaging visuals instead of walls of text, and include clear next steps. Check mobile specifically - bounce rates are often higher on mobile due to UX issues.'
WHERE title = 'Reduce bounce rate on key landing pages';

-- Task: Improve mobile user experience
UPDATE wm_library_tasks
SET description = 'Google uses mobile-first indexing, meaning they primarily evaluate your mobile site for rankings. Over 60% of searches happen on mobile devices. Test your site on actual phones, not just browser simulators. Check that: text is readable without zooming (16px minimum), buttons are easily tappable (44x44 pixels minimum), forms are simple to complete on mobile, content doesn''t require horizontal scrolling, pop-ups don''t block content, and click-to-call is enabled for phone numbers. Mobile page speed is especially critical - mobile users are often on slower connections and have less patience.'
WHERE title = 'Improve mobile user experience';
