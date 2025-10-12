-- Update AI-Assisted Review Collection article with comprehensive How It Works section
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'ai-reviews',
  'AI-Assisted Review Collection',
  '# AI-Assisted Review Collection

PromptReviews uses artificial intelligence to help you collect more authentic, keyword-rich reviews faster. Our AI system, **Prompty AI**, learns from your business information to generate contextual, personalized review suggestions that your customers can edit and customize.

## How It Works: Training Prompty AI for Best Results

The quality of AI-generated reviews depends on how well Prompty AI understands your business. Here''s how to configure your settings for optimal results:

### Step 1: Fill Out Your Business Profile

Your business profile is Prompty AI''s foundation. Navigate to **Dashboard → Your Business** and complete these critical sections:

**Company Information:**
- **Business Name** - Used in review context
- **About Us** - Helps AI understand your story and voice
- **Services Offered** - Each service becomes review-worthy content
- **Industries Served** - Provides context for customer types
- **Years in Business** - Adds credibility details
- **Company Values** - Influences tone and messaging
- **Differentiators** - What makes you unique (AI emphasizes these)

**Keywords (CRITICAL):**
This field is the most important for SEO-focused reviews. Enter phrases you want to appear in reviews:
- Use comma-separated phrases: `"best Moose Juice in Seattle, Space Needle views, organic ingredients"`
- Include location-based keywords: `"Seattle coffee shop, Capitol Hill cafe"`
- Add service-specific terms: `"specialty roasting, small batch, direct trade"`
- **Why it matters:** Reviews containing these keywords rank better in Google and appear in ChatGPT responses

**AI Dos (Preferences):**
Tell Prompty AI what to emphasize or include:
- `"Always mention our fast turnaround time"`
- `"Emphasize our eco-friendly practices"`
- `"Reference our family-owned heritage"`
- `"Use enthusiastic, friendly tone"`

**AI Don''ts (Restrictions):**
Tell Prompty AI what to avoid:
- `"Never mention competitor names"`
- `"Don''t use overly formal language"`
- `"Avoid mentioning pricing specifics"`
- `"Don''t make claims about ''best'' or ''#1'' without context"`

### Step 2: Configure Your Prompt Page Settings

Each prompt page (Universal or Service-specific) has additional settings that refine AI output:

**Universal Prompt Page Settings** (Dashboard → Edit Prompt Page → Universal):
- **Page Keywords** - Overrides business keywords for this specific page
- **Custom Instructions** - Page-specific guidance for reviewers
- **Tone & Style** - Inherited from business profile or customized per page

**Service Prompt Page Settings** (Dashboard → Edit Prompt Page → [Service Name]):
- **Service Name** - Becomes the review focus
- **Service Description** - Provides context for AI
- **Keywords** - Service-specific terms to include
- **Custom Messaging** - Tailored for this service type

**Platform Settings:**
For each review platform (Google, Yelp, etc.):
- **Word Count** - Controls review length (AI adapts content to fit)
- **Platform Instructions** - Specific steps for that platform
- **Custom Instructions** - Per-platform messaging

### Step 3: Optimize Prompt Page Content

The actual prompt page configuration provides real-time context:

**Review Request Settings:**
- **Thank You Message** - Sets the tone for the interaction
- **Custom Branding** - Logo and colors reinforce identity
- **Platform Selection** - Which platforms to emphasize

**Kickstarters (Review Prompts):**
These are question prompts that help customers start writing:
- `"What did you love most about our service?"`
- `"How did we exceed your expectations?"`
- `"What would you tell a friend about us?"`

AI uses these prompts to structure review suggestions.

### Step 4: Test and Refine

**Generate Test Reviews:**
1. Go to any prompt page editor
2. Click "Generate with AI" on a review platform card
3. Review the generated content
4. If it''s off-target, refine your:
   - Keywords
   - AI Dos/Don''ts
   - Service descriptions

**Iterative Improvement:**
- Generate multiple reviews to see variety
- Identify patterns you don''t like → Add to AI Don''ts
- Identify missing elements → Add to AI Dos or Keywords
- Adjust tone by updating Company Values and About Us

## Best Practices for Training Prompty AI

### 1. Be Specific with Keywords
❌ **Vague:** `"good service, quality work"`
✅ **Specific:** `"same-day turnaround, certified technicians, warranty-backed repairs"`

### 2. Use Natural Language in AI Dos/Don''ts
❌ **Robotic:** `"Include speed"`
✅ **Natural:** `"Mention how quickly we completed the work"`

### 3. Think Like Your Customer
Your keywords and dos should reflect what customers naturally say:
- Not: `"enterprise-grade solutions"`
- But: `"helped us solve our problem fast"`

### 4. Update Based on Real Reviews
When you receive authentic reviews:
- Extract phrases customers actually use
- Add those phrases to your keywords
- This makes AI-generated reviews sound more authentic

### 5. Balance Enthusiasm with Authenticity
AI can be overly enthusiastic. Use AI Don''ts to moderate:
- `"Avoid excessive exclamation points"`
- `"Keep tone professional, not salesy"`
- `"Don''t oversell - let the facts speak"`

## What the AI Actually Does

When a customer clicks "Generate with AI" on your prompt page:

1. **Gathers Context:**
   - Business profile (name, services, values, keywords)
   - Prompt page settings (service name, instructions)
   - Platform requirements (word count, tone)
   - Customer''s rating (1-5 stars influences content)
   - Any text customer already entered

2. **Applies Your Rules:**
   - Incorporates keywords naturally
   - Follows AI Dos preferences
   - Avoids AI Don''ts restrictions
   - Matches word count for platform

3. **Generates Suggestion:**
   - Creates a draft review
   - Customer sees it in the text field
   - **Customer MUST edit** to add personal details

4. **Customer Personalizes:**
   - Add specific names, dates, details
   - Adjust tone to their voice
   - Remove generic phrases
   - Make it authentically theirs

## Why Customer Editing Matters

**AI provides structure, customers provide authenticity:**
- AI: `"Great experience with professional service"`
- Customer edit: `"Great experience with Sarah - she diagnosed my AC problem in 10 minutes and had it fixed by lunchtime"`

The edited version:
- ✅ Contains specific details (Sarah, AC, timing)
- ✅ Sounds like a real person
- ✅ More credible to readers
- ✅ Better for SEO (more unique content)

**Reviews used verbatim are:**
- ❌ Generic and less believable
- ❌ May sound robotic
- ❌ Missing valuable specific details
- ❌ Less effective for search rankings

## Configuration Hierarchy

Settings flow from general to specific:

```
Business Profile (Global defaults)
  ↓
Universal Prompt Page (Overrides for all services)
  ↓
Service Prompt Page (Overrides for specific service)
  ↓
Platform Settings (Per-platform customization)
```

**Example:**
- **Business Keywords:** `"Seattle, eco-friendly, fast service"`
- **Universal Page Keywords:** `"reliable, professional, affordable"` ← Overrides business keywords
- **Service Page (Plumbing):** `"emergency plumber, 24/7, licensed"` ← Overrides universal keywords

## Advanced Tips

### Seasonal Updates
Update keywords for seasons or promotions:
- Holiday season: `"holiday hours, gift certificates"`
- Summer: `"summer special, outdoor service"`

### A/B Testing
Try different approaches:
- Generate reviews with current settings
- Note what works/doesn''t work
- Adjust one variable (keywords, dos, or don''ts)
- Generate again and compare

### Location-Specific Content
For multi-location businesses:
- Include neighborhood/city names in keywords
- Mention local landmarks in AI Dos
- Create location-specific prompt pages

## Common Questions

**Q: How many keywords should I include?**
A: 5-15 key phrases is ideal. Too many dilutes focus, too few limits variety.

**Q: Can I update keywords later?**
A: Yes! Refine them anytime based on what''s working. Changes apply to all future AI generations.

**Q: Will every review sound the same?**
A: No. AI generates variety within your guidelines. Plus, customer editing makes each review unique.

**Q: Should I use technical jargon in keywords?**
A: Only if your customers actually use those terms. Use language your customers speak, not industry buzzwords.

**Q: What if AI ignores my don''ts?**
A: Make them more specific. Instead of "Don''t be salesy," try "Don''t use phrases like ''best in town'' or ''you won''t regret it.''"

---

*Start by filling out Your Business profile with comprehensive information. The more context you provide, the better Prompty AI performs.*
',
  'published',
  jsonb_build_object(
    'description', 'Learn how to train Prompty AI by configuring your business profile, keywords, and prompt page settings for authentic AI-assisted reviews',
    'category', 'ai-features',
    'category_label', 'AI Features',
    'category_icon', 'FaMagic',
    'keywords', ARRAY['AI reviews', 'Prompty AI', 'review generation', 'keywords', 'AI settings', 'business profile', 'prompt pages', 'dos and donts'],
    'tags', ARRAY['ai', 'configuration', 'best-practices', 'reviews'],
    'seo_title', 'How to Train Prompty AI for Better Review Generation - Complete Guide',
    'seo_description', 'Complete guide to configuring business settings, keywords, and AI preferences for optimal AI-assisted review generation in PromptReviews.',
    'how_it_works', jsonb_build_array(
      jsonb_build_object('number', 1, 'icon', '🏢', 'title', 'Fill Out Your Business Profile', 'description', 'Complete all fields in Your Business including keywords, AI Dos/Don''ts, services, and company values'),
      jsonb_build_object('number', 2, 'icon', '⚙️', 'title', 'Configure Prompt Page Settings', 'description', 'Set up Universal and Service-specific prompt pages with custom keywords and instructions'),
      jsonb_build_object('number', 3, 'icon', '📝', 'title', 'Optimize Platform Settings', 'description', 'Configure word counts and instructions for each review platform (Google, Yelp, etc.)'),
      jsonb_build_object('number', 4, 'icon', '🧪', 'title', 'Test and Refine', 'description', 'Generate test reviews, evaluate output, and update settings based on results')
    ),
    'best_practices', jsonb_build_array(
      jsonb_build_object('icon', '🎯', 'title', 'Be Specific with Keywords', 'description', 'Use detailed phrases customers actually say, not vague generalities'),
      jsonb_build_object('icon', '💬', 'title', 'Use Natural Language', 'description', 'Write AI Dos/Don''ts in conversational tone, not robotic commands'),
      jsonb_build_object('icon', '👥', 'title', 'Think Like Your Customer', 'description', 'Use words and phrases your customers naturally use, not industry jargon'),
      jsonb_build_object('icon', '🔄', 'title', 'Update Based on Real Reviews', 'description', 'Extract phrases from authentic reviews and add them to your keywords'),
      jsonb_build_object('icon', '⚖️', 'title', 'Balance Enthusiasm with Authenticity', 'description', 'Use AI Don''ts to prevent overly salesy or generic language')
    ),
    'key_features', jsonb_build_array(
      jsonb_build_object('icon', '🏢', 'title', 'Business Profile Training', 'description', 'Keywords, AI Dos/Don''ts, and company information teach Prompty AI your voice'),
      jsonb_build_object('icon', '📄', 'title', 'Prompt Page Customization', 'description', 'Override global settings with page-specific keywords and instructions'),
      jsonb_build_object('icon', '🎨', 'title', 'Platform-Specific Settings', 'description', 'Customize word counts and tone for each review platform'),
      jsonb_build_object('icon', '✏️', 'title', 'Customer Editing Required', 'description', 'AI provides structure, customers add authentic personal details')
    )
  ),
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
