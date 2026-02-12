-- Add "Agency onboarding" survey template

INSERT INTO survey_templates (name, description, category, questions, display_order) VALUES
(
  'Agency onboarding',
  'Gather key business details from new clients — services, marketing goals, competitors, and positioning — to kick off your engagement.',
  'onboarding',
  '[
    {
      "question_type": "text",
      "question_text": "Business name(s)",
      "description": "Include any nicknames, abbreviations, acronyms, or sub-brands",
      "is_required": true,
      "text_placeholder": "e.g. Acme Corp, Acme, AC Industries...",
      "text_max_length": 500
    },
    {
      "question_type": "multiple_choice_multi",
      "question_text": "What are your primary contact methods?",
      "description": "Select all that apply",
      "is_required": true,
      "options": ["Physical location", "Phone", "Email", "App", "Website form", "Social media"],
      "allow_other": true
    },
    {
      "question_type": "text",
      "question_text": "Briefly describe the scale of your business",
      "description": "Team size, output, number of locations, etc.",
      "is_required": true,
      "text_placeholder": "e.g. 3-person leadership team, 10 employees, 200 widgets per year...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "List your services and estimated percentage of revenue per service",
      "is_required": true,
      "text_placeholder": "e.g. Web design (40%), SEO (35%), Social media management (25%)...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Are there any new services you are developing?",
      "is_required": false,
      "text_placeholder": "Describe any upcoming or planned offerings...",
      "text_max_length": 1000
    },
    {
      "question_type": "multiple_choice_multi",
      "question_text": "How do you usually get new business?",
      "description": "Select all that apply",
      "is_required": true,
      "options": ["Referrals", "Organic search", "Paid ads", "Social media", "Cold outreach", "Events / networking", "Partnerships"],
      "allow_other": true
    },
    {
      "question_type": "text",
      "question_text": "What are your marketing goals or plans for this year?",
      "description": "Include any prior brand strategy or marketing work we should know about",
      "is_required": false,
      "text_placeholder": "Share any goals, budgets, or existing marketing assets...",
      "text_max_length": 1500
    },
    {
      "question_type": "multiple_choice_multi",
      "question_text": "How does your pricing work?",
      "description": "Select all that apply",
      "is_required": true,
      "options": ["Fixed price", "Packages", "Subscriptions", "Custom bid", "Financed", "Hourly"],
      "allow_other": true
    },
    {
      "question_type": "text",
      "question_text": "What industries or customer types do you serve, and how are your services unique?",
      "is_required": true,
      "text_placeholder": "Describe your target market and what sets you apart...",
      "text_max_length": 1500
    },
    {
      "question_type": "text",
      "question_text": "Are there specific geographic areas or seasonal trends that affect your business?",
      "is_required": false,
      "text_placeholder": "e.g. Most business comes from the metro area, sales peak in Q4...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "List some competitors (local or otherwise)",
      "is_required": false,
      "text_placeholder": "Include names or websites if possible...",
      "text_max_length": 1000
    },
    {
      "question_type": "text",
      "question_text": "Anything else unique, novel, or cool we should know about your business?",
      "is_required": false,
      "text_placeholder": "Awards, patents, community involvement, fun facts...",
      "text_max_length": 1500
    }
  ]'::jsonb,
  2
);
