-- Add AI Visibility workflow tasks to the library
-- These tasks guide users through discovering, tracking, and improving their AI visibility

-- Helper function to get pack ID by name
CREATE OR REPLACE FUNCTION get_pack_id(pack_name TEXT) RETURNS UUID AS $$
  SELECT id FROM wm_library_packs WHERE name = pack_name LIMIT 1;
$$ LANGUAGE SQL;

-- Insert the 6 new AI Visibility workflow tasks
INSERT INTO wm_library_tasks (
  title, description, instructions, education, category, goals, page_types, offsite_sources, difficulty, time_estimate, relevant_tools, sort_order
) VALUES

-- Task 1: Discover queries
('Discover queries people use to find your services',
'Identify the natural language questions people ask AI assistants when looking for businesses like yours.',
'1. Brainstorm questions for each funnel stage:
   - Top of funnel: Educational queries ("What is...", "How does...")
   - Middle of funnel: Comparison queries ("Best options for...", "X vs Y")
   - Bottom of funnel: Ready-to-buy queries ("Who offers...", "Find a ... in [city]")
2. Use conversational phrases, not just keywords
3. Use explicit city or region names instead of "near me" (LLM tracking can''t provide location context)
4. Add queries to the AI Visibility tracker in Prompt Reviews
5. Aim for at least 3-5 queries per funnel stage',
'AI assistants don''t work like Google - people ask full questions at every stage of their journey. Tracking queries across the full funnel ensures you''re visible whether someone is just learning, comparing options, or ready to hire.',
'ai_visibility',
ARRAY['Get discovered by AI'],
ARRAY[]::TEXT[],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
150),

-- Task 2: Run first visibility check
('Run your first AI visibility check',
'Test your queries across multiple AI models to see if and how you''re being recommended.',
'1. Go to the AI Visibility section in Prompt Reviews
2. Add your discovered queries
3. Run a visibility check across ChatGPT, Perplexity, and other models
4. Review which queries mention you vs competitors
5. Note which sources the AI cites when making recommendations
6. Set up a regular schedule (weekly or monthly) to track changes over time',
'LLMs don''t always give the same answer - responses vary based on many factors. A single check only shows a snapshot. Regular scheduled checks reveal whether you''re consistently being recommended or just occasionally mentioned.',
'ai_visibility',
ARRAY['Get discovered by AI'],
ARRAY[]::TEXT[],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
151),

-- Task 3: Expand with fan-out
('Expand your query list with fan-out suggestions',
'Use Prompt Reviews'' query fan-out feature to discover related queries you hadn''t considered.',
'1. Review the fan-out suggestions generated from your initial queries
2. Add promising variations to your tracking list
3. Look for patterns in how people phrase similar questions
4. Include long-tail conversational queries
5. Re-run visibility checks on your expanded list',
'One seed query can reveal dozens of variations people actually use. The fan-out feature shows you the full landscape of how AI users search for your services.',
'ai_visibility',
ARRAY['Get discovered by AI'],
ARRAY[]::TEXT[],
ARRAY[]::TEXT[],
'easy',
'15_45_min',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
152),

-- Task 4: Identify opportunities
('Identify your visibility opportunities from AI sources',
'Analyze the sources AI models cite and find opportunities to get your business mentioned.',
'1. Go to the Visibility Opportunities tab in Prompt Reviews
2. Review the sources AI models use when answering your queries
3. Note which directories, review sites, and content hubs appear frequently
4. Filter by difficulty (Easy, Medium, Hard) to prioritize
5. Create a target list of sites where you need presence',
'AI models cite their sources. If you''re listed on the sites they trust, you''ll be recommended. This is the roadmap to AI visibility - the exact sites you need to be on.',
'ai_visibility',
ARRAY['Get discovered by AI', 'Get links and mentions'],
ARRAY[]::TEXT[],
ARRAY[]::TEXT[],
'medium',
'45_120_min',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
153),

-- Task 5: Claim directory profiles
('Claim profiles on AI-recommended directories',
'Sign up for directories and platforms that AI models cite when recommending businesses in your industry.',
'1. Start with "Easy" opportunities from your Visibility Opportunities list
2. Create or claim your business profile on each directory
3. Complete profiles fully - AI favors comprehensive listings
4. Add consistent NAP (name, address, phone) information
5. Request reviews on these platforms when possible',
'Being listed on AI-trusted directories is the fastest path to visibility. These aren''t random sites - they''re the exact sources AI models pull from when making recommendations.',
'ai_visibility',
ARRAY['Get discovered by AI', 'Get links and mentions'],
ARRAY[]::TEXT[],
ARRAY['Citations', 'Directories'],
'easy',
'45_120_min',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
154),

-- Task 6: Outreach to content sites
('Reach out to content sites for mentions',
'Contact blogs, guides, and resource pages that AI cites to request inclusion or coverage.',
'1. Focus on "Medium" and "Hard" opportunities from your list
2. Research each site''s content and find relevant articles
3. Craft personalized outreach explaining your value to their readers
4. Offer something in exchange: expert quotes, data, backlinks, guest content
5. Some sites accept sponsored listings or paid placements - don''t rule this out
6. Follow up professionally and track responses',
'The hardest-to-get mentions are often the most valuable. When authoritative content sites mention you, AI models learn to recommend you across many related queries. Offering a fair trade or budget for placements can open doors that cold outreach alone won''t.',
'ai_visibility',
ARRAY['Get discovered by AI', 'Get links and mentions'],
ARRAY[]::TEXT[],
ARRAY['Backlinks'],
'hard',
'2_4_hours',
'[{"name": "AI Visibility", "route": "/dashboard/ai-visibility"}]',
155);

-- Link new tasks to AI Visibility Starter Pack
INSERT INTO wm_library_pack_tasks (pack_id, task_id, sort_order)
SELECT get_pack_id('AI Visibility Starter Pack'), id, sort_order
FROM wm_library_tasks WHERE sort_order IN (150, 151, 152, 153, 154, 155);

-- Clean up helper function
DROP FUNCTION IF EXISTS get_pack_id(TEXT);
