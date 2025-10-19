-- Populate Prompt Page Type Articles with Comprehensive Content
-- Run this script against your production database

-- ============================================================================
-- 1. UNIVERSAL PROMPT PAGES
-- ============================================================================

INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'prompt-pages/types/universal',
  'Universal Prompt Page - One Page for All Reviews',
  '# Universal Prompt Page: The All-Purpose Review Collection Solution

The Universal Prompt Page is your always-ready, works-for-everyone review collection tool. One simple URL that any customer can use, any time, from anywhere.

## What Makes It Universal?

Unlike individual prompt pages personalized for specific customers, the Universal Prompt Page is designed to work for **any customer who visits it**. They simply enter their name and email, and the page adapts to collect their review.

Think of it as your business''s main review collection hub—always available, never needing customization.

## Why Use a Universal Prompt Page?

### Perfect for Spontaneous Reviews
When a customer says "I''d love to leave you a review!" you can immediately share one link that works for everyone.

### Simplifies Your Workflow
No need to create individual pages for every customer. One link handles it all.

### Ideal for In-Person Interactions
- Print the QR code on receipts
- Display it at your checkout counter
- Add it to business cards
- Include it in email signatures

### Works Across All Channels
- Email campaigns to your entire list
- Social media posts
- Website "Leave a Review" buttons
- In-store signage

## How It Works

1. **Customer visits your Universal Prompt Page**
   - They scan a QR code, click a link, or type the URL

2. **They enter their information**
   - Name and email (you can make email optional)
   - The page personalizes their experience

3. **They write their review**
   - Choose which platform (Google, Yelp, etc.)
   - Use AI assistance if they need help writing
   - Submit their review

4. **Review appears in your dashboard**
   - You can verify it, feature it, or share it
   - Track analytics on who''s leaving reviews

## Universal vs Individual Prompt Pages

| Feature | Universal | Individual |
|---------|-----------|------------|
| **Setup** | Create once, use forever | Create for each customer |
| **URL** | Same for everyone | Personalized per customer |
| **Best for** | Walk-ins, general campaigns | Follow-ups, personal touchpoints |
| **Pre-filled data** | None | Customer name, service details |
| **Personalization** | Generic greeting | Custom message per customer |

**Use both!** Many businesses use Universal for general collection and Individual for VIP customers or after specific transactions.

## Setup Best Practices

### 1. Choose a Memorable Slug
Your Universal Prompt Page URL will look like:
```
app.promptreviews.app/r/your-business-name
```

Pick something easy to remember and type:
- ✅ `/r/joe-plumbing`
- ✅ `/r/mainstreet-salon`
- ❌ `/r/best-plumbing-services-nyc-licensed` (too long)

### 2. Customize Your Page Branding
- Add your logo
- Choose brand colors
- Write a welcoming headline
- Include a photo of your team or location

### 3. Enable the Right Platform Options
Only show platforms you actually have:
- Google Business Profile
- Yelp
- Facebook
- TripAdvisor
- Industry-specific platforms

### 4. Configure Required vs Optional Fields
- **Name**: Usually required
- **Email**: Optional if you want to reduce friction
- **Phone**: Optional, only if you need follow-up ability

## Distribution Strategies

### Physical Distribution
1. **QR Codes**
   - Print on receipts (automatic with many POS systems)
   - Table tents in restaurants
   - Window decals
   - Business cards
   - Thank you cards

2. **Verbal Sharing**
   - Train staff to say: "We''d love your feedback! Just scan this code or visit joe-plumbing.com/review"
   - Make it part of checkout script

### Digital Distribution
1. **Email**
   - Post-service follow-up emails
   - Newsletter footer
   - Email signature

2. **Website**
   - "Leave a Review" button in navigation
   - Footer link
   - Dedicated "/review" page redirect

3. **Social Media**
   - Link in bio (Instagram, TikTok)
   - Pinned post
   - Story highlights

## Advanced Features for Universal Pages

### Emoji Sentiment (Optional)
Let customers quickly rate their experience with emojis before writing:
- 😊 Love it
- 🙂 Happy
- 😐 Neutral
- 😕 Unsatisfied
- 😤 Frustrated

Negative sentiment lets them choose public or private feedback.

### AI Review Generation
Customers who struggle with writing can click "Generate with AI" to get started.

### Grammar Fix
Built-in grammar correction helps customers polish their reviews.

### Multi-Platform Support
One form submission can go to multiple platforms simultaneously.

## Common Questions

**Q: Can I have multiple Universal Prompt Pages?**
A: Yes! You might have one per location, service type, or brand. Each gets its own URL.

**Q: Can I change the URL later?**
A: The slug (URL) cannot be changed after creation to prevent broken links. Choose carefully!

**Q: Do I need the email address?**
A: No—you can make email optional. However, collecting emails lets you:
- Follow up with customers
- Send review verification emails
- Build your marketing list (with permission)

**Q: Can I see who left reviews?**
A: Yes! The dashboard shows all submissions with customer names and contact info (if collected).

**Q: What if someone leaves a negative review?**
A: Negative emoji sentiments offer the option to send private feedback instead of posting publicly. You see the feedback, they avoid public complaints.

## Measuring Success

Track these metrics for your Universal Prompt Page:
- **Page visits**: How many people clicked the link
- **Conversion rate**: % who actually submitted reviews
- **Platform distribution**: Which review sites people chose
- **Sentiment breakdown**: Overall satisfaction patterns

Good conversion rates:
- Email campaigns: 15-30%
- In-person requests: 30-50%
- QR codes on receipts: 5-15%

## Upgrade Your Strategy

**Start with Universal, add Individual for VIPs**

Most businesses follow this progression:
1. **Month 1**: Deploy Universal page everywhere
2. **Month 2**: Analyze which customers convert best
3. **Month 3**: Create Individual pages for high-value customers
4. **Ongoing**: Use Universal for everyone, Individual for VIPs

The Universal Prompt Page handles 80% of your review collection needs—it''s the foundation of a solid review strategy.',
  'published',
  '{
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
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 2. LOCATION PROMPT PAGES
-- ============================================================================

INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'prompt-pages/types/location',
  'Location Prompt Pages - Reviews for Multi-Location Businesses',
  '# Location Prompt Pages: Collect Location-Specific Reviews

For businesses with multiple locations, Location Prompt Pages let you collect reviews for each specific branch, store, or office—keeping your reviews organized and actionable.

## What Are Location Prompt Pages?

Location Prompt Pages create a unique review collection page for each of your business locations. Each location gets its own:
- Dedicated URL (e.g., `/r/your-business-downtown`)
- Custom branding and messaging
- Separate analytics and review tracking
- Google Business Profile integration per location

## Why Use Location-Specific Pages?

### Accurate Review Attribution
When you have multiple locations, you need to know **which location** earned which review.

**Without Location Pages:**
- All reviews go to one central page
- Can''t track performance by location
- Hard to identify problem areas
- Google reviews get misdirected

**With Location Pages:**
- Each location''s reviews are tracked separately
- Identify top and underperforming locations
- Direct Google reviews to the correct listing
- Managers see only their location''s feedback

### Location-Specific Google Business Profiles
Each of your locations has its own Google Business Profile. Location Prompt Pages integrate with the correct GBP for each location.

### Manager Accountability
Give each location manager their own review collection tool with isolated analytics.

### Localized Marketing
Different locations can have different:
- QR codes and promotional materials
- Team photos and branding
- Special offers or messaging
- Hours and contact information

## How They Work

### Setup Process
1. **Connect your Google Business Profile**
   - Import all your locations automatically
   - Or add locations manually

2. **Create Location Prompt Pages**
   - One click to create pages for all locations
   - Or create selectively for specific branches

3. **Customize per location** (optional)
   - Add location-specific photos
   - Customize messaging
   - Set location hours
   - Add manager contact info

4. **Distribute to customers**
   - Each location gets unique QR codes
   - Location-specific URLs for emails
   - Print materials per branch

### Customer Experience
1. Customer visits location-specific URL
2. Page shows location name, address, photo
3. Customer enters their info
4. They write review for that specific location
5. Review directs to correct Google listing

## Location Pages vs Universal Pages

| Feature | Location Pages | Universal Page |
|---------|---------------|----------------|
| **Number of pages** | One per location | One for all |
| **Google integration** | Separate per location | General only |
| **Analytics** | By location | Combined |
| **URL** | `/r/business-downtown` | `/r/business` |
| **Best for** | Multi-location businesses | Single-location or general |
| **Manager access** | Per-location filtering | All reviews |

**Use both!** Many businesses use Location Pages for location-specific campaigns and a Universal Page for general branding.

## Setup Best Practices

### 1. Import from Google Business
The fastest way to set up Location Pages:
1. Connect your Google Business Profile
2. Click "Import Locations"
3. Select which locations to create pages for
4. Pages are created automatically with location data

### 2. Naming Convention
Choose consistent, intuitive slugs:
- ✅ `/r/yourcompany-downtown`
- ✅ `/r/yourcompany-westside`
- ✅ `/r/yourcompany-mall-plaza`
- ❌ `/r/yourcompany-loc1` (not descriptive)

### 3. Location-Specific Customization
Consider customizing for each location:
- **High-traffic locations**: Add special branding, highlight popular services
- **New locations**: Include opening date, welcome message
- **Flagship stores**: Showcase premium services
- **Struggling locations**: Emphasize improvement efforts

### 4. Manager Training
Ensure each location manager knows:
- Their unique URL and QR code
- How to check their location''s reviews
- Response protocols for feedback
- How to request reviews from customers

## Distribution Strategies

### Physical Materials per Location
1. **Printed QR Codes**
   - Receipt footers (location-specific)
   - Window decals with location name
   - Table tents at each location
   - Business cards for staff

2. **In-Store Signage**
   - Checkout counter displays
   - Waiting area posters
   - Bathroom mirror decals
   - Exit door reminders

### Digital per Location
1. **Location-Specific Emails**
   - Receipts from that location
   - Follow-up emails mention location name
   - Local email campaigns

2. **Google Business Profile**
   - Add review link to each GBP
   - Include in booking confirmations
   - Add to location description

3. **Location Landing Pages**
   - Each location''s website page links to its prompt page
   - Store locator includes review links

## Advanced Location Features

### Google Business Integration
- Reviews route to correct GBP listing
- Location name and address auto-fill
- Hours and phone sync from GBP
- Photos can pull from GBP

### Location Analytics Dashboard
Track performance across all locations:
- Reviews collected per location
- Conversion rates by location
- Sentiment analysis by location
- Top and bottom performers
- Month-over-month trends

### Multi-Location Campaigns
Run location-specific or company-wide campaigns:
- Contest between locations for most reviews
- Seasonal campaigns per region
- New location launch campaigns
- Manager incentive programs

### Bulk Operations
Manage all location pages efficiently:
- Update branding across all locations
- Change platform options globally
- Bulk print QR codes
- Export all location analytics

## Common Questions

**Q: Do I need a separate Google Business Profile for each location?**
A: Yes! Each location should have its own GBP listing. Location Prompt Pages integrate with each one.

**Q: Can managers only see their location''s reviews?**
A: Yes, if you give them location-specific access. Admins can see all locations.

**Q: What if we open a new location?**
A: Simply create a new Location Prompt Page. Takes about 2 minutes.

**Q: Can I delete a location if we close it?**
A: Yes, but existing reviews and analytics are preserved. The page becomes inactive.

**Q: Do all locations have to use the same platform options?**
A: No! You can customize which platforms (Google, Yelp, etc.) appear per location.

**Q: Can I have different team photos per location?**
A: Absolutely! Each location can have unique branding, photos, and messaging.

## Measuring Success by Location

### Key Metrics to Track
1. **Reviews per location per month**
   - Identify high and low performers
   - Set location-specific goals

2. **Conversion rate by location**
   - Which locations convert best?
   - What are they doing differently?

3. **Sentiment by location**
   - Where are customers happiest?
   - Where do we need improvement?

4. **Platform preferences by location**
   - Some locations may be stronger on specific platforms
   - Adjust marketing accordingly

### Benchmark Goals
- **Strong performers**: 20+ reviews/month per location
- **Average**: 10-20 reviews/month per location
- **Needs improvement**: <10 reviews/month per location

## Scaling with Location Pages

### For Franchise Businesses
- Corporate provides template pages
- Franchisees customize per location
- Corporate tracks performance across network
- Best practices shared between locations

### For Growing Businesses
- Start with 1-3 locations
- Add pages as you expand
- Use successful locations as templates
- Analytics guide new location setup

### For Enterprise
- Centralized management for 50+ locations
- Region-based performance tracking
- Automated reporting by location
- Integration with business intelligence tools

## Location Pages Success Stories

**Dental Practice with 8 Locations**
- Created Location Pages for each office
- Added QR codes to appointment reminder cards
- Result: Went from 3 reviews/month (total) to 15 reviews/month **per location**

**Restaurant Chain with 12 Locations**
- Location-specific QR codes on every receipt
- Manager contest for most reviews
- Result: Identified 2 underperforming locations, fixed issues, ratings improved

**Home Services with 5 Service Areas**
- Created pages per service territory
- Technicians share location-specific links
- Result: Better Google rankings in each service area

## Pro Tips

1. **Make it a contest**: Track which location gets the most reviews each month
2. **Share success stories**: Celebrate locations with great reviews
3. **Identify patterns**: If one location excels, learn from them
4. **Address issues quickly**: Low ratings at a specific location indicate action needed
5. **Empower managers**: Give them ownership of their location''s reputation

Location Prompt Pages turn multi-location review chaos into organized, actionable data that helps every branch succeed.',
  'published',
  '{
    "description": "Collect reviews for each of your business locations separately. Perfect for multi-location businesses, franchises, and chains that need location-specific review tracking and Google Business Profile integration.",
    "category": "Prompt Pages",
    "category_label": "Page Types",
    "category_icon": "MapPin",
    "category_color": "green",
    "available_plans": ["builder", "maven"],
    "keywords": ["location prompt pages", "multi-location reviews", "franchise reviews", "location-specific reviews", "Google Business Profile"],
    "key_features": [
      {
        "icon": "MapPin",
        "title": "One Page Per Location",
        "description": "Separate review collection for each business location with unique URLs."
      },
      {
        "icon": "Building2",
        "title": "Google Business Integration",
        "description": "Reviews route to the correct Google Business Profile for each location."
      },
      {
        "icon": "BarChart3",
        "title": "Location Analytics",
        "description": "Track performance, sentiment, and conversion rates by location."
      },
      {
        "icon": "Users",
        "title": "Manager Access",
        "description": "Location managers can view and respond to their location''s reviews only."
      }
    ],
    "key_features_title": "Location-Specific Features",
    "how_it_works": [
      {
        "number": 1,
        "icon": "Building2",
        "title": "Import Your Locations",
        "description": "Connect Google Business Profile or add locations manually. Create pages for each."
      },
      {
        "number": 2,
        "icon": "Palette",
        "title": "Customize Per Location",
        "description": "Add location-specific photos, hours, team info, and branding."
      },
      {
        "number": 3,
        "icon": "Share2",
        "title": "Distribute Location Links",
        "description": "Each location uses its own URL and QR codes for review collection."
      },
      {
        "number": 4,
        "icon": "TrendingUp",
        "title": "Track by Location",
        "description": "View analytics, reviews, and sentiment data per location in your dashboard."
      }
    ],
    "how_it_works_title": "Setting Up Location Pages",
    "best_practices": [
      {
        "icon": "Link",
        "title": "Use Clear Naming",
        "description": "Name each location page clearly (e.g., downtown, westside, mall-location)."
      },
      {
        "icon": "Target",
        "title": "Location-Specific Campaigns",
        "description": "Run contests or campaigns comparing location performance."
      },
      {
        "icon": "Users",
        "title": "Empower Managers",
        "description": "Give location managers access to their reviews for accountability."
      },
      {
        "icon": "TrendingUp",
        "title": "Identify Patterns",
        "description": "High-performing locations teach lessons for struggling ones."
      }
    ],
    "best_practices_title": "Multi-Location Best Practices",
    "faqs": [
      {
        "question": "Do I need separate Google Business Profiles?",
        "answer": "Yes! Each physical location should have its own Google Business Profile listing."
      },
      {
        "question": "Can managers see only their location?",
        "answer": "Yes, you can grant location-specific access so managers only see their branch''s reviews."
      },
      {
        "question": "What if we add a new location?",
        "answer": "Simply create a new Location Prompt Page in about 2 minutes."
      },
      {
        "question": "Can locations have different platforms enabled?",
        "answer": "Yes! Each location can show different review platform options (Google, Yelp, etc.)."
      },
      {
        "question": "How do I track all locations at once?",
        "answer": "The dashboard shows combined analytics plus ability to filter by individual location."
      }
    ],
    "faqs_title": "Common Questions",
    "call_to_action": {
      "primary": {
        "text": "Create Location Pages",
        "href": "/prompt-pages?tab=locations"
      },
      "secondary": {
        "text": "View All Page Types",
        "href": "/prompt-pages/types"
      }
    }
  }'::jsonb,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- Continue in next file part due to length constraints...
-- ============================================================================
