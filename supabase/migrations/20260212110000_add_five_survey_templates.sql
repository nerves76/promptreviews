-- Add five new survey templates: NPS, Employee engagement, Event feedback, QBR, Workshop evaluation

-- 1. Net Promoter Score (NPS)
INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Net Promoter Score (NPS)',
  'Short, focused NPS survey — the industry-standard loyalty question plus targeted follow-ups that surface real insight, not just a number.',
  'feedback',
  '[
    {
      "question_type": "rating_number",
      "question_text": "How likely are you to recommend us to someone you respect?",
      "description": "0 = not at all likely, 10 = extremely likely",
      "is_required": true,
      "rating_min": 0,
      "rating_max": 10,
      "rating_labels": {"0": "Not at all", "10": "Extremely likely"}
    },
    {
      "question_type": "text",
      "question_text": "What''s the main reason for your score?",
      "description": "Be as specific as you can — a particular experience, interaction, or result",
      "is_required": true,
      "text_placeholder": "The reason I gave that score is...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "What''s one thing we could change that would make you score us higher?",
      "description": null,
      "is_required": false,
      "text_placeholder": "If I could change one thing, it would be...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What do we do better than other options you''ve tried?",
      "description": "If we''re your first, what made you choose us?",
      "is_required": false,
      "text_placeholder": "Compared to alternatives...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Is there anything we do that frustrates or confuses you — even something small?",
      "description": null,
      "is_required": false,
      "text_placeholder": "Even minor annoyances are worth mentioning...",
      "text_max_length": 1000
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Would you like us to follow up on your feedback?",
      "is_required": false,
      "options": ["Yes, please reach out", "No, just wanted to share", "Only if something changes"],
      "allow_other": false
    }
  ]'::jsonb,
  4,
  'Quick feedback',
  'One short survey — your honest answers help us get better'
);

-- 2. Employee Engagement
INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Employee engagement',
  'Candid team health check covering meaning, autonomy, growth, psychological safety, and workload — designed to surface what people actually think, not what they think you want to hear.',
  'internal',
  '[
    {
      "question_type": "rating_number",
      "question_text": "I feel like my work actually matters — not just that I''m busy",
      "description": "Purpose & meaning — 1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "I have enough autonomy to make decisions about how I do my work",
      "description": "1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "I''m learning and growing here — not just repeating what I already know",
      "description": "1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "I feel safe raising concerns, pushing back, or admitting mistakes",
      "description": "Psychological safety — 1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "My workload is sustainable — I can do good work without burning out",
      "description": "1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "I know what''s expected of me and how success is measured",
      "description": "1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "rating_number",
      "question_text": "When I do good work, it gets noticed",
      "description": "1 = strongly disagree, 5 = strongly agree",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Strongly disagree", "5": "Strongly agree"}
    },
    {
      "question_type": "text",
      "question_text": "What''s the one thing that would make your day-to-day work meaningfully better?",
      "description": "Not a wish list — your single highest-impact change",
      "is_required": true,
      "text_placeholder": "If I could change one thing...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What''s something we used to do well that we''ve lost?",
      "description": "A habit, practice, or vibe that faded over time",
      "is_required": false,
      "text_placeholder": "We used to...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "If you could change one thing about how this team operates, what would it be?",
      "is_required": false,
      "text_placeholder": "Process, communication, culture, tools...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What keeps you here?",
      "description": "Be honest — it helps us protect the things that matter",
      "is_required": false,
      "text_placeholder": "The reason I stay is...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What would make you seriously consider leaving?",
      "description": "This is anonymous and confidential. Candor helps us fix things before they break.",
      "is_required": false,
      "text_placeholder": "I''d consider leaving if...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "Overall, how satisfied are you working here right now?",
      "description": "1 = very unsatisfied, 5 = very satisfied",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very unsatisfied", "5": "Very satisfied"}
    }
  ]'::jsonb,
  5,
  'Team check-in',
  'Anonymous and confidential — your honest answers help us build a better workplace'
);

-- 3. Event / Webinar Feedback
INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Event / webinar feedback',
  'Post-event feedback covering content quality, speaker performance, pacing, and actionable takeaways — focused on what attendees will actually remember and use.',
  'feedback',
  '[
    {
      "question_type": "rating_star",
      "question_text": "How would you rate this event overall?",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Poor", "5": "Excellent"}
    },
    {
      "question_type": "rating_number",
      "question_text": "How relevant was the content to your actual work or goals?",
      "description": "1 = not relevant, 5 = directly applicable",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Not relevant", "5": "Directly applicable"}
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Did you learn something you can act on this week?",
      "description": "Not someday — this week",
      "is_required": true,
      "options": ["Yes, I know exactly what I''ll do", "Maybe, I need to think on it", "Not really — it was interesting but not actionable", "No"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "What was your single biggest takeaway?",
      "description": "The one thing you''ll actually remember next month",
      "is_required": true,
      "text_placeholder": "The thing that stuck with me was...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What question did you have that didn''t get answered?",
      "is_required": false,
      "text_placeholder": "I still want to know...",
      "text_max_length": 1000
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "How was the pacing?",
      "is_required": true,
      "options": ["Too fast — I couldn''t keep up", "Just right", "A bit slow in parts", "Way too slow"],
      "allow_other": false
    },
    {
      "question_type": "rating_star",
      "question_text": "How would you rate the speaker(s)?",
      "description": "Clarity, engagement, and expertise",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Poor", "5": "Excellent"}
    },
    {
      "question_type": "text",
      "question_text": "What could the speaker(s) do differently to make this better?",
      "description": "Constructive feedback — even great speakers want to improve",
      "is_required": false,
      "text_placeholder": "It would be even better if...",
      "text_max_length": 1000
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "How did you hear about this event?",
      "is_required": false,
      "options": ["Email invite", "Social media", "Colleague or friend", "Website", "Search"],
      "allow_other": true
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Would you attend a follow-up session on this topic?",
      "is_required": true,
      "options": ["Definitely", "Probably", "Only if it went deeper", "No, I got what I needed"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "What topic would you want us to cover next?",
      "is_required": false,
      "text_placeholder": "I''d love to learn about...",
      "text_max_length": 1000
    }
  ]'::jsonb,
  6,
  'Event feedback',
  'Quick feedback on today''s session — help us make the next one even better'
);

-- 4. Quarterly Business Review (QBR)
INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Quarterly business review (QBR)',
  'Client check-in survey covering satisfaction, priorities, communication, and renewal intent — gives you honest signal before the QBR meeting, not just polite nodding during it.',
  'client',
  '[
    {
      "question_type": "rating_number",
      "question_text": "How satisfied are you with the results we''ve delivered this quarter?",
      "description": "Results — not effort. We want to know if the work is moving the needle.",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very unsatisfied", "5": "Very satisfied"}
    },
    {
      "question_type": "rating_number",
      "question_text": "Are we focused on the right priorities for your business right now?",
      "description": "1 = way off, 5 = exactly right",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Way off", "5": "Exactly right"}
    },
    {
      "question_type": "rating_number",
      "question_text": "When you need something from us, how responsive are we?",
      "description": "1 = frustratingly slow, 5 = impressively fast",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Frustratingly slow", "5": "Impressively fast"}
    },
    {
      "question_type": "rating_number",
      "question_text": "Do you feel informed about what we''re working on and why?",
      "description": "1 = in the dark, 5 = fully in the loop",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "In the dark", "5": "Fully in the loop"}
    },
    {
      "question_type": "text",
      "question_text": "Is there anything we promised but haven''t delivered?",
      "description": "Even if it''s small or you think we forgot — we want to know",
      "is_required": false,
      "text_placeholder": "You said you''d... but I haven''t seen...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "What''s the most valuable thing we''ve done for you recently?",
      "description": "Helps us understand what matters most to you",
      "is_required": true,
      "text_placeholder": "The thing that made the biggest difference was...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Where are we falling short of your expectations?",
      "description": "Don''t spare our feelings — we''d rather hear it now than lose you later",
      "is_required": false,
      "text_placeholder": "The area where I expected more is...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Have your business goals or priorities shifted since we last checked in?",
      "description": "New markets, budget changes, leadership shifts, competitive pressure — anything we should adapt to",
      "is_required": false,
      "text_placeholder": "What''s changed is...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Is there anything you wish we''d proactively flag or suggest — without waiting for you to ask?",
      "is_required": false,
      "text_placeholder": "I wish you''d tell me when...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "How likely are you to continue working with us next quarter?",
      "description": "1 = very unlikely, 5 = definitely continuing",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very unlikely", "5": "Definitely continuing"}
    },
    {
      "question_type": "text",
      "question_text": "What would make this engagement a 10 out of 10 for you?",
      "description": "Paint the picture — what does perfect look like?",
      "is_required": true,
      "text_placeholder": "It would be a 10/10 if...",
      "text_max_length": 1500
    }
  ]'::jsonb,
  7,
  'Quarterly check-in',
  'Help us understand what''s working, what''s not, and where to focus next'
);

-- 5. Workshop Evaluation
INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Workshop evaluation',
  'Post-workshop feedback focused on what participants will actually use — covers content, facilitation, pacing, materials, and what deserves more depth.',
  'feedback',
  '[
    {
      "question_type": "rating_star",
      "question_text": "How would you rate this workshop overall?",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Poor", "5": "Excellent"}
    },
    {
      "question_type": "rating_number",
      "question_text": "How relevant was the content to your actual role and goals?",
      "description": "Not \"was it interesting\" — was it useful for what you do every day?",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Not relevant", "5": "Directly useful"}
    },
    {
      "question_type": "rating_number",
      "question_text": "How well did the facilitator explain concepts and keep the group engaged?",
      "description": "1 = lost the room, 5 = nailed it",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Lost the room", "5": "Nailed it"}
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Was the workshop the right length?",
      "is_required": true,
      "options": ["Too short — I wanted more", "Just right", "Slightly too long", "Way too long — I checked out"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "What was your biggest takeaway?",
      "description": "The one idea, framework, or technique that clicked",
      "is_required": true,
      "text_placeholder": "The thing that clicked for me was...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What will you do differently as a result of this workshop?",
      "description": "Specific action, not a vague intention",
      "is_required": true,
      "text_placeholder": "Starting next week, I''m going to...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Was there anything confusing, unclear, or that didn''t land?",
      "is_required": false,
      "text_placeholder": "I got lost when...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "How useful were the materials and resources provided?",
      "description": "Slides, handouts, templates, follow-up resources",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Not useful", "5": "Very useful"}
    },
    {
      "question_type": "text",
      "question_text": "Which topic deserved more time or depth?",
      "is_required": false,
      "text_placeholder": "I wanted to go deeper on...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Which topic could have been shortened or cut?",
      "is_required": false,
      "text_placeholder": "We spent too long on...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "How likely are you to recommend this workshop to a colleague?",
      "description": "0 = would not recommend, 10 = would strongly recommend",
      "is_required": true,
      "rating_min": 0,
      "rating_max": 10,
      "rating_labels": {"0": "Would not recommend", "10": "Strongly recommend"}
    },
    {
      "question_type": "text",
      "question_text": "Anything else the facilitator should know?",
      "description": "Praise, criticism, suggestions — all welcome",
      "is_required": false,
      "text_placeholder": "One more thing...",
      "text_max_length": 1500
    }
  ]'::jsonb,
  8,
  'Workshop feedback',
  'Tell us what worked, what didn''t, and what you''ll actually use'
);
