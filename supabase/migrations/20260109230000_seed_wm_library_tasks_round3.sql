-- Additional Work Manager Library Tasks: Round 3
-- Conversion, GBP Deep Dive, E-E-A-T, UX, and Content Types
-- Brings total to 100 tasks

-- Helper function to get pack ID by name
CREATE OR REPLACE FUNCTION get_pack_id(pack_name TEXT) RETURNS UUID AS $$
  SELECT id FROM wm_library_packs WHERE name = pack_name LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================================
-- CONVERSION OPTIMIZATION TASKS
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 75
('Optimize your calls-to-action (CTAs)',
'Improve the buttons and links that drive conversions on your key pages.',
'1. Audit CTAs on your top 5 pages
2. Use action-oriented language ("Get Your Free Quote" vs "Submit")
3. Make CTAs visually prominent with contrasting colors
4. Place CTAs above the fold and after key content sections
5. Test different wording and placement',
'Traffic without conversions is wasted effort. Google''s leaked documents reference user satisfaction signals - when visitors complete their goal on your site, it signals quality. Clear, compelling CTAs guide visitors to take action. Better conversion rates mean more leads from the same traffic.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Service page', 'Homepage', 'Location page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
101),

-- Task 76
('Add trust signals throughout your site',
'Display credibility indicators that build visitor confidence.',
'1. Add industry certifications and licenses prominently
2. Display association memberships and badges
3. Include insurance/bonding information if applicable
4. Show years in business or experience
5. Add security badges near forms and checkout',
'Trust signals reduce friction in the buying process. Visitors need to feel safe before contacting you or making a purchase. Google''s quality guidelines emphasize trustworthiness (the T in E-E-A-T). Visible trust signals also reduce bounce rate as visitors feel confident staying on your site.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Homepage', 'Service page', 'Contact page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
102),

-- Task 77
('Optimize your contact forms for conversions',
'Reduce friction and increase form submissions.',
'1. Minimize required fields (name, email/phone, message is often enough)
2. Use clear field labels and helpful placeholder text
3. Add a compelling submit button (not just "Submit")
4. Include a brief privacy assurance near the form
5. Test form on mobile devices',
'Every extra field reduces completion rates by roughly 10%. Simple forms convert better. Google tracks user behavior - if visitors start forms but don''t complete them, it signals friction. Make it as easy as possible for potential customers to reach you.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Contact page', 'Service page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
103),

-- Task 78
('Add social proof near conversion points',
'Place testimonials and trust indicators where decisions are made.',
'1. Add testimonials near CTAs and contact forms
2. Display review counts or ratings prominently
3. Show customer logos or "As seen in" badges if applicable
4. Include case study links near service descriptions
5. Add real-time activity ("5 people requested quotes today")',
'Social proof influences decisions at the critical moment. When visitors see others have had good experiences, they''re more likely to convert. Place proof strategically - not just on a testimonials page, but right where someone is deciding whether to contact you.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Service page', 'Homepage'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "Reviews", "route": "/dashboard/reviews"}]',
104),

-- Task 79
('Create dedicated landing pages for key services',
'Build focused pages optimized for specific conversions.',
'1. Create one landing page per major service or offer
2. Remove navigation distractions (simplified header/footer)
3. Focus on a single CTA per page
4. Include all information needed to make a decision
5. Add urgency or incentive when appropriate',
'Dedicated landing pages convert better than general pages because they match visitor intent precisely. Someone searching "emergency plumber" should land on a page focused entirely on emergency plumbing - not your homepage. Focused pages also rank better for specific queries.',
'search_visibility',
ARRAY['Get more leads', 'Improve rankings for keyword'],
ARRAY['Service page'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
105),

-- Task 80
('Add click-to-call and easy contact options',
'Make it effortless for mobile visitors to contact you.',
'1. Add click-to-call phone links (tel: links)
2. Include a sticky header or footer with contact info on mobile
3. Add a floating contact button or chat widget
4. Enable text/SMS as a contact option if possible
5. Add Google Maps link for directions',
'Over 60% of searches are mobile, and mobile users want to act immediately. A phone number that requires copying and pasting loses leads. Click-to-call can increase mobile conversions by 200%+. Make every contact method one tap away.',
'search_visibility',
ARRAY['Get more leads', 'Get more sales'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'easy',
'5_15_min',
'[]',
106);

-- ============================================================================
-- GOOGLE BUSINESS PROFILE DEEP DIVE
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 81
('Create a Google Business posts calendar',
'Plan and schedule regular GBP posts to stay active and visible.',
'1. Plan 2-4 posts per week (minimum 1)
2. Mix content types: updates, offers, events, tips
3. Include images with every post
4. Add clear CTAs with links when appropriate
5. Track which post types get the most engagement',
'Regular GBP posts signal an active, engaged business. Google''s local algorithm favors profiles with recent activity. Posts appear in your Business Profile and can show in local search results. Consistency matters more than perfection - keep showing up.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Social Posting", "route": "/dashboard/social-posting"}, {"name": "Google Business", "route": "/dashboard/google-business"}]',
110),

-- Task 82
('Optimize your GBP Q&A section',
'Proactively populate and manage the Questions & Answers feature.',
'1. Add your own common questions (you can ask and answer)
2. Monitor for new customer questions weekly
3. Answer all questions promptly and thoroughly
4. Upvote the most helpful Q&As
5. Report spam or inappropriate questions',
'The Q&A section influences potential customers but is often neglected. You can seed it with your most common questions and authoritative answers. This prevents wrong answers from random users and provides helpful info right in your GBP listing. AI assistants may also reference Q&A content.',
'local_visibility',
ARRAY['Optimize Google Business', 'Improve mentions in LLMs'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
111),

-- Task 83
('Add all products and services to GBP',
'Fully populate the Products and Services sections of your profile.',
'1. Add every service you offer with descriptions
2. Include pricing or price ranges where possible
3. Add product listings with photos if you sell products
4. Organize into logical categories
5. Keep descriptions keyword-rich but natural',
'Products and Services sections give Google detailed information about what you offer. This helps match your profile to relevant searches. Complete listings also give potential customers the information they need to choose you. Many competitors skip this - it''s an easy advantage.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'45_120_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
112),

-- Task 84
('Optimize GBP photos strategically',
'Add and organize photos that showcase your business effectively.',
'1. Add a high-quality logo and cover photo
2. Include interior and exterior photos
3. Add photos of your team at work
4. Show finished projects or products
5. Add new photos regularly (monthly minimum)',
'Businesses with photos get 42% more requests for directions and 35% more website clicks. Google uses photos to understand your business better. Customer-uploaded photos are good, but you should control the narrative with professional images of your best work.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
113),

-- Task 85
('Complete all GBP attributes and features',
'Fill out every available attribute and special feature for your business.',
'1. Complete all "From the business" attributes
2. Add accessibility information
3. Set up messaging if you can respond promptly
4. Add booking links if you use a scheduling system
5. Check for industry-specific attributes',
'GBP attributes help Google match you to specific searches. Someone searching "wheelchair accessible restaurant" will only see businesses with that attribute. Many attributes are hidden in the dashboard - explore thoroughly. Each completed attribute is a potential search match.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
114),

-- Task 86
('Set up GBP messaging and response protocols',
'Enable and manage direct messaging from your Google Business Profile.',
'1. Enable messaging in your GBP dashboard
2. Set up automated welcome message
3. Create response templates for common questions
4. Set expectations for response time (and meet them)
5. Assign team member responsibility for responses',
'GBP messaging provides another way for customers to reach you. Quick response times improve your profile''s performance. Google tracks messaging responsiveness. If you enable it, commit to responding within hours, not days. Poor response times can hurt your visibility.',
'local_visibility',
ARRAY['Optimize Google Business', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile'],
'easy',
'15_45_min',
'[{"name": "Google Business", "route": "/dashboard/google-business"}]',
115);

-- ============================================================================
-- E-E-A-T BUILDING (Experience, Expertise, Authoritativeness, Trust)
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 87
('Create detailed author bios for content creators',
'Establish credibility for everyone who creates content on your site.',
'1. Create a bio page for each content author
2. Include relevant credentials, experience, and expertise
3. Add professional photos
4. Link to social profiles and other publications
5. Link author bios from all their content',
'Google''s quality guidelines explicitly mention author expertise. The leaked documents reference author credibility signals. For YMYL (Your Money Your Life) topics especially, showing who writes your content and why they''re qualified matters. Author pages also help AI understand the expertise behind your content.',
'ai_visibility',
ARRAY['Increase authority', 'Improve mentions in LLMs'],
ARRAY['About page', 'Blog post'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
120),

-- Task 88
('Display credentials and qualifications prominently',
'Showcase the expertise behind your business.',
'1. List professional licenses and certifications
2. Display degrees and formal training
3. Show years of experience and specializations
4. Add "Why choose us" section with qualifications
5. Include credentials in footer or sidebar site-wide',
'Credentials provide objective proof of expertise. Google''s E-E-A-T framework values demonstrated expertise. For service businesses especially, licenses and certifications differentiate you from unqualified competitors. Make these visible - don''t assume visitors will dig for them.',
'search_visibility',
ARRAY['Increase authority', 'Get more leads'],
ARRAY['Homepage', 'About page', 'Service page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
121),

-- Task 89
('Add comprehensive privacy and terms pages',
'Build trust with clear policies and legal compliance.',
'1. Create a detailed privacy policy
2. Add terms of service/conditions
3. Include accessibility statement if applicable
4. Link policies from every page (footer)
5. Keep policies updated and dated',
'Privacy and terms pages signal a legitimate, trustworthy business. They''re required by law in many cases (GDPR, CCPA). Google''s quality guidelines mention trust signals. These pages also prevent legal issues and show visitors you take their data seriously.',
'search_visibility',
ARRAY['Increase authority', 'Get more leads'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
122),

-- Task 90
('Showcase awards and recognition',
'Display third-party validation of your quality.',
'1. List industry awards and recognition
2. Display "Best of" badges from local publications
3. Add association rankings or ratings
4. Include customer choice or review site awards
5. Keep awards section updated annually',
'Awards provide third-party validation that''s more credible than self-praise. Google''s algorithms look for external signals of quality. Awards and recognition from industry bodies, local media, or review sites build trust with both search engines and potential customers.',
'search_visibility',
ARRAY['Increase authority', 'Get more leads'],
ARRAY['Homepage', 'About page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
123),

-- Task 91
('Add real contact information and location details',
'Demonstrate you''re a real, reachable business.',
'1. Display full business address (not just city)
2. Include multiple contact methods (phone, email)
3. Add a Google Maps embed on contact page
4. Show business hours clearly
5. Include photos of your physical location if applicable',
'Google''s leaked documents mention "contact information" as a quality signal. Being transparent about who and where you are builds trust. Hiding contact information is a spam signal. Even service-area businesses should have a clear base of operations and easy contact methods.',
'search_visibility',
ARRAY['Increase authority', 'Get more leads'],
ARRAY['Contact page', 'Homepage'],
ARRAY[]::TEXT[],
'easy',
'5_15_min',
'[]',
124);

-- ============================================================================
-- USER EXPERIENCE / ENGAGEMENT SIGNALS
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 92
('Reduce bounce rate on key landing pages',
'Keep visitors engaged when they first arrive on your site.',
'1. Ensure headline matches search intent immediately
2. Add a clear value proposition above the fold
3. Improve page load speed
4. Use engaging visuals, not walls of text
5. Include clear next steps/CTAs',
'Bounce rate is a user satisfaction signal. Google''s NavBoost system tracks whether users return to search results after visiting your page. If they bounce immediately, it signals your page didn''t meet their needs. First impressions matter - visitors decide in seconds whether to stay.',
'fix_issues',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Homepage', 'Service page', 'Location page'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[{"name": "Analytics", "route": "/dashboard/analytics"}]',
130),

-- Task 93
('Improve time on page with engaging content',
'Create content that keeps visitors reading and exploring.',
'1. Use short paragraphs and plenty of white space
2. Add subheadings every 2-3 paragraphs
3. Include images, videos, or infographics
4. Add internal links to related content
5. Use bullet points and numbered lists',
'Time on page indicates content quality. Google''s leaked documents reference engagement signals. Longer engagement suggests your content is valuable. But don''t pad content - make it genuinely useful and scannable. Good formatting keeps readers moving through your content.',
'search_visibility',
ARRAY['Improve traffic', 'Improve rankings for keyword'],
ARRAY['Blog post', 'Service page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
131),

-- Task 94
('Create clear site navigation',
'Make it easy for visitors to find what they need.',
'1. Limit main navigation to 5-7 items
2. Use clear, descriptive labels (not clever/cute names)
3. Group related pages logically
4. Include a search function for larger sites
5. Add breadcrumbs for deep pages',
'Good navigation reduces friction and helps both users and search engines. Confused visitors leave. Clear navigation keeps them exploring. Google also uses navigation structure to understand site hierarchy. The leaked documents mention crawling efficiency - simple navigation aids discovery.',
'fix_issues',
ARRAY['Improve site structure', 'Improve traffic'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
132),

-- Task 95
('Optimize above-the-fold content',
'Make the first screen of every page work hard.',
'1. Include your main headline and value proposition
2. Add a relevant image or video
3. Include a CTA or clear next step
4. Ensure fast load time for this content
5. Test on mobile - above-fold is different on phones',
'What visitors see before scrolling determines whether they stay. Most visitors never scroll on pages that don''t immediately hook them. The most important content must be visible without scrolling. This is especially critical on mobile where above-fold space is limited.',
'search_visibility',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Homepage', 'Service page', 'Location page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
133),

-- Task 96
('Improve mobile user experience',
'Ensure your site works flawlessly on phones and tablets.',
'1. Test all pages on actual mobile devices
2. Ensure buttons are large enough to tap (44x44px minimum)
3. Check that forms are easy to complete on mobile
4. Verify text is readable without zooming
5. Test mobile page speed separately',
'Mobile-first indexing means Google primarily uses your mobile site for rankings. Poor mobile experience directly hurts rankings. But beyond SEO, over 60% of your visitors are on mobile. A frustrating mobile experience means lost customers, not just lost rankings.',
'fix_issues',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Site-wide'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
134);

-- ============================================================================
-- CONTENT TYPES
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 97
('Create video content for key services',
'Add video to your most important pages to boost engagement.',
'1. Plan 1-2 minute videos for top services
2. Include customer testimonial videos if possible
3. Create how-to or educational videos
4. Upload to YouTube with optimized titles/descriptions
5. Embed videos on relevant website pages',
'Video dramatically increases engagement and time on page. Google owns YouTube and favors video content in many searches. Video thumbnails in search results increase click-through rate. Even simple videos shot on a phone can be effective - authenticity often beats production value.',
'search_visibility',
ARRAY['Improve traffic', 'Get more leads'],
ARRAY['Service page', 'Homepage'],
ARRAY[]::TEXT[],
'medium',
'multi_step',
'[]',
140),

-- Task 98
('Write comparison content for your industry',
'Create "vs" and comparison content that captures decision-stage searches.',
'1. Identify comparisons customers commonly make
2. Write fair, balanced comparison content
3. Include your service as one option (honestly)
4. Add comparison tables for scannability
5. Target "[option A] vs [option B]" keywords',
'Comparison searches indicate someone is ready to decide. "WordPress vs Squarespace" or "plumber vs handyman for leak" are high-intent queries. Being the resource that helps them decide positions you as helpful and authoritative. Be honest - biased comparisons backfire.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Get more leads'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
141),

-- Task 99
('Create "Best of [City]" local content',
'Write local listicles that attract links and establish local authority.',
'1. Create "Best [category] in [Your City]" guides
2. Include genuinely helpful recommendations
3. Be fair - include competitors if deserved
4. Add original insights or experiences
5. Keep lists updated annually',
'Local "best of" content attracts searches and links. People search for local recommendations constantly. By being the local authority on topics related to your industry, you build relevance. Include competitors where appropriate - it makes you credible and they may link back.',
'local_visibility',
ARRAY['Improve rankings for keyword', 'Increase authority'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
142),

-- Task 100
('Design a visual infographic for your industry',
'Create shareable visual content that earns links and mentions.',
'1. Choose a topic with interesting data or process
2. Design a visually appealing infographic
3. Include your branding subtly
4. Create an embed code for easy sharing
5. Promote to relevant blogs and publications',
'Infographics are highly shareable and earn backlinks naturally. Complex information presented visually is more accessible and memorable. When other sites embed your infographic, they link back. This is a proven link-building tactic that also builds brand awareness.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY['Blog post'],
ARRAY['Backlinks'],
'advanced',
'multi_step',
'[]',
143),

-- Task 100 (actual last one)
('Write "How to Choose" guides for your services',
'Create decision-helper content that builds trust and captures searches.',
'1. Write "How to Choose a [Your Service Type]" guide
2. Include honest criteria customers should consider
3. Address common mistakes and red flags
4. Be helpful first - promotional second
5. Include a checklist or decision framework',
'Decision-guide content captures people at the consideration stage. By helping them make a good choice (even if they don''t choose you), you build trust and authority. Many will choose you because you proved your expertise by educating them. This content also ranks well for research queries.',
'search_visibility',
ARRAY['Improve rankings for keyword', 'Get more leads'],
ARRAY['Blog post'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
144);

-- ============================================================================
-- Link new tasks to relevant packs
-- ============================================================================

-- Add conversion tasks to Service Page Growth Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Service Page Growth Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (101, 102, 103, 104, 105, 106);

-- Add GBP tasks to Local Visibility Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Local Visibility Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (110, 111, 112, 113, 114, 115);

-- Add E-E-A-T tasks to AI Visibility Starter Pack (they help AI trust signals too)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('AI Visibility Starter Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (120, 121, 123);

-- Add UX tasks to Technical Cleanup Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Technical Cleanup Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (130, 132, 134);

-- Add content type tasks to Content Growth Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Content Growth Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (140, 141, 142, 144);

-- Clean up helper function
DROP FUNCTION IF EXISTS get_pack_id(TEXT);
