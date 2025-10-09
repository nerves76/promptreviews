/**
 * Script to create Google Business Profile metric help articles
 * Run with: npx ts-node scripts/create-gbp-metric-articles.ts
 */

const ARTICLES = [
  // === METRICS SECTION ===
  {
    slug: 'google-biz-optimizer/metrics/monthly-patterns',
    title: 'Understanding Monthly Review Patterns',
    category: 'google-business',
    content: `
# Understanding Monthly Review Patterns

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
4. Improve overall review volume consistency
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/total-reviews',
    title: 'Total Reviews Count',
    category: 'google-business',
    content: `
# Total Reviews Count

## What Is Total Reviews?

Your total reviews count represents the complete number of customer reviews your business has received on Google Business Profile over time. This is your cumulative review history.

## Why This Matters

Total reviews is one of the most important metrics because:

- **Trust Signal**: More reviews = more credibility. Customers trust businesses with hundreds of reviews over those with just a few
- **Search Ranking**: Google's algorithm favors businesses with more reviews, improving your local search visibility
- **Competitive Advantage**: Businesses with 50+ reviews are significantly more likely to be chosen over competitors
- **Customer Confidence**: Each review adds social proof that encourages potential customers to choose your business

## Benchmarks

- **0-10 reviews**: Just starting - focus on getting your first reviews
- **10-50 reviews**: Building momentum - maintain consistent review requests
- **50-100 reviews**: Strong foundation - you're competitive in local search
- **100+ reviews**: Excellent - you have significant social proof and search advantages

## Taking Action

To increase your total reviews:
1. Make review requests part of your standard customer follow-up
2. Use PromptReviews to automate review collection
3. Train staff to ask happy customers for reviews
4. Feature your review count in marketing materials
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/review-trends',
    title: 'Review Trends Analysis',
    category: 'google-business',
    content: `
# Review Trends Analysis

## What Are Review Trends?

Review trends track how your review volume changes over time - whether you're receiving more reviews, fewer reviews, or maintaining a steady pace. This shows the direction and momentum of your review collection efforts.

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
- **Positive Trends**: Document what's working and scale it
- **Flat Trends**: Experiment with new review request methods
- **Negative Trends**: Audit your customer experience and review request process
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/average-rating',
    title: 'Average Rating Score',
    category: 'google-business',
    content: `
# Average Rating Score

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
5. Never ask only happy customers for reviews - maintain authenticity
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/response-rate',
    title: 'Review Response Rate',
    category: 'google-business',
    content: `
# Review Response Rate

## What Is Response Rate?

Response rate measures the percentage of reviews you've responded to out of your total reviews. It shows how actively you engage with customer feedback.

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
5. **Show appreciation** - thank customers for their feedback
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/unresponded-reviews',
    title: 'Unresponded Reviews',
    category: 'google-business',
    content: `
# Unresponded Reviews

## What Are Unresponded Reviews?

These are reviews that haven't received a response from your business yet. Each unresponded review represents a missed opportunity to engage with customers and show prospects you care about feedback.

## Why This Matters

Unresponded reviews have serious consequences:

- **Lost Engagement**: Each unresponded review is a missed chance to thank customers or address concerns
- **Negative Signal**: Prospects see unresponded reviews as a sign you don't care about customer feedback
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
3. **Positive reviews** - respond within 3-5 days
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/questions',
    title: 'Customer Questions (Q&A)',
    category: 'google-business',
    content: `
# Customer Questions (Q&A)

## What Is Q&A?

The Questions & Answers section on your Google Business Profile allows potential customers to ask questions directly. Total Q&A counts all questions asked about your business.

## Why This Matters

Q&A is a powerful engagement tool because:

- **High Intent Signals**: People asking questions are seriously considering your business
- **Public Answers**: Your responses are visible to everyone, helping multiple potential customers at once
- **First Impressions**: How you handle Q&A directly influences purchase decisions
- **Information Gap**: Unanswered questions may send customers to competitors
- **SEO Value**: Active Q&A engagement can improve your profile's relevance signals

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
5. **Proactive FAQ** - anticipate common questions and answer them yourself
`,
  },
  {
    slug: 'google-biz-optimizer/metrics/unanswered-questions',
    title: 'Unanswered Questions',
    category: 'google-business',
    content: `
# Unanswered Questions

## What Are Unanswered Questions?

These are customer questions in your Q&A section that haven't received an official answer from your business. Other users can answer, but business responses carry more weight and credibility.

## Why This Matters

Unanswered questions directly impact your business because:

- **Lost Conversions**: Potential customers may choose competitors rather than wait for answers
- **Wrong Information**: Without official answers, users may provide incorrect information about your business
- **Perceived Inattention**: Unanswered questions signal that you're not actively managing your profile
- **Missed Opportunities**: Each question is someone interested enough to engage - don't waste that intent
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
5. **Monitor user answers** - correct any misinformation
`,
  },

  // === OPTIMIZATION SECTION ===
  {
    slug: 'google-biz-optimizer/optimization/categories',
    title: 'Business Categories',
    category: 'google-business',
    content: `
# Business Categories

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
- Don't add categories you don't truly fit

## Best Practices

1. **Be Accurate**: Only select categories that truly describe your business
2. **Be Specific**: Choose the most specific category available
3. **Research Competitors**: See what categories successful competitors use
4. **Review Regularly**: Update categories as your services evolve
5. **Avoid Spam**: Don't add irrelevant categories just to appear in more searches
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/services',
    title: 'Business Services',
    category: 'google-business',
    content: `
# Business Services

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
- **16+ services**: Comprehensive - you're maximizing this feature

## Service Descriptions

Strong service descriptions include:
1. **What's Included**: Specify exactly what the service entails
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
- Use keywords customers actually search for
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/business-description',
    title: 'Business Description',
    category: 'google-business',
    content: `
# Business Description

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
- **Update regularly**: Refresh seasonally or when services change
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/attributes',
    title: 'Business Attributes',
    category: 'google-business',
    content: `
# Business Attributes

## What Are Business Attributes?

Attributes are specific features or characteristics of your business, such as "wheelchair accessible," "outdoor seating," "free Wi-Fi," or "accepts credit cards." They help customers quickly identify if your business meets their needs.

## Why This Matters

Attributes significantly impact customer decisions because:

- **Filter Matching**: Customers often filter search results by attributes (e.g., "restaurants with outdoor seating")
- **Accessibility**: Critical for customers with specific accessibility needs
- **Decision Factors**: Attributes like parking, payment options, or Wi-Fi influence choices
- **Complete Profile**: More attributes signal to Google that you maintain a comprehensive profile
- **Competitive Advantage**: Stand out by highlighting features competitors don't have

## Target: 8+ Attributes

Aim for at least 8 attributes because:
- More attributes = better search matching
- Covers most common customer filters
- Shows Google you maintain an active, complete profile
- Provides customers comprehensive information at a glance

## Common Attribute Categories

**Accessibility**:
- Wheelchair accessible entrance/parking/restroom
- Assistive hearing loop

**Amenities**:
- Free Wi-Fi
- Parking available
- Outdoor seating
- Dogs allowed

**Service Options**:
- Dine-in, takeout, delivery
- Online appointments
- Curbside pickup

**Planning**:
- Reservations recommended
- Accepts walk-ins
- Long wait times

**Payments**:
- Credit cards accepted
- Cash only
- NFC mobile payments

## Best Practices

1. **Be honest**: Only select attributes that truly apply
2. **Be complete**: Add all relevant attributes for your business type
3. **Update seasonally**: Some attributes may change (outdoor seating in winter)
4. **Check suggestions**: Google suggests attributes based on your category
5. **Review regularly**: New attributes are added - check for relevant ones
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/products',
    title: 'Product Listings',
    category: 'google-business',
    content: `
# Product Listings

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

**Retail Businesses**:
- Best-selling items
- Seasonal products
- New arrivals
- Signature products

**Service Businesses**:
- Service packages
- Membership options
- Popular treatments/services
- Seasonal offerings

## Product Details

Each product should include:
1. **Clear Photo**: High-quality image showing the product
2. **Descriptive Name**: Clear, keyword-rich product name
3. **Price**: Exact price or price range
4. **Description**: Benefits, features, and key details
5. **Category**: Helps organize your product catalog

## Best Practices

- **Update regularly**: Refresh products seasonally
- **Highlight bestsellers**: Showcase what you're known for
- **Use quality photos**: Professional or high-quality smartphone photos
- **Include prices**: Transparency builds trust
- **Add new products**: Keep your catalog fresh and current
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/photos',
    title: 'Photo Activity',
    category: 'google-business',
    content: `
# Photo Activity

## What Is Photo Activity?

Photo activity tracks how frequently you upload new photos to your Google Business Profile. The target is 2+ photos per month to maintain an active presence.

## Why This Matters

Regular photo uploads are crucial because:

- **Search Ranking Factor**: Google favors businesses with fresh, recent photos
- **Engagement Boost**: Businesses with photos receive 42% more direction requests and 35% more website clicks
- **Trust Signal**: Recent photos show your business is active and current
- **Visual Appeal**: Photos attract attention in search results and compete better against competitors
- **Customer Expectations**: Modern consumers expect to see what they're getting before they visit

## Photo Upload Targets

- **2-4 photos/month**: Minimum to maintain active status
- **4-8 photos/month**: Good engagement level
- **8-12 photos/month**: Excellent - staying top of mind
- **12+ photos/month**: Outstanding - maximum visibility

## Photo Strategy

**What to Photograph**:
1. **New products/services**: Show what's fresh
2. **Behind the scenes**: Build connection and trust
3. **Team members**: Put faces to your business
4. **Customer experiences**: Show your business in action
5. **Seasonal updates**: Decorations, events, seasonal offerings

**Photo Categories to Cover**:
- Cover photo (your best showcase image)
- Logo
- Exterior (2-3 angles)
- Interior (3-5 areas)
- Team (individual and group)
- Products/services (5+ items)

## Quality Guidelines

- **Resolution**: Minimum 720px x 720px
- **Format**: JPG or PNG
- **Lighting**: Well-lit, clear images
- **Focus**: Sharp, not blurry
- **Authentic**: Real photos, not stock images

## Best Practices

1. **Batch upload**: Take multiple photos in one session, schedule throughout month
2. **Vary content**: Mix products, people, spaces, and experiences
3. **Stay current**: Remove outdated photos seasonally
4. **Use smartphone**: Modern phones take great photos
5. **Tell a story**: Let photos showcase your brand personality
`,
  },
  {
    slug: 'google-biz-optimizer/optimization/posts',
    title: 'Google Posts',
    category: 'google-business',
    content: `
# Google Posts

## What Are Google Posts?

Google Posts are short updates (similar to social media posts) that appear directly in your Google Business Profile. They can announce events, offers, news, or products.

## Why This Matters

Regular posting is essential because:

- **Visibility Boost**: Posts appear prominently in your Business Profile and can show in search results
- **Freshness Signal**: Active posting tells Google your business is engaged and current
- **Engagement Tool**: Posts with call-to-action buttons drive clicks, calls, and bookings
- **Promotional Channel**: Free way to promote offers, events, and announcements
- **Competitive Edge**: Most businesses don't post regularly - consistent posting sets you apart

## Target: 4+ Posts Per Month

Post at least 4 times monthly because:
- Maintains "active" status with Google
- Keeps your profile fresh with new content
- Provides weekly touchpoints with potential customers
- Maximizes visibility in search results
- Studies show weekly posting increases engagement by 30%

## Post Types

**What's New Posts**:
- General updates about your business
- New products or services
- Behind-the-scenes content

**Event Posts**:
- Upcoming events with date, time
- Special occasions
- Seasonal happenings

**Offer Posts**:
- Promotions and discounts
- Limited-time offers
- Include terms and conditions

**Product Posts**:
- Highlight specific products
- Include pricing
- Add buy/learn more buttons

## Post Best Practices

1. **Be Visual**: Always include high-quality photos
2. **Be Concise**: 100-300 characters works best
3. **Use CTAs**: Include clear call-to-action buttons
4. **Update Weekly**: Aim for one post per week minimum
5. **Track Performance**: Monitor which posts get the most engagement

## Content Calendar Ideas

- **Week 1**: New product/service announcement
- **Week 2**: Customer spotlight or testimonial
- **Week 3**: Special offer or promotion
- **Week 4**: Behind-the-scenes or team feature

## Timing

- Posts expire after 7 days (or on event date)
- Post on Mondays or Tuesdays for best visibility
- Schedule in advance to maintain consistency
- Align with your business's peak hours
`,
  },

  // === PERFORMANCE SECTION ===
  {
    slug: 'google-biz-optimizer/performance/profile-views',
    title: 'Profile Views',
    category: 'google-business',
    content: `
# Profile Views

## What Are Profile Views?

Profile views count how many times your Google Business Profile has been viewed on Google Search and Maps. This includes both direct searches for your business name and discovery searches where you appeared in results.

## Why This Matters

Profile views are a critical metric because:

- **Visibility Indicator**: More views = better search visibility and discoverability
- **Top of Funnel**: Views are the first step in the customer journey - no views means no customers
- **Competitive Benchmark**: Compare your views to competitors to understand your market position
- **Marketing Effectiveness**: Track how your optimization efforts impact visibility
- **Revenue Correlation**: More views typically lead to more website clicks, calls, and customers

## View Trends

**📈 Increasing Views**:
- Your optimization efforts are working
- Your business is growing in relevance
- Positive reviews and engagement are helping

**➡️ Stable Views**:
- Consistent market presence
- Maintain current efforts
- Look for optimization opportunities

**📉 Decreasing Views**:
- Competitors may be improving faster
- Need to increase optimization efforts
- Check for technical issues with your profile

## What Influences Profile Views

1. **Search Ranking**: Higher rankings = more views
2. **Categories**: Accurate categories match more searches
3. **Keywords**: Business name and description matching search queries
4. **Reviews**: More/better reviews improve visibility
5. **Photos**: Profiles with photos get more clicks
6. **Completeness**: 100% complete profiles rank better
7. **Engagement**: Regular posts and updates boost visibility

## Taking Action

To increase profile views:
- Complete every section of your profile
- Add regular photos and posts
- Collect more reviews consistently
- Optimize your business description with keywords
- Ensure categories accurately reflect your services
- Monitor competitor profiles for ideas
`,
  },
  {
    slug: 'google-biz-optimizer/performance/customer-actions',
    title: 'Customer Actions',
    category: 'google-business',
    content: `
# Customer Actions

## What Are Customer Actions?

Customer actions track the specific actions people take after viewing your Google Business Profile. These include website clicks, phone calls, direction requests, and photo views.

## Why This Matters

Customer actions are conversion metrics that directly impact revenue:

- **Intent Indicators**: These are high-intent actions from interested customers
- **ROI Measurement**: Actions translate directly to business opportunities
- **Conversion Tracking**: Shows how well your profile converts views into engagement
- **Business Impact**: Each action represents a potential customer ready to buy
- **Optimization Guide**: Shows which actions customers prefer, guiding your strategy

## Understanding Each Action

### Website Clicks
- **What**: Customers clicking to visit your website
- **Why Important**: Shows interest in learning more about your business
- **Goal**: High website traffic leads to online conversions

### Phone Calls
- **What**: Direct calls initiated from your profile
- **Why Important**: Highest intent action - customers ready to engage
- **Goal**: More calls = more booking/sales opportunities

### Direction Requests
- **What**: Customers requesting driving directions to your location
- **Why Important**: Strong intent to visit in person
- **Goal**: Higher foot traffic and in-store sales

### Photo Views
- **What**: Customers viewing your business photos
- **Why Important**: Visual engagement indicates serious interest
- **Goal**: Quality photos convert interest into visits

## Benchmarks (Monthly)

**Website Clicks**:
- 0-10: Low - improve your website call-to-action
- 10-50: Fair - decent interest level
- 50-100: Good - strong online presence
- 100+: Excellent - high digital engagement

**Phone Calls**:
- 0-5: Low - make your number more prominent
- 5-20: Fair - some customer engagement
- 20-50: Good - solid inquiry volume
- 50+: Excellent - high conversion potential

**Direction Requests**:
- 0-10: Low - improve location visibility
- 10-30: Fair - moderate foot traffic interest
- 30-75: Good - strong local presence
- 75+: Excellent - major local destination

## Taking Action

To increase customer actions:
1. **Complete profile**: More information = more confidence = more actions
2. **Add compelling photos**: Visual appeal drives engagement
3. **Update business hours**: Ensure customers can find you when open
4. **Respond to reviews**: Shows you're active and care
5. **Use Posts**: Promote offers that drive specific actions
6. **Clear CTA**: Make your website button or phone number prominent
`,
  },
  {
    slug: 'google-biz-optimizer/performance/search-queries',
    title: 'Top Search Queries',
    category: 'google-business',
    content: `
# Top Search Queries

## What Are Search Queries?

Top search queries show the actual terms and phrases people used to find your business. This includes both "direct" searches (your business name) and "discovery" searches (what you do/offer).

## Why This Matters

Understanding your search queries is valuable because:

- **Customer Language**: Shows exactly how customers describe what you do
- **Keyword Insights**: Reveals which terms drive the most traffic to your profile
- **Content Optimization**: Guides what keywords to emphasize in your description and posts
- **Service Gaps**: May reveal services customers expect but you don't prominently advertise
- **Competitive Intelligence**: Shows what customers are looking for in your market

## Query Types

### Direct Queries
- Your exact business name
- Variations of your business name
- Business name + location

**Why they matter**: Brand awareness indicator - shows people specifically looking for you

### Discovery Queries
- "Italian restaurant near me"
- "emergency plumber open now"
- "best coffee shop downtown"

**Why they matter**: New customer acquisition - these are people discovering you for the first time

## How to Use This Data

1. **Optimize Your Description**:
   - Include popular discovery query terms naturally
   - If people search "emergency plumber" but you don't mention "emergency," add it

2. **Update Your Services**:
   - Add services that match common queries
   - Ensure service descriptions use customer language

3. **Create Targeted Posts**:
   - Post about topics related to popular queries
   - Use query terms in post titles

4. **Refine Categories**:
   - Ensure your categories align with how customers search
   - Add categories that match common discovery queries

5. **Website Optimization**:
   - Use popular query terms on your website
   - Create content around common search themes

## Red Flags to Watch For

- **High direct, low discovery**: Good brand awareness but not attracting new customers
- **Irrelevant queries**: Shows up for wrong searches - adjust categories
- **Negative queries**: "Is [business] open" when you're closed - fix hours
- **Competitor names**: People searching for competitors finding you - good opportunity!

## Taking Action

Weekly review of search queries:
1. Identify top 5 most common discovery searches
2. Ensure those terms appear in your description
3. Create a post addressing the most popular query
4. Add any missing services that match queries
5. Track changes in query patterns over time
`,
  },
];

async function createArticles() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  console.log('🚀 Starting to create Google Business Profile metric articles...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const article of ARTICLES) {
    try {
      console.log(`📝 Creating: ${article.title}`);

      const response = await fetch(`${baseUrl}/api/admin/help-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          slug: article.slug,
          content: article.content.trim(),
          status: 'published',
          metadata: {
            category: article.category,
            description: article.content.substring(0, 150).trim() + '...',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Created successfully (ID: ${data.article.id})`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`   ❌ Failed: ${error.error}`);
        errorCount++;
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📈 Total articles: ${ARTICLES.length}`);
}

// Run the script
createArticles().catch(console.error);
