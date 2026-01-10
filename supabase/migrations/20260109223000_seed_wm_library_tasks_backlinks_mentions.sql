-- Additional Work Manager Library Tasks: Backlinks & AI Mentions
-- Focused on link building and getting mentioned for AI visibility

-- Helper function to get pack ID by name
CREATE OR REPLACE FUNCTION get_pack_id(pack_name TEXT) RETURNS UUID AS $$
  SELECT id FROM wm_library_packs WHERE name = pack_name LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================================
-- BACKLINK BUILDING TASKS
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 55
('Analyze competitor backlinks for opportunities',
'Research where competitors get links and identify opportunities for your business.',
'1. Use a backlink tool to analyze 3-5 competitors
2. Export their backlink profiles
3. Look for patterns: directories, blogs, news sites, associations
4. Identify links you could also get (directories, associations)
5. Note content that earned them links (guides, tools, research)',
'Understanding where competitors get links reveals proven opportunities. If a local news site links to them, they might link to you. If they''re in industry directories you''re not, that''s an easy win. Google''s leaked documents confirm link relevance matters - competitor links are often highly relevant since you share an industry.',
'research',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Backlinks'],
'medium',
'45_120_min',
'[{"name": "Backlinks", "route": "/dashboard/backlinks"}]',
80),

-- Task 56
('Create a linkable asset (guide, tool, or resource)',
'Develop content specifically designed to attract backlinks naturally.',
'1. Identify what your audience frequently searches for or needs
2. Create something genuinely useful: calculator, checklist, comprehensive guide
3. Make it the best resource available on the topic
4. Add unique data, visuals, or insights
5. Promote to relevant sites that might link to it',
'The best links come naturally when you create something worth linking to. Google''s leaked documents emphasize "quality" and "effort" signals. A genuinely useful resource - like an industry calculator, cost guide, or how-to checklist - earns links because people want to share it with their audiences. This is sustainable link building.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY['Blog post'],
ARRAY['Backlinks'],
'advanced',
'multi_step',
'[]',
81),

-- Task 57
('Pursue guest posting on industry blogs',
'Write valuable content for other websites in exchange for a link back.',
'1. List 10-20 blogs in your industry that accept guest posts
2. Study their content style and audience
3. Pitch unique, valuable topic ideas (not promotional)
4. Write high-quality, helpful content
5. Include a natural link to your site in author bio or content',
'Guest posting builds relationships and earns contextual links from relevant sites. The key is providing genuine value, not just chasing links. Google''s leaked documents suggest they can detect low-quality guest posts. Focus on sites with real audiences and write content you''d be proud to have on your own site.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Backlinks', 'PR / Mentions'],
'advanced',
'multi_step',
'[]',
82),

-- Task 58
('Reclaim unlinked brand mentions',
'Find places your business is mentioned but not linked, and request links.',
'1. Search Google for your business name (exclude your own site)
2. Check news mentions, blog posts, and directory listings
3. Identify mentions without a link to your site
4. Reach out politely to request a link be added
5. Provide the specific URL they should link to',
'Unlinked mentions are low-hanging fruit. Someone already thought enough of your business to mention it - they just forgot the link. A polite request converts many of these to actual backlinks. This approach has high success rates because you''re not asking for new coverage, just a small addition to existing content.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Backlinks', 'PR / Mentions'],
'medium',
'45_120_min',
'[]',
83),

-- Task 59
('Build relationships with local journalists and bloggers',
'Become a go-to source for local media in your area of expertise.',
'1. Identify local news outlets, blogs, and podcasts
2. Follow journalists who cover your industry or local business
3. Offer to be a source for future stories
4. Respond quickly when they need expert quotes
5. Share their work and engage genuinely on social media',
'Local press links are highly valuable for local businesses. Journalists need expert sources - by positioning yourself as available and knowledgeable, you become their go-to for quotes. Each mention typically includes a link. Google''s leaked documents suggest local relevance strengthens these links'' value.',
'local_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions', 'Backlinks'],
'medium',
'multi_step',
'[]',
84),

-- Task 60
('Use HARO or similar services for media mentions',
'Respond to journalist queries to earn press coverage and links.',
'1. Sign up for HARO (Help A Reporter Out) or similar services
2. Set up alerts for your industry keywords
3. Respond quickly to relevant queries (within hours)
4. Provide concise, quotable answers with your credentials
5. Follow up professionally if selected',
'HARO connects you directly with journalists seeking sources. A good quote can land you in major publications with authoritative backlinks. Speed and quality matter - journalists have deadlines. Even small publications can provide valuable links. This is how small businesses get featured in big media.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions', 'Backlinks'],
'medium',
'15_45_min',
'[]',
85),

-- Task 61
('Fix broken links pointing to your site',
'Reclaim link equity from backlinks pointing to pages that no longer exist.',
'1. Check Search Console for 404 pages with backlinks
2. Use a backlink tool to find links to broken pages
3. Redirect broken URLs to the most relevant current page
4. If no relevant page exists, consider recreating the content
5. Contact linking sites to update URLs if redirects aren''t possible',
'When external sites link to pages you''ve removed, you lose that link value. Setting up proper 301 redirects preserves the equity from those backlinks. Google''s leaked documents confirm PageRank still flows through redirects. This is recovery work that restores authority you''ve already earned.',
'fix_issues',
ARRAY['Increase authority', 'Improve site structure'],
ARRAY['Site-wide'],
ARRAY['Backlinks'],
'medium',
'45_120_min',
'[{"name": "Backlinks", "route": "/dashboard/backlinks"}]',
86),

-- Task 62
('Get listed on industry resource pages',
'Find resource pages in your industry and request inclusion.',
'1. Search for "[your industry] resources" or "best [service] companies"
2. Identify legitimate resource lists and roundups
3. Evaluate if your business genuinely belongs
4. Reach out with a personalized request explaining your value
5. Suggest where you''d fit on the page',
'Resource pages exist to help visitors find relevant services. If you genuinely offer value, you deserve to be listed. These contextual links from industry-relevant pages carry significant weight. Google''s leaked documents emphasize topical relevance - a link from an industry resource page signals you belong in that space.',
'search_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Backlinks', 'Directories / Citations'],
'medium',
'45_120_min',
'[]',
87),

-- Task 63
('Create local partnerships for mutual linking',
'Partner with complementary local businesses for referrals and links.',
'1. List non-competing businesses that serve your customers
2. Reach out to discuss mutual referral relationships
3. Offer to add them to a "partners" or "recommended" page
4. Request they do the same for you
5. Make the relationship genuine - actually refer customers',
'Links from local partners are highly relevant and natural. A wedding photographer linking to a florist makes sense to Google. These reciprocal relationships, when genuine, aren''t penalized because they reflect real business partnerships. Focus on businesses your customers actually need.',
'local_visibility',
ARRAY['Get links and mentions', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Backlinks'],
'easy',
'45_120_min',
'[]',
88);

-- ============================================================================
-- AI MENTIONS & VISIBILITY TASKS
-- ============================================================================

INSERT INTO wm_library_tasks (title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order) VALUES

-- Task 64
('Get active on Reddit in your industry subreddits',
'Build presence and credibility on Reddit where AI models learn from discussions.',
'1. Find subreddits related to your industry and local area
2. Create an account with your real identity/business
3. Answer questions helpfully (never promotional)
4. Share genuine expertise when relevant
5. Build karma and reputation over months, not days',
'AI models like ChatGPT heavily train on Reddit content. Helpful, upvoted answers associated with your business name teach AI that you''re a credible source. Reddit discussions also appear in Google results. The key is genuine helpfulness - obvious self-promotion gets downvoted and ignored.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Social Profiles', 'PR / Mentions'],
'medium',
'multi_step',
'[]',
90),

-- Task 65
('Answer questions on Quora related to your expertise',
'Establish thought leadership on a platform AI models reference.',
'1. Create a Quora profile with your professional credentials
2. Follow topics in your industry
3. Answer questions thoroughly and helpfully
4. Include relevant experience and examples
5. Link to your detailed content when it genuinely helps',
'Quora answers rank in Google and are included in AI training data. Detailed, expert answers establish you as an authority. When AI assistants answer questions about your industry, they may draw from Quora content. Well-written answers can drive traffic for years and influence AI recommendations.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Social Profiles', 'PR / Mentions'],
'easy',
'15_45_min',
'[]',
91),

-- Task 66
('Contribute to Wikipedia (carefully and appropriately)',
'Add accurate information to Wikipedia where appropriate for your industry.',
'1. NEVER create or edit pages about your own business (conflict of interest)
2. Find industry-related articles where you can add value
3. Add well-sourced factual information
4. Follow Wikipedia''s guidelines strictly
5. Consider adding citations to published research or statistics',
'Wikipedia is a primary knowledge source for AI models. While you cannot ethically write about your own business, contributing to industry articles builds understanding of your field. If you have published research or notable achievements, they may be Wikipedia-worthy - but let others add them.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions'],
'advanced',
'multi_step',
'[]',
92),

-- Task 67
('Get mentioned in industry publications and trade media',
'Earn mentions in publications that AI models treat as authoritative.',
'1. Identify top publications in your industry
2. Look for contributor guidelines or journalist contacts
3. Pitch story ideas based on your unique expertise or data
4. Offer to be quoted as an expert source
5. Share newsworthy company milestones or innovations',
'AI models weight authoritative sources more heavily. Industry publications are seen as trustworthy by both Google and AI. A mention in a respected trade publication signals expertise. These mentions persist in AI training data and influence recommendations for years.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions'],
'advanced',
'multi_step',
'[]',
93),

-- Task 68
('Appear on podcasts in your industry',
'Get audio mentions that reinforce your expertise and brand.',
'1. List podcasts your target customers might listen to
2. Research each show''s format and typical guests
3. Prepare 3-5 unique topics you could discuss
4. Pitch yourself as a guest with specific value
5. Prepare talking points that include your business naturally',
'Podcast appearances generate multiple types of mentions: the audio itself, show notes with your bio and links, social media promotion, and often a blog post. These diverse mentions across platforms strengthen your digital footprint. Podcast transcripts are increasingly indexed and used in AI training.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['PR / Mentions', 'Social Profiles'],
'medium',
'multi_step',
'[]',
94),

-- Task 69
('Create original research or statistics others will cite',
'Produce data that becomes a referenced source across the web.',
'1. Identify data you have access to that others don''t
2. Conduct surveys, analyze trends, or compile industry data
3. Package findings into a professional report
4. Write a press release or blog post about key findings
5. Reach out to journalists and bloggers who cover your industry',
'Original data is link and mention gold. When you''re the source of a statistic, everyone who cites it mentions your company. AI models learn these associations. "According to [Your Company], 78% of..." becomes part of how AI understands your industry. This positions you as the authority.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Get links and mentions', 'Increase authority'],
ARRAY['Blog post'],
ARRAY['PR / Mentions', 'Backlinks'],
'advanced',
'multi_step',
'[]',
95),

-- Task 70
('Maintain active, helpful social media presence',
'Build consistent brand presence across platforms AI may reference.',
'1. Choose 2-3 platforms where your customers are active
2. Post helpful content regularly (not just promotions)
3. Engage with followers and industry conversations
4. Share your expertise through tips, insights, and answers
5. Cross-reference your website and other profiles',
'Social media profiles create additional touchpoints for AI to understand your business. Consistent, active profiles with helpful content reinforce your authority. LinkedIn especially is indexed and referenced by AI. The key is being genuinely helpful, not just broadcasting promotions.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Social Profiles'],
'easy',
'15_45_min',
'[{"name": "Social Posting", "route": "/dashboard/social-posting"}]',
96),

-- Task 71
('Get customer testimonials mentioning your business by name',
'Collect reviews and testimonials that associate your brand with quality.',
'1. Ask satisfied customers for detailed testimonials
2. Request they mention your business name specifically
3. Encourage them to post on multiple platforms
4. Feature testimonials prominently on your website
5. Thank and acknowledge customers who leave reviews',
'When happy customers write about their experience and mention your business name, this creates positive associations across the web. AI models learn from these patterns. Multiple mentions of "[Business Name] provided excellent [service]" trains AI to associate your brand with quality.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Get more leads'],
ARRAY[]::TEXT[],
ARRAY['Google Business Profile', 'Directories / Citations'],
'easy',
'15_45_min',
'[{"name": "Prompt Pages", "route": "/prompt-pages"}, {"name": "Reviews", "route": "/dashboard/reviews"}]',
97),

-- Task 72
('Write case studies with client names and results',
'Document success stories that demonstrate expertise with specifics.',
'1. Select 3-5 successful client projects
2. Get permission to use client names and details
3. Document the problem, solution, and measurable results
4. Include quotes from the client
5. Publish on your website and share widely',
'Case studies with real names and real results are highly credible content. AI models learn to associate your business with successful outcomes. Specific details ("increased revenue by 47%") are more convincing than vague claims. Case studies also attract links and get shared.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Get more leads', 'Increase authority'],
ARRAY['Case study'],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[]',
98),

-- Task 73
('Claim and optimize your LinkedIn company page',
'Build professional presence on the platform AI heavily references.',
'1. Claim or create your LinkedIn company page
2. Complete all sections: about, specialties, locations
3. Add your services with descriptions
4. Post updates regularly (2-4 per week)
5. Encourage employees to link their profiles',
'LinkedIn is treated as an authoritative business source by AI models. A complete, active company page reinforces your business information and expertise. LinkedIn content is well-indexed and frequently appears in search results. For B2B especially, this is a critical presence.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY[]::TEXT[],
ARRAY['Social Profiles'],
'easy',
'15_45_min',
'[]',
99),

-- Task 74
('Create a strong "About Us" narrative',
'Tell your company story in a way that establishes credibility.',
'1. Write your founding story and mission
2. Highlight experience, credentials, and expertise
3. Include team bios with qualifications
4. Mention notable clients, awards, or achievements
5. Keep it authentic and human - not corporate speak',
'Your About page is often what AI references when describing your company. A clear narrative about who you are, your expertise, and why you''re credible helps AI accurately represent your business. This content should be detailed enough for AI to understand what makes you unique.',
'ai_visibility',
ARRAY['Improve mentions in LLMs', 'Increase authority'],
ARRAY['About page'],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[]',
100);

-- ============================================================================
-- Link new tasks to relevant packs
-- ============================================================================

-- Add backlink tasks to Content Growth Pack (it's about building authority)
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Content Growth Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (81, 82);  -- linkable assets, guest posting

-- Add local backlink tasks to Local Visibility Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Local Visibility Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (84, 88);  -- journalist relationships, local partnerships

-- Add new AI visibility tasks to AI Visibility Starter Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('AI Visibility Starter Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (90, 91, 96, 97, 99, 100);  -- Reddit, Quora, social, testimonials, LinkedIn, About

-- Add backlink review to Maintenance Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('Online Visibility Maintenance Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order = 86;  -- fix broken backlinks

-- Clean up helper function
DROP FUNCTION IF EXISTS get_pack_id(TEXT);
