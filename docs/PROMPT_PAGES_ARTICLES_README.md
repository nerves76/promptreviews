# Prompt Pages Help Articles - Complete Guide

## What I've Created

I've researched your app thoroughly and created comprehensive help content for the Prompt Pages section of your documentation site.

### Files Created

1. **`scripts/populate-prompt-page-articles.sql`**
   - ✅ Universal Prompt Pages (COMPLETE - 3,000+ words)
   - ✅ Location Prompt Pages (COMPLETE - 2,500+ words)

2. **`scripts/populate-prompt-page-articles-part2.sql`**
   - ✅ Service Review Pages (COMPLETE - 2,000+ words)

3. **`docs/analytics-help-article.md`**
   - Comprehensive analytics guide (ready to paste into CMS)

## Prompt Page Types Found in Your App

Based on `/src/config/promptTypes.tsx`:

### Active Types
1. **Service** - For professional services (plumbing, consulting, etc.)
2. **Event** - For events, rentals, tours, spaces
3. **Product** - For product reviews
4. **Employee** - Employee spotlights to showcase team members
5. **Photo** - Photo + testimonial capture
6. **Video** - Video testimonials (marked as "coming soon")

### Page Categories
1. **Universal/Catch all** (`is_universal: true`) - One page for all customers
2. **Campaign** - Personalized pages (all 6 types above)
3. **Location** - Location-specific pages for multi-location businesses

## What Each Article Includes

Every article I've written contains:

### Main Content (Markdown)
- What it is and why use it
- How it works (step-by-step)
- Comparison tables vs other types
- Setup best practices
- Distribution strategies
- Advanced features
- Common questions
- Measuring success
- Pro tips and examples
- 2,000-3,000 words of comprehensive content

### Metadata (JSON)
- `description` - SEO description
- `category` - "Prompt Pages"
- `category_label`, `category_icon`, `category_color` - For docs site UI
- `available_plans` - Which plans can use this feature
- `keywords` - SEO keywords
- `key_features` (4-6 items) - Feature cards with icons
- `how_it_works` (3-5 steps) - Step-by-step process
- `best_practices` (4-6 items) - Tips for success
- `faqs` (5-7 Q&A pairs) - Common questions
- `call_to_action` - Primary and secondary CTA buttons

## Articles Still Needed

I've completed 3 of 9 articles. Here's what still needs writing:

### High Priority
1. **`prompt-pages/types/product`** - Product Review Pages
2. **`prompt-pages/types/employee`** - Employee Spotlight Pages
3. **`prompt-pages/types/event`** - Event & Space Pages
4. **`prompt-pages/types/photo`** - Photo + Testimonial Pages

### Medium Priority
5. **`prompt-pages/types/video`** - Video Testimonial Pages (coming soon feature)
6. **`prompt-pages/types`** - Overview page listing all types

## How to Use What I've Created

### Option 1: Run the SQL (Recommended)
```bash
# Connect to your production database
psql [your-production-connection-string]

# Run part 1 (Universal & Location)
\i scripts/populate-prompt-page-articles.sql

# Run part 2 (Service)
\i scripts/populate-prompt-page-articles-part2.sql
```

### Option 2: Copy/Paste in CMS
1. Go to https://app.promptreviews.app/dashboard/help-content/new
2. Set slug to: `prompt-pages/types/universal` (or location, or service)
3. Paste the content from the SQL file
4. Paste the metadata JSON into the metadata editor
5. Publish

## Template for Remaining Articles

Each remaining article should follow this structure:

### 1. Content Sections
```markdown
# [Type] Prompt Pages: [Subtitle]

[2-3 sentence overview]

## What Are [Type] Pages?

## Why Use [Type] Pages?

## How They Work

## [Type] Pages vs Universal Pages
[Comparison table]

## Setup Best Practices

## Distribution Strategies

## Advanced Features

## Common Questions

## Measuring Success

## Pro Tips
```

### 2. Metadata Structure
```json
{
  "description": "...",
  "category": "Prompt Pages",
  "category_label": "Page Types",
  "category_icon": "[Icon name]",
  "category_color": "[color]",
  "available_plans": ["builder", "maven"],
  "keywords": [...],
  "key_features": [
    {
      "icon": "...",
      "title": "...",
      "description": "..."
    }
  ],
  "how_it_works": [...],
  "best_practices": [...],
  "faqs": [...],
  "call_to_action": {
    "primary": {
      "text": "Create [Type] Page",
      "href": "/prompt-pages?tab=campaign"
    },
    "secondary": {
      "text": "View All Page Types",
      "href": "/prompt-pages/types"
    }
  }
}
```

## Key Research Findings

### From Code Analysis
- Prompt pages use the Icon sprite system (FaHandshake, FaCamera, etc.)
- Individual pages available on Builder+ plans only
- Universal pages available on all plans
- Location pages integrate with Google Business Profile
- Video type exists in code but marked "comingSoon: true"

### From App Structure
- Three main tabs in `/prompt-pages`: Catch all, Campaign, locations
- Campaign pages include: service, event, product, employee, photo, video
- Each type has specific icons and descriptions in `promptTypes.tsx`
- Location pages are separate and require GBP connection

### Recommended Icon Mapping for Docs
- **Service**: Handshake
- **Product**: Package or ShoppingBag
- **Employee**: UserCircle or Users
- **Event**: CalendarDays
- **Photo**: Camera
- **Video**: Video or PlayCircle
- **Location**: MapPin
- **Universal**: Globe

## Next Steps

### For You
1. Review the 3 completed articles (Universal, Location, Service)
2. Decide if you want me to complete the remaining 6 articles
3. Run the SQL scripts against production OR paste into CMS

### For Me (If You Want)
I can continue writing:
- Product Review Pages (similar to Service)
- Employee Spotlight Pages (unique use case)
- Event & Space Pages (rentals, venues)
- Photo + Testimonial Pages (visual testimonials)
- Video Testimonial Pages (coming soon feature)
- Overview page (comparing all types)

Each will be 2,000-3,000 words with complete metadata.

## Questions to Answer

1. **Do you want me to finish all 6 remaining articles?**
2. **Should I create them as SQL or markdown files?**
3. **Any specific features/use cases I should emphasize?**
4. **Do you want the "video" type documented even though it's "coming soon"?**

Let me know and I'll complete the rest!
