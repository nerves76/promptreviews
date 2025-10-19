-- Extract ONLY Metadata for Existing Articles
-- Use this to update articles that already have good content but need the metadata

-- This updates ONLY the metadata field, preserving existing title and content

-- ============================================================================
-- UNIVERSAL PROMPT PAGES - Metadata Only
-- ============================================================================
UPDATE articles
SET metadata = '{
  "description": "The all-purpose review collection solution. One page that works for any customer, any time, anywhere. Perfect for businesses that want a simple, always-ready review collection tool.",
  "category": "Prompt Pages",
  "category_label": "Page Types",
  "category_icon": "Globe",
  "category_color": "cyan",
  "available_plans": ["grower", "builder", "maven"],
  "keywords": ["universal prompt page", "review collection", "QR code reviews", "one link reviews"],
  "key_features": [
    {
      "icon": "Globe",
      "title": "Works for Everyone",
      "description": "One URL that any customer can use. No personalization needed."
    },
    {
      "icon": "QrCode",
      "title": "QR Code Ready",
      "description": "Generate QR codes for receipts, signage, and print materials."
    },
    {
      "icon": "Zap",
      "title": "Always Available",
      "description": "Never expires. Share it once, use it forever."
    },
    {
      "icon": "Target",
      "title": "Multi-Platform",
      "description": "Let customers choose Google, Yelp, Facebook, or other platforms."
    }
  ],
  "key_features_title": "Why Universal Works",
  "how_it_works": [
    {
      "number": 1,
      "icon": "Link",
      "title": "Share Your Link",
      "description": "Give customers your Universal Prompt Page URL via QR code, email, or direct link."
    },
    {
      "number": 2,
      "icon": "User",
      "title": "Customer Enters Info",
      "description": "They provide their name and email (optional). The page personalizes for them."
    },
    {
      "number": 3,
      "icon": "Star",
      "title": "They Write & Submit",
      "description": "Customer writes their review with optional AI assistance and submits to their chosen platform."
    }
  ],
  "how_it_works_title": "Three Simple Steps",
  "best_practices": [
    {
      "icon": "Sparkles",
      "title": "Choose a Memorable URL",
      "description": "Pick a short, easy-to-remember slug for your Universal Page URL."
    },
    {
      "icon": "Palette",
      "title": "Brand It Well",
      "description": "Add your logo, colors, and a welcoming message to build trust."
    },
    {
      "icon": "Users",
      "title": "Train Your Team",
      "description": "Make sure staff knows how to share the link or QR code with customers."
    },
    {
      "icon": "BarChart3",
      "title": "Track & Optimize",
      "description": "Monitor conversion rates and test different distribution methods."
    }
  ],
  "best_practices_title": "Tips for Success",
  "faqs": [
    {
      "question": "Can I change the URL after creating it?",
      "answer": "No, the slug (URL) is permanent to prevent broken links. Choose carefully when you create it."
    },
    {
      "question": "Do I need to collect email addresses?",
      "answer": "No—email is optional. However, collecting emails helps with follow-up and building your marketing list."
    },
    {
      "question": "Can I have multiple Universal Pages?",
      "answer": "Yes! Create separate Universal Pages for different locations, service types, or brands."
    },
    {
      "question": "What happens to negative reviews?",
      "answer": "Customers with negative sentiment can choose to send private feedback instead of posting publicly."
    },
    {
      "question": "Can I see who left reviews?",
      "answer": "Yes! Your dashboard shows all submissions with customer contact information (if collected)."
    }
  ],
  "faqs_title": "Frequently Asked Questions",
  "call_to_action": {
    "primary": {
      "text": "Create Your Universal Page",
      "href": "/prompt-pages"
    },
    "secondary": {
      "text": "View All Page Types",
      "href": "/prompt-pages/types"
    }
  }
}'::jsonb,
updated_at = NOW()
WHERE slug = 'prompt-pages/types/universal';

-- ============================================================================
-- To use this script:
-- ============================================================================
-- 1. Check if your article exists and has content you want to keep
-- 2. Run this UPDATE statement to add just the metadata
-- 3. Your title and content remain unchanged
-- 4. The docs site will now show feature cards, FAQs, etc.
