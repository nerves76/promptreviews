# Analytics Dashboard Guide

Track and understand how customers interact with your Prompt Pages, review submissions, and AI-powered features.

## Overview

The Analytics dashboard provides comprehensive insights into your review collection performance. Monitor everything from page visits and review submissions to how customers use AI features and emoji sentiment tracking.

## Time Range Filtering

Control what data you see with flexible time range options:

- **All time** - Complete historical data
- **Last year** - Previous calendar year
- **This year** - Current year to date
- **Last 6 months** - Rolling 6-month window
- **Last 3 months** - Rolling 3-month window
- **Last month** - Previous calendar month
- **This month** - Current month to date
- **This week** - Sunday through today
- **Last week** - Previous Sunday-Saturday

## Location Filtering

If you have multiple Prompt Pages, filter analytics by:

- **All** - Combined data across all pages
- **Universal prompt page** - Your main universal page only
- **Specific locations** - Individual location-specific pages

## Key Metrics

### Reviews Over Time Chart

Visual timeline showing review submission trends month-by-month. Use this to:
- Identify seasonal patterns
- Measure campaign effectiveness
- Track growth trends
- Spot unusual activity

### Total Reviews

Count of all reviews submitted through your Prompt Pages in the selected time range. This includes:
- Reviews written directly on the page
- Reviews generated with AI assistance
- Reviews after grammar fixes
- All emoji sentiment submissions

### Verified Reviews

Reviews that have been verified by your team. Verified reviews are:
- Confirmed as authentic
- Safe to display publicly
- Suitable for widgets and marketing

The dashboard shows verified review counts for:
- All time (in selected range)
- Last 7 days
- Last 30 days
- Last 365 days

### Copy & Submits

Number of times customers clicked "Copy & Submit" to copy their review and proceed to the external review platform (Google, Yelp, etc.).

This metric indicates:
- **Intent to post** - Customer was satisfied enough to proceed
- **Platform engagement** - Reviews likely posted externally
- **Conversion rate** - Compare to total reviews to see completion percentage

### Prompt Page Visits

Total number of times your Prompt Pages were viewed. Use this to:
- Calculate conversion rates (reviews ÷ visits)
- Measure marketing campaign reach
- Understand page traffic patterns

### Platform Distribution

When customers click to leave a review on an external platform, this shows which platforms are most popular:
- Google
- Yelp
- Facebook
- TripAdvisor
- And other configured platforms

**Note:** This only tracks which platform buttons were clicked, not whether the review was actually posted on that platform.

## Emoji Sentiment Tracking

If you've enabled emoji sentiment on your Prompt Pages, this section shows how customers rated their experience.

### Sentiment Counts

Visual display of emoji selections showing:
- Happy/satisfied customers
- Neutral experiences
- Unsatisfied customers
- Frustrated customers

Each emoji shows the total count for the selected time range.

### Public vs Private Choice

When customers select negative emojis (neutral, unsatisfied, frustrated), they choose whether to:
- **Post publicly** - Submit as a public review
- **Send private feedback** - Share concerns privately with you

This section breaks down these choices by sentiment level, showing:
- Number of public reviews chosen
- Number of private feedback chosen
- Percentage split between public/private
- Total choices for each sentiment

**Why this matters:**
- High private feedback rates may indicate fixable issues
- Public negative reviews need immediate attention
- Patterns help identify systematic problems

## AI Features Usage

Track how customers use AI-powered review assistance:

### AI Generate

Number of times customers clicked "Generate with AI" to create a review using AI assistance.

**What this measures:**
- Feature adoption - How many customers use AI help
- Engagement with advanced features
- Potential reviews that wouldn't exist without AI

### Grammar Fix

Times customers used the grammar correction feature to polish their review.

**What this measures:**
- Quality improvement efforts
- Customer care about presentation
- Feature utility and adoption

### Total AI Usage

Combined count of all AI feature uses (Generate + Grammar Fix).

Use this to:
- Justify AI feature investment
- Identify power users
- Track feature adoption trends

## Detailed Event Tables

### AI Generation Events

Complete log of each AI generation including:
- **Date & time** - When the generation occurred
- **Prompt Page** - Which page (location or universal)
- **Page Type** - Universal or Custom/Location-specific
- **Review Platform** - Which platform they were reviewing for

### Grammar Fix Events

Complete log of grammar corrections with same details as AI generations.

### Copy & Submit Events

Detailed breakdown of each copy & submit action with:
- Timestamp of the click
- Which Prompt Page
- Page type (universal vs custom)
- Target review platform

## Recent Activity Table

Shows the 7 most recent days with any activity, displaying:
- Date
- Total interactions (all event types combined)

Use this to quickly spot:
- Days with unusual activity
- Current engagement trends
- Recent campaign performance

## How to Use Analytics Effectively

### 1. Set a Baseline

Start by reviewing "All time" data to understand your typical performance:
- Average reviews per month
- Typical conversion rate (reviews ÷ visits)
- Common sentiment distribution
- Popular review platforms

### 2. Monitor Trends

Check analytics weekly using "This week" and "Last week" to:
- Spot unusual drops or spikes
- Verify campaigns are working
- Catch technical issues early

### 3. Measure Campaigns

When running a review campaign:
1. **Before:** Note current weekly averages
2. **During:** Monitor "This week" daily
3. **After:** Compare "Last week" to baseline

### 4. Optimize Conversion

Calculate your conversion rate: (Total Reviews ÷ Prompt Page Visits) × 100

**Good conversion rates:**
- Email campaigns: 15-30%
- In-person requests: 30-50%
- QR codes: 5-15%
- Website visitors: 2-10%

If conversion is low:
- Simplify your Prompt Page
- Offer AI assistance
- Reduce required fields
- Test different messaging

### 5. Address Negative Sentiment

If you see high negative emoji sentiment:
1. Check "Public vs Private Choice" ratios
2. Review private feedback for patterns
3. Address systematic issues
4. Follow up with private feedback senders

### 6. Leverage AI Insights

Track AI feature usage to:
- Identify which customers need help writing
- Measure feature ROI (AI reviews ÷ total reviews)
- Test AI prompts for better results

**High AI usage (>40%) suggests:**
- Customers appreciate the help
- Reviews might not happen without AI
- Feature is valuable to keep/promote

**Low AI usage (<10%) could mean:**
- Feature is hard to find
- Customers confident without help
- UI needs improvement

## Common Questions

**Q: Why don't my visit numbers match Google Analytics?**
A: Analytics only counts actual page loads of your Prompt Pages. It excludes bots, failed loads, and bounces under 3 seconds.

**Q: Can I export this data?**
A: Currently, analytics are view-only. Contact support if you need raw data exports for custom reporting.

**Q: What counts as a "review submission"?**
A: Any time a customer completes your Prompt Page form and submits their feedback, whether they post publicly or send private feedback.

**Q: Why are verified reviews different from total reviews?**
A: Only reviews you've manually marked as verified (in the Reviews dashboard) count as verified. New submissions start unverified until you review them.

**Q: Do emoji sentiments count as reviews?**
A: Yes. When a customer selects an emoji and chooses to post publicly or send private feedback, it counts as a review submission.

**Q: What's the difference between "Copy & Submit" and "Reviews"?**
A: Reviews are submitted through your Prompt Page. Copy & Submit means they copied text to paste elsewhere (like Google), but we can't confirm they actually posted it.

## Tips for Better Data

1. **Use UTM parameters** in links to Prompt Pages to track campaign sources
2. **Check analytics weekly** to catch issues early
3. **Compare time ranges** to identify trends vs anomalies
4. **Filter by location** if you have multiple pages to find location-specific insights
5. **Note external factors** (seasons, promotions, events) that affect patterns

## Next Steps

Use analytics insights to:
- **Optimize Prompt Pages** - Test changes and measure impact
- **Plan campaigns** - Launch when you see natural dips
- **Improve response rates** - Address issues causing negative sentiment
- **Showcase success** - Use verified review counts in marketing
- **Justify investment** - Demonstrate ROI of review collection efforts
