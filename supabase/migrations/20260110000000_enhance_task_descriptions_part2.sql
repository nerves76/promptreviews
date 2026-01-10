-- Enhance remaining task descriptions with comprehensive educational content - Part 2

-- Task: Optimize service page URLs and structure
UPDATE wm_library_tasks
SET description = 'URL structure matters more than many realize. Clean, descriptive URLs help both users and search engines understand page content before clicking. Best practices: use format like yoursite.com/services/kitchen-remodeling (not /page?id=123), keep URLs short and readable, use hyphens between words (not underscores), include your target keyword, avoid dates or numbers that make content seem outdated, and use lowercase letters only. Your URL hierarchy should reflect your site structure - /services/plumbing/drain-cleaning tells Google this is a drain cleaning page within plumbing services. Never change URLs without setting up 301 redirects.'
WHERE title = 'Optimize service page URLs and structure';

-- Task: Add local service schema markup
UPDATE wm_library_tasks
SET description = 'Schema markup is structured data that helps search engines understand your content precisely. For local service businesses, LocalBusiness schema tells Google exactly what you do and where. Include: business name, address, phone, hours, geo coordinates, service area, price range, and payment methods accepted. Add Service schema for each service offered. Use Google''s Structured Data Markup Helper to generate code, then test with Rich Results Test. While schema isn''t a direct ranking factor, it enables rich results (enhanced listings) that improve click-through rates and helps Google match your business to relevant local searches.'
WHERE title = 'Add local service schema markup';

-- Task: Create location-specific content for your service area
UPDATE wm_library_tasks
SET description = 'Location pages help you rank for "[service] in [city]" searches - high-intent queries from people ready to hire. But Google can detect thin, duplicate location pages (just swapping city names). Each page needs genuinely unique, locally-relevant content: mention specific neighborhoods, local landmarks, area-specific challenges (climate, building codes, common home styles), local testimonials, and your experience serving that area. Include a Google Map embed, local phone number if you have one, and specific service details for that location. Quality location pages can rank for dozens of local keyword variations.'
WHERE title = 'Create location-specific content for your service area';

-- Task: Answer common customer questions as blog posts
UPDATE wm_library_tasks
SET description = 'Your customers'' questions are SEO gold - they''re literally telling you what to write about. Questions like "How much does X cost?" or "How long does Y take?" get searched constantly. Mine your emails, phone calls, sales conversations, and reviews for recurring questions. Write thorough answers (500+ words) that genuinely help - not thin content designed just to rank. Group related questions into comprehensive posts. This content targets long-tail keywords naturally, can appear in Google''s "People Also Ask" feature, and demonstrates expertise to potential customers researching their options.'
WHERE title = 'Answer common customer questions as blog posts';

-- Task: Build a content hub around your main service
UPDATE wm_library_tasks
SET description = 'A content hub (or topic cluster) establishes topical authority by covering a subject comprehensively. Structure: one "pillar" page covering your main topic broadly, surrounded by "cluster" pages diving deep into subtopics. All cluster pages link to the pillar; the pillar links to all clusters; clusters interlink where relevant. Example: pillar page on "Kitchen Remodeling" with clusters on cabinets, countertops, flooring, lighting, costs, timeline, etc. This structure signals expertise to Google, keeps visitors engaged across multiple pages, and creates natural internal linking. Expand your hub over time as you publish more related content.'
WHERE title = 'Build a content hub around your main service';

-- Task: Optimize meta descriptions for click motivation
UPDATE wm_library_tasks
SET description = 'Most meta descriptions are boring summaries that don''t motivate clicks. Treat yours as advertisements. Focus on benefits over features - not "We offer plumbing services" but "Fast, reliable plumbing that won''t break the bank." Include your unique value proposition: what makes you different? Add urgency when appropriate ("Limited spots available," "Same-day service"). Match the search intent - transactional searches want solutions, informational searches want answers. End with an implied call-to-action. Test different approaches on your highest-impression pages and monitor CTR changes in Search Console.'
WHERE title = 'Optimize meta descriptions for click motivation';

-- Task: Build brand recognition for improved CTR
UPDATE wm_library_tasks
SET description = 'People click on brands they recognize in search results. Google''s leaked documents confirm branded searches are a quality signal - when people search for you by name, it indicates trust. Building brand recognition takes time but compounds: maintain consistent branding across all platforms, encourage happy customers to recommend you by name, engage genuinely on social media, participate in local community events and sponsorships, and get mentioned in local press. When someone sees your business in search results and thinks "Oh, I''ve heard of them," they''re much more likely to click than on an unknown competitor.'
WHERE title = 'Build brand recognition for improved CTR';

-- Task: Optimize for featured snippets on question queries
UPDATE wm_library_tasks
SET description = 'Featured snippets appear above the #1 organic result - "position zero." They''re pulled from pages that clearly and concisely answer specific questions. To optimize: identify question keywords you rank for (positions 2-10 are ideal candidates), add the exact question as an H2 or H3 heading, follow immediately with a clear, concise answer (40-60 words for paragraph snippets), then expand with supporting details. Use lists or tables for "how to" or comparison queries. Format matters: numbered lists for processes, bullet points for features, tables for comparisons. Monitor Search Console to track snippet wins.'
WHERE title = 'Optimize for featured snippets on question queries';

-- Task: Add review stars to your search listings
UPDATE wm_library_tasks
SET description = 'Star ratings in search results catch the eye and dramatically increase click-through rates - studies show 20-30% improvement. To display stars, implement aggregate rating schema markup on pages where you showcase reviews. Include: rating value (e.g., 4.8), rating count (number of reviews), and best/worst rating scale. Only use this markup for genuine customer reviews displayed on the page - Google prohibits self-serving or fake review markup. Test your implementation with Google''s Rich Results Test. Note that Google doesn''t guarantee star display, but proper implementation makes you eligible.'
WHERE title = 'Add review stars to your search listings';

-- Task: Find and fix broken links
UPDATE wm_library_tasks
SET description = 'Broken links (404 errors) frustrate users and waste Google''s crawl budget on dead ends. Internal broken links prevent link equity from flowing to important pages. External broken links make your site look unmaintained. Use a crawler tool (Screaming Frog, Sitebulb) or check Search Console for crawl errors. For broken internal links: either fix the link URL, redirect the missing page, or remove the link. For broken external links: update to working URLs or remove. Set up a custom 404 page with navigation to help users who land on missing pages find what they need.'
WHERE title = 'Find and fix broken links';

-- Task: Ensure your site is mobile-friendly
UPDATE wm_library_tasks
SET description = 'Google uses mobile-first indexing - they primarily crawl and evaluate your mobile site for rankings. Over 60% of searches are mobile. Test at search.google.com/test/mobile-friendly and on actual devices. Common issues: text too small to read (minimum 16px), links too close together to tap accurately, content wider than screen requiring horizontal scroll, slow mobile load times, and intrusive pop-ups covering content. Mobile users have different needs - they want quick answers and easy contact options. Click-to-call phone numbers and simplified navigation are essential. What works on desktop may fail on mobile.'
WHERE title = 'Ensure your site is mobile-friendly';

-- Task: Set up and fix redirect chains
UPDATE wm_library_tasks
SET description = 'Redirect chains occur when one URL redirects to another, which redirects to another (A→B→C). Each hop slows page load and dilutes link equity. Google follows up to 10 redirects but prefers direct paths. Common causes: multiple site migrations, changed URL structures, or http-to-https plus www-to-non-www redirects stacking. Fix by updating redirects to point directly to final destinations (A→C). Also check for redirect loops (A→B→A) which completely break pages. Update internal links to point directly to final URLs rather than relying on redirects. Use 301 (permanent) redirects, not 302 (temporary), to pass full link equity.'
WHERE title = 'Set up and fix redirect chains';

-- Task: Add HTTPS and fix mixed content
UPDATE wm_library_tasks
SET description = 'HTTPS is a confirmed ranking factor and essential for user trust. Browsers prominently warn visitors about insecure sites, especially on pages with forms. Most hosts offer free SSL certificates via Let''s Encrypt. After enabling HTTPS: set up redirects from HTTP to HTTPS versions of all pages, update all internal links to use HTTPS, fix "mixed content" warnings (when HTTPS pages load HTTP resources like images or scripts), update your sitemap and canonical tags, and update external profiles/directories with new URLs. Check for mixed content warnings in browser developer console and fix any HTTP resource references.'
WHERE title = 'Add HTTPS and fix mixed content';

-- Task: Create and optimize XML sitemap
UPDATE wm_library_tasks
SET description = 'An XML sitemap is a file listing all pages you want Google to index - it''s a roadmap for search engines. Most CMS platforms generate these automatically, but they often include pages that shouldn''t be indexed. Optimize by: including only valuable, indexable pages (not thank-you pages, login pages, or duplicate content), organizing large sites with multiple sitemaps, keeping file size under 50MB and 50,000 URLs per sitemap, and updating automatically when content changes. Submit to Google via Search Console. While Google can find pages through crawling, sitemaps ensure nothing important is missed and help prioritize crawling.'
WHERE title = 'Create and optimize XML sitemap';

-- Task: Fix duplicate content issues
UPDATE wm_library_tasks
SET description = 'Duplicate content confuses Google about which version to rank, diluting your ranking potential across multiple URLs. Common causes: www vs non-www versions, HTTP vs HTTPS, trailing slashes, URL parameters, printer-friendly pages, and thin location pages with only city names swapped. Solutions: use canonical tags to specify preferred versions, set up redirects for duplicate URLs, consolidate thin pages into comprehensive ones, use parameter handling in Search Console, and ensure consistent internal linking to preferred URLs. Check for duplicates by searching your content in quotes - if multiple pages from your site appear, you have duplication.'
WHERE title = 'Fix duplicate content issues';

-- Task: Create location pages for each service area
UPDATE wm_library_tasks
SET description = 'Location pages help you rank for "[service] + [location]" searches across your service area. Each page needs substantial unique content - Google penalizes doorway pages that just swap city names. Include: genuinely unique content about serving that area (300+ words), local testimonials from customers in that area, relevant local information (neighborhoods served, local landmarks, area-specific considerations), local phone number if available, Google Map embed centered on that area, and service-specific content relevant to local needs. Create pages for primary cities first, then expand to neighborhoods or surrounding areas as you build content.'
WHERE title = 'Create location pages for each service area';

-- Task: Get listed in industry-specific directories
UPDATE wm_library_tasks
SET description = 'Industry directories carry more weight than general business directories because they''re topically relevant. A plumbing directory linking to a plumber signals relevance to Google. Search for "[your industry] directory," "[your industry] association," and "[your industry] certification" to find opportunities. Most professional associations have member directories. Industry-specific review sites (Houzz for home services, Avvo for lawyers, Healthgrades for doctors) provide authoritative citations. Ensure consistent NAP information across all listings. These directories often have high domain authority, making their links valuable, and they drive referral traffic from people specifically looking for your type of service.'
WHERE title = 'Get listed in industry-specific directories';

-- Task: Add local schema markup
UPDATE wm_library_tasks
SET description = 'Local schema markup helps Google understand your business information precisely and consistently. Implement LocalBusiness schema (or a more specific subtype like Plumber, Electrician, or Restaurant) on your homepage and contact page. Include: business name (exactly as on Google Business Profile), full address with postal code, phone number, business hours (including special hours), geo coordinates, service area, accepted payment methods, and price range. This structured data reinforces your NAP consistency and helps Google confidently display your information. Test implementation with Google''s Rich Results Test and Schema Markup Validator.'
WHERE title = 'Add local schema markup';

-- Task: Build local links from community involvement
UPDATE wm_library_tasks
SET description = 'Local links from community organizations, news sites, and local businesses are incredibly valuable for local SEO - they''re relevant, authoritative, and hard for competitors to replicate. Opportunities: sponsor local sports teams, charity events, or school programs (usually includes a website link); join local business associations and chambers of commerce with member directories; participate in community events that get local press coverage; partner with complementary local businesses for mutual referrals; offer expertise for local news stories. These relationships also drive genuine referral business. Focus on authentic community involvement, not just link acquisition.'
WHERE title = 'Build local links from community involvement';

-- Task: Implement comprehensive structured data
UPDATE wm_library_tasks
SET description = 'Comprehensive schema markup helps search engines and AI assistants understand every aspect of your business. Layer multiple schema types: Organization schema for company-wide information, LocalBusiness for location details, Service schema for each service offered, FAQPage for Q&A content, HowTo for process content, and Review schema for testimonials. Use JSON-LD format (recommended by Google) in your page''s head section. This machine-readable data enables rich search results and helps AI accurately describe your business, services, and expertise. Test each implementation individually using Google''s Rich Results Test before deploying.'
WHERE title = 'Implement comprehensive structured data';

-- Task: Establish social proof and credentials
UPDATE wm_library_tasks
SET description = 'AI assistants evaluate trustworthiness using signals across the web. Third-party validation carries more weight than self-promotion. Display prominently: industry certifications and licenses, professional association memberships, insurance and bonding, Better Business Bureau rating, manufacturer authorizations or partnerships, years in business, and awards or recognition. Encourage reviews on multiple platforms (not just Google) to create a broad trust footprint. Get listed in credential verification databases when available. The more independent sources that validate your legitimacy and expertise, the more confident AI becomes in recommending you.'
WHERE title = 'Establish social proof and credentials';

-- Task: Create comprehensive FAQ content
UPDATE wm_library_tasks
SET description = 'AI assistants frequently answer specific questions about services. If your website comprehensively answers these questions, AI can draw from your content when responding. Think about what someone might ask ChatGPT about your type of service: "How much does X cost?" "How do I choose a Y?" "What should I expect from Z?" Create thorough FAQ content covering 20+ questions organized by category. Use natural, conversational language. Include questions at various stages of the customer journey - from early research to ready-to-buy. This content also targets long-tail search queries and can trigger FAQ rich results.'
WHERE title = 'Create comprehensive FAQ content';

-- Task: Ensure consistent business information everywhere
UPDATE wm_library_tasks
SET description = 'AI models cross-reference information from multiple sources to determine accuracy. Inconsistencies create uncertainty about what''s true. Create a master document with your exact business information: legal business name, address (formatted consistently), phone number, hours, and service descriptions. Audit all online presence for consistency: website, Google Business Profile, all directory listings, social profiles, and anywhere else you appear. Even small differences (Street vs St., Suite vs Ste.) can cause issues. When information matches everywhere, both search engines and AI have high confidence in the facts they present about your business.'
WHERE title = 'Ensure consistent business information everywhere';

-- Task: Answer questions on Quora related to your expertise
UPDATE wm_library_tasks
SET description = 'Quora answers rank in Google search results and are included in AI training data. Thoughtful, expert answers establish you as an authority and create persistent visibility. Create a profile highlighting your professional credentials. Follow topics in your industry. Answer questions thoroughly - not one-liners, but genuinely helpful responses with specific details and examples from your experience. You can include links to your detailed content when genuinely relevant (not every answer). Well-written answers continue driving traffic and influencing AI recommendations for years. Focus on being helpful rather than promotional.'
WHERE title = 'Answer questions on Quora related to your expertise';

-- Task: Contribute to Wikipedia (carefully and appropriately)
UPDATE wm_library_tasks
SET description = 'Wikipedia is a primary knowledge source for AI models, but contributing requires understanding its strict guidelines. Never create or edit articles about your own business - this is a conflict of interest violation. Instead, contribute to industry-related articles where you have genuine expertise: add well-sourced factual information, improve article quality, or fix errors. All claims must be cited from reliable sources. If your business has received significant press coverage or awards, that information may be Wikipedia-worthy - but let neutral editors add it. The goal is establishing expertise in your field, not self-promotion.'
WHERE title = 'Contribute to Wikipedia (carefully and appropriately)';

-- Task: Get mentioned in industry publications and trade media
UPDATE wm_library_tasks
SET description = 'Industry publications are authoritative sources that AI models trust. Being mentioned positions you as a recognized expert. Strategies: pitch story ideas based on unique data or insights you have; offer to be quoted as an expert source on industry topics; submit articles to publications with contributor programs; issue press releases for genuinely newsworthy company developments; build relationships with journalists covering your industry. These mentions persist in AI training data and influence recommendations for years. Start with niche industry publications (easier to get into) before targeting major outlets.'
WHERE title = 'Get mentioned in industry publications and trade media';

-- Task: Appear on podcasts in your industry
UPDATE wm_library_tasks
SET description = 'Podcast appearances generate multiple visibility benefits: the audio content itself, show notes with your bio and links, social media promotion by the host, and often a blog post recap. These diverse mentions across platforms strengthen your digital footprint. Podcast transcripts are increasingly indexed by search engines and included in AI training. Find podcasts your target customers listen to, study their format and typical guests, then pitch yourself with 3-5 specific topics you could discuss. Prepare talking points that include your expertise and business naturally. Even small podcasts in your niche can drive qualified leads.'
WHERE title = 'Appear on podcasts in your industry';

-- Task: Create original research or statistics others will cite
UPDATE wm_library_tasks
SET description = 'Original data is the ultimate link and mention magnet. When you''re the source of a statistic, everyone who cites it mentions your company. "According to [Your Company], 73% of homeowners..." becomes part of how AI understands your industry. What data do you have access to? Customer survey results, pricing trends, project timelines, common problems encountered, industry changes you''ve observed. Package findings into a professional report or infographic. Promote to journalists and bloggers who cover your industry. Annual studies that you update each year become anticipated resources that earn links year after year.'
WHERE title = 'Create original research or statistics others will cite';

-- Task: Maintain active, helpful social media presence
UPDATE wm_library_tasks
SET description = 'Social media profiles create additional touchpoints for AI to understand your business. Consistent, active profiles with helpful content reinforce your authority and expertise. Choose 2-3 platforms where your customers are active (LinkedIn for B2B, Facebook and Instagram for local consumer businesses). Post helpful content regularly - tips, insights, behind-the-scenes, and answers to common questions - not just promotions. Engage genuinely with followers and industry conversations. Cross-reference your website and other profiles. LinkedIn is particularly indexed by search engines and referenced by AI. Inactive profiles can hurt credibility; active ones build it.'
WHERE title = 'Maintain active, helpful social media presence';

-- Task: Get customer testimonials mentioning your business by name
UPDATE wm_library_tasks
SET description = 'When happy customers write about their experience and mention your business name, this creates positive associations across the web. AI models learn from these patterns - multiple mentions of "[Business Name] provided excellent [service]" trains AI to associate your brand with quality. Ask satisfied customers for detailed testimonials that specifically name your business. Encourage reviews on multiple platforms (Google, Yelp, industry-specific sites). Feature testimonials prominently on your website with the customer''s name and location. The more diverse sources that contain positive mentions of your business name, the stronger your AI visibility becomes.'
WHERE title = 'Get customer testimonials mentioning your business by name';

-- Task: Write case studies with client names and results
UPDATE wm_library_tasks
SET description = 'Case studies with real names and measurable results are highly credible content that AI and humans trust. Structure: describe the client''s challenge, your approach/solution, and specific results achieved (with numbers when possible - "increased efficiency by 34%," "completed 2 weeks ahead of schedule"). Include direct quotes from the client. Get permission to use company/client names - named case studies are far more credible than anonymous ones. Publish on your website and share through marketing channels. Case studies demonstrate expertise through documented success, which is exactly what AI looks for when determining who to recommend.'
WHERE title = 'Write case studies with client names and results';

-- Task: Claim and optimize your LinkedIn company page
UPDATE wm_library_tasks
SET description = 'LinkedIn is treated as an authoritative business information source by both search engines and AI models. A complete, active company page reinforces your business information and expertise. Complete all sections: detailed "About" description with relevant keywords, specialties, locations, company size, and founding date. Add your services with descriptions. Post updates regularly (2-4 per week) - industry insights, company news, helpful tips. Encourage employees to list your company as their employer and engage with company posts. For B2B businesses especially, LinkedIn presence directly influences credibility assessments.'
WHERE title = 'Claim and optimize your LinkedIn company page';

-- Task: Create a strong "About Us" narrative
UPDATE wm_library_tasks
SET description = 'Your About page is often what AI references when describing your company. A clear, detailed narrative helps AI accurately represent your business. Include: your founding story and mission, what makes your approach unique, credentials and experience of leadership/team, notable clients or projects, awards and recognition, and community involvement. Be specific - vague corporate speak doesn''t help AI understand what distinguishes you. Write in a natural, authentic voice that reflects your brand personality. This page should be comprehensive enough for AI to understand who you are, what you do, why you''re qualified, and what makes you different from competitors.'
WHERE title = 'Create a strong "About Us" narrative';

-- Task: Weekly review monitoring and response
UPDATE wm_library_tasks
SET description = 'Reviews influence both local rankings and conversion rates, requiring consistent attention. Check all review platforms weekly: Google, Yelp, Facebook, and industry-specific sites. Respond to every review within 24-48 hours - speed matters for both customer satisfaction and showing Google you''re engaged. Thank positive reviewers specifically for what they mentioned. For negative reviews: apologize for their experience, take responsibility, offer to resolve the issue offline, and remain professional - your response is for future customers watching how you handle problems. Track trends in review velocity, rating averages, and common themes in feedback.'
WHERE title = 'Weekly review monitoring and response';

-- Task: Monthly competitor check
UPDATE wm_library_tasks
SET description = 'SEO is relative - you rank compared to competitors. If they improve while you stay static, you lose ground. Monthly competitive analysis keeps you informed and ahead. Track: their rankings for your target keywords, new content they''ve published, changes to their website or services, their review volume and ratings, new backlinks they''ve earned, and their Google Business Profile activity. Identify gaps you could fill - topics they haven''t covered, keywords they''re missing. Learn from their successes and failures. This intelligence helps you prioritize your own SEO efforts and stay competitive in your market.'
WHERE title = 'Monthly competitor check';

-- Task: Annual technical SEO audit
UPDATE wm_library_tasks
SET description = 'Technical issues accumulate over time as you add content, install plugins, and make changes. An annual comprehensive audit catches problems before they significantly impact rankings. Audit checklist: run a full site crawl for errors (broken links, redirect chains, duplicate content), test Core Web Vitals and page speed, verify mobile responsiveness across devices, check robots.txt and XML sitemap accuracy, review crawl stats in Search Console, audit schema markup implementation, verify HTTPS across all pages and resources, and check for security issues. Create a prioritized fix list and address critical issues first. Consider professional help for complex technical problems.'
WHERE title = 'Annual technical SEO audit';

-- Task: Monthly Google Business updates
UPDATE wm_library_tasks
SET description = 'Regular GBP activity signals an engaged, active business to Google''s local algorithm. Monthly maintenance: create 2-4 Google Business posts (updates, offers, events, tips) with images and links; upload new photos showcasing recent work, seasonal offerings, or team activities; update any changed information (hours, services, contact info); review and respond to any new Q&A entries; check for and respond to any new reviews; and update special hours for upcoming holidays. This consistent activity takes minimal time but keeps your profile fresh and favored by the local algorithm. Stale profiles suggest inactive businesses.'
WHERE title = 'Monthly Google Business updates';

-- Task: Quarterly backlink profile review
UPDATE wm_library_tasks
SET description = 'Your backlink profile directly impacts rankings, making regular monitoring essential. Quarterly review: identify new backlinks acquired and assess their quality, check for toxic or spammy links that could trigger penalties (consider disavowing if concerning), analyze which content or tactics earned links to replicate success, look for broken backlinks pointing to moved/deleted pages (reclaim this equity with redirects), and research competitor backlinks for opportunities. Tools like Ahrefs, Moz, or Semrush make this analysis manageable. A healthy, growing backlink profile from relevant, authoritative sites is one of the strongest ranking factors.'
WHERE title = 'Quarterly backlink profile review';

-- Task: Semi-annual AI visibility check
UPDATE wm_library_tasks
SET description = 'AI assistants are becoming a significant source of business recommendations. Understanding how AI perceives your business helps you optimize for this growing channel. Every 6 months, test: ask ChatGPT, Claude, and other AI assistants about businesses in your category and location; ask for recommendations and see if you''re mentioned; check what information AI provides about your business specifically and verify accuracy; compare your mentions to competitors. If AI has incorrect information, your web presence needs updating. If you''re not mentioned when you should be, focus on building mentions across authoritative sources. Track progress over time.'
WHERE title = 'Semi-annual AI visibility check';

-- Task: Pursue guest posting on industry blogs
UPDATE wm_library_tasks
SET description = 'Guest posting builds relationships, earns contextual backlinks from relevant sites, and exposes your expertise to new audiences. Find opportunities: search "[your industry] + write for us" or "guest post guidelines," identify blogs your target customers read, and research publications in your niche. Pitch unique, valuable topics - not promotional content. Write genuinely helpful articles you''d be proud to have on your own site. Include a natural author bio with a link to your site. Focus on quality over quantity - one link from a respected industry publication beats ten from low-quality blogs. Build ongoing relationships with editors for repeat opportunities.'
WHERE title = 'Pursue guest posting on industry blogs';

-- Task: Reclaim unlinked brand mentions
UPDATE wm_library_tasks
SET description = 'Unlinked brand mentions are low-hanging fruit for link building. Someone thought enough of your business to mention it - they just forgot to link. Search Google for your business name (in quotes, excluding your own site) and variations. Look for mentions in articles, blog posts, directories, and news coverage that don''t include links. Reach out politely: thank them for the mention and kindly ask if they could add a link for their readers'' convenience. Provide the specific URL to link to. Success rates are high because you''re not asking for new coverage, just a small addition to existing content. Monitor for new mentions monthly using Google Alerts.'
WHERE title = 'Reclaim unlinked brand mentions';

-- Task: Build relationships with local journalists and bloggers
UPDATE wm_library_tasks
SET description = 'Local media coverage provides highly valuable, geographically-relevant links and exposure. Journalists need expert sources for stories - position yourself as available and knowledgeable. Identify local reporters covering your industry, business news, or home/lifestyle topics. Follow them on social media and engage genuinely with their work. Introduce yourself as a resource for future stories in your area of expertise. Respond quickly when they need quotes - journalists work on tight deadlines. Share their work and build genuine relationships over time. When story opportunities arise, you''ll be their go-to source, earning mentions and links in local publications.'
WHERE title = 'Build relationships with local journalists and bloggers';

-- Task: Use HARO or similar services for media mentions
UPDATE wm_library_tasks
SET description = 'HARO (Help A Reporter Out) and similar services connect you directly with journalists seeking expert sources. Sign up and set alerts for your industry keywords. When relevant queries appear, respond quickly (within hours - journalists have deadlines) with concise, quotable answers that include your credentials. Be genuinely helpful, not promotional. A good quote can land you in major publications with authoritative backlinks. Success requires consistency - respond to relevant queries regularly. Even smaller publications provide valuable links. Over time, media mentions compound, building your authority and visibility across the web.'
WHERE title = 'Use HARO or similar services for media mentions';

-- Task: Fix broken links pointing to your site
UPDATE wm_library_tasks
SET description = 'When external sites link to pages you''ve deleted or moved, you lose that valuable link equity entirely. This is wasted authority you''ve already earned. Check Search Console for 404 pages receiving external traffic, or use backlink tools to find links pointing to non-existent pages. For each broken backlink: set up a 301 redirect to the most relevant current page (preserves link equity), or recreate the content if it was valuable enough to earn links, or contact the linking site to request an updated URL (more effort, but sometimes worthwhile for high-value links). Regular monitoring prevents link equity loss from site changes.'
WHERE title = 'Fix broken links pointing to your site';

-- Task: Get listed on industry resource pages
UPDATE wm_library_tasks
SET description = 'Resource pages curate helpful links for specific topics or industries. Getting listed provides contextual, relevant backlinks from pages designed to help visitors find services like yours. Search for "[your industry] resources," "recommended [service type]," or "best [your service] companies." Evaluate if your business genuinely belongs (only pursue relevant opportunities). Reach out with a personalized request explaining what value you provide and why you''d be a good addition. Suggest where you''d fit on the page. These are often easier to earn than editorial links because resource pages exist specifically to list quality businesses in your space.'
WHERE title = 'Get listed on industry resource pages';

-- Task: Create local partnerships for mutual linking
UPDATE wm_library_tasks
SET description = 'Partnering with complementary local businesses creates natural linking opportunities that benefit both parties. Identify non-competing businesses serving your same customers: a wedding photographer might partner with florists, caterers, and venues; a dentist might partner with orthodontists and oral surgeons. Create a "Partners" or "Recommended Services" page linking to each other. Make the relationships genuine - actually refer customers when appropriate. These reciprocal links, when between truly complementary businesses, aren''t penalized because they reflect real business relationships. This also opens opportunities for co-marketing, referrals, and community presence.'
WHERE title = 'Create local partnerships for mutual linking';

-- Task: Optimize your contact forms for conversions
UPDATE wm_library_tasks
SET description = 'Every unnecessary form field reduces completion rates by approximately 10%. Most contact forms ask for too much information upfront. Essentials only: name, email or phone, and a message field - you can collect additional details after initial contact. Use clear, descriptive field labels. Replace generic "Submit" buttons with action-oriented text: "Get My Free Quote," "Schedule My Consultation," "Send Message." Include a brief privacy assurance near the form ("We never share your information"). Test forms on mobile devices - many forms that work on desktop are frustrating on phones. Consider adding form abandonment tracking to identify friction points.'
WHERE title = 'Optimize your contact forms for conversions';

-- Task: Add social proof near conversion points
UPDATE wm_library_tasks
SET description = 'Social proof is most powerful at the moment of decision - when visitors are considering whether to contact you or make a purchase. Place strategically: testimonials near CTAs and contact forms, star ratings visible on service pages, customer counts or logos near pricing, and trust badges near form submissions. Real-time proof like "12 people requested quotes today" creates urgency. Use specific testimonials relevant to each page - a testimonial about kitchen remodeling on your kitchen remodeling page is more persuasive than generic praise. Make social proof visual when possible - photos of happy customers, screenshots of reviews, recognizable certification badges.'
WHERE title = 'Add social proof near conversion points';

-- Task: Create dedicated landing pages for key services
UPDATE wm_library_tasks
SET description = 'Generic pages try to serve everyone and often convert no one. Dedicated landing pages focus entirely on one service, one audience, or one offer - matching specific search intent precisely. Elements of effective landing pages: headline matching the search query, clear value proposition above the fold, benefits-focused content (not just features), social proof and trust signals, single clear call-to-action (don''t offer multiple options), minimal navigation distractions, and mobile optimization. Create landing pages for your highest-value services or for specific campaigns. These pages typically convert 2-5x better than general service pages because they speak directly to specific visitor needs.'
WHERE title = 'Create dedicated landing pages for key services';

-- Task: Add click-to-call and easy contact options
UPDATE wm_library_tasks
SET description = 'Mobile users want to act immediately - making them copy and paste a phone number loses leads. Click-to-call links (using tel: protocol) let mobile visitors call with one tap. Implementation: make phone numbers clickable links, add a sticky header or floating button with phone/contact options that stays visible while scrolling, consider adding SMS/text as a contact option for customers who prefer it, and include a one-tap Google Maps link for directions. Multiple contact options accommodate different preferences. Test on actual mobile devices to ensure tap targets are large enough (44x44 pixels minimum) and easy to access while scrolling.'
WHERE title = 'Add click-to-call and easy contact options';

-- Task: Create a GBP posts calendar
UPDATE wm_library_tasks
SET description = 'Google Business posts appear on your profile and can show in local search results, keeping your business visible and demonstrating activity to Google''s algorithm. Plan content in advance: promotional posts for offers and specials, update posts for news and announcements, event posts for workshops or open houses, and product posts highlighting specific offerings. Each post should include an engaging image (1200x900 pixels ideal), compelling text, and a call-to-action button with link. Posts expire after 7 days (events after the event date), so maintain a regular publishing schedule. Aim for 2-4 posts per week during busy periods, minimum weekly otherwise.'
WHERE title = 'Create a Google Business posts calendar';

-- Task: Optimize your GBP Q&A section
UPDATE wm_library_tasks
SET description = 'The Questions & Answers section on your Google Business Profile is often neglected but highly visible to potential customers. You can (and should) seed it with your own questions - ask and answer your most common customer questions yourself. This ensures accurate information appears rather than incorrect answers from random users. Monitor weekly for new questions from actual customers and answer promptly. Upvote the most helpful Q&As to keep them prominent. Report spam or inappropriate content. AI assistants may also reference Q&A content when answering questions about businesses, making this another visibility opportunity.'
WHERE title = 'Optimize your GBP Q&A section';

-- Task: Add all products and services to GBP
UPDATE wm_library_tasks
SET description = 'Google Business Profile''s Products and Services sections give Google detailed information about exactly what you offer, helping match your profile to specific searches. Many competitors skip these sections entirely, giving you an advantage. Add every service you offer with: a clear title, detailed description (use relevant keywords naturally), and pricing or price range when possible. If you sell products, add them with photos, descriptions, and prices. Organize into logical categories. Keep this updated as your offerings change. Complete service listings also help potential customers understand your full capabilities without visiting your website.'
WHERE title = 'Add all products and services to GBP';

-- Task: Optimize GBP photos strategically
UPDATE wm_library_tasks
SET description = 'Businesses with photos receive 42% more requests for directions and 35% more website clicks than those without. Google also uses photos to understand your business. Strategic photo categories: logo and cover photo (brand recognition), exterior shots (helps customers find you), interior photos (shows atmosphere and professionalism), team photos (builds personal connection), and work samples/portfolio (demonstrates quality). Add new photos monthly to show you''re active. Use high-quality images - poor photos hurt credibility. While customer photos are valuable social proof, maintain control of your visual narrative by ensuring your uploaded photos are the most prominent and professional.'
WHERE title = 'Optimize GBP photos strategically';

-- Task: Complete all GBP attributes and features
UPDATE wm_library_tasks
SET description = 'GBP attributes are specific features and characteristics that help Google match you to relevant searches. Someone searching "wheelchair accessible restaurant" only sees results with that attribute. Many attributes are hidden in deeper settings - explore your profile thoroughly. Complete all "From the business" attributes for your category. Add accessibility information (wheelchair access, etc.). Set up online booking/appointment links if you use a scheduling system. Enable messaging only if you can respond promptly. Check for category-specific attributes (restaurant attributes differ from plumber attributes). Each completed attribute is a potential search match competitors miss if their profiles are incomplete.'
WHERE title = 'Complete all GBP attributes and features';

-- Task: Set up GBP messaging and response protocols
UPDATE wm_library_tasks
SET description = 'GBP messaging allows customers to contact you directly from your Business Profile. Google tracks response times and may show this metric to potential customers. Before enabling: ensure someone can respond promptly (within a few hours during business hours), set up automated welcome messages to manage expectations, create response templates for common questions, and establish clear team responsibility for monitoring and responding. If you enable messaging but respond slowly or inconsistently, it can hurt your profile''s performance and customer perception. Better to not offer messaging than to offer it poorly. Consider your capacity honestly before enabling.'
WHERE title = 'Set up GBP messaging and response protocols';

-- Task: Display credentials and qualifications prominently
UPDATE wm_library_tasks
SET description = 'Credentials provide objective proof of expertise that builds trust with both visitors and search engines (E-E-A-T). Don''t hide qualifications on a buried About page. Display prominently throughout your site: professional licenses and certifications on service pages, degrees and training on team bios, years of experience in page headers, and industry association memberships in your footer. Create dedicated pages for important certifications explaining what they mean and why they matter. For regulated industries, license numbers and verification links add extra credibility. Make credentials visual with badge images and certificate scans when available.'
WHERE title = 'Display credentials and qualifications prominently';

-- Task: Add comprehensive privacy and terms pages
UPDATE wm_library_tasks
SET description = 'Privacy and terms pages serve multiple purposes: legal compliance (GDPR, CCPA, etc.), trust signaling, and demonstrating legitimate business practices. At minimum: privacy policy explaining what data you collect, how it''s used, and how to opt out; terms of service for any transactions or account creation; accessibility statement if applicable. Link these pages from every page footer. Include last-updated dates and review annually. Many website users (especially B2B) check these pages before engaging. Missing or outdated policies suggest an unprofessional operation. Use a lawyer for custom policies or reputable generators for basic templates, but ensure they accurately reflect your practices.'
WHERE title = 'Add comprehensive privacy and terms pages';

-- Task: Showcase awards and recognition
UPDATE wm_library_tasks
SET description = 'Awards and recognition provide third-party validation more credible than self-praise. Display prominently: industry awards and competition wins, "Best of" recognition from local publications, association rankings or ratings, customer choice awards from review sites, manufacturer certifications or preferred status, and press features or media recognition. Create a dedicated awards page and also feature relevant awards on related service pages. Keep the display current - outdated awards (especially "Best of 2019" when it''s 2024) look neglected. Apply for awards you''re qualified for - many are surprisingly achievable and provide ongoing marketing value.'
WHERE title = 'Showcase awards and recognition';

-- Task: Add real contact information and location details
UPDATE wm_library_tasks
SET description = 'Transparent contact information signals legitimacy to both users and search engines. Hidden or minimal contact info is a spam signal. Include: complete physical address (not just city - full street address unless you have privacy concerns), local phone number (not just toll-free), multiple contact methods (phone, email, form), business hours, and physical location photos if applicable. Add a Google Maps embed on your contact page centered on your location. Even service-area businesses should have a clear base of operations. This transparency builds trust and satisfies Google''s quality guidelines which specifically mention contact information as a trust factor.'
WHERE title = 'Add real contact information and location details';

-- Task: Improve time on page with engaging content
UPDATE wm_library_tasks
SET description = 'Time on page indicates content quality and user engagement - metrics that influence rankings. To keep visitors reading: use short paragraphs (2-4 sentences max) with plenty of white space, add subheadings every 2-3 paragraphs for scannability, include images, videos, or infographics to break up text and illustrate points, use bullet points and numbered lists for easy consumption, add internal links to related content (keeps them on your site), and include interactive elements when relevant (calculators, quizzes). Write for how people actually read online - scanning first, then reading sections that interest them. Dense walls of text get abandoned.'
WHERE title = 'Improve time on page with engaging content';

-- Task: Create clear site navigation
UPDATE wm_library_tasks
SET description = 'Navigation directly impacts user experience and Google''s ability to crawl your site. Poor navigation frustrates users (increasing bounce rate) and can hide important pages from search engines. Best practices: limit main navigation to 5-7 items (too many options overwhelm), use clear descriptive labels (not clever or insider terms), organize pages hierarchically with logical groupings, ensure every important page is reachable within 3 clicks from homepage, add breadcrumbs for deep pages showing where users are in the site structure, and include a search function for larger sites. Test navigation with actual users unfamiliar with your site to identify confusion points.'
WHERE title = 'Create clear site navigation';

-- Task: Optimize above-the-fold content
UPDATE wm_library_tasks
SET description = 'What visitors see before scrolling determines whether they stay or bounce. Above-the-fold content must immediately communicate value and relevance. Include: headline that matches search intent (visitors should instantly confirm they''re in the right place), clear value proposition or benefit statement, relevant high-quality image or video, and a visible call-to-action or clear next step. Ensure this critical content loads quickly - it''s what visitors see while the rest loads. Test on mobile specifically - above-fold space is much smaller on phones. Avoid giant hero images that push all content below the fold. Every element above the fold should earn its space.'
WHERE title = 'Optimize above-the-fold content';

-- Task: Write "How to Choose" guides for your services
UPDATE wm_library_tasks
SET description = 'Decision-guide content captures people researching how to evaluate and select services like yours. "How to Choose a [Your Service]" content ranks for research queries and positions you as a helpful expert. Include: key criteria customers should consider, questions to ask potential providers, red flags and warning signs to avoid, realistic expectations for pricing and timeline, common mistakes people make, and a checklist or decision framework they can use. Be genuinely helpful - recommend what''s best for the customer even if it''s not always you. This builds trust that often converts to business because you proved your expertise by educating them.'
WHERE title = 'Write "How to Choose" guides for your services';

-- Task: Design a visual infographic for your industry
UPDATE wm_library_tasks
SET description = 'Infographics present complex information visually, making it more accessible and shareable. They''re proven link magnets - websites embed infographics and link back to the source. Choose topics with interesting data or processes: pricing trends, step-by-step guides, comparison charts, statistics compilations, or timelines. Include your subtle branding and website URL. Create an embed code so other sites can easily share with attribution. Promote to industry blogs, journalists, and social media. Infographics require upfront investment but can earn links and traffic for years. Update periodically if data changes to maintain accuracy and give reasons for re-sharing.'
WHERE title = 'Design a visual infographic for your industry';
