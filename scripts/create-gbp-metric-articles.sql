-- 1. Monthly Patterns
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/monthly-patterns',
  'Understanding Monthly Review Patterns',
  '# Understanding Monthly Review Patterns

## What Are Monthly Review Patterns?

Monthly review patterns show you how your reviews are distributed throughout the month. This metric tracks when customers are most likely to leave reviews and helps identify trends in your review collection efforts.

## Why This Matters

Understanding monthly patterns is crucial because:

- **Optimize Timing**: Knowing when customers are most likely to leave reviews helps you time your review requests more effectively
- **Identify Gaps**: Spotting periods with fewer reviews allows you to increase outreach during slower times
- **Seasonal Insights**: Patterns can reveal seasonal trends in your business that affect customer engagement
- **Campaign Effectiveness**: Track how your marketing campaigns influence review submission timing

## Taking Action

Use this data to:
1. Schedule review requests during peak engagement periods
2. Create targeted campaigns for slow review periods
3. Align review collection with your busiest business days
4. Improve overall review volume consistency',
  'published',
  '{"category": "google-business", "description": "Learn how monthly review patterns help optimize your review collection timing and identify seasonal trends."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 2. Total Reviews
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/total-reviews',
  'Total Reviews Count',
  '# Total Reviews Count

## What Is Total Reviews?

Your total reviews count represents the complete number of customer reviews your business has received on Google Business Profile over time. This is your cumulative review history.

## Why This Matters

Total reviews is one of the most important metrics because:

- **Trust Signal**: More reviews = more credibility. Customers trust businesses with hundreds of reviews over those with just a few
- **Search Ranking**: Google''s algorithm favors businesses with more reviews, improving your local search visibility
- **Competitive Advantage**: Businesses with 50+ reviews are significantly more likely to be chosen over competitors
- **Customer Confidence**: Each review adds social proof that encourages potential customers to choose your business

## Benchmarks

- **0-10 reviews**: Just starting - focus on getting your first reviews
- **10-50 reviews**: Building momentum - maintain consistent review requests
- **50-100 reviews**: Strong foundation - you''re competitive in local search
- **100+ reviews**: Excellent - you have significant social proof and search advantages

## Taking Action

To increase your total reviews:
1. Make review requests part of your standard customer follow-up
2. Use PromptReviews to automate review collection
3. Train staff to ask happy customers for reviews
4. Feature your review count in marketing materials',
  'published',
  '{"category": "google-business", "description": "Why total review count matters for trust, search ranking, and customer acquisition."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 3. Review Trends
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/review-trends',
  'Review Trends Analysis',
  '# Review Trends Analysis

## What Are Review Trends?

Review trends track how your review volume changes over time - whether you''re receiving more reviews, fewer reviews, or maintaining a steady pace. This shows the direction and momentum of your review collection efforts.

## Why This Matters

Monitoring review trends is critical because:

- **Early Warning System**: Declining trends alert you to problems before they impact your business significantly
- **Success Validation**: Positive trends confirm your review strategy is working
- **Competitive Position**: Steady growth keeps you competitive as other businesses increase their review counts
- **Algorithm Impact**: Google favors businesses with consistent, growing review activity

## Understanding Trend Indicators

- **📈 Upward Trend**: Your review collection is accelerating - great job!
- **➡️ Steady Trend**: Consistent pace - maintain your current strategy
- **📉 Downward Trend**: Review velocity is slowing - time to increase efforts

## Taking Action

Based on your trends:
- **Positive Trends**: Document what''s working and scale it
- **Flat Trends**: Experiment with new review request methods
- **Negative Trends**: Audit your customer experience and review request process',
  'published',
  '{"category": "google-business", "description": "Track review velocity trends to validate strategy and catch problems early."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 4. Average Rating
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/average-rating',
  'Average Rating Score',
  '# Average Rating Score

## What Is Average Rating?

Your average rating is the mean score of all your customer reviews, displayed as stars (1-5). This single number represents your overall customer satisfaction and is prominently displayed in Google Search and Maps.

## Why This Matters

Average rating is perhaps your most visible metric because:

- **First Impression**: This is often the first thing potential customers see when finding your business
- **Decision Driver**: 88% of consumers trust online reviews as much as personal recommendations
- **Search Impact**: Businesses with 4+ stars appear more prominently in local search results
- **Revenue Impact**: A single star increase can boost revenue by 5-9% according to Harvard research

## Rating Benchmarks

- **4.5-5.0 stars**: Excellent - strong competitive advantage
- **4.0-4.4 stars**: Good - meeting customer expectations
- **3.5-3.9 stars**: Fair - room for improvement needed
- **Below 3.5**: Action required - significant improvements needed

## Taking Action

To improve or maintain your rating:
1. Address negative reviews promptly and professionally
2. Focus on delivering exceptional customer experiences
3. Encourage satisfied customers to share their experiences
4. Use feedback to make real business improvements
5. Never ask only happy customers for reviews - maintain authenticity',
  'published',
  '{"category": "google-business", "description": "Why your average star rating is crucial for first impressions and search rankings."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 5. Response Rate
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/response-rate',
  'Review Response Rate',
  '# Review Response Rate

## What Is Response Rate?

Response rate measures the percentage of reviews you''ve responded to out of your total reviews. It shows how actively you engage with customer feedback.

## Why This Matters

Your response rate is crucial because:

- **Customer Perception**: 89% of consumers read business responses to reviews
- **Trust Building**: Responding shows you value customer feedback and care about their experience
- **SEO Benefit**: Active engagement signals to Google that you maintain your profile, potentially improving rankings
- **Damage Control**: Professional responses to negative reviews can minimize their impact on your reputation
- **Future Business**: Prospects see how you handle both praise and criticism

## Response Rate Targets

- **80-100%**: Excellent - shows consistent engagement
- **50-79%**: Good - maintain momentum and improve
- **25-49%**: Fair - significant improvement needed
- **Below 25%**: Poor - start responding to reviews immediately

## Best Practices

1. **Respond to ALL reviews** - positive and negative
2. **Be timely** - respond within 24-48 hours when possible
3. **Personalize** - avoid generic copy-paste responses
4. **Stay professional** - even with difficult reviews
5. **Show appreciation** - thank customers for their feedback',
  'published',
  '{"category": "google-business", "description": "Why responding to reviews matters for trust, SEO, and reputation management."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 6. Unresponded Reviews
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/unresponded-reviews',
  'Unresponded Reviews',
  '# Unresponded Reviews

## What Are Unresponded Reviews?

These are reviews that haven''t received a response from your business yet. Each unresponded review represents a missed opportunity to engage with customers and show prospects you care about feedback.

## Why This Matters

Unresponded reviews have serious consequences:

- **Lost Engagement**: Each unresponded review is a missed chance to thank customers or address concerns
- **Negative Signal**: Prospects see unresponded reviews as a sign you don''t care about customer feedback
- **SEO Impact**: Google may view inactive profiles less favorably in local search rankings
- **Escalation Risk**: Unhappy customers with unresponded reviews may escalate complaints to other platforms
- **Revenue Loss**: Potential customers may choose competitors who actively engage with reviews

## Taking Action

Reduce your unresponded reviews by:
1. **Set Up Alerts**: Get notified immediately when new reviews arrive
2. **Create Templates**: Develop response templates to speed up the process
3. **Assign Responsibility**: Designate team members to manage review responses
4. **Schedule Time**: Block time daily to respond to reviews
5. **Use Automation**: Leverage tools to streamline review management

## Priority Order

1. **Negative reviews** - respond within 24 hours
2. **Questions in reviews** - respond within 48 hours
3. **Positive reviews** - respond within 3-5 days',
  'published',
  '{"category": "google-business", "description": "The cost of ignoring reviews and how to catch up on unresponded feedback."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 7. Questions
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/questions',
  'Customer Questions (Q&A)',
  '# Customer Questions (Q&A)

## What Is Q&A?

The Questions & Answers section on your Google Business Profile allows potential customers to ask questions directly. Total Q&A counts all questions asked about your business.

## Why This Matters

Q&A is a powerful engagement tool because:

- **High Intent Signals**: People asking questions are seriously considering your business
- **Public Answers**: Your responses are visible to everyone, helping multiple potential customers at once
- **First Impressions**: How you handle Q&A directly influences purchase decisions
- **Information Gap**: Unanswered questions may send customers to competitors
- **SEO Value**: Active Q&A engagement can improve your profile''s relevance signals

## Common Question Types

- Operating hours and holiday schedules
- Pricing and payment methods
- Parking and accessibility
- Services offered and restrictions
- COVID-19 policies and safety measures

## Best Practices

1. **Answer quickly** - respond within 24 hours when possible
2. **Be comprehensive** - provide complete, helpful answers
3. **Stay professional** - maintain your brand voice
4. **Add photos** - visual answers are more helpful
5. **Proactive FAQ** - anticipate common questions and answer them yourself',
  'published',
  '{"category": "google-business", "description": "Why customer questions are high-intent signals and how to leverage Q&A effectively."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 8. Unanswered Questions
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/metrics/unanswered-questions',
  'Unanswered Questions',
  '# Unanswered Questions

## What Are Unanswered Questions?

These are customer questions in your Q&A section that haven''t received an official answer from your business. Other users can answer, but business responses carry more weight and credibility.

## Why This Matters

Unanswered questions directly impact your business because:

- **Lost Conversions**: Potential customers may choose competitors rather than wait for answers
- **Wrong Information**: Without official answers, users may provide incorrect information about your business
- **Perceived Inattention**: Unanswered questions signal that you''re not actively managing your profile
- **Missed Opportunities**: Each question is someone interested enough to engage - don''t waste that intent
- **Negative Impression**: Prospects judge businesses by how they handle inquiries

## Impact on Business

Studies show:
- Businesses that answer questions within 24 hours see 35% higher engagement
- 92% of consumers will use a business that responds to all reviews and questions
- Unanswered questions can reduce your click-through rate by up to 20%

## Taking Action

To reduce unanswered questions:
1. **Enable notifications** for new questions
2. **Check daily** - make Q&A review part of your routine
3. **Answer publicly** - helps multiple potential customers
4. **Be thorough** - comprehensive answers prevent follow-up questions
5. **Monitor user answers** - correct any misinformation',
  'published',
  '{"category": "google-business", "description": "The conversion cost of unanswered questions and how to stay on top of Q&A."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 9. Categories
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/categories',
  'Business Categories',
  '# Business Categories

## What Are Business Categories?

Categories tell Google what your business does. You can select one primary category and up to 9 additional categories that describe your services or products.

## Why This Matters

Proper categorization is fundamental because:

- **Search Visibility**: Categories determine which searches your business appears in
- **Local Ranking**: Google uses categories as a primary ranking factor for local searches
- **Customer Expectations**: Categories set the right expectations about what you offer
- **Competitor Set**: Your category determines which businesses you compete against in search results
- **Feature Access**: Some Google Business features are only available to specific categories

## Category Strategy

**Primary Category**:
- Choose your most important business type
- This has the biggest impact on search rankings
- Be specific rather than generic (e.g., "Italian Restaurant" vs "Restaurant")

**Additional Categories**:
- Include all relevant services you offer
- Help you appear in more specific searches
- Don''t add categories you don''t truly fit

## Best Practices

1. **Be Accurate**: Only select categories that truly describe your business
2. **Be Specific**: Choose the most specific category available
3. **Research Competitors**: See what categories successful competitors use
4. **Review Regularly**: Update categories as your services evolve
5. **Avoid Spam**: Don''t add irrelevant categories just to appear in more searches',
  'published',
  '{"category": "google-business", "description": "Why business categories are crucial for search visibility and local ranking."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 10. Services
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/services',
  'Business Services',
  '# Business Services

## What Are Services?

The Services section lists specific services or products your business offers. Each service can include a description, pricing, and additional details.

## Why This Matters

Detailed service listings are crucial because:

- **Search Matching**: Google matches service keywords with user searches, improving visibility
- **Customer Clarity**: Clear service lists help customers quickly determine if you offer what they need
- **Competitive Edge**: Detailed services make you stand out from competitors with minimal information
- **Conversion Boost**: Businesses with 10+ services see 35% more engagement than those with fewer
- **Price Transparency**: Listing prices builds trust and filters qualified leads

## Service Count Benchmarks

- **1-4 services**: Basic presence - expand your listings
- **5-9 services**: Good coverage - getting better
- **10-15 services**: Excellent - strong competitive position
- **16+ services**: Comprehensive - you''re maximizing this feature

## Service Descriptions

Strong service descriptions include:
1. **What''s Included**: Specify exactly what the service entails
2. **Benefits**: Explain how it helps customers
3. **Pricing**: Be transparent about costs when possible
4. **Duration**: How long the service takes
5. **Keywords**: Naturally include terms customers search for

## Taking Action

To optimize your services:
- Add at least 10 services if possible
- Write detailed descriptions (100-300 characters each)
- Include pricing to set expectations
- Update regularly to reflect current offerings
- Use keywords customers actually search for',
  'published',
  '{"category": "google-business", "description": "Why detailed service listings drive more qualified leads and better engagement."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 11. Business Description
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/business-description',
  'Business Description',
  '# Business Description

## What Is the Business Description?

Your business description is a 750-character summary of what your business does, your unique value, and why customers should choose you. It appears in your Google Business Profile and search results.

## Why This Matters

Your description is critical because:

- **First Impression**: Often the first detailed information potential customers read about your business
- **SEO Impact**: Google uses your description to understand your business and match you to searches
- **Differentiation**: This is your chance to explain what makes you different from competitors
- **Keyword Opportunity**: Strategic keyword placement improves search visibility
- **Conversion Tool**: Well-written descriptions increase the likelihood of clicks and calls

## Optimal Length

- **Minimum**: 250 characters - bare minimum for basic information
- **Ideal**: 500-600 characters - sweet spot for SEO and readability
- **Maximum**: 750 characters - use all available space when possible

**Why 500-600 characters?**
- Enough space for comprehensive information
- Fits mobile screens without excessive truncation
- Maximizes keyword inclusion without spam
- Google shows preference for more complete profiles

## Description Formula

1. **Opening (100-150 chars)**: What you do and your unique value
2. **Middle (200-300 chars)**: Key services, specialties, and benefits
3. **Closing (100-150 chars)**: Call to action and what makes you different

## Best Practices

- **Start strong**: Lead with your biggest benefit or differentiator
- **Use keywords**: Include terms customers search for naturally
- **Be specific**: Concrete details are more compelling than vague claims
- **Avoid keyword stuffing**: Write for humans, not just search engines
- **Include location**: Local keywords help local search
- **Update regularly**: Refresh seasonally or when services change',
  'published',
  '{"category": "google-business", "description": "How to write an effective business description that drives visibility and conversions."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 12. Attributes
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/attributes',
  'Business Attributes',
  '# Business Attributes

## What Are Business Attributes?

Attributes are specific features or characteristics of your business, such as "wheelchair accessible," "outdoor seating," "free Wi-Fi," or "accepts credit cards." They help customers quickly identify if your business meets their needs.

## Why This Matters

Attributes significantly impact customer decisions because:

- **Filter Matching**: Customers often filter search results by attributes (e.g., "restaurants with outdoor seating")
- **Accessibility**: Critical for customers with specific accessibility needs
- **Decision Factors**: Attributes like parking, payment options, or Wi-Fi influence choices
- **Complete Profile**: More attributes signal to Google that you maintain a comprehensive profile
- **Competitive Advantage**: Stand out by highlighting features competitors don''t have

## Target: 8+ Attributes

Aim for at least 8 attributes because:
- More attributes = better search matching
- Covers most common customer filters
- Shows Google you maintain an active, complete profile
- Provides customers comprehensive information at a glance

## Common Attribute Categories

**Accessibility**: Wheelchair accessible, assistive hearing loop
**Amenities**: Free Wi-Fi, parking, outdoor seating, dogs allowed
**Service Options**: Dine-in, takeout, delivery, online appointments
**Planning**: Reservations recommended, accepts walk-ins
**Payments**: Credit cards, cash only, NFC mobile payments

## Best Practices

1. **Be honest**: Only select attributes that truly apply
2. **Be complete**: Add all relevant attributes for your business type
3. **Update seasonally**: Some attributes may change
4. **Check suggestions**: Google suggests attributes based on your category
5. **Review regularly**: New attributes are added - check for relevant ones',
  'published',
  '{"category": "google-business", "description": "Why business attributes help customers find exactly what they''re looking for."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 13. Products
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/products',
  'Product Listings',
  '# Product Listings

## What Are Product Listings?

Products are items or service packages you can showcase with photos, descriptions, and pricing. They appear in your Google Business Profile and can show up directly in search results.

## Why This Matters

Product listings drive business because:

- **Visual Appeal**: Products with photos get 35% more clicks than text-only listings
- **Price Transparency**: Listing prices builds trust and qualifies leads before they contact you
- **Search Visibility**: Products can appear in Google search results independently of your business listing
- **Shopping Intent**: Customers searching for specific products may discover your business
- **Conversion Boost**: Detailed product information reduces friction in the buying process

## Target: 5+ Products

List at least 5 products because:
- Provides good variety for customers
- Increases chances of appearing in product searches
- Shows you actively maintain your profile
- Gives customers multiple entry points to your business

## What to List

**Retail**: Best-sellers, seasonal products, new arrivals, signature items
**Services**: Service packages, memberships, popular treatments

## Product Details

Each product should include:
1. **Clear Photo**: High-quality image showing the product
2. **Descriptive Name**: Clear, keyword-rich product name
3. **Price**: Exact price or price range
4. **Description**: Benefits, features, and key details
5. **Category**: Helps organize your product catalog

## Best Practices

- Update regularly with seasonal items
- Highlight bestsellers
- Use quality photos
- Include prices for transparency
- Keep catalog fresh and current',
  'published',
  '{"category": "google-business", "description": "How product listings boost visibility and drive qualified customer interest."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 14. Photos
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/photos',
  'Photo Activity',
  '# Photo Activity

## What Is Photo Activity?

Photo activity tracks how frequently you upload new photos to your Google Business Profile. The target is 2+ photos per month to maintain an active presence.

## Why This Matters

Regular photo uploads are crucial because:

- **Search Ranking Factor**: Google favors businesses with fresh, recent photos
- **Engagement Boost**: Businesses with photos receive 42% more direction requests and 35% more website clicks
- **Trust Signal**: Recent photos show your business is active and current
- **Visual Appeal**: Photos attract attention in search results
- **Customer Expectations**: Modern consumers expect to see what they''re getting before they visit

## Photo Upload Targets

- **2-4 photos/month**: Minimum to maintain active status
- **4-8 photos/month**: Good engagement level
- **8-12 photos/month**: Excellent - staying top of mind
- **12+ photos/month**: Outstanding - maximum visibility

## Photo Strategy

**What to Photograph**:
1. New products/services
2. Behind the scenes
3. Team members
4. Customer experiences
5. Seasonal updates

**Categories**: Cover, logo, exterior (2-3), interior (3-5), team, products (5+)

## Quality Guidelines

- Resolution: Minimum 720px x 720px
- Format: JPG or PNG
- Lighting: Well-lit, clear images
- Focus: Sharp, not blurry
- Authentic: Real photos, not stock images

## Best Practices

1. Batch upload photos, schedule throughout month
2. Vary content types
3. Remove outdated photos seasonally
4. Use smartphone for convenience
5. Let photos showcase your brand',
  'published',
  '{"category": "google-business", "description": "Why regular photo uploads boost search ranking and customer engagement."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 15. Posts
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/optimization/posts',
  'Google Posts',
  '# Google Posts

## What Are Google Posts?

Google Posts are short updates (similar to social media posts) that appear directly in your Google Business Profile. They can announce events, offers, news, or products.

## Why This Matters

Regular posting is essential because:

- **Visibility Boost**: Posts appear prominently in your profile and can show in search results
- **Freshness Signal**: Active posting tells Google your business is engaged and current
- **Engagement Tool**: Posts with call-to-action buttons drive clicks, calls, and bookings
- **Promotional Channel**: Free way to promote offers, events, and announcements
- **Competitive Edge**: Most businesses don''t post regularly - consistent posting sets you apart

## Target: 4+ Posts Per Month

Post at least 4 times monthly because:
- Maintains "active" status with Google
- Keeps your profile fresh
- Provides weekly customer touchpoints
- Maximizes visibility
- Studies show weekly posting increases engagement by 30%

## Post Types

**What''s New**: General updates, new products, behind-the-scenes
**Events**: Upcoming events with date and time
**Offers**: Promotions, discounts, limited-time offers
**Products**: Highlight specific products with pricing

## Best Practices

1. **Be Visual**: Always include high-quality photos
2. **Be Concise**: 100-300 characters works best
3. **Use CTAs**: Include clear call-to-action buttons
4. **Update Weekly**: Aim for one post per week minimum
5. **Track Performance**: Monitor engagement

## Content Calendar

- Week 1: New product/service announcement
- Week 2: Customer spotlight
- Week 3: Special offer
- Week 4: Behind-the-scenes

## Timing

- Posts expire after 7 days
- Post Mondays/Tuesdays for best visibility
- Align with your business peak hours',
  'published',
  '{"category": "google-business", "description": "How regular Google Posts boost visibility and drive customer actions."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 16. Profile Views
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/performance/profile-views',
  'Profile Views',
  '# Profile Views

## What Are Profile Views?

Profile views count how many times your Google Business Profile has been viewed on Google Search and Maps. This includes both direct searches for your business name and discovery searches.

## Why This Matters

Profile views are critical because:

- **Visibility Indicator**: More views = better search visibility
- **Top of Funnel**: Views are the first step - no views means no customers
- **Competitive Benchmark**: Compare to competitors
- **Marketing Effectiveness**: Track optimization impact
- **Revenue Correlation**: More views typically lead to more customers

## View Trends

**📈 Increasing**: Optimization working, growing relevance
**➡️ Stable**: Consistent presence, maintain efforts
**📉 Decreasing**: Competitors improving, need optimization

## What Influences Profile Views

1. **Search Ranking**: Higher rankings = more views
2. **Categories**: Accurate categories match more searches
3. **Keywords**: Business name and description matching searches
4. **Reviews**: More/better reviews improve visibility
5. **Photos**: Profiles with photos get more clicks
6. **Completeness**: 100% complete profiles rank better
7. **Engagement**: Regular posts boost visibility

## Taking Action

To increase profile views:
- Complete every profile section
- Add regular photos and posts
- Collect more reviews consistently
- Optimize description with keywords
- Ensure accurate categories
- Monitor competitor profiles',
  'published',
  '{"category": "google-business", "description": "Why profile views matter and how to increase your search visibility."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 17. Customer Actions
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/performance/customer-actions',
  'Customer Actions',
  '# Customer Actions

## What Are Customer Actions?

Customer actions track specific actions people take after viewing your profile: website clicks, phone calls, direction requests, and photo views.

## Why This Matters

Customer actions are conversion metrics that directly impact revenue:

- **Intent Indicators**: High-intent actions from interested customers
- **ROI Measurement**: Actions translate to business opportunities
- **Conversion Tracking**: Shows how well profile converts views
- **Business Impact**: Each action = potential customer
- **Optimization Guide**: Shows which actions customers prefer

## Understanding Each Action

**Website Clicks**: Shows interest in learning more
**Phone Calls**: Highest intent - ready to engage
**Direction Requests**: Strong intent to visit in person
**Photo Views**: Visual engagement indicates serious interest

## Monthly Benchmarks

**Website Clicks**: 0-10 Low, 10-50 Fair, 50-100 Good, 100+ Excellent
**Phone Calls**: 0-5 Low, 5-20 Fair, 20-50 Good, 50+ Excellent
**Directions**: 0-10 Low, 10-30 Fair, 30-75 Good, 75+ Excellent

## Taking Action

To increase customer actions:
1. Complete profile fully
2. Add compelling photos
3. Update business hours
4. Respond to reviews
5. Use Posts to promote offers
6. Make CTAs clear',
  'published',
  '{"category": "google-business", "description": "How customer actions measure conversion and drive revenue opportunities."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 18. Search Queries
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'google-biz-optimizer/performance/search-queries',
  'Top Search Queries',
  '# Top Search Queries

## What Are Search Queries?

Top search queries show the actual terms people used to find your business - both "direct" searches (your business name) and "discovery" searches (what you do/offer).

## Why This Matters

Understanding search queries is valuable because:

- **Customer Language**: Shows exactly how customers describe what you do
- **Keyword Insights**: Reveals which terms drive the most traffic
- **Content Optimization**: Guides keywords to emphasize in description and posts
- **Service Gaps**: May reveal services customers expect but you don''t advertise
- **Competitive Intelligence**: Shows what customers are looking for

## Query Types

**Direct Queries**: Your business name and variations
- **Why they matter**: Brand awareness indicator

**Discovery Queries**: "Italian restaurant near me", "emergency plumber"
- **Why they matter**: New customer acquisition

## How to Use This Data

1. **Optimize Description**: Include popular discovery terms naturally
2. **Update Services**: Add services matching common queries
3. **Create Posts**: Post about topics related to queries
4. **Refine Categories**: Ensure categories align with searches
5. **Website Optimization**: Use popular query terms on site

## Red Flags

- High direct, low discovery: Not attracting new customers
- Irrelevant queries: Showing up for wrong searches
- Negative queries: Fix hours or profile issues
- Competitor names: Good opportunity

## Weekly Review

1. Identify top 5 discovery searches
2. Ensure terms appear in description
3. Create post about popular query
4. Add missing services
5. Track query pattern changes',
  'published',
  '{"category": "google-business", "description": "How search query data guides optimization and reveals customer intent."}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;
