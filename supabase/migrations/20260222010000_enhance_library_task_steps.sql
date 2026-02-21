-- Enhance Work Manager Library Tasks with more actionable steps
-- and updated relevant_tools links (including Web Page Planner)
-- This migration updates instructions and relevant_tools for existing tasks.

-- ============================================================================
-- SEO STARTER PACK (sort_order 1-8) - More specific, actionable steps
-- ============================================================================

-- Task: Research your primary keywords (sort_order 1)
UPDATE wm_library_tasks SET instructions =
'1. Open the Keyword Research tool in Prompt Reviews and enter your main service (e.g., "roof repair")
2. Review the keyword suggestions and note search volume for each term
3. Open Google in an incognito window, type your service, and write down 5 autocomplete suggestions
4. Scroll through the first page of results and copy every "People also ask" question you see
5. Visit the top 3 competitor websites and note any service terms they use that you missed
6. Group your keywords by intent: informational ("how to fix a leak"), commercial ("roof repair cost"), and transactional ("roof repair near me")
7. Prioritize 5-10 keywords that match what your ideal customer would search
8. Add your top keywords to Rank Tracking in Prompt Reviews so you can monitor positions over time'
WHERE sort_order = 1;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]'
WHERE sort_order = 1;

-- Task: Write compelling title tags for your main pages (sort_order 2)
UPDATE wm_library_tasks SET instructions =
'1. Open a spreadsheet and list every main page on your site (homepage, service pages, about, contact)
2. For each page, write down the primary keyword it should target (use your keyword research)
3. Write a title tag under 60 characters with the keyword near the front, e.g., "Kitchen Remodeling in Portland | Your Brand"
4. Add your brand name after a separator (| or -) at the end of each title
5. Make each title unique - no two pages should share a title
6. Add a power word or benefit where it fits naturally (e.g., "Affordable", "Trusted", "24/7")
7. Check your current titles using Rank Tracking in Prompt Reviews to see how they appear in search
8. Update the title tags in your website CMS or HTML <title> element for each page
9. After 2-4 weeks, check Rank Tracking to see if click-through rate improved'
WHERE sort_order = 2;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 2;

-- Task: Write meta descriptions that drive clicks (sort_order 3)
UPDATE wm_library_tasks SET instructions =
'1. Open a spreadsheet with all your main pages listed (match your title tag list)
2. For each page, write a meta description under 155 characters that answers "why should I click this?"
3. Include your target keyword naturally in the first sentence
4. Add a specific benefit or value proposition (e.g., "Free estimates" or "Same-day service")
5. End with a subtle call-to-action like "Get a free quote today" or "See our recent projects"
6. Make every description unique - duplicates get ignored by Google
7. Check Analytics in Prompt Reviews to identify pages with high impressions but low click-through rates
8. Update meta descriptions in your CMS or in the <meta name="description"> HTML tag
9. Monitor click-through rate changes in Analytics over the next month'
WHERE sort_order = 3;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 3;

-- Task: Set up proper heading structure (sort_order 4)
UPDATE wm_library_tasks SET instructions =
'1. Pick one important page on your site to start with (e.g., your top service page)
2. Open the page in your CMS editor and check the heading tags (H1, H2, H3)
3. Ensure there is exactly ONE H1 tag - this should be your main page title with the primary keyword
4. Break your content into logical sections and give each an H2 heading
5. Use H3s for subsections under each H2 (e.g., H2: "Our Process", H3: "Step 1: Assessment")
6. Include your target keyword naturally in at least one H2
7. Make headings descriptive and scannable - a visitor should understand your page by reading headings alone
8. Use the Domain Analysis tool in Prompt Reviews to check if your page structure has issues
9. Repeat for all main pages on your site, prioritizing service pages and your homepage'
WHERE sort_order = 4;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Domain Analysis", "route": "/dashboard/domain-analysis"}]'
WHERE sort_order = 4;

-- Task: Add internal links between related pages (sort_order 5)
UPDATE wm_library_tasks SET instructions =
'1. List all your pages in a spreadsheet: homepage, service pages, blog posts, location pages
2. For each page, identify 2-3 other pages on your site that are related
3. Open your highest-traffic page first and find natural spots in the text to add links
4. Use descriptive anchor text like "our kitchen remodeling services" instead of "click here"
5. Link every service page to at least one relevant blog post, and every blog post to a service page
6. Ensure every page on your site is reachable within 3 clicks from your homepage
7. Add a "Related services" or "You might also like" section at the bottom of blog posts
8. Use the Domain Analysis tool in Prompt Reviews to identify orphan pages with no internal links
9. Check Analytics in Prompt Reviews to see which pages could use more traffic funneled to them'
WHERE sort_order = 5;

-- Task: Optimize your images with alt text and compression (sort_order 6)
UPDATE wm_library_tasks SET instructions =
'1. List all images on your top 5 most important pages
2. Rename files descriptively before uploading (e.g., "kitchen-remodel-portland.jpg" not "IMG_1234.jpg")
3. Compress each image to under 200KB using a free tool like TinyPNG or Squoosh
4. Convert images to WebP format when your CMS supports it (30-50% smaller than JPEG)
5. Add descriptive alt text to every image that explains what the image shows
6. Include your target keyword in the alt text when it fits naturally (e.g., "completed kitchen remodel in Portland")
7. Set explicit width and height attributes on images to prevent layout shift
8. Use the Domain Analysis tool in Prompt Reviews to check your page speed score
9. Repeat for all pages, prioritizing pages that load slowly'
WHERE sort_order = 6;

-- Task: Claim and verify your Google Business Profile (sort_order 7)
UPDATE wm_library_tasks SET instructions =
'1. Go to business.google.com and sign in with your business Google account
2. Search for your business name - if it already exists, click "Claim this business"
3. If not found, click "Add your business to Google" and enter your business name
4. Choose the most specific business category available (e.g., "Plumber" not "Home Services")
5. Enter your complete street address, or select "I deliver goods and services to my customers" for service-area businesses
6. Add your phone number and website URL
7. Complete the verification process (postcard, phone call, or email depending on your business)
8. Once verified, connect your Google Business Profile in Prompt Reviews under the Google Business tool
9. Set a reminder to check back in 5-7 days if waiting for postcard verification'
WHERE sort_order = 7;

-- Task: Add your business to the main citation directories (sort_order 8)
UPDATE wm_library_tasks SET instructions =
'1. Open the Business Profile tool in Prompt Reviews and verify all your business details are correct
2. Copy your exact business name, address, and phone number (NAP) - these must be identical everywhere
3. Create or claim your profile on Yelp (yelp.com/biz) with your exact NAP
4. Create or claim your profile on Facebook Business (facebook.com/pages/create)
5. Submit your business to Apple Maps Connect (mapsconnect.apple.com)
6. Claim your Bing Places listing (bingplaces.com)
7. For each listing, upload your logo, add business hours, and write a complete description
8. Upload 5+ high-quality photos to each platform
9. Set a calendar reminder to check all listings quarterly for accuracy'
WHERE sort_order = 8;

-- ============================================================================
-- SERVICE PAGE GROWTH PACK (sort_order 10-15, 101-106) - Add Web Page Planner
-- ============================================================================

-- Task: Research keywords for each service you offer (sort_order 10)
UPDATE wm_library_tasks SET instructions =
'1. Write down every service you offer, including variations (e.g., "roof repair", "roof replacement", "emergency roof repair")
2. Open the Keyword Research tool in Prompt Reviews and search for each service
3. For each service, note the top 3-5 keyword variations by search volume
4. Check for long-tail keywords with commercial intent (e.g., "affordable roof repair near me")
5. Search each keyword in Google and note what types of pages rank (service pages, blog posts, directories)
6. Look at competitor service pages and note any terms they target that you missed
7. Group keywords by service so each service page has a primary keyword and 2-3 secondary keywords
8. Add your top service keywords to Rank Tracking in Prompt Reviews to monitor positions'
WHERE sort_order = 10;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]'
WHERE sort_order = 10;

-- Task: Create dedicated pages for each major service (sort_order 11)
UPDATE wm_library_tasks SET instructions =
'1. List every major service you offer that doesn''t already have its own dedicated page
2. Open the Web Page Planner in Prompt Reviews and create an outline for each service page
3. Use your keyword research to choose a primary keyword for each page
4. Structure each page with: H1 (service name), overview paragraph, process/how-it-works section, benefits, FAQ, CTA
5. Write at least 500 words of unique content per page - describe your specific approach, not generic information
6. Include practical details customers care about: typical timeline, price factors, what to expect
7. Set the URL structure to yoursite.com/services/service-name (or similar clean format)
8. Add the primary keyword in the URL, title tag, H1, and first paragraph
9. Include a clear call-to-action above the fold and at the bottom of the page
10. Add internal links from the new page to related blog posts and from existing pages to the new page'
WHERE sort_order = 11;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}]'
WHERE sort_order = 11;

-- Task: Add customer testimonials to service pages (sort_order 12)
UPDATE wm_library_tasks SET instructions =
'1. Open the Reviews tool in Prompt Reviews and identify your best reviews for each service
2. Select 2-3 testimonials per service page that mention specific outcomes or the service name
3. Set up a Prompt Page in Prompt Reviews to collect new service-specific testimonials from customers
4. Add testimonials near the call-to-action on each service page for maximum conversion impact
5. Include the customer''s first name and city (with their permission) to build trust
6. If you have before/after photos, add them alongside the relevant testimonial
7. Add Review schema markup (JSON-LD) to each service page with the aggregate rating
8. Keep testimonials fresh - aim to rotate in new ones every quarter'
WHERE sort_order = 12;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 12;

-- Task: Add FAQ sections to service pages (sort_order 13)
UPDATE wm_library_tasks SET instructions =
'1. For each service page, write down 5-10 questions customers actually ask you (check emails, calls, chat logs)
2. Open the Keyword Research tool in Prompt Reviews and search for question keywords related to each service
3. Write clear, helpful answers of 2-4 sentences each - be specific, not vague
4. Include pricing questions when possible (e.g., "How much does X typically cost?" with a range)
5. Add FAQ schema markup (JSON-LD) to make your answers eligible for rich results in Google
6. Place the FAQ section below your main content but above the footer
7. Link to related service pages or blog posts within your answers where relevant
8. Test your FAQ schema at search.google.com/test/rich-results to verify it works'
WHERE sort_order = 13;

-- Task: Optimize service page URLs and structure (sort_order 14)
UPDATE wm_library_tasks SET instructions =
'1. List all your current service page URLs in a spreadsheet
2. Check each URL follows the format: yoursite.com/services/service-name (short, descriptive, keyword-rich)
3. Replace underscores with hyphens and remove unnecessary words (a, the, and, etc.)
4. Ensure each URL contains your target keyword (e.g., /services/kitchen-remodeling)
5. Remove dates, numbers, or parameters from service URLs
6. If you need to change a URL, set up a 301 redirect from the old URL to the new one
7. Use the Domain Analysis tool in Prompt Reviews to check for any URL issues or redirect chains
8. Update all internal links to point to the new clean URLs directly (not through redirects)
9. Submit your updated sitemap in Google Search Console'
WHERE sort_order = 14;

-- Task: Add local service schema markup (sort_order 15)
UPDATE wm_library_tasks SET instructions =
'1. Decide on the most specific schema type for your business (e.g., Plumber, Electrician, Dentist rather than generic LocalBusiness)
2. Create a JSON-LD script block for your main service page with Service schema
3. Include: service name, description, provider (your business), service area, and price range
4. Add the schema to each individual service page with service-specific details
5. Include your business NAP (Name, Address, Phone) consistently in the schema
6. Add areaServed with the cities or regions you cover
7. Test each page at search.google.com/test/rich-results to verify schema is valid
8. Use the Domain Analysis tool in Prompt Reviews to check your overall structured data health
9. Monitor Google Search Console for any structured data errors after publishing'
WHERE sort_order = 15;

-- Task: Optimize your calls-to-action (sort_order 101)
UPDATE wm_library_tasks SET instructions =
'1. Open your top 5 pages by traffic (check Analytics in Prompt Reviews)
2. Screenshot the CTA on each page and note the exact text, color, and placement
3. Replace generic text ("Submit", "Contact") with action-oriented language ("Get your free quote", "Schedule a consultation")
4. Make CTA buttons visually stand out with a contrasting color from the rest of the page
5. Add a CTA above the fold on every service page so visitors don''t need to scroll to take action
6. Place a second CTA after your key content sections and testimonials
7. Add a brief supporting line near the CTA (e.g., "No obligation - response within 1 hour")
8. Test all CTAs on mobile to ensure they''re easy to tap (at least 44x44px)
9. Monitor form submissions or calls in Analytics to track improvement over 2-4 weeks'
WHERE sort_order = 101;

-- Task: Add trust signals throughout your site (sort_order 102)
UPDATE wm_library_tasks SET instructions =
'1. List every trust credential your business has: licenses, certifications, insurance, BBB rating, awards
2. Check the Reviews tool in Prompt Reviews to find your current review count and average rating
3. Add a "trust bar" near the top of your homepage showing 3-5 key credentials with icons/badges
4. Display your Google review count and star rating on your homepage (e.g., "4.8 stars from 120+ reviews")
5. Add license and insurance numbers on service pages where customers expect to see them
6. Show "Years in business" or "Established [year]" prominently
7. Include association logos (BBB, chamber of commerce, trade associations) in your footer
8. Add a "Featured in" or "As seen in" section if you have any press mentions
9. Place trust badges near your contact form and phone number to build confidence at decision points'
WHERE sort_order = 102;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE sort_order = 102;

-- Task: Optimize your contact forms for conversions (sort_order 103)
UPDATE wm_library_tasks SET instructions =
'1. Open your contact or quote request page on both desktop and mobile
2. Count the required fields - if more than 4, remove anything not essential (Name, Email or Phone, Message is enough)
3. Replace "Submit" with a specific button label like "Get my free quote" or "Request a callback"
4. Add a brief privacy line near the form: "We never share your information. Response within [timeframe]."
5. Set clear expectations: tell visitors what happens after they submit (call within 1 hour, email within 24 hours)
6. Test the form on a mobile phone - ensure fields are large enough and the keyboard type is correct (phone keyboard for phone field)
7. Add a trust signal near the form (e.g., review stars, "Licensed & insured", a small testimonial)
8. Check Analytics in Prompt Reviews to see your form page bounce rate before and after changes'
WHERE sort_order = 103;

-- Task: Add social proof near conversion points (sort_order 104)
UPDATE wm_library_tasks SET instructions =
'1. Open your website and identify every conversion point: contact forms, phone numbers, quote request buttons
2. Check the Reviews tool in Prompt Reviews and pick 3-5 short, impactful testimonials
3. Set up a Prompt Page in Prompt Reviews to collect new testimonials focused on outcomes and results
4. Place a 1-2 sentence testimonial directly above or beside each contact form
5. Add your Google star rating and review count near your main phone number
6. On service pages, add a relevant testimonial after the service description, before the CTA
7. If you have recognizable client logos, add a small "Trusted by" row near conversion areas
8. Include specific numbers when possible ("500+ projects completed", "4.9 stars from 200 reviews")
9. Rotate testimonials quarterly to keep them fresh and relevant'
WHERE sort_order = 104;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 104;

-- Task: Create dedicated landing pages for key services (sort_order 105)
UPDATE wm_library_tasks SET instructions =
'1. Identify your top 2-3 services by revenue or lead volume - these get dedicated landing pages
2. Open the Web Page Planner in Prompt Reviews and create an outline for each landing page
3. Open the Keyword Research tool and find the highest-intent keywords for each service
4. Write focused copy that addresses one service and one audience (e.g., "Emergency Plumbing in [City]")
5. Simplify the page layout: remove main navigation, keep only the logo and phone number in the header
6. Include a single, clear CTA repeated 2-3 times on the page (e.g., "Call now for same-day service")
7. Add 2-3 testimonials specific to this service
8. Include everything a customer needs to decide: pricing info, process, timeline, guarantees
9. Optimize the title tag and meta description for the high-intent keyword
10. Set up conversion tracking in Analytics to measure form submissions and calls from each landing page'
WHERE sort_order = 105;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 105;

-- Task: Add click-to-call and easy contact options (sort_order 106)
UPDATE wm_library_tasks SET instructions =
'1. Open your website on a mobile phone and try to call your business - is it one tap?
2. Add click-to-call links using the tel: protocol on every phone number: <a href="tel:5551234567">
3. Add a sticky header or floating button on mobile that shows your phone number at all times
4. Add a "Text us" option if you can receive business texts (use sms: link protocol)
5. Include a Google Maps link on your contact page so customers can get directions with one tap
6. Add a floating "Contact us" button or chat widget in the bottom corner
7. Ensure your contact information is visible on every page, not just the contact page
8. Test all contact links on both iPhone and Android to verify they work correctly'
WHERE sort_order = 106;

-- ============================================================================
-- CONTENT GROWTH PACK (sort_order 20-25) - Add Web Page Planner + expand steps
-- ============================================================================

-- Task: Create a content calendar for your blog (sort_order 20)
UPDATE wm_library_tasks SET instructions =
'1. Open the Keyword Research tool in Prompt Reviews and export your keyword list
2. Group keywords by topic cluster (e.g., all roof-related questions, all maintenance tips)
3. For each cluster, brainstorm 2-3 blog post ideas that answer real customer questions
4. Create a spreadsheet with columns: Month, Topic, Target Keyword, Search Intent, Status
5. Plan at least 1 post per month (2-4 is ideal for faster growth)
6. Mix content types: how-to guides, FAQs, seasonal tips, case studies, industry news
7. Schedule seasonal or timely content 4-6 weeks before the season (e.g., "winterize your plumbing" in October)
8. For each planned post, use the Web Page Planner in Prompt Reviews to outline the structure before writing
9. Set publishing dates and assign who will write each post
10. Review and adjust the calendar quarterly based on what''s performing in Analytics'
WHERE sort_order = 20;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 20;

-- Task: Write a comprehensive guide for your main topic (sort_order 21)
UPDATE wm_library_tasks SET instructions =
'1. Choose the topic most central to your business (e.g., "The Complete Guide to Kitchen Remodeling")
2. Open the Keyword Research tool in Prompt Reviews and find all related keywords and questions
3. Open the Web Page Planner in Prompt Reviews and create a detailed outline with 8-12 sections
4. Write 2,000+ words covering every aspect a customer might want to know
5. Include original insights from your hands-on experience - things only a professional would know
6. Add practical details: cost ranges, timelines, common mistakes to avoid, what to ask a contractor
7. Include images, diagrams, or tables to break up text and illustrate key points
8. Add a table of contents at the top with anchor links to each section
9. Link to your service pages and other relevant blog posts throughout the guide
10. Set a calendar reminder to update the guide every 6-12 months with fresh information'
WHERE sort_order = 21;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}]'
WHERE sort_order = 21;

-- Task: Update your oldest blog posts with fresh content (sort_order 22)
UPDATE wm_library_tasks SET instructions =
'1. Open Analytics in Prompt Reviews and find blog posts that are getting less traffic than 6 months ago
2. Check the Keyword Research tool to see if your target keywords have shifted or new opportunities exist
3. List posts older than 12 months and prioritize those that once performed well but declined
4. For each post, check if the information is still accurate (prices, processes, regulations, statistics)
5. Add 1-2 new sections addressing recent developments or commonly asked follow-up questions
6. Update any outdated statistics with current data and cite your sources
7. Refresh images or add new ones if the visuals are outdated
8. Improve internal links - link to newer content you''ve published since the original post
9. Update the publication date in your CMS after making substantial changes
10. Resubmit the URL in Google Search Console to speed up re-indexing'
WHERE sort_order = 22;

-- Task: Create location-specific content for your service area (sort_order 23)
UPDATE wm_library_tasks SET instructions =
'1. List every city and neighborhood in your service area that has enough search volume to target
2. Open the Keyword Research tool in Prompt Reviews and check volume for "[service] in [city]" for each area
3. Use the Web Page Planner in Prompt Reviews to create a unique outline for each location page
4. For each location page, include genuinely local details: neighborhoods you serve, local landmarks, area-specific challenges
5. Add local testimonials from customers in that area when available
6. Include a Google Maps embed or reference to your service coverage for that area
7. Write unique content for each page - do NOT just swap city names on a template
8. Add LocalBusiness schema with the specific service area for each page
9. Use the Local Ranking Grids tool in Prompt Reviews to track your visibility in each area
10. Interlink location pages with your main service pages and with each other'
WHERE sort_order = 23;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE sort_order = 23;

-- Task: Answer common customer questions as blog posts (sort_order 24)
UPDATE wm_library_tasks SET instructions =
'1. Review the last 3 months of customer emails, phone calls, and chat logs for frequently asked questions
2. Ask your team (front desk, sales, technicians) what questions they hear most often
3. Open the Keyword Research tool in Prompt Reviews and check search volume for each question
4. Choose 5-10 questions with the highest search potential
5. Use the Web Page Planner in Prompt Reviews to outline a 500-800 word post for each question
6. Write a clear, direct answer in the first paragraph (this helps win featured snippets)
7. Follow with detailed explanation, examples, and related information
8. Group related questions into a single post when they''re closely connected
9. Link each blog post to the relevant service page (e.g., "How much does X cost?" links to your X service page)
10. Add FAQ schema markup to each post to be eligible for rich results in Google'
WHERE sort_order = 24;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}]'
WHERE sort_order = 24;

-- Task: Build a content hub around your main service (sort_order 25)
UPDATE wm_library_tasks SET instructions =
'1. Identify your most important service as the hub topic (e.g., "Kitchen Remodeling")
2. Open the Keyword Research tool in Prompt Reviews and find 8-12 subtopics related to the hub
3. Use the Web Page Planner in Prompt Reviews to plan the hub page and each supporting article
4. Create the hub page as your definitive resource on the main topic (2,000+ words)
5. Write 5-10 supporting articles on subtopics (e.g., "Countertop Materials Guide", "Cabinet Styles Explained")
6. Add links from every supporting article back to the main hub page
7. Cross-link between related supporting articles where it makes sense
8. Add a "Related articles" section on the hub page linking to all supporting content
9. Update the hub page whenever you add new supporting content
10. Monitor the hub page ranking in Rank Tracking - it should climb as you add supporting content'
WHERE sort_order = 25;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]'
WHERE sort_order = 25;

-- ============================================================================
-- CTR BOOST PACK (sort_order 30-35) - More actionable steps
-- ============================================================================

-- Task: Improve titles for your top-traffic pages (sort_order 30)
UPDATE wm_library_tasks SET instructions =
'1. Open Rank Tracking in Prompt Reviews and identify pages with high impressions but low CTR (below 3%)
2. For each low-CTR page, search the target keyword in Google and study the top 3 competitor titles
3. Note what makes their titles compelling - numbers, benefits, current year, power words
4. Rewrite your title to be more specific and benefit-driven (e.g., add "2026", "Free Quote", or a number)
5. Keep titles under 60 characters to avoid truncation in search results
6. Ensure your primary keyword is still in the first half of the title
7. Add emotional hooks where appropriate: "Affordable", "Trusted", "Fast", "Expert"
8. Update one page at a time so you can isolate the impact of each change
9. Check Rank Tracking and Analytics in 2-4 weeks to measure the CTR improvement'
WHERE sort_order = 30;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 30;

-- Task: Add FAQ schema for rich results (sort_order 31)
UPDATE wm_library_tasks SET instructions =
'1. Identify your 3-5 highest-traffic pages that don''t already have FAQ schema
2. Write 3-5 genuine questions and answers for each page based on real customer queries
3. Add an FAQ section to the page content if not already present (below main content, above footer)
4. Create FAQ structured data using JSON-LD format - use Google''s documentation as a template
5. Place the JSON-LD script in the <head> or at the bottom of the page body
6. Test each page at search.google.com/test/rich-results to verify the schema is valid
7. Submit the updated pages for re-indexing in Google Search Console
8. Monitor Google Search Console''s "Enhancements" section for FAQ rich result impressions
9. Use the Domain Analysis tool in Prompt Reviews to check for schema errors across your site'
WHERE sort_order = 31;

-- Task: Optimize meta descriptions for click motivation (sort_order 32)
UPDATE wm_library_tasks SET instructions =
'1. Open Rank Tracking in Prompt Reviews and sort pages by impressions - start with the highest
2. For each page, read the current meta description and ask: "Would I click this over competitors?"
3. Rewrite descriptions focusing on benefits, not features (e.g., "Save 20% on energy bills" not "We install insulation")
4. Add social proof in descriptions when possible: "Rated 4.9/5 by 200+ customers"
5. Include urgency or time-sensitive language: "Free estimates this week" or "Same-day appointments available"
6. Add a clear call-to-action: "Get your free quote" or "See our portfolio"
7. Match the description to the search intent - transactional queries need offers, informational queries need answers
8. Keep all descriptions under 155 characters to avoid truncation
9. Update descriptions in your CMS and monitor CTR changes in Analytics over the next month'
WHERE sort_order = 32;

-- Task: Build brand recognition for improved CTR (sort_order 33)
UPDATE wm_library_tasks SET instructions =
'1. Use the Keyword Research tool in Prompt Reviews to check how many branded searches your business gets
2. Ensure your business name, logo, and visual branding are identical across every online platform
3. Set up a Prompt Page in Prompt Reviews to ask happy customers to search for your business by name
4. Use the Social Posting tool in Prompt Reviews to post helpful content regularly on social media
5. Get involved in local events, sponsorships, or community groups that generate brand exposure
6. Encourage happy customers to mention your business name in their Google reviews
7. Add your business name to the title tag of your homepage (e.g., "Brand Name | Service in City")
8. Track branded search growth in Rank Tracking in Prompt Reviews over time'
WHERE sort_order = 33;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 33;

-- Task: Optimize for featured snippets (sort_order 34)
UPDATE wm_library_tasks SET instructions =
'1. Open the Keyword Research tool in Prompt Reviews and identify question-based keywords you rank for (positions 2-10)
2. Search each keyword in Google and note what format the current featured snippet uses (paragraph, list, or table)
3. Match that format on your page: write a clear, concise 40-60 word answer right after an H2/H3 heading that contains the question
4. For "how to" queries, use numbered steps (Google loves structured steps for these)
5. For "what is" queries, write a clear definition paragraph directly below the heading
6. For comparison queries, use a comparison table
7. Follow your concise answer with more detailed supporting content
8. Check Rank Tracking in Prompt Reviews after 2-4 weeks to see if you captured any snippets
9. Target one snippet at a time for the clearest measurement of what works'
WHERE sort_order = 34;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}]'
WHERE sort_order = 34;

-- Task: Add review stars to your search listings (sort_order 35)
UPDATE wm_library_tasks SET instructions =
'1. Open the Reviews tool in Prompt Reviews and check your current average rating and review count
2. Collect at least 5 genuine reviews before adding review schema (Google may not show stars with fewer)
3. Add AggregateRating schema markup (JSON-LD) to your service pages and homepage
4. Include: ratingValue (your average), reviewCount (total reviews), and bestRating (5)
5. Ensure the reviews referenced in your schema are actually displayed on that page
6. Test your markup at search.google.com/test/rich-results
7. Set up a Prompt Page in Prompt Reviews to continuously collect new reviews and keep stars fresh
8. Monitor Google Search Console for rich result appearances over the next 2-4 weeks'
WHERE sort_order = 35;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 35;

-- ============================================================================
-- TECHNICAL CLEANUP PACK (sort_order 40-46) - More concrete debugging steps
-- ============================================================================

-- Task: Fix Core Web Vitals issues (sort_order 40)
UPDATE wm_library_tasks SET instructions =
'1. Run your homepage through pagespeed.web.dev and screenshot the results for both mobile and desktop
2. Note the three Core Web Vitals scores: LCP (Largest Contentful Paint), FID/INP (Interaction), CLS (Cumulative Layout Shift)
3. Address LCP first (most common issue): compress images, use WebP format, and enable lazy loading for below-the-fold images
4. Fix CLS issues: add explicit width/height to all images and video embeds, avoid inserting content above existing content
5. Enable browser caching by setting Cache-Control headers for static assets (images, CSS, JS)
6. Minimize render-blocking resources: defer non-critical JavaScript, inline critical CSS
7. Use the Domain Analysis tool in Prompt Reviews to get an overview of your site health score
8. Test your 5 most important pages individually - each may have different issues
9. Re-test after each fix to verify the improvement before moving to the next issue
10. Set up a monthly reminder to re-check Core Web Vitals for regression'
WHERE sort_order = 40;

-- Task: Find and fix broken links (sort_order 41)
UPDATE wm_library_tasks SET instructions =
'1. Use the Domain Analysis tool in Prompt Reviews to scan for broken links and 404 errors
2. Check Google Search Console under "Indexing" > "Pages" for any pages returning 404 errors
3. Create a spreadsheet listing every broken link: the page it''s on, what URL it points to, and the anchor text
4. For broken internal links, update them to point to the correct current page
5. For pages you''ve deleted that still get traffic, set up 301 redirects to the most relevant existing page
6. For broken external links, either update to the correct URL or remove the link entirely
7. Create a custom 404 page with your branding, a search bar, and links to popular pages
8. Set up a quarterly schedule to re-scan for new broken links'
WHERE sort_order = 41;

-- Task: Ensure your site is mobile-friendly (sort_order 42)
UPDATE wm_library_tasks SET instructions =
'1. Test your homepage at search.google.com/test/mobile-friendly and note any issues
2. Open your website on an actual phone (not just desktop browser resized) and navigate every page
3. Check that all text is readable without pinching or zooming - minimum 16px font size for body text
4. Verify all buttons and links have enough tap target size (minimum 44x44 pixels with spacing between)
5. Ensure no content requires horizontal scrolling on mobile
6. Test all forms on mobile: are fields easy to tap? Does the keyboard type match the field? (number pad for phone fields)
7. Check that menus work properly on mobile - hamburger menu should open and close smoothly
8. Use the Domain Analysis tool in Prompt Reviews to check your mobile performance score
9. Fix the most impactful issues first: tap targets and font sizes affect the most users'
WHERE sort_order = 42;

-- Task: Set up and fix redirect chains (sort_order 43)
UPDATE wm_library_tasks SET instructions =
'1. Use the Domain Analysis tool in Prompt Reviews to identify redirect chains on your site
2. A redirect chain is A -> B -> C: fix these so A goes directly to C
3. Check that all redirects use 301 (permanent) not 302 (temporary) - 302s don''t pass link equity
4. Update old internal links to point directly to the final destination URL, not to redirected URLs
5. Check for redirect loops (A -> B -> A) which create errors - these need immediate fixing
6. If you''ve changed your URL structure, ensure old URLs redirect to their new equivalents
7. For any external links you control (directories, social profiles), update them to the final URL
8. After fixing, retest with Domain Analysis to confirm chains are resolved'
WHERE sort_order = 43;

-- Task: Add HTTPS and fix mixed content (sort_order 44)
UPDATE wm_library_tasks SET instructions =
'1. Check if your site loads on https:// - if not, contact your hosting provider to install an SSL certificate (many offer free via Let''s Encrypt)
2. Open your browser''s developer console (F12) and look for "Mixed Content" warnings on each page
3. Find all HTTP resources (images, scripts, stylesheets) and update them to HTTPS
4. Use the Domain Analysis tool in Prompt Reviews to scan for mixed content issues site-wide
5. Set up a server-level redirect from HTTP to HTTPS so all traffic is secure
6. Update your sitemap and Google Search Console to use the HTTPS version
7. Check all internal links and update any that still use http:// to https://
8. Update your canonical tags to use HTTPS URLs'
WHERE sort_order = 44;

-- Task: Create and optimize XML sitemap (sort_order 45)
UPDATE wm_library_tasks SET instructions =
'1. Check if you already have a sitemap at yoursite.com/sitemap.xml
2. If using a CMS like WordPress, use an SEO plugin (Yoast, Rank Math) to auto-generate your sitemap
3. If creating manually, include only indexable pages you want Google to rank - not admin pages, duplicate pages, or thin content
4. Exclude pages with noindex tags, redirected URLs, and 404 pages from your sitemap
5. Submit your sitemap URL in Google Search Console under "Sitemaps"
6. Use the Domain Analysis tool in Prompt Reviews to check for indexing issues
7. Verify the sitemap updates automatically when you add or remove pages
8. Check Google Search Console weekly for the first month to see how many pages are being indexed'
WHERE sort_order = 45;

-- Task: Fix duplicate content issues (sort_order 46)
UPDATE wm_library_tasks SET instructions =
'1. Use the Domain Analysis tool in Prompt Reviews to identify pages with similar or duplicate content
2. Search for sentences from your own pages in Google using quotes ("your exact sentence") to find duplicates
3. Check for www vs non-www duplicates (both versions serving the same content) and set up a redirect to one
4. Check for HTTP vs HTTPS duplicates and redirect all traffic to HTTPS
5. For pages that are intentionally similar (e.g., location pages), add unique content to each - at least 60% unique
6. Add canonical tags (<link rel="canonical">) to any pages that might be seen as duplicates, pointing to the preferred version
7. Consolidate truly duplicate pages: pick the best one, redirect the others to it
8. Use the "URL Inspection" tool in Google Search Console to verify which version Google is indexing'
WHERE sort_order = 46;

-- ============================================================================
-- LOCAL VISIBILITY PACK (sort_order 50-56) - More specific steps
-- ============================================================================

-- Task: Fully optimize your Google Business Profile (sort_order 50)
UPDATE wm_library_tasks SET instructions =
'1. Open the Google Business tool in Prompt Reviews and connect your profile if not already connected
2. Write a complete business description using all 750 characters - include your services, service area, and what makes you unique
3. Select the most specific primary category (e.g., "Plumber" not "Home Services") and add 2-5 secondary categories
4. Add every service you offer with a brief description for each
5. Upload at least 10 high-quality photos: exterior, interior, team, and your best work
6. Set accurate business hours including special hours for holidays
7. Add your service area if you travel to customers
8. Fill out all available attributes (payment methods, accessibility, etc.)
9. Use the Local Ranking Grids tool in Prompt Reviews to check your map visibility before and after optimization'
WHERE sort_order = 50;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE sort_order = 50;

-- Task: Build a review generation system (sort_order 51)
UPDATE wm_library_tasks SET instructions =
'1. Set up a Prompt Page in Prompt Reviews specifically designed for collecting Google reviews
2. Customize the Prompt Page with your branding and a personal thank-you message
3. Decide the best moment in your customer journey to ask for a review (typically right after service completion)
4. Create a simple process: send the Prompt Page link via text or email within 24 hours of service completion
5. Write a template message for your team: personal, grateful, with the direct link
6. Train your team to mention reviews naturally during positive customer interactions
7. Set up a follow-up: if a customer doesn''t leave a review within 3 days, send one polite reminder
8. Track your review velocity in the Reviews tool in Prompt Reviews - aim for consistent new reviews, not bursts
9. Never incentivize reviews (against Google''s terms) - just make it easy and ask sincerely'
WHERE sort_order = 51;

-- Task: Respond to all Google reviews (sort_order 52)
UPDATE wm_library_tasks SET instructions =
'1. Open the Reviews tool in Prompt Reviews and check for any unresponded reviews
2. Respond to positive reviews within 24-48 hours: thank them by name, reference something specific from their review
3. For negative reviews, respond professionally: acknowledge the concern, apologize if appropriate, offer to discuss offline
4. Include a contact method in negative review responses so the customer can reach you directly
5. Naturally weave in a keyword when it fits: "We''re glad you enjoyed our kitchen remodeling service"
6. Keep responses concise (2-4 sentences for positive, 3-5 for negative)
7. Set a weekly reminder in your calendar to check for new reviews
8. Track your response rate in the Google Business tool in Prompt Reviews - aim for 100%'
WHERE sort_order = 52;

-- Task: Create location pages for each service area (sort_order 53)
UPDATE wm_library_tasks SET instructions =
'1. List every city or major neighborhood in your service area that has enough search volume
2. Open the Keyword Research tool in Prompt Reviews and check volume for "[service] in [city]" for each area
3. Use the Web Page Planner in Prompt Reviews to create a unique outline for each location page
4. Write genuinely unique content for each page: mention local landmarks, neighborhoods, area-specific challenges
5. Add local testimonials from customers in that specific area
6. Include a Google Maps embed centered on the service area
7. Add LocalBusiness schema with the specific service area for each page
8. Use the Local Ranking Grids tool in Prompt Reviews to track visibility in each area
9. Link location pages to your main service pages and to each other
10. Do NOT just swap city names on a template - Google detects this as thin content'
WHERE sort_order = 53;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE sort_order = 53;

-- Task: Get listed in industry-specific directories (sort_order 54)
UPDATE wm_library_tasks SET instructions =
'1. Search Google for "[your industry] directory" and "[your industry] best companies" to find relevant directories
2. Check the Business Profile tool in Prompt Reviews to ensure your NAP info is correct before adding listings
3. Claim or create listings on the top 5-10 industry-specific directories for your field
4. Ensure your Name, Address, and Phone match EXACTLY what''s on your website and Google Business Profile
5. Complete every field available: description, services, photos, business hours
6. Look for your local chamber of commerce directory and get listed
7. Check if your industry associations have member directories and get included
8. Upload quality photos and your logo to each listing
9. Set a quarterly reminder to check all listings for accuracy and update as needed'
WHERE sort_order = 54;

-- Task: Add local schema markup (sort_order 55)
UPDATE wm_library_tasks SET instructions =
'1. Choose the most specific schema type for your business at schema.org (e.g., Plumber, Dentist, RealEstateAgent)
2. Add LocalBusiness JSON-LD to your homepage with: name, address, phone, hours, geo coordinates, and URL
3. Include your exact NAP matching your Google Business Profile and all directory listings
4. Add areaServed to specify the cities and regions you cover
5. Include paymentAccepted and priceRange when applicable
6. Add the schema to your contact page as well
7. Test at search.google.com/test/rich-results to verify it validates
8. Use the Domain Analysis tool in Prompt Reviews to check your structured data health
9. Use the Local Ranking Grids tool in Prompt Reviews to monitor local visibility after adding schema'
WHERE sort_order = 55;

-- Task: Build local links from community involvement (sort_order 56)
UPDATE wm_library_tasks SET instructions =
'1. List local organizations, charities, sports teams, and events you could realistically sponsor or participate in
2. Check the Backlinks tool in Prompt Reviews to see if competitors have local links you''re missing
3. Sponsor a local sports team, charity event, or community organization (most will list sponsors with a link)
4. Join your local chamber of commerce and business associations that provide member directory listings
5. Offer to host or speak at local events related to your industry
6. Partner with complementary local businesses for cross-promotion
7. Reach out to local news outlets when you have a community involvement story to share
8. After each involvement, verify you received the expected link using the Backlinks tool in Prompt Reviews
9. Aim for 2-3 new local links per quarter through genuine community participation'
WHERE sort_order = 56;

-- ============================================================================
-- AI VISIBILITY STARTER PACK (sort_order 60-65) - Mostly keep as-is, light enhancements
-- ============================================================================

-- Task: Build brand mentions across the web (sort_order 60)
UPDATE wm_library_tasks SET instructions =
'1. Check the LLM Visibility tool in Prompt Reviews to see how AI assistants currently describe your business
2. Contribute helpful, expert answers in online communities like Reddit and Quora (mention your business naturally when relevant)
3. Pitch guest posts to 3-5 industry blogs - include your business name naturally in the content
4. Seek opportunities to be quoted in industry publications or local news
5. Appear on relevant podcasts - episode descriptions and show notes create mentions
6. Create shareable content (guides, research, tools) that others will reference and mention
7. Monitor new mentions by searching your business name in Google monthly
8. Re-check LLM Visibility in Prompt Reviews quarterly to see if AI mentions are improving'
WHERE sort_order = 60;

-- Task: Create authoritative, factual content (sort_order 61)
UPDATE wm_library_tasks SET instructions =
'1. Check the LLM Visibility tool in Prompt Reviews to see what AI currently says about your industry
2. Identify topics where your hands-on experience gives you unique authority
3. Use the Web Page Planner in Prompt Reviews to outline content that covers these topics comprehensively
4. Write content that includes specific statistics, data points, and verifiable facts
5. Cite authoritative sources (government data, industry associations, research papers) for every claim
6. Share original insights from your professional experience that can''t be found elsewhere
7. Update content regularly to maintain accuracy - set a 6-month review cycle
8. Include your author bio with credentials on every piece of content
9. Check LLM Visibility again after publishing to see if AI begins referencing your content'
WHERE sort_order = 61;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}]'
WHERE sort_order = 61;

-- Task: Implement comprehensive structured data (sort_order 62)
UPDATE wm_library_tasks SET instructions =
'1. Start with Organization schema on your homepage: name, URL, logo, social profiles, contact info
2. Add LocalBusiness schema (or your specific business type) with complete NAP and service area
3. Add Service schema to each service page with: name, description, provider, area served, price range
4. Add FAQ schema to pages with FAQ sections (questions and answers in JSON-LD)
5. Add HowTo schema to any process-based content (e.g., "How to prepare for a home inspection")
6. Use the Domain Analysis tool in Prompt Reviews to verify your structured data is error-free
7. Test every page with schema at search.google.com/test/rich-results
8. Monitor Google Search Console''s "Enhancements" section for structured data issues
9. AI assistants use structured data to extract precise facts - the more structured data you have, the more accurately AI can represent your business'
WHERE sort_order = 62;

-- Task: Establish social proof and credentials (sort_order 63)
UPDATE wm_library_tasks SET instructions =
'1. Check the LLM Visibility tool in Prompt Reviews to see what credentials AI already mentions about you
2. List all certifications, licenses, and credentials your business holds
3. Display these prominently on your About page and in the footer of every page
4. Add memberships (BBB, trade associations, chamber of commerce) with badge images
5. Use Prompt Pages in Prompt Reviews to collect reviews on multiple platforms (not just Google)
6. Display your aggregate review score (e.g., "4.9 stars across 300+ reviews") on your homepage
7. Publish any awards, "Best of" recognitions, or media features you''ve received
8. Cross-reference credentials across your website, social profiles, and directory listings for consistency'
WHERE sort_order = 63;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}, {"name": "Prompt Pages", "route": "/prompt-pages"}, {"name": "Reviews", "route": "/dashboard/reviews"}]'
WHERE sort_order = 63;

-- Task: Create comprehensive FAQ content (sort_order 64)
UPDATE wm_library_tasks SET instructions =
'1. Open the Keyword Research tool in Prompt Reviews and filter for question-based keywords in your industry
2. List 20+ questions customers ask: from initial research questions to post-purchase concerns
3. Organize questions into categories (e.g., "Pricing", "Process", "Maintenance", "Choosing a provider")
4. Write thorough answers of 3-5 sentences each - be specific and practical, not vague
5. Think about what someone might ask an AI assistant about your service and ensure you answer those questions
6. Use natural, conversational language that matches how people actually ask these questions
7. Add FAQ schema markup to make the content machine-readable
8. Link relevant answers to your service pages and other content
9. Use the LLM Visibility tool in Prompt Reviews to see if AI starts referencing your FAQ content'
WHERE sort_order = 64;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 64;

-- Task: Ensure consistent business information everywhere (sort_order 65)
UPDATE wm_library_tasks SET instructions =
'1. Open the Business Profile tool in Prompt Reviews and confirm your master NAP (Name, Address, Phone) is correct
2. Create a spreadsheet listing every platform where your business appears (Google, Yelp, Facebook, directories, social, etc.)
3. Visit each listing and compare every detail against your master record
4. Check: business name format, street address, phone number, website URL, hours, and description
5. Fix any inconsistencies immediately - even small differences (St. vs Street, Suite vs Ste.) can confuse AI
6. Verify your Google Business Profile matches your website contact page exactly
7. Update social profiles (LinkedIn, Facebook, Instagram) to match
8. Check AI''s understanding using the LLM Visibility tool in Prompt Reviews - inconsistencies cause AI to report inaccurate information
9. Set a quarterly reminder to re-audit all listings'
WHERE sort_order = 65;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Business Profile", "route": "/dashboard/business-profile"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 65;

-- ============================================================================
-- ONLINE VISIBILITY MAINTENANCE PACK (sort_order 70-77) - Add cadences and tool refs
-- ============================================================================

-- Task: Monthly ranking check and analysis (sort_order 70)
UPDATE wm_library_tasks SET instructions =
'1. Open the Rank Tracking tool in Prompt Reviews on the first Monday of each month
2. Review position changes for all tracked keywords - note anything that moved 3+ positions up or down
3. For keywords that dropped, check if there was a Google algorithm update (search "Google update [month] [year]")
4. For keywords that improved, note what you did that may have caused the improvement
5. Open the Analytics tool in Prompt Reviews and compare this month''s organic traffic to last month
6. Check for new keyword opportunities: are there queries appearing in Search Console you haven''t targeted yet?
7. Review your competitors'' rankings for the same keywords - are they gaining or losing ground?
8. Update your task priorities based on what you learned: address drops first, then pursue new opportunities
9. Document your findings in a brief monthly note so you can track trends over time'
WHERE sort_order = 70;

-- Task: Quarterly content freshness audit (sort_order 71)
UPDATE wm_library_tasks SET instructions =
'1. Set a recurring quarterly task: January, April, July, October
2. Open Analytics in Prompt Reviews and identify your top 10 most important pages by traffic
3. Open each page and check for: outdated information, old statistics, discontinued services, changed pricing
4. Use the Keyword Research tool in Prompt Reviews to see if new keywords have emerged for each topic
5. Add 1-2 new sections to each page addressing recent developments or new questions
6. Update any outdated statistics, dates, or references
7. Refresh images if they look dated or if you have better examples of recent work
8. Improve internal links - link to newer content published since the last audit
9. Update the publication date in your CMS after substantial changes
10. Resubmit updated URLs in Google Search Console for faster re-indexing'
WHERE sort_order = 71;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Analytics", "route": "/dashboard/analytics"}, {"name": "Keyword Research", "route": "/dashboard/research/keywords"}]'
WHERE sort_order = 71;

-- Task: Weekly review monitoring and response (sort_order 72)
UPDATE wm_library_tasks SET instructions =
'1. Set a recurring weekly task: every Monday, check for new reviews
2. Open the Reviews tool in Prompt Reviews to see all recent reviews across platforms
3. Respond to every new review within 48 hours - positive and negative
4. For positive reviews: thank them by name, reference something specific, add a natural keyword mention
5. For negative reviews: acknowledge the issue, apologize if warranted, offer to resolve offline with a phone number or email
6. Log review sentiment trends: is your average rating going up or down? Note any recurring complaints
7. Check the Google Business tool in Prompt Reviews to verify your GBP response rate stays at 100%
8. If you notice a complaint trend (e.g., wait times), flag it to your team for operational improvement
9. Use the Prompt Pages tool in Prompt Reviews to send review requests to recent happy customers to maintain velocity'
WHERE sort_order = 72;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 72;

-- Task: Monthly competitor check (sort_order 73)
UPDATE wm_library_tasks SET instructions =
'1. Set a recurring monthly task: same day each month
2. Open the Rank Tracking tool in Prompt Reviews and review which competitors are ranking above you
3. Visit the top 3 competitor websites and note any new content, new services, or design changes
4. Check competitors'' Google Business Profiles for new reviews, posts, and photos
5. Use the Backlinks tool in Prompt Reviews to see if competitors have earned new backlinks you could pursue
6. Note any new keywords competitors are targeting that you aren''t
7. Check if competitors are investing in content you could create better versions of
8. Update your content calendar and task priorities based on competitive insights
9. Focus on gaps where you have a genuine advantage, not copying everything competitors do'
WHERE sort_order = 73;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Rank Tracking", "route": "/dashboard/keywords/rank-tracking"}, {"name": "Backlinks", "route": "/dashboard/backlinks"}]'
WHERE sort_order = 73;

-- Task: Annual technical SEO audit (sort_order 74)
UPDATE wm_library_tasks SET instructions =
'1. Schedule annually: pick a quiet business month (e.g., January or July)
2. Run a full site crawl using the Domain Analysis tool in Prompt Reviews
3. Check Core Web Vitals at pagespeed.web.dev for your 5 most important pages
4. Test mobile responsiveness at search.google.com/test/mobile-friendly
5. Audit all redirects: look for chains, loops, and 302s that should be 301s
6. Review and clean up your XML sitemap - remove any pages that shouldn''t be indexed
7. Check Google Search Console for crawl errors, indexing issues, and manual actions
8. Verify all structured data is still valid using Rich Results Test
9. Check for new Core Web Vitals issues introduced by site changes over the year
10. Create a prioritized fix list and address critical issues within 2 weeks'
WHERE sort_order = 74;

-- Task: Monthly Google Business updates (sort_order 75)
UPDATE wm_library_tasks SET instructions =
'1. Set a recurring task: first week of each month
2. Open the Social Posting tool in Prompt Reviews and schedule 4-8 Google Business posts for the month
3. Mix post types: project showcases, tips, seasonal offers, team highlights, community involvement
4. Open the Google Business tool in Prompt Reviews and upload 3-5 new photos (recent projects, team, seasonal)
5. Review and update your services list if anything has changed
6. Update special hours for upcoming holidays
7. Check the Q&A section for new customer questions and answer them promptly
8. Review your GBP insights to see which posts and photos are performing best
9. Use the Local Ranking Grids tool in Prompt Reviews to track if your map pack visibility is improving'
WHERE sort_order = 75;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "Google Business", "route": "/dashboard/google-business"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE sort_order = 75;

-- Task: Quarterly backlink profile review (sort_order 76)
UPDATE wm_library_tasks SET instructions =
'1. Set recurring quarterly: March, June, September, December
2. Open the Backlinks tool in Prompt Reviews and review your current backlink profile
3. Note new backlinks acquired since last quarter - are they from quality, relevant sites?
4. Look for any suspicious or spammy links that appeared (porn sites, gambling, link farms)
5. If you find toxic links, consider using Google''s Disavow tool (use cautiously and only for clearly harmful links)
6. Identify your most successful link-earning content and create more like it
7. Check which competitor backlinks you could pursue (directories, associations, resource pages you''re missing from)
8. Look for broken backlinks pointing to 404 pages and set up 301 redirects to reclaim that link value
9. Document your link growth trend - you should be gaining more links than you''re losing each quarter'
WHERE sort_order = 76;

-- Task: Semi-annual AI visibility check (sort_order 77)
UPDATE wm_library_tasks SET instructions =
'1. Set recurring checks: January and July
2. Open the LLM Visibility tool in Prompt Reviews and check how AI describes your business
3. Ask ChatGPT: "What are the best [your service] companies in [your city]?" and note if you''re mentioned
4. Ask Claude the same question and compare responses
5. Note if the information AI has about you is accurate: services, location, contact details
6. If AI has inaccurate info, update your website and key profiles (Google, LinkedIn, directories) with correct details
7. Compare your AI visibility to competitors - who does AI recommend and why?
8. Identify gaps: if AI mentions competitors but not you, strengthen your web presence in the areas where competitors are stronger
9. Track progress over time - AI knowledge bases update slowly, so expect 3-6 month lag times'
WHERE sort_order = 77;

-- ============================================================================
-- BACKLINKS & PR/MENTIONS TASKS (sort_order 80-88)
-- ============================================================================

-- Task: Analyze competitor backlinks for opportunities (sort_order 80)
UPDATE wm_library_tasks SET instructions =
'1. Open the Backlinks tool in Prompt Reviews and run a competitor analysis for your top 3 competitors
2. Export or note their backlink sources: directories, blogs, news sites, associations, resource pages
3. Look for patterns: which types of sites link to multiple competitors? These are your best opportunities
4. Identify directory listings your competitors have that you don''t - claim those profiles
5. Find industry associations or business groups that provide member links - join them
6. Note any content that earned competitors links (guides, tools, research) - create better versions
7. Prioritize opportunities by effort vs. value: directory claims are easy, earning press links takes more work
8. Create a target list of 10-15 link opportunities to pursue over the next quarter'
WHERE sort_order = 80;

-- Task: Create a linkable asset (sort_order 81)
UPDATE wm_library_tasks SET instructions =
'1. Use the Keyword Research tool in Prompt Reviews to find topics your audience frequently searches for
2. Use the Web Page Planner in Prompt Reviews to outline a comprehensive resource on that topic
3. Choose a format that earns links: cost calculator, comprehensive guide, downloadable checklist, or data report
4. Create something genuinely better than anything currently available on the topic
5. Add unique data, original insights, custom visuals, or a tool that provides real value
6. Include your branding subtly - the content should be useful first, branded second
7. Publish on your site with an embed code or share button for easy linking
8. Promote the asset: email it to industry contacts, share on social media, mention in relevant forums
9. Reach out to bloggers and journalists who cover your topic and let them know about the resource
10. Track new backlinks in the Backlinks tool in Prompt Reviews over the following months'
WHERE sort_order = 81;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Backlinks", "route": "/dashboard/backlinks"}]'
WHERE sort_order = 81;

-- Task: Pursue guest posting on industry blogs (sort_order 82)
UPDATE wm_library_tasks SET instructions =
'1. Search Google for "[your industry] + write for us" or "[your industry] + guest post" to find accepting blogs
2. List 10-20 blogs that have real audiences and are relevant to your industry
3. Read 3-5 recent posts on each blog to understand their content style and audience
4. Pitch 2-3 unique topic ideas per blog that provide genuine value (not promotional fluff)
5. Write high-quality content that matches their style - this should be as good as your own blog posts
6. Include a natural link to your site in the author bio or within the content where relevant
7. Track which posts publish successfully using the Backlinks tool in Prompt Reviews
8. Build ongoing relationships with editors for repeat guest posting opportunities
9. Never pay for guest posts on low-quality sites - Google can detect and penalize these'
WHERE sort_order = 82;

-- Task: Reclaim unlinked brand mentions (sort_order 83)
UPDATE wm_library_tasks SET instructions =
'1. Search Google for your business name in quotes, excluding your own site: "Your Business Name" -site:yourdomain.com
2. Check the Backlinks tool in Prompt Reviews and compare mentions found vs. actual backlinks
3. Create a list of every mention that doesn''t include a link back to your site
4. For each unlinked mention, find the contact email for the website editor or author
5. Send a polite, brief email: thank them for the mention and ask if they''d be willing to add a link
6. Provide the exact URL you''d like them to link to (your homepage or relevant service page)
7. Follow up once after 1-2 weeks if you don''t hear back - then move on
8. Expect a 20-40% success rate - even a few converted mentions are valuable new backlinks'
WHERE sort_order = 83;

-- Task: Build relationships with local journalists (sort_order 84)
UPDATE wm_library_tasks SET instructions =
'1. Identify local newspapers, TV stations, radio stations, and online publications in your area
2. Find journalists who cover your industry, local business, or community news
3. Follow them on social media and engage genuinely with their content
4. Use the Backlinks tool in Prompt Reviews to see which local media sites link to your competitors
5. Send a brief introduction email offering yourself as a local expert source for future stories
6. Respond quickly whenever a journalist reaches out - speed matters for their deadlines
7. Share interesting business data, trends, or community stories that might be newsworthy
8. After any coverage, share the article on social media and thank the journalist publicly
9. Maintain the relationship with occasional check-ins, not just when you need coverage'
WHERE sort_order = 84;

-- Task: Use HARO or similar services for media mentions (sort_order 85)
UPDATE wm_library_tasks SET instructions =
'1. Sign up for HARO (helpareporter.com) or similar services (Qwoted, Terkel, SourceBottle)
2. Set up alerts for your industry keywords so you only see relevant queries
3. When a relevant query appears, respond within hours - journalists have tight deadlines
4. Write concise, quotable responses (3-5 sentences) that directly answer their question
5. Include your credentials: "John Smith, owner of [Business] with 15 years of experience in [industry]"
6. Use the Backlinks tool in Prompt Reviews to track when your media mentions go live
7. Aim for 2-3 responses per week to increase your chances of being selected
8. When published, share the article on social media and add it to your website''s press/media page'
WHERE sort_order = 85;

-- Task: Fix broken links pointing to your site (sort_order 86)
UPDATE wm_library_tasks SET instructions =
'1. Open the Backlinks tool in Prompt Reviews and look for backlinks pointing to 404 pages on your site
2. Check Google Search Console under "Indexing" > "Pages" for 404 errors that have external backlinks
3. For each broken backlink, decide: is the content still relevant? Could you restore the page or redirect it?
4. Set up 301 redirects from old/broken URLs to the most relevant current page
5. If the original content is gone and no good redirect exists, consider recreating the content
6. For high-value backlinks, contact the linking site and ask them to update the URL
7. After setting up redirects, verify they work by clicking the external links in the Backlinks tool
8. Check quarterly for new broken backlinks as pages change over time'
WHERE sort_order = 86;

-- Task: Get listed on industry resource pages (sort_order 87)
UPDATE wm_library_tasks SET instructions =
'1. Search Google for "[your industry] resources", "[your industry] recommended companies", and "best [your service] [your city]"
2. Identify legitimate resource lists, roundup posts, and "best of" articles
3. Use the Backlinks tool in Prompt Reviews to see which resource pages already link to your competitors
4. Evaluate if your business genuinely belongs on each list - only pursue relevant, quality pages
5. Find the website editor''s contact email (check the About or Contact page)
6. Write a personalized outreach email explaining why your business would add value to their resource page
7. Include a brief description of your business, any notable credentials, and the URL to link to
8. Follow up once after 1-2 weeks, then move on if no response
9. Track successful listings in the Backlinks tool'
WHERE sort_order = 87;

-- Task: Create local partnerships for mutual linking (sort_order 88)
UPDATE wm_library_tasks SET instructions =
'1. List 5-10 non-competing businesses that serve the same customers (e.g., if you''re a plumber: electricians, HVAC companies, realtors)
2. Check the Backlinks tool in Prompt Reviews to see if any of these businesses already link to competitors
3. Reach out to each business suggesting a mutual referral partnership
4. Create a "Partners" or "Recommended providers" page on your website listing your partners
5. Ask each partner to create a similar page linking back to you
6. Refer real customers to each other - this makes the partnership genuine, not just a link scheme
7. Consider co-hosting local events, workshops, or community projects for additional visibility
8. Review and refresh partnerships annually - remove inactive partnerships, add new ones'
WHERE sort_order = 88;

-- ============================================================================
-- AI MENTIONS & VISIBILITY TASKS (sort_order 90-100)
-- ============================================================================

-- Task: Get active on Reddit (sort_order 90)
UPDATE wm_library_tasks SET instructions =
'1. Find 3-5 subreddits related to your industry and your local area (e.g., r/HomeImprovement, r/[YourCity])
2. Create a Reddit account with your real name or business identity
3. Read each subreddit''s rules before posting - many prohibit direct self-promotion
4. Start by commenting helpfully on posts where your expertise is relevant (minimum 2-4 weeks before mentioning your business)
5. Answer questions thoroughly - the most helpful answers get upvoted and gain visibility
6. Only mention your business when it genuinely helps answer someone''s question
7. Build karma and reputation over months - Reddit communities detect and reject obvious self-promotion
8. Use the LLM Visibility tool in Prompt Reviews to track whether Reddit activity improves how AI mentions you'
WHERE sort_order = 90;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 90;

-- Task: Answer questions on Quora (sort_order 91)
UPDATE wm_library_tasks SET instructions =
'1. Create a Quora profile with your professional credentials, business name, and a professional photo
2. Follow topics related to your industry and expertise
3. Search for unanswered or poorly answered questions in your area of expertise
4. Write thorough, helpful answers of 200-500 words - be the most useful answer on the page
5. Include relevant experience and examples from your work (without being overtly promotional)
6. Add a link to your detailed content only when it genuinely adds value to the answer
7. Answer 2-3 questions per week consistently rather than doing a burst and disappearing
8. Use the LLM Visibility tool in Prompt Reviews to see if your Quora activity influences AI recommendations'
WHERE sort_order = 91;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 91;

-- Task: Contribute to Wikipedia (sort_order 92)
UPDATE wm_library_tasks SET instructions =
'1. Read Wikipedia''s conflict of interest policy thoroughly - you CANNOT edit pages about your own business
2. Identify industry-related Wikipedia articles where you can add genuine value
3. Create a Wikipedia account and start with small, well-sourced edits to build credibility
4. Add factual, well-sourced information to industry articles (cite published research, government data, or news sources)
5. If your business has done published research or earned notable achievements, these may be Wikipedia-worthy
6. Let others add information about your business to maintain objectivity - you can suggest it on Talk pages
7. This is a long-term authority play: contributing to Wikipedia builds industry credibility that AI models learn from
8. Never attempt to game Wikipedia - vandalism or promotional edits will be reverted and may damage your reputation'
WHERE sort_order = 92;

-- Task: Get mentioned in industry publications (sort_order 93)
UPDATE wm_library_tasks SET instructions =
'1. Identify the top 5-10 publications in your industry (trade magazines, industry blogs, news sites)
2. Research each publication''s contributor guidelines and editorial contacts
3. Pitch story ideas based on unique data or insights from your business (not generic promotional content)
4. Offer to be quoted as an expert source for stories in your area of expertise
5. Share newsworthy milestones: significant project completions, community impact, innovative approaches
6. Write thought leadership articles if the publication accepts guest contributors
7. Promote any mentions on your website and social media to maximize the signal
8. Use the LLM Visibility tool in Prompt Reviews to track if industry mentions improve AI recommendations
9. Build ongoing relationships with editors for repeat features'
WHERE sort_order = 93;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 93;

-- Task: Appear on podcasts in your industry (sort_order 94)
UPDATE wm_library_tasks SET instructions =
'1. Search for podcasts in your industry or local area using Apple Podcasts, Spotify, or podcast directories
2. List 10-15 relevant podcasts and note their format, audience size, and typical guest profile
3. Prepare 3-5 specific topics you could discuss that would genuinely help their audience
4. Write personalized pitch emails to each host: reference a recent episode you enjoyed and propose your topic
5. Prepare talking points that naturally mention your business and expertise
6. Ask hosts to include your website link and bio in the show notes
7. After airing, share the episode on social media and embed it on your website
8. Track mentions from podcast show notes using the Backlinks tool in Prompt Reviews
9. Podcast transcripts are increasingly indexed by search engines and used in AI training data'
WHERE sort_order = 94;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Backlinks", "route": "/dashboard/backlinks"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 94;

-- Task: Create original research or statistics (sort_order 95)
UPDATE wm_library_tasks SET instructions =
'1. Identify unique data your business has access to that others don''t (customer trends, pricing data, industry patterns)
2. Use the Keyword Research tool in Prompt Reviews to find topics where people are looking for data and statistics
3. Conduct a survey, analyze your business data, or compile industry information into a professional report
4. Use the Web Page Planner in Prompt Reviews to outline a research page with clear sections and data visualizations
5. Package findings with charts, key statistics, and a clear summary
6. Write a press release or blog post highlighting the most interesting findings
7. Reach out to industry journalists and bloggers who might cite your data
8. When your data gets cited as "According to [Your Company]...", check LLM Visibility in Prompt Reviews - this is how AI learns to reference your business
9. Update the research annually to maintain its relevance and citation value'
WHERE sort_order = 95;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 95;

-- Task: Maintain active social media presence (sort_order 96)
UPDATE wm_library_tasks SET instructions =
'1. Choose 2-3 platforms where your customers are most active (LinkedIn for B2B, Instagram for visual services, Facebook for local)
2. Use the Social Posting tool in Prompt Reviews to plan and schedule posts in advance
3. Post helpful content 3-5 times per week: tips, project showcases, behind-the-scenes, customer stories
4. Engage genuinely with comments and messages - don''t just broadcast
5. Share your blog posts and expertise content across platforms with platform-appropriate formatting
6. Cross-reference your website and other profiles in your bios
7. Use the LLM Visibility tool in Prompt Reviews to see if active social presence improves AI mentions
8. Focus on being genuinely helpful rather than promotional - the platforms reward engagement'
WHERE sort_order = 96;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 96;

-- Task: Get customer testimonials mentioning your business by name (sort_order 97)
UPDATE wm_library_tasks SET instructions =
'1. Set up a Prompt Page in Prompt Reviews with a personal message asking for detailed feedback
2. In your Prompt Page message, specifically ask customers to mention the service they received
3. When following up in person, say something like: "If you could mention [Business Name] in your review, it really helps others find us"
4. Encourage reviews on multiple platforms: Google, Yelp, Facebook, and industry-specific sites
5. Feature the best testimonials on your website with the customer''s first name and city
6. Check the Reviews tool in Prompt Reviews to track how many reviews mention your business name
7. Use the LLM Visibility tool in Prompt Reviews to see if named mentions improve how AI talks about your business
8. Aim for 2-3 new named testimonials per month for consistent growth'
WHERE sort_order = 97;

-- Task: Write case studies with client names and results (sort_order 98)
UPDATE wm_library_tasks SET instructions =
'1. Select 3-5 successful projects where you can share specific, measurable results
2. Get written permission from each client to use their name, project details, and results
3. Use the Web Page Planner in Prompt Reviews to outline each case study: Challenge, Solution, Results
4. Write each case study with specific numbers: "Reduced energy costs by 47%" not "saved money on energy"
5. Include direct quotes from the client about their experience
6. Add before/after photos or relevant visuals
7. Use the Reviews tool in Prompt Reviews to find complementary review quotes from these same clients
8. Publish case studies on your website and promote them through social media and email
9. Link case studies from relevant service pages to strengthen those pages'
WHERE sort_order = 98;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Prompt Pages", "route": "/prompt-pages"}]'
WHERE sort_order = 98;

-- Task: Claim and optimize LinkedIn company page (sort_order 99)
UPDATE wm_library_tasks SET instructions =
'1. Go to linkedin.com/company/ and claim or create your company page
2. Complete every section: About (use all 2,000 characters), specialties, company size, locations, website
3. Open the Business Profile tool in Prompt Reviews to ensure your business details are consistent with LinkedIn
4. Add your services with detailed descriptions that match your website
5. Use the Social Posting tool in Prompt Reviews to schedule regular LinkedIn posts (2-4 per week)
6. Encourage employees to link their personal profiles to the company page
7. Share thought leadership content: industry insights, project highlights, team achievements
8. Engage with followers'' comments and industry discussions
9. Check the LLM Visibility tool in Prompt Reviews - LinkedIn is heavily referenced by AI models'
WHERE sort_order = 99;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "Business Profile", "route": "/dashboard/business-profile"}, {"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}]'
WHERE sort_order = 99;

-- Task: Create a strong "About Us" narrative (sort_order 100)
UPDATE wm_library_tasks SET instructions =
'1. Check the LLM Visibility tool in Prompt Reviews to see what AI currently says about your company''s background
2. Write your founding story: why you started the business and what problem you solve
3. Highlight your experience: years in business, number of projects completed, areas served
4. Include team bios with qualifications, certifications, and relevant experience
5. Mention notable clients, awards, or achievements with specifics
6. Use the Business Profile tool in Prompt Reviews to ensure your About page details match your profile everywhere
7. Keep the tone authentic and human - avoid corporate jargon
8. Include structured data (Organization schema) on the About page
9. This page is often what AI cites when describing your company - make it comprehensive and accurate'
WHERE sort_order = 100;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "LLM Visibility", "route": "/dashboard/keywords/llm-visibility"}, {"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE sort_order = 100;

-- ============================================================================
-- GBP DEEP DIVE (sort_order 110-115) - More specific steps
-- ============================================================================

-- Task: Create a Google Business posts calendar (sort_order 110)
UPDATE wm_library_tasks SET instructions =
'1. Open the Social Posting tool in Prompt Reviews to plan and schedule your GBP posts
2. Plan 2-4 posts per week covering different types: project updates, tips, seasonal offers, events
3. Write posts that are 150-300 words with a clear call-to-action (Learn More, Call Now, Book Online)
4. Include a high-quality image with every post - posts with images get significantly more engagement
5. Add UTM parameters to links so you can track which posts drive traffic in Analytics
6. Schedule posts in advance using the Social Posting tool to stay consistent
7. Mix content: 40% helpful tips, 30% project showcases, 20% offers/promotions, 10% team/community
8. Track post engagement in the Google Business tool in Prompt Reviews and do more of what works
9. Repurpose your best blog content as GBP posts to maximize content value'
WHERE sort_order = 110;

-- Task: Optimize your GBP Q&A section (sort_order 111)
UPDATE wm_library_tasks SET instructions =
'1. Open your Google Business Profile and navigate to the Q&A section
2. Write 10-15 common questions your customers ask and post them yourself (you can ask and answer your own questions)
3. Write thorough, helpful answers that include relevant service keywords naturally
4. Monitor the Q&A section weekly for new customer questions
5. Answer all new questions within 24 hours with accurate, helpful information
6. Upvote the most helpful Q&As so they appear first
7. Report any spam, inappropriate questions, or competitor-posted misleading answers
8. Check the Google Business tool in Prompt Reviews to monitor your Q&A activity
9. Update answers periodically if your services, pricing, or processes change'
WHERE sort_order = 111;

-- Task: Add all products and services to GBP (sort_order 112)
UPDATE wm_library_tasks SET instructions =
'1. Open the Google Business tool in Prompt Reviews and navigate to your products/services section
2. Create a complete list of every service you offer, organized by category
3. Write a 2-3 sentence description for each service including what''s included, your approach, and why customers choose you
4. Include pricing or price ranges when possible - this helps customers make decisions
5. Add product listings with photos if you sell physical products
6. Organize everything into logical categories that make sense for browsing
7. Use keyword-rich descriptions that match how customers search for these services
8. Review and update the list quarterly - add new services, remove discontinued ones
9. Compare your listing completeness to competitors and ensure you have more detailed service descriptions'
WHERE sort_order = 112;

-- Task: Optimize GBP photos strategically (sort_order 113)
UPDATE wm_library_tasks SET instructions =
'1. Open the Google Business tool in Prompt Reviews and review your current photos
2. Ensure you have a professional logo (square, 250x250 minimum) and an appealing cover photo
3. Add 3-5 interior photos showing your workspace, showroom, or office
4. Add exterior photos so customers can recognize your location
5. Upload 5-10 photos of your best completed work or projects
6. Add team photos - customers like to see the people behind the business
7. Upload new photos monthly: recent projects, seasonal changes, team events
8. Geo-tag photos with your business location before uploading for local relevance
9. Track photo views in GBP insights - photos that get more views tell you what customers want to see'
WHERE sort_order = 113;

-- Task: Complete all GBP attributes and features (sort_order 114)
UPDATE wm_library_tasks SET instructions =
'1. Open the Google Business tool in Prompt Reviews and check your profile completeness
2. Navigate to "Info" > "More" to find all available attributes for your business category
3. Complete every relevant "From the business" attribute (accessibility, amenities, service options)
4. Add payment methods accepted (credit cards, cash, checks, financing)
5. Set up messaging if you can commit to responding within a few hours
6. Add booking links if you use a scheduling system (Calendly, Square, etc.)
7. Check for industry-specific attributes unique to your category (e.g., "Women-led" for eligible businesses)
8. Enable appointment links, menu links, or product links based on what applies to your business
9. Re-check quarterly as Google regularly adds new attributes for different business categories'
WHERE sort_order = 114;

-- Task: Set up GBP messaging and response protocols (sort_order 115)
UPDATE wm_library_tasks SET instructions =
'1. Open the Google Business tool in Prompt Reviews to check your current messaging status
2. Enable messaging in your GBP dashboard under "Messages"
3. Write a professional automated welcome message (e.g., "Thanks for reaching out! We typically respond within 1 hour during business hours.")
4. Create response templates for common questions: pricing inquiries, appointment requests, service area, hours
5. Assign a specific team member to monitor and respond to messages during business hours
6. Set a maximum response time goal (Google shows your average response time to customers)
7. Respond to every message within 4 hours maximum - faster is better
8. If you can''t maintain fast response times, disable messaging rather than having slow responses hurt your profile
9. Track messaging volume and common questions monthly - recurring questions may indicate missing info on your profile'
WHERE sort_order = 115;

-- ============================================================================
-- E-E-A-T BUILDING (sort_order 120-124) - More actionable steps
-- ============================================================================

-- Task: Create detailed author bios (sort_order 120)
UPDATE wm_library_tasks SET instructions =
'1. List every person who creates content for your website (blog posts, service descriptions, guides)
2. Create a dedicated bio page for each author at yoursite.com/about/author-name
3. Include: professional photo, credentials, years of experience, relevant certifications, areas of expertise
4. Add links to their LinkedIn profile and other published work
5. Link each author bio from every piece of content they wrote (add "Written by [Name]" with a link)
6. Include a brief, engaging personal note about why they''re passionate about the industry
7. Check the LLM Visibility tool in Prompt Reviews - author credibility helps AI trust your content
8. Update author bios annually with new credentials, accomplishments, or experience'
WHERE sort_order = 120;

-- Task: Display credentials and qualifications prominently (sort_order 121)
UPDATE wm_library_tasks SET instructions =
'1. Compile a complete list of your business credentials: licenses, certifications, insurance, bonds, degrees
2. Create a "Why choose us" section on your service pages featuring 3-5 key credentials with icons
3. Add license and certification numbers where customers expect to see them (especially regulated industries)
4. Display credential badges in your website footer so they appear on every page
5. Add credential information to your About page with full details
6. Check the Reviews tool in Prompt Reviews to see if customers mention your credentials in reviews
7. Include credentials in your Google Business Profile description
8. Use the Business Profile tool in Prompt Reviews to ensure credentials are listed consistently everywhere
9. Update immediately when you earn new certifications or renew existing ones'
WHERE sort_order = 121;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Reviews", "route": "/dashboard/reviews"}, {"name": "Business Profile", "route": "/dashboard/business-profile"}]'
WHERE sort_order = 121;

-- Task: Add comprehensive privacy and terms pages (sort_order 122)
UPDATE wm_library_tasks SET instructions =
'1. Check if your website already has privacy and terms pages - if they''re generic templates, they need updating
2. Create a privacy policy that covers: what data you collect, how you use it, who you share it with, and how to opt out
3. Add a terms of service page covering: service agreements, liability limitations, dispute resolution
4. Include an accessibility statement if you''ve made accessibility improvements
5. Use the Business Profile tool in Prompt Reviews to ensure your contact information is prominently linked from these pages
6. Link privacy and terms pages from your website footer so they appear on every page
7. Date your policies and update them annually or whenever your practices change
8. If you''re in a regulated industry, consult with a legal professional to ensure compliance'
WHERE sort_order = 122;

-- Task: Showcase awards and recognition (sort_order 123)
UPDATE wm_library_tasks SET instructions =
'1. List every award, recognition, and "Best of" mention your business has received
2. Create a dedicated awards section on your homepage or About page
3. Display award badges and logos with the year received
4. Check the Reviews tool in Prompt Reviews - high review volume and ratings can qualify you for review platform awards
5. Add customer choice awards from review platforms (Yelp, Houzz, Angi, etc.)
6. Include "Best of [City]" mentions from local publications
7. Submit your business for relevant industry awards you haven''t applied to yet
8. Update your awards section annually and remove outdated recognitions (older than 3-5 years)
9. Add awards to your Google Business Profile description and social media bios'
WHERE sort_order = 123;

-- Task: Add real contact information and location details (sort_order 124)
UPDATE wm_library_tasks SET instructions =
'1. Open the Business Profile tool in Prompt Reviews and verify all contact information is current
2. Display your full street address on your contact page (not just city/state)
3. Include multiple contact methods: phone number (with click-to-call), email, and physical address
4. Add a Google Maps embed on your contact page showing your location
5. Show business hours clearly on the contact page and in the footer
6. Include photos of your physical location or office to build trust
7. Add LocalBusiness schema with your complete contact information
8. Verify your contact page information matches your Google Business Profile and all directory listings exactly'
WHERE sort_order = 124;

-- ============================================================================
-- UX / ENGAGEMENT SIGNALS (sort_order 130-134) - More concrete steps
-- ============================================================================

-- Task: Reduce bounce rate on key landing pages (sort_order 130)
UPDATE wm_library_tasks SET instructions =
'1. Open Analytics in Prompt Reviews and identify your top 5 landing pages with the highest bounce rates
2. Visit each page and assess: does the headline match what the searcher is looking for?
3. Add a clear value proposition above the fold that tells visitors they''re in the right place
4. Improve page load speed: compress images, minimize scripts, enable caching
5. Replace walls of text with scannable content: short paragraphs, bullet points, and subheadings
6. Add an engaging visual element above the fold (relevant photo, video, or graphic)
7. Include a clear CTA or next step so visitors know what to do
8. Add internal links to related content to encourage visitors to explore further
9. Re-check bounce rates in Analytics after 2-4 weeks to measure improvement'
WHERE sort_order = 130;

-- Task: Improve time on page with engaging content (sort_order 131)
UPDATE wm_library_tasks SET instructions =
'1. Open Analytics in Prompt Reviews and identify pages with the lowest average time on page
2. For each low-engagement page, assess the content: is it useful? Is it well-formatted?
3. Break long paragraphs into 2-3 sentences max and add white space between sections
4. Add subheadings every 2-3 paragraphs so visitors can scan and find what they need
5. Include relevant images, videos, or before/after photos every 300-400 words
6. Add bullet points and numbered lists for processes, tips, or features
7. Include internal links to related content: "Learn more about [related topic]"
8. Add a table of contents for longer pages (1,500+ words) with jump links
9. Monitor time on page in Analytics over the next month to track improvement'
WHERE sort_order = 131;

-- Task: Create clear site navigation (sort_order 132)
UPDATE wm_library_tasks SET instructions =
'1. Open your website and count your main navigation items - if more than 7, simplify
2. Use clear, descriptive labels for navigation items (e.g., "Services" not "Solutions", "About" not "Our Story")
3. Group related pages under dropdown menus logically (e.g., "Services" > individual service pages)
4. Ensure the most important pages are accessible within 2 clicks from any page
5. Add breadcrumbs on interior pages so visitors always know where they are (Home > Services > Plumbing)
6. Add a search function if your site has more than 20 pages
7. Use the Domain Analysis tool in Prompt Reviews to check for crawl and navigation issues
8. Test navigation on mobile: does the hamburger menu work? Can visitors find services easily?
9. Add a clear footer navigation with links to all important pages, contact info, and social profiles'
WHERE sort_order = 132;

-- Task: Optimize above-the-fold content (sort_order 133)
UPDATE wm_library_tasks SET instructions =
'1. Open your homepage on both desktop and mobile and screenshot what''s visible without scrolling
2. Check that your main headline clearly communicates what you do and who you serve
3. Add your primary value proposition in a brief subheadline (e.g., "Licensed, insured, same-day service")
4. Include a prominent CTA button above the fold on every important page
5. Add a relevant hero image or video that supports your message
6. Ensure above-fold content loads fast: optimize hero images, avoid heavy animations
7. On mobile, verify the CTA is visible and tappable without scrolling
8. Check Analytics in Prompt Reviews to compare bounce rates before and after changes
9. Test with 2-3 people who aren''t familiar with your business: do they understand what you offer within 5 seconds?'
WHERE sort_order = 133;

-- Task: Improve mobile user experience (sort_order 134)
UPDATE wm_library_tasks SET instructions =
'1. Open your website on an actual mobile phone (not just a desktop browser resized)
2. Navigate to every main page and try completing key actions: find a phone number, submit a form, read a service page
3. Check that all buttons and links have at least 44x44 pixel tap targets with visible spacing
4. Verify text is at least 16px and readable without zooming on all pages
5. Test all forms on mobile: are fields easy to tap? Does the keyboard type match (phone pad for phone, email keyboard for email)?
6. Check that images and videos resize properly and don''t break the layout
7. Use the Domain Analysis tool in Prompt Reviews to check your mobile performance score
8. Fix the most impactful issues first: tap targets, font size, and form usability affect conversions most
9. Test after each fix on at least 2 different phones (iPhone and Android)'
WHERE sort_order = 134;

-- ============================================================================
-- CONTENT TYPES (sort_order 140-144) - Add Web Page Planner where applicable
-- ============================================================================

-- Task: Create video content for key services (sort_order 140)
UPDATE wm_library_tasks SET instructions =
'1. Identify your top 3 services by revenue - these get video content first
2. Plan 1-2 minute videos for each: what the service includes, your process, and why customers choose you
3. Film with a smartphone in good lighting - authenticity often outperforms expensive production
4. Include customer testimonial videos if possible (even short 30-second clips are valuable)
5. Create how-to or educational videos that answer common customer questions
6. Upload each video to YouTube with an SEO-optimized title, description, and tags using keywords from your keyword research
7. Embed videos on the relevant service pages of your website
8. Add video thumbnails and schema markup for video rich results in search
9. Track video views and engagement in Analytics in Prompt Reviews
10. Repurpose video content: use clips on social media, turn transcripts into blog posts'
WHERE sort_order = 140;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 140;

-- Task: Write comparison content for your industry (sort_order 141)
UPDATE wm_library_tasks SET instructions =
'1. Use the Keyword Research tool in Prompt Reviews to find "vs" and comparison keywords in your industry
2. Identify the comparisons your customers commonly make (e.g., "hardwood vs laminate flooring")
3. Use the Web Page Planner in Prompt Reviews to outline a balanced comparison article for each topic
4. Write fair, honest comparisons that help customers make informed decisions
5. Include comparison tables for quick scanning of key differences
6. Mention your service as one option and be transparent about pros and cons
7. Add your professional opinion based on experience - this is where your expertise shines
8. Include a CTA for customers who want personalized advice after reading the comparison
9. Target "[option A] vs [option B]" keywords in the title tag and H1'
WHERE sort_order = 141;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}]'
WHERE sort_order = 141;

-- Task: Create "Best of [City]" local content (sort_order 142)
UPDATE wm_library_tasks SET instructions =
'1. Use the Keyword Research tool in Prompt Reviews to check volume for "best [category] in [your city]" variations
2. Choose 2-3 local listicle topics related to your industry (e.g., "Best Kitchen Showrooms in Portland")
3. Use the Web Page Planner in Prompt Reviews to outline a helpful guide with 5-10 recommendations
4. Include genuinely helpful recommendations - yes, even competitors if they deserve inclusion
5. Write original descriptions for each recommendation based on your knowledge of the local market
6. Add practical details: address, hours, what they specialize in, price range
7. Be fair and credible - biased or fake-looking lists don''t rank or earn trust
8. Track rankings in Rank Tracking and visibility in Local Ranking Grids in Prompt Reviews
9. Update lists annually to keep them current and relevant'
WHERE sort_order = 142;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Local Ranking Grids", "route": "/dashboard/local-ranking-grids"}]'
WHERE sort_order = 142;

-- Task: Design a visual infographic (sort_order 143)
UPDATE wm_library_tasks SET instructions =
'1. Choose a topic with interesting data or a process your audience cares about
2. Use the Keyword Research tool in Prompt Reviews to find a topic with search volume and sharing potential
3. Collect your data: industry statistics, survey results, process steps, or cost breakdowns
4. Create a visually appealing infographic using tools like Canva, Piktochart, or a designer
5. Include your branding subtly: logo and URL at the bottom, brand colors throughout
6. Publish the infographic on a dedicated page with surrounding text content (300+ words explaining the data)
7. Create an embed code so other websites can easily share it with a link back to you
8. Promote to relevant blogs, publications, and social media
9. Track backlinks earned using the Backlinks tool in Prompt Reviews'
WHERE sort_order = 143;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Backlinks", "route": "/dashboard/backlinks"}]'
WHERE sort_order = 143;

-- Task: Write "How to Choose" guides (sort_order 144)
UPDATE wm_library_tasks SET instructions =
'1. Identify your top 2-3 services where customers commonly need help choosing a provider
2. Use the Keyword Research tool in Prompt Reviews to check volume for "how to choose a [service provider]"
3. Use the Web Page Planner in Prompt Reviews to outline a comprehensive decision guide
4. Write an honest guide covering: key criteria to evaluate, questions to ask providers, red flags to watch for
5. Include a downloadable checklist or decision framework that visitors can save
6. Be genuinely helpful first, promotional second - discuss what makes ANY good provider, not just you
7. Add your expertise throughout: "In our 15 years of experience, the most important factor is..."
8. Include a CTA at the end: "Ready to talk? Here''s how we stack up against these criteria"
9. Track the guide''s performance in Analytics and Rank Tracking in Prompt Reviews'
WHERE sort_order = 144;

UPDATE wm_library_tasks SET relevant_tools =
'[{"name": "Keyword Research", "route": "/dashboard/research/keywords"}, {"name": "Web Page Planner", "route": "/dashboard/web-page-outlines"}, {"name": "Analytics", "route": "/dashboard/analytics"}]'
WHERE sort_order = 144;
