-- ============================================================================
-- KEYWORD TOOLS HELP ARTICLES
-- Run this in Supabase SQL Editor to populate help documentation
-- Created: 2025-12-14
-- ============================================================================

-- ============================================================================
-- PART 1: KEYWORD LIBRARY ARTICLES
-- ============================================================================

-- 1.1 Keyword Library Overview
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/library-overview',
  'Keyword library overview',
  '# Keyword library overview

## What is the keyword library?

The keyword library is your central hub for managing all keywords across your PromptReviews account. It''s a unified system that stores, organizes, and tracks keywords used in review collection, SEO monitoring, and local ranking.

## Why keywords matter for reviews

Keywords in customer reviews are powerful for several reasons:

- **SEO Impact**: Google indexes review content. Reviews containing relevant keywords can improve your local search visibility
- **Social Proof**: When potential customers see reviews mentioning specific services, it builds targeted trust
- **Competitive Advantage**: Businesses with keyword-rich reviews often outrank competitors with generic feedback

## Key features

### Organization with groups
Create keyword groups to organize by:
- Service categories (e.g., "Plumbing Services", "HVAC Services")
- Seasonal terms (e.g., "Summer Specials", "Holiday Promotions")
- Locations (e.g., "Downtown", "North Side")

### Integration with prompt pages
Keywords from your library can be:
- Assigned to specific prompt pages
- Rotated automatically to encourage varied review content
- Tracked for usage in actual customer reviews

### Usage tracking
The library tracks:
- How many reviews contain each keyword
- When keywords were last mentioned in reviews
- Which keywords are overused or underutilized

## Getting started

1. Navigate to **Keywords** in your dashboard sidebar
2. Click **Add keyword** to add individual keywords
3. Or use **Import** to bulk upload from a spreadsheet
4. Organize into groups for easier management

## Best practices

- **Be specific**: "emergency plumber" is better than just "plumber"
- **Think like customers**: Use terms your customers actually say
- **Include variations**: Add common misspellings and synonyms
- **Update regularly**: Add new service keywords as your business evolves',
  'published',
  '{"category": "keywords", "description": "Learn how the keyword library helps you manage and track keywords for reviews and SEO.", "keywords": ["keywords", "library", "seo", "reviews"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 1.2 Creating and Managing Keywords
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/creating-keywords',
  'Creating and managing keywords',
  '# Creating and managing keywords

## Adding keywords

### Add a single keyword
1. Go to **Keywords** in your dashboard
2. Click **Add keyword** button
3. Enter the keyword phrase
4. Optionally assign to a group
5. Click **Save**

### Bulk import keywords
1. Click **Import** in the keyword library
2. Upload a CSV file with one keyword per line
3. Map columns if needed (phrase, group)
4. Review and confirm the import

## Keyword details

Each keyword has several properties:

| Property | Description |
|----------|-------------|
| **Phrase** | The actual keyword text |
| **Group** | Optional category for organization |
| **Status** | Active or Paused |
| **Usage count** | How many reviews mention this keyword |
| **Last used** | When it was last found in a review |

## Editing keywords

1. Click on any keyword in the list
2. The details sidebar opens on the right
3. Edit the phrase, group, or status
4. Changes save automatically

## Deleting keywords

1. Select keywords using the checkboxes
2. Click **Delete selected**
3. Confirm the deletion

**Note**: Deleting a keyword removes it from tracking but doesn''t affect existing reviews that contain it.

## Keyword groups

### Creating a group
1. Click **Manage groups** or the groups dropdown
2. Click **Add group**
3. Enter a name (e.g., "Core Services")
4. Drag to reorder groups

### Assigning keywords to groups
- When creating: select group from dropdown
- Existing keywords: edit and change group
- Bulk: select multiple and use **Move to group**

## Pausing vs. deleting

**Pause** a keyword when:
- You want to temporarily stop tracking
- It''s seasonal and will be relevant again
- You''re testing different keyword strategies

**Delete** a keyword when:
- It''s no longer relevant to your business
- It was added by mistake
- You''re cleaning up duplicates',
  'published',
  '{"category": "keywords", "description": "Step-by-step guide to creating, editing, and organizing keywords in your library.", "keywords": ["create", "manage", "groups", "import"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 1.3 Keyword Rotation for Prompt Pages
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/keyword-rotation',
  'Keyword rotation for prompt pages',
  '# Keyword rotation for prompt pages

## What is keyword rotation?

Keyword rotation automatically varies which keywords appear on your review collection pages. Instead of showing the same keywords to every customer, the system rotates through your keyword pool to encourage diverse review content.

## Why use rotation?

- **Natural variety**: Reviews look more authentic when they don''t all use identical phrases
- **Broader coverage**: Over time, you''ll collect reviews mentioning different services
- **Avoid patterns**: Search engines may discount repetitive keyword usage
- **Better customer experience**: Fresh prompts feel more personalized

## How it works

### Active pool
Keywords currently shown to customers. The system randomly selects from this pool when displaying your prompt page.

### Reserve pool
Keywords waiting to rotate in. When active keywords become overused, the system swaps them with reserve keywords.

### Rotation triggers
Keywords rotate based on:
- Usage count reaching a threshold
- Time since last rotation
- Manual rotation by you

## Setting up rotation

1. Go to your **Prompt page** settings
2. Navigate to the **Keywords** tab
3. Assign keywords from your library
4. Enable **Auto-rotation**
5. Set your rotation preferences:
   - Pool size (how many keywords active at once)
   - Rotation frequency
   - Usage threshold

## Rotation settings explained

| Setting | Description |
|---------|-------------|
| **Active pool size** | Number of keywords shown at once (recommended: 5-10) |
| **Rotation trigger** | After X reviews mention keyword, swap it out |
| **Minimum time** | Keywords stay active for at least this long |

## Manual rotation

You can manually rotate keywords anytime:
1. Open the keyword rotation panel
2. Select keywords to swap out
3. Choose replacements from reserve
4. Click **Apply rotation**

## Best practices

- Keep active pool small enough (5-10) for meaningful rotation
- Ensure reserve pool has enough variety
- Review rotation history monthly
- Balance popular and niche keywords',
  'published',
  '{"category": "keywords", "description": "Learn how automatic keyword rotation keeps your review content fresh and varied.", "keywords": ["rotation", "prompt pages", "active pool", "reserve"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- PART 2: KEYWORD RESEARCH ARTICLES
-- ============================================================================

-- 2.1 Keyword Research Overview
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/research-overview',
  'Keyword research overview',
  '# Keyword research overview

## What is keyword research?

Keyword research helps you discover what terms people actually search for when looking for businesses like yours. It provides data on search volume, competition, and trends to help you choose the most effective keywords.

## Why research keywords?

Guessing which keywords to target is inefficient. Research shows you:

- **Search volume**: How many people search for this term monthly
- **Competition**: How hard it is to rank for this term
- **Cost data**: What advertisers pay per click (indicates commercial value)
- **Trends**: Whether searches are increasing or decreasing

## Accessing keyword research

1. Go to **Keywords** in your dashboard
2. Click the **Research** tab
3. Enter a seed keyword or phrase
4. View results with metrics

## Understanding the metrics

### Search volume
Monthly average searches for this term. Higher volume means more potential visibility, but also usually more competition.

| Volume | Classification |
|--------|----------------|
| 0-100 | Low volume (niche) |
| 100-1,000 | Medium volume |
| 1,000-10,000 | High volume |
| 10,000+ | Very high volume |

### Competition level
How difficult it is to rank for this keyword:

- **Low**: Easier to rank, but may have less traffic
- **Medium**: Balanced opportunity
- **High**: Difficult to rank, requires strong SEO

### CPC (Cost Per Click)
What advertisers pay for this keyword. Higher CPC usually indicates:
- Strong commercial intent
- Valuable customer searches
- Competitive market

### Trend direction
Shows if searches are:
- **Rising**: Growing interest, good opportunity
- **Stable**: Consistent demand
- **Falling**: Declining interest, may want to deprioritize

## Research workflow

1. Start with broad terms related to your business
2. Note high-volume, lower-competition keywords
3. Explore related keyword suggestions
4. Add promising keywords to your library
5. Track their performance over time',
  'published',
  '{"category": "keywords", "description": "Discover how keyword research helps you find the terms customers actually search for.", "keywords": ["research", "search volume", "competition", "discovery"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 2.2 Using the Keyword Research Tool
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/using-research-tool',
  'Using the keyword research tool',
  '# Using the keyword research tool

## Getting started

1. Navigate to **Keywords** > **Research**
2. You''ll see a search box and your recent searches

## Searching for keywords

### Basic search
1. Enter a keyword or phrase (e.g., "plumber near me")
2. Click **Search** or press Enter
3. Results display with metrics

### Location-based research
By default, results show USA data. To research for a specific area:
1. Click the location selector
2. Choose your target location
3. Results will reflect local search data

## Reading results

Each result shows:

```
"emergency plumber"
Volume: 12,100 | Competition: Medium | CPC: $45.20 | Trend: Rising
```

### The trend chart
Click any keyword to see a 12-month trend chart showing:
- Monthly search volume over time
- Seasonal patterns
- Overall trend direction

## Related keywords

Below your main results, you''ll see **Related keywords** - terms that people also search for. These often reveal:
- Long-tail variations (more specific phrases)
- Related services you might offer
- Questions customers ask

## Adding to your library

When you find a good keyword:
1. Click the **+** button next to it
2. Choose a keyword group (optional)
3. The keyword is added to your library

You can also:
- Select multiple keywords with checkboxes
- Click **Add selected to library**
- Assign all to the same group

## Usage limits

Keyword research uses our data provider''s API, which has daily limits:

| Plan | Daily searches |
|------|----------------|
| Grower | 25 |
| Builder | 50 |
| Maven | Unlimited |

Your remaining searches for today are shown in the interface.

## Tips for effective research

- **Start broad, then narrow**: Begin with your main service, then explore specific variations
- **Check competitor keywords**: Research terms your competitors might rank for
- **Look for low-competition gems**: Keywords with decent volume but lower competition
- **Consider intent**: "Emergency plumber" has more urgency than "plumber reviews"
- **Seasonal awareness**: Some keywords spike at certain times of year',
  'published',
  '{"category": "keywords", "description": "Step-by-step guide to using the keyword research tool effectively.", "keywords": ["research tool", "search", "related keywords", "add to library"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- PART 3: RANK TRACKING ARTICLES
-- ============================================================================

-- 3.1 Rank Tracking Overview
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/rank-tracking-overview',
  'Rank tracking overview',
  '# Rank tracking overview

## What is rank tracking?

Rank tracking monitors where your website appears in Google search results for specific keywords. It answers the question: "When someone searches for [keyword], where does my site show up?"

## Why track rankings?

- **Measure SEO success**: See if your optimization efforts are working
- **Spot opportunities**: Find keywords where you''re close to page 1
- **Monitor competitors**: Know when competitors overtake you
- **Prove ROI**: Show clients or stakeholders concrete ranking improvements

## How it works

1. You specify keywords to track
2. Choose a location and device type
3. Our system checks Google search results
4. You see your position (1-100 or "Not found")
5. Track changes over time

## What you''ll see

For each tracked keyword:

| Metric | Description |
|--------|-------------|
| **Position** | Your current ranking (1 = top result) |
| **Change** | Movement since last check (+3, -2, etc.) |
| **URL** | Which page on your site is ranking |
| **SERP features** | Special results like featured snippets |
| **Top competitors** | Who else ranks for this keyword |

## Ranking groups

Organize your tracking with groups based on:

- **Device**: Desktop vs. mobile rankings (they differ!)
- **Location**: Rankings vary by city/region
- **Schedule**: How often to check (daily, weekly, monthly)

Example groups:
- "Core Services - Desktop - Chicago"
- "Emergency Keywords - Mobile - National"

## Understanding positions

| Position | What it means |
|----------|---------------|
| 1-3 | Top of page 1 - excellent visibility |
| 4-10 | Page 1 - good visibility |
| 11-20 | Page 2 - limited visibility |
| 21-50 | Pages 3-5 - rarely seen |
| 50+ | Very low visibility |
| Not found | Not in top 100 results |

## SERP features

Modern search results include special features beyond regular links:

- **Featured snippet**: Answer box at the very top
- **Local pack**: Map with 3 local businesses
- **People also ask**: Expandable questions
- **AI overview**: AI-generated summary (new)

We track if your site appears in these features, not just regular results.',
  'published',
  '{"category": "rank-tracking", "description": "Learn how rank tracking helps you monitor your Google search visibility.", "keywords": ["rank tracking", "serp", "google rankings", "seo"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 3.2 Setting Up Rank Tracking
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/setting-up-rank-tracking',
  'Setting up rank tracking',
  '# Setting up rank tracking

## Creating your first tracking group

1. Go to **Keywords** > **Rank tracking**
2. Click **Create group**
3. Configure your group settings

### Group settings explained

**Name**: Descriptive name (e.g., "Main Keywords - Desktop")

**Device type**:
- Desktop: How rankings appear on computers
- Mobile: How rankings appear on phones (often different!)

**Location**: Where to check rankings from
- Enter a city, state, or country
- Select from suggestions
- Rankings vary significantly by location

**Your website**: The domain to track
- Enter your main website URL
- We''ll find this domain in search results

### Scheduling

Choose when to check rankings:

| Schedule | Best for |
|----------|----------|
| Daily | Active SEO campaigns, competitive keywords |
| Weekly | Most businesses, general monitoring |
| Monthly | Stable keywords, budget-conscious tracking |

## Adding keywords to your group

After creating a group:

1. Click **Add keywords**
2. Choose from options:
   - **From library**: Select existing keywords
   - **Enter manually**: Type new keywords
   - **Suggested**: Based on your business

3. Review and confirm

### Keyword limits by plan

| Plan | Keywords per group |
|------|-------------------|
| Grower | 25 |
| Builder | 100 |
| Maven | Unlimited |

## Running your first check

Once keywords are added:

1. Click **Check now** for immediate results
2. Or wait for the scheduled check

First results appear within a few minutes.

## Best practices for setup

### Choose the right location
- Track where your customers are, not where you are
- Multi-location businesses: create groups for each area

### Device selection
- Most local searches are mobile
- Create separate groups to compare desktop vs. mobile

### Keyword selection
- Start with your most important keywords
- Include branded terms (your business name)
- Add competitor comparison keywords
- Mix high and low competition terms

### Realistic expectations
- New keywords may not rank immediately
- Track consistently for at least a month before drawing conclusions
- Rankings fluctuate daily - look at weekly/monthly trends',
  'published',
  '{"category": "rank-tracking", "description": "Step-by-step guide to creating rank tracking groups and adding keywords.", "keywords": ["setup", "create group", "add keywords", "configuration"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 3.3 Reading Rank Tracking Results
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/reading-rank-results',
  'Reading rank tracking results',
  '# Reading rank tracking results

## The results table

After a rank check completes, you''ll see a table with your keywords:

| Keyword | Position | Change | URL | Features |
|---------|----------|--------|-----|----------|
| plumber near me | 7 | +2 | /services | Map pack |
| emergency plumber | 15 | -3 | /emergency | - |
| drain cleaning | 4 | = | /drains | PAA |

## Understanding each column

### Position
Your current ranking for this keyword:
- **1-10**: Page 1 (where most clicks happen)
- **11-20**: Page 2
- **21+**: Lower pages
- **--**: Not found in top 100

### Change
Movement since the previous check:
- **+5**: Improved 5 positions (good!)
- **-3**: Dropped 3 positions (investigate)
- **=**: No change
- **New**: First time tracking this keyword

### URL
Which page on your site is ranking:
- Check if it''s the page you intended
- Different pages ranking can indicate cannibalization
- "N/A" if your site isn''t ranking

### SERP features
Special features where you appear or could appear:
- **Map pack**: Local 3-pack (crucial for local businesses)
- **Featured snippet**: Answer box
- **PAA**: "People Also Ask" section
- **AI Overview**: Google''s AI summary

## Analyzing trends

Click any keyword to see historical data:

### Position history chart
Shows your ranking over time. Look for:
- Overall trend (improving, declining, stable)
- Sudden drops (algorithm updates? technical issues?)
- Gradual improvement (SEO efforts working)

### Competitor tracking
See which domains consistently appear for this keyword:
- Identify your main competitors
- Notice when new competitors enter
- Spot opportunities when competitors drop

## Color coding

Results are color-coded for quick scanning:
- **Green**: Positions 1-3 (excellent)
- **Light green**: Positions 4-10 (good)
- **Yellow**: Positions 11-20 (opportunity)
- **Orange**: Positions 21-50 (needs work)
- **Red**: Not ranking (focus area)

## Taking action on results

### For keywords ranking 4-10:
- You''re close to top 3! Focus SEO efforts here
- Small improvements = big traffic gains

### For keywords ranking 11-20:
- Page 2 means limited visibility
- Prioritize for optimization

### For keywords not ranking:
- Ensure you have relevant content for this topic
- May need dedicated page or content
- Consider if keyword matches your services

### For declining keywords:
- Check if the ranking URL changed
- Look for technical issues on that page
- Review competitor content improvements',
  'published',
  '{"category": "rank-tracking", "description": "How to interpret your rank tracking data and take action on insights.", "keywords": ["results", "position", "trends", "analysis"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- PART 4: LOCAL RANKING GRID ARTICLES
-- ============================================================================

-- 4.1 Local Ranking Grid Overview
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'local-ranking-grids/overview',
  'Local ranking grid overview',
  '# Local ranking grid overview

## What is a local ranking grid?

A local ranking grid shows where your business appears in Google Maps search results across different geographic points around your location. It''s like checking your Google Maps visibility from many different locations at once.

## Why does location matter?

Google Maps results change based on where the searcher is located. A customer 2 miles east of you might see different results than someone 2 miles west. The local ranking grid reveals this geographic variation.

## How it works

1. **Set your center point**: Your business location
2. **Define the radius**: How far out to check
3. **Grid points are created**: Center + surrounding points
4. **We search from each point**: "Your service" searches
5. **See where you rank**: Position at each location

## What you''ll see

The grid displays as a map with markers showing your ranking at each point:

```
        [3]
         |
   [5]--[1]--[4]
         |
        [7]
```

Each number is your position in local results at that location.

## Understanding positions

In Google Maps local results:

| Position | Visibility |
|----------|------------|
| 1-3 | Top of the pack (shown without expanding) |
| 4-10 | Visible with scrolling |
| 11-20 | Below the fold, rarely seen |
| Not found | Not appearing in this area |

## Why top 3 matters

Google shows a "Local Pack" in search results with only 3 businesses. Being in positions 1-3 means you appear in this pack - dramatically more visible than position 4 or lower.

## Grid configurations

### Basic grid (5 points)
- Your location (center)
- North, South, East, West points
- Good for quick overview

### Extended grid (9 points)
- All 5 basic points
- Plus: Northeast, Northwest, Southeast, Southwest
- More detailed geographic picture

### Custom radius
- Small radius (1-2 miles): Dense urban areas
- Medium radius (3-5 miles): Suburban areas
- Large radius (5-10 miles): Wide service areas

## Key metrics tracked

- **Visibility score**: Overall percentage of grid where you rank well
- **Average position**: Mean ranking across all points
- **Top 3 coverage**: What percentage of points you''re in the top 3
- **Competitor presence**: Who else appears across the grid',
  'published',
  '{"category": "local-ranking-grids", "description": "Learn how local ranking grids reveal your Google Maps visibility across geographic areas.", "keywords": ["local ranking", "geo grid", "google maps", "local pack"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 4.2 Setting Up Your Local Ranking Grid
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'local-ranking-grids/setup',
  'Setting up your local ranking grid',
  '# Setting up your local ranking grid

## Accessing the setup

1. Go to **Local ranking grids** in your dashboard
2. If first time, you''ll see the setup wizard
3. If configured, click **Settings** to modify

## Step 1: Set your business location

Enter your business address or select from your saved locations.

**Tips**:
- Use your exact Google Business Profile address
- This becomes the center of your grid
- You can adjust the pin if needed

## Step 2: Choose your radius

Select how far from your location to check:

| Radius | Best for |
|--------|----------|
| 1-2 miles | Dense urban areas, walkable neighborhoods |
| 3-5 miles | Typical local service businesses |
| 5-10 miles | Wide service areas, less competition |
| 10+ miles | Regional businesses, sparse areas |

**Recommendation**: Start with 3-5 miles, adjust based on results.

## Step 3: Configure grid points

### Basic (5 points) - Included in all plans
- Center (your location)
- 4 cardinal directions (N, S, E, W)

### Extended (9 points) - Builder and Maven plans
- All basic points
- 4 diagonal directions (NE, NW, SE, SW)

## Step 4: Add keywords to track

Select keywords that people search when looking for your services:

- **Good**: "plumber", "emergency plumber", "drain cleaning"
- **Avoid**: Your business name (that''s brand search, not discovery)

You can add keywords from:
- Your keyword library
- Manual entry
- Suggested keywords based on your business category

## Step 5: Set your schedule

Choose when to run grid checks:

| Schedule | Credits used | Best for |
|----------|--------------|----------|
| Daily | 7x weekly | Active campaigns, competitive markets |
| Weekly | 1x weekly | Most businesses |
| Monthly | ~1x monthly | Stable rankings, budget-conscious |

**Cost calculation**: Keywords × Grid points × Frequency = Credits

## Running your first check

After setup, click **Run check now** to see immediate results. Your grid will populate with rankings within a few minutes.

## Multi-location setup (Maven only)

Maven plans can track multiple business locations:

1. Click **Add location**
2. Configure a separate grid for each location
3. Each location tracks independently
4. Compare performance across locations',
  'published',
  '{"category": "local-ranking-grids", "description": "Step-by-step guide to configuring your local ranking grid.", "keywords": ["setup", "configuration", "radius", "grid points"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 4.3 Reading Local Ranking Grid Results
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'local-ranking-grids/reading-results',
  'Reading local ranking grid results',
  '# Reading local ranking grid results

## The grid map view

Your results display on an interactive map with colored markers at each grid point.

### Marker colors

| Color | Position | Meaning |
|-------|----------|---------|
| Green | 1-3 | In the Local Pack - excellent! |
| Yellow | 4-10 | Visible but below the pack |
| Orange | 11-20 | Low visibility |
| Red | 20+ or not found | Not appearing |

### Clicking a marker

Click any grid point to see:
- Your exact position
- Top 3 competitors at this location
- Historical ranking at this point
- Distance from your business

## Summary metrics

Above the grid, you''ll see aggregate stats:

### Visibility score
Percentage of grid points where you rank in top 20:
- **80-100%**: Excellent coverage
- **60-79%**: Good, with some gaps
- **40-59%**: Moderate - opportunities exist
- **Below 40%**: Significant improvement needed

### Average position
Your mean ranking across all grid points:
- **1-3**: Dominant presence
- **4-7**: Competitive
- **8-15**: Room to improve
- **15+**: Need significant work

### Top 3 rate
Percentage of points where you''re in positions 1-3:
- This is your "Local Pack" appearance rate
- Higher = more visibility without scrolling

## Keyword breakdown

Switch between keywords to see how rankings differ:

You might rank:
- #2 everywhere for "plumber"
- #8 everywhere for "emergency plumber"

This reveals where to focus optimization.

## Competitor analysis

The **View as business** dropdown lets you see the grid from a competitor''s perspective:

- See their coverage vs. yours
- Identify where you beat them
- Find areas where they dominate

## Trend tracking

### Daily summary
If checking daily, see trends:
- Is your visibility improving?
- Are you losing ground in certain areas?
- How do weekday vs. weekend differ?

### Historical comparison
Compare current results to:
- Last week
- Last month
- Custom date range

## Geographic patterns

Look for patterns in your results:

### Strong in one direction
If you rank well North but poorly South:
- Competitor might be South of you
- Consider targeted local content

### Distance decay
Ranking drops as you move away from your location:
- Normal for Google Maps
- Focus optimization on your core service area

### Inconsistent results
Random variation across the grid:
- May indicate unstable rankings
- Google testing different results',
  'published',
  '{"category": "local-ranking-grids", "description": "How to interpret your local ranking grid results and identify opportunities.", "keywords": ["results", "map", "visibility score", "competitors"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 4.4 Improving Your Local Rankings
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'local-ranking-grids/improving-rankings',
  'Improving your local rankings',
  '# Improving your local rankings

## What affects local rankings?

Google ranks local businesses based on three main factors:

1. **Relevance**: How well you match the search
2. **Distance**: How close you are to the searcher
3. **Prominence**: How well-known and reputable you are

You can''t change distance, but you can improve relevance and prominence.

## Quick wins

### Optimize your Google Business Profile

**Completeness matters**:
- Fill out every section
- Add all services you offer
- Include products if applicable
- Upload photos regularly

**Categories are crucial**:
- Primary category = most important
- Add all relevant secondary categories
- Don''t add irrelevant categories

### Get more reviews

Reviews directly impact rankings:
- More reviews = stronger signal
- Higher ratings help (but quantity matters more)
- Recent reviews weighted more heavily
- Keywords in reviews provide relevance signals

**Using PromptReviews**: Your keyword rotation feature helps customers naturally mention relevant services in their reviews.

## Medium-term strategies

### Build local citations

Ensure your business is listed consistently on:
- Yelp
- Yellow Pages
- Industry directories
- Local chamber of commerce
- Apple Maps

**Consistency is key**: Same name, address, phone (NAP) everywhere.

### Create local content

Add location-specific content to your website:
- Service area pages
- Local case studies
- Community involvement posts
- Local event coverage

### Get quality backlinks

Links from local sources help:
- Local news sites
- Community organizations
- Business associations
- Partner businesses

## Addressing problem areas

### Weak in a specific direction?

If your grid shows poor rankings in one area:

1. Check for strong competitors there
2. Consider service area-specific content
3. Seek reviews from customers in that area
4. Look for citation opportunities in that neighborhood

### Overall low visibility?

If rankings are weak everywhere:

1. Audit your GBP for issues
2. Check for NAP inconsistencies
3. Increase review collection efforts
4. Verify no Google penalties
5. Compare your profile completeness to top competitors

## Tracking improvement

After making changes:

1. Run a grid check to establish baseline
2. Implement improvements
3. Wait 2-4 weeks (changes take time)
4. Run another check
5. Compare results

**Patience required**: Local ranking changes happen gradually. Don''t expect overnight results.

## What to prioritize

Focus your efforts based on grid data:

| Situation | Priority action |
|-----------|-----------------|
| Ranking 4-10 everywhere | Reviews + GBP optimization |
| Strong center, weak edges | Service area content |
| One direction weak | Investigate competitors there |
| Inconsistent results | Citations + consistency check |
| Not ranking at all | GBP audit + basic SEO |',
  'published',
  '{"category": "local-ranking-grids", "description": "Strategies to improve your local Google Maps rankings based on grid insights.", "keywords": ["improve rankings", "optimization", "local seo", "google business profile"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- PART 5: KEYWORD MONITORING IN REVIEWS
-- ============================================================================

-- 5.1 Keyword Monitoring Overview
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/monitoring-overview',
  'Keyword monitoring in reviews',
  '# Keyword monitoring in reviews

## What is keyword monitoring?

Keyword monitoring automatically scans all your reviews (both from PromptReviews and Google Business Profile) to find mentions of your tracked keywords. It shows you which keywords appear in actual customer feedback.

## Why monitor keywords in reviews?

### Measure prompt effectiveness
If you''re suggesting keywords on your prompt pages, monitoring shows whether customers actually use those terms.

### Discover organic mentions
Customers naturally use certain words to describe your services. Monitoring reveals these organic keywords you might want to target.

### Track SEO impact
Reviews containing relevant keywords contribute to your search visibility. More keyword mentions = stronger relevance signals.

### Identify trends
See which services customers mention most, and track changes over time.

## Accessing keyword monitoring

1. Go to **Get reviews** > **Keyword monitoring**
2. Or access via **Keywords** > **Usage** tab

## What you''ll see

### Keyword usage table

| Keyword | Mentions | Last mentioned | Trend |
|---------|----------|----------------|-------|
| plumbing repair | 47 | 2 days ago | ↑ |
| drain cleaning | 32 | 1 week ago | → |
| water heater | 18 | 3 days ago | ↓ |

### Usage chart
Visual representation of keyword mentions over time, showing:
- Monthly mention counts
- Trend lines
- Comparisons between keywords

### Review excerpts
For any keyword, see the actual reviews that mention it:
- Click a keyword to expand
- See snippets with the keyword highlighted
- Link to full review

## How matching works

The system uses smart matching:

- **Exact matches**: "plumber" matches "plumber"
- **Variations**: "plumbing" also matches "plumber"
- **Case insensitive**: "Plumber" = "plumber"
- **Partial matches**: Configurable per keyword

## Understanding the data

### High mention count
Many reviews mention this keyword:
- Validates it''s relevant to your business
- Good for SEO - keep encouraging it
- Consider expanding related keywords

### Low mention count
Few reviews mention this keyword:
- May not resonate with customers
- Consider different phrasing
- Or may need more prominent prompting

### Declining trend
Keyword mentions decreasing:
- Check if service offering changed
- Review if keyword is still featured
- May indicate seasonal pattern

### Rising trend
Keyword mentions increasing:
- Prompting strategy is working
- Or organic interest is growing
- Capitalize on momentum',
  'published',
  '{"category": "keywords", "description": "Learn how keyword monitoring tracks which terms appear in your customer reviews.", "keywords": ["monitoring", "review analysis", "keyword mentions", "tracking"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- PART 6: CREDITS AND BILLING FOR KEYWORD TOOLS
-- ============================================================================

-- 6.1 Keyword Tools Credits
INSERT INTO articles (slug, title, content, status, metadata, published_at, created_at, updated_at)
VALUES (
  'keywords/credits-explained',
  'Keyword tools credits explained',
  '# Keyword tools credits explained

## How credits work

Keyword research and rank tracking features use a credit system. Credits are consumed when you:

- Search for new keywords (research)
- Check keyword rankings (rank tracking)
- Run local ranking grid checks

## Credit costs

### Keyword research
| Action | Credits |
|--------|---------|
| Keyword search | 1 credit per search |
| Related keywords | Included with search |
| Trend data | Included with search |

### Rank tracking
| Action | Credits |
|--------|---------|
| Rank check | 1 credit per keyword |
| 10 keywords | 10 credits |
| Daily schedule (30 days) | 10 × 30 = 300 credits/month |

### Local ranking grids
| Action | Credits |
|--------|---------|
| Grid check | Keywords × Grid points |
| 5 keywords × 5 points | 25 credits |
| 5 keywords × 9 points | 45 credits |

## Credits by plan

| Plan | Monthly credits | Research limit |
|------|-----------------|----------------|
| Grower | 100 | 25/day |
| Builder | 500 | 50/day |
| Maven | 2,000 | Unlimited |

## Checking your balance

See your credit balance:
1. Dashboard header shows remaining credits
2. Or go to **Settings** > **Billing** > **Credits**

## When credits refresh

Credits refresh on your billing date each month. Unused credits do not roll over.

## Running low on credits?

Options:
- Wait for monthly refresh
- Reduce check frequency (daily → weekly)
- Reduce keywords tracked
- Upgrade your plan

## Optimizing credit usage

### Research efficiently
- Use related keywords (free) before new searches
- Save promising keywords to library for later
- Batch your research sessions

### Rank tracking
- Start with weekly checks, upgrade to daily only for active campaigns
- Focus on your most important keywords
- Remove keywords you''re not acting on

### Local grids
- Monthly checks are often sufficient
- Use 5-point grid unless you need more detail
- Track fewer keywords more strategically',
  'published',
  '{"category": "keywords", "description": "Understanding how credits work for keyword research and rank tracking features.", "keywords": ["credits", "billing", "limits", "plans"]}',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- NAVIGATION ENTRIES FOR KEYWORD TOOLS
-- ============================================================================

-- First, get or create the parent navigation item for Keywords section
INSERT INTO navigation (title, href, icon_name, order_index, visibility, is_active)
VALUES (
  'Keyword tools',
  NULL,
  'FaKey',
  50,
  ARRAY['docs', 'help'],
  true
) ON CONFLICT DO NOTHING;

-- Insert child navigation items (these will need parent_id set after parent is created)
-- Note: In practice, you may need to run these with explicit parent_id

-- ============================================================================
-- ARTICLE CONTEXTS (route-to-article mappings)
-- ============================================================================

-- Keyword Library contexts
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords', ARRAY['keywords', 'library', 'manage'], 90
FROM articles WHERE slug = 'keywords/library-overview'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords', ARRAY['create', 'add', 'import'], 80
FROM articles WHERE slug = 'keywords/creating-keywords'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Keyword Research contexts
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/research', ARRAY['research', 'discover', 'search volume'], 90
FROM articles WHERE slug = 'keywords/research-overview'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/research', ARRAY['research tool', 'how to', 'guide'], 85
FROM articles WHERE slug = 'keywords/using-research-tool'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Rank Tracking contexts
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/rank-tracking', ARRAY['rank tracking', 'serp', 'google'], 90
FROM articles WHERE slug = 'keywords/rank-tracking-overview'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/rank-tracking', ARRAY['setup', 'create', 'configure'], 85
FROM articles WHERE slug = 'keywords/setting-up-rank-tracking'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/rank-tracking', ARRAY['results', 'position', 'analysis'], 80
FROM articles WHERE slug = 'keywords/reading-rank-results'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Local Ranking Grid contexts
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/local-ranking-grids', ARRAY['local ranking', 'geo grid', 'maps'], 90
FROM articles WHERE slug = 'local-ranking-grids/overview'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/local-ranking-grids', ARRAY['setup', 'configure', 'create'], 85
FROM articles WHERE slug = 'local-ranking-grids/setup'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/local-ranking-grids', ARRAY['results', 'map', 'visibility'], 80
FROM articles WHERE slug = 'local-ranking-grids/reading-results'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/local-ranking-grids', ARRAY['improve', 'optimization', 'seo'], 75
FROM articles WHERE slug = 'local-ranking-grids/improving-rankings'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Keyword Monitoring context
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/get-reviews/keyword-monitoring', ARRAY['monitoring', 'analysis', 'mentions'], 90
FROM articles WHERE slug = 'keywords/monitoring-overview'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Credits context (appears on multiple pages)
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/research', ARRAY['credits', 'limits', 'billing'], 70
FROM articles WHERE slug = 'keywords/credits-explained'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/keywords/rank-tracking', ARRAY['credits', 'limits', 'billing'], 70
FROM articles WHERE slug = 'keywords/credits-explained'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/local-ranking-grids', ARRAY['credits', 'limits', 'billing'], 70
FROM articles WHERE slug = 'keywords/credits-explained'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- Rotation context for prompt pages
INSERT INTO article_contexts (article_id, route_pattern, keywords, priority)
SELECT id, '/dashboard/edit-prompt-page', ARRAY['rotation', 'keywords', 'prompt'], 75
FROM articles WHERE slug = 'keywords/keyword-rotation'
ON CONFLICT (article_id, route_pattern) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total articles created: 12
-- Categories covered:
--   - Keyword Library (3 articles)
--   - Keyword Research (2 articles)
--   - Rank Tracking (3 articles)
--   - Local Ranking Grids (4 articles)
--   - Keyword Monitoring (1 article)
--   - Credits/Billing (1 article)
-- ============================================================================
