-- Migrate default content from page files into CMS database
-- Generated: 2025-10-06

-- AI-Reviews page (ai-reviews)
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      metadata,
      '{key_features}',
      '[
        {
          "icon": "Brain",
          "title": "Smart Personalization",
          "description": "AI analyzes your business, customers, and context to create review requests that feel genuinely personal and human."
        },
        {
          "icon": "Target",
          "title": "Context-Aware Content",
          "description": "Creates different messages for different situations - service completion, product purchase, or event attendance."
        },
        {
          "icon": "Wand2",
          "title": "Review Writing Assistance",
          "description": "Helps customers express their thoughts better with AI-powered suggestions while keeping reviews authentic."
        },
        {
          "icon": "TrendingUp",
          "title": "Performance Optimization",
          "description": "Learns from your results and continuously improves your review request strategies over time."
        },
        {
          "icon": "Shield",
          "title": "Ethical AI Approach",
          "description": "Designed to enhance human connection, not replace it. Helps you be more personal while staying authentic."
        },
        {
          "icon": "Edit3",
          "title": "Grammar & Style Enhancement",
          "description": "AI can polish grammar and improve clarity while preserving the customer''s authentic voice and message."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "title": "Understand Your Business",
        "description": "AI learns about your business type, services, customer base, and review goals to provide relevant suggestions.",
        "icon": "Users"
      },
      {
        "number": 2,
        "title": "Analyze Customer Context",
        "description": "Considers the customer''s experience, relationship with your business, and what they''re most likely to review.",
        "icon": "Target"
      },
      {
        "number": 3,
        "title": "Generate Personalized Content",
        "description": "Creates review requests that feel personal, relevant, and authentic to each customer situation.",
        "icon": "MessageSquare"
      },
      {
        "number": 4,
        "title": "Learn and Improve",
        "description": "Tracks performance and adjusts strategies to continuously improve your review collection success rates.",
        "icon": "TrendingUp"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Heart",
      "title": "Keep It Personal",
      "description": "Use AI to enhance your personal touch, not replace it. Always review and customize AI suggestions to match your voice."
    },
    {
      "icon": "Clock",
      "title": "Perfect Your Timing",
      "description": "Send review requests when the experience is fresh but not overwhelming. AI helps identify optimal timing windows."
    },
    {
      "icon": "Star",
      "title": "Focus on Quality",
      "description": "Target customers who had positive experiences. AI works best with satisfied customers who are likely to leave good reviews."
    },
    {
      "icon": "Zap",
      "title": "Test and Learn",
      "description": "Experiment with different AI-generated approaches and let the system learn what works best for your specific business."
    },
    {
      "icon": "Users",
      "title": "Monitor Performance",
      "description": "Track which AI-generated content performs best and use those insights to refine your review collection strategy."
    }
  ]'::jsonb
)
WHERE slug = 'ai-reviews';

