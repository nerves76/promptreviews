-- Add "Project post-mortem" survey template

INSERT INTO survey_templates (name, description, category, questions, display_order, default_survey_title, default_survey_description) VALUES
(
  'Project post-mortem',
  'Structured retrospective covering planning, delivery, communication, outcomes, team experience, and improvements — ideal for wrapping up client or internal projects.',
  'operations',
  '[
    {
      "question_type": "multiple_choice_single",
      "question_text": "Were deadlines met or missed?",
      "description": "Planning & scope",
      "is_required": true,
      "options": ["All met", "Mostly met", "Some missed", "Significantly missed"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "If deadlines were missed, what caused the delays?",
      "description": null,
      "is_required": false,
      "text_placeholder": "Describe the root causes...",
      "text_max_length": 1500
    },
    {
      "question_type": "rating_number",
      "question_text": "How accurate were initial time and budget estimates?",
      "description": "1 = way off, 5 = spot on",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Way off", "5": "Spot on"}
    },
    {
      "question_type": "text",
      "question_text": "Were any tasks under-scoped or overlooked during planning?",
      "is_required": false,
      "text_placeholder": "List tasks or areas that were missed or underestimated...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Did scope creep occur? How was it handled?",
      "is_required": false,
      "text_placeholder": "Describe any scope changes and how they were managed...",
      "text_max_length": 1500
    },
    {
      "question_type": "rating_number",
      "question_text": "Were project criteria and expectations clearly defined from the start?",
      "description": "1 = very unclear, 5 = crystal clear",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very unclear", "5": "Crystal clear"}
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Did we provide all deliverables outlined in the project scope?",
      "description": "Delivery & execution",
      "is_required": true,
      "options": ["Yes, all delivered", "Most delivered", "Some missing", "Significant gaps"],
      "allow_other": false
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Were outlined workflows and processes followed?",
      "is_required": true,
      "options": ["Yes, consistently", "Mostly", "Partially", "No, we deviated significantly"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "Was there an hours or budget overrun? Where specifically?",
      "is_required": false,
      "text_placeholder": "Identify specific areas of overrun...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Where did we experience bottlenecks, delays, or rework?",
      "is_required": false,
      "text_placeholder": "Describe the biggest friction points...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "What slowed us down the most?",
      "is_required": true,
      "text_placeholder": "Name the single biggest drag on progress...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What could have been automated or simplified?",
      "is_required": false,
      "text_placeholder": "Processes, handoffs, approvals, etc...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "Was ownership clear for each task and deliverable?",
      "description": "Communication & ownership — 1 = very unclear, 5 = crystal clear",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Very unclear", "5": "Crystal clear"}
    },
    {
      "question_type": "rating_number",
      "question_text": "Were decisions made quickly enough?",
      "description": "1 = too slow, 5 = great pace",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Too slow", "5": "Great pace"}
    },
    {
      "question_type": "rating_number",
      "question_text": "How well did internal communication work?",
      "description": "1 = poorly, 5 = excellently",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Poorly", "5": "Excellently"}
    },
    {
      "question_type": "rating_number",
      "question_text": "How well did client communication work?",
      "description": "1 = poorly, 5 = excellently",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Poorly", "5": "Excellently"}
    },
    {
      "question_type": "text",
      "question_text": "Were feedback loops early and frequent enough?",
      "is_required": false,
      "text_placeholder": "What worked and what didn\u0027t with feedback timing...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Was anything poorly defined or communicated?",
      "is_required": false,
      "text_placeholder": "Expectations, requirements, roles, etc...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "Did we deliver work at the high standards we and our client expect?",
      "description": "Quality & outcomes — 1 = below standards, 5 = exceeded expectations",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Below standards", "5": "Exceeded expectations"}
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Does the client agree with our quality assessment?",
      "is_required": true,
      "options": ["Yes, very satisfied", "Mostly satisfied", "Mixed feedback", "Dissatisfied", "Unknown / not yet discussed"],
      "allow_other": false
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Did the project achieve the intended business outcome?",
      "is_required": true,
      "options": ["Yes, fully", "Partially", "Too early to tell", "No"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "What measurable impact did the work create?",
      "description": "Traffic, leads, revenue, efficiency, etc.",
      "is_required": false,
      "text_placeholder": "Share any metrics or results...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Knowing what we know now, would we approach the solution differently?",
      "is_required": false,
      "text_placeholder": "Describe what you would change...",
      "text_max_length": 1500
    },
    {
      "question_type": "rating_number",
      "question_text": "Did you have the resources, information, and support needed to complete your tasks?",
      "description": "Team experience — 1 = not at all, 5 = fully equipped",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Not at all", "5": "Fully equipped"}
    },
    {
      "question_type": "text",
      "question_text": "Where did you feel blocked or dependent on others?",
      "is_required": false,
      "text_placeholder": "Describe blockers or dependencies...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "Did workload feel balanced and sustainable?",
      "description": "1 = overwhelming, 5 = well balanced",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Overwhelming", "5": "Well balanced"}
    },
    {
      "question_type": "text",
      "question_text": "What skills, tools, or support would have helped?",
      "is_required": false,
      "text_placeholder": "Training, software, staffing, etc...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What did you enjoy most about this project?",
      "is_required": false,
      "text_placeholder": "Highlights, wins, favorite moments...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What did you enjoy least?",
      "is_required": false,
      "text_placeholder": "Pain points, frustrations...",
      "text_max_length": 1000
    },
    {
      "question_type": "rating_number",
      "question_text": "How was working with the client?",
      "description": "1 = difficult, 5 = great",
      "is_required": true,
      "rating_min": 1,
      "rating_max": 5,
      "rating_labels": {"1": "Difficult", "5": "Great"}
    },
    {
      "question_type": "text",
      "question_text": "How could the next project run more smoothly?",
      "description": "Improvements & future projects",
      "is_required": true,
      "text_placeholder": "Your top suggestions...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "What should we start doing next time?",
      "is_required": false,
      "text_placeholder": "New practices, tools, or habits...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What should we stop doing?",
      "is_required": false,
      "text_placeholder": "Practices or habits that hurt more than help...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What should we continue doing?",
      "is_required": false,
      "text_placeholder": "What worked well and should be repeated...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "What should we document, templatize, or standardize?",
      "is_required": false,
      "text_placeholder": "Processes worth formalizing...",
      "text_max_length": 1000
    },
    {
      "question_type": "multiple_choice_single",
      "question_text": "Do you want to work on a similar type of project again?",
      "is_required": true,
      "options": ["Definitely yes", "Probably yes", "Neutral", "Probably not", "Definitely not"],
      "allow_other": false
    },
    {
      "question_type": "text",
      "question_text": "What changes would we make to this type of project in the future?",
      "is_required": false,
      "text_placeholder": "Structural, process, or approach changes...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Biggest win from this project",
      "description": "Quick summary (required)",
      "is_required": true,
      "text_placeholder": "The single best outcome or achievement...",
      "text_max_length": 500
    },
    {
      "question_type": "text",
      "question_text": "Biggest challenge or mistake",
      "description": null,
      "is_required": true,
      "text_placeholder": "The hardest part or biggest lesson learned...",
      "text_max_length": 500
    },
    {
      "question_type": "text",
      "question_text": "Top 3 improvements for next time",
      "description": null,
      "is_required": true,
      "text_placeholder": "1. ...\n2. ...\n3. ...",
      "text_max_length": 1000
    }
  ]'::jsonb,
  3,
  'Project post-mortem',
  'Reflect on what went well, what didn''t, and how to improve next time'
);
