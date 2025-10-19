# Analytics System Documentation

## Overview
Comprehensive analytics tracking system for PromptReviews platform metrics, user engagement, and business intelligence.

## Database Tables

### 1. `platform_metrics` - Global Lifetime Counters
Stores cumulative metrics that **never decrease**. Perfect for marketing headlines.

**Schema:**
```sql
- metric_name (TEXT PRIMARY KEY)
- metric_value (BIGINT)
- metadata (JSONB)
- updated_at (TIMESTAMPTZ)
```

**Tracked Metrics:**
- `total_accounts_created` - Lifetime signups
- `total_accounts_deleted` - Accounts closed
- `total_reviews_captured` - All reviews ever submitted
- `total_reviews_deleted` - Reviews removed by users
- `total_widgets_created` - Widgets created
- `total_prompt_pages_created` - Prompt pages created
- `total_gbp_posts_published` - Posts to Google Business
- `total_gbp_locations_connected` - GBP locations connected
- `total_ai_generations` - AI feature usage

**Functions:**
- `increment_metric(name, amount)` - Safely increment a metric
- `get_metric(name)` - Get current value
- `populate_historical_metrics()` - Backfill from existing data

### 2. `daily_stats` - Daily Snapshots
Daily snapshots for historical analysis, trends, and charts.

**Key Fields:**
```sql
-- Account Metrics
accounts_created_today, accounts_deleted_today
accounts_total, accounts_active, accounts_trial, accounts_paid

-- Review Metrics
reviews_captured_today, reviews_deleted_today
reviews_total, reviews_active
reviews_by_platform (JSONB)

-- Engagement
active_users_today, active_users_7day, active_users_30day

-- Feature Usage
widgets_created_today, widgets_total
prompt_pages_created_today, prompt_pages_total
ai_generations_today

-- Google Business Profile
gbp_locations_connected
gbp_posts_published_today, gbp_posts_total
gbp_reviews_responded_today
gbp_photos_uploaded_today

-- Revenue
mrr, paying_accounts
```

## Automatic Tracking

### Database Triggers
Metrics are automatically incremented when:
- ✅ Account created → `total_accounts_created`
- ✅ Account deleted → `total_accounts_deleted`
- ✅ Review captured → `total_reviews_captured`
- ✅ Review deleted → `total_reviews_deleted`
- ✅ Widget created → `total_widgets_created`
- ✅ Prompt page created → `total_prompt_pages_created`
- ✅ GBP post published → `total_gbp_posts_published`

### Cron Jobs

**Daily Stats Calculation** (`/api/cron/calculate-daily-stats`)
- **Schedule:** 1:00 AM UTC daily
- **Purpose:** Calculate and store daily snapshots
- **Duration:** ~1-2 seconds

**Monthly Stats Post** (`/api/cron/post-monthly-stats`)
- **Schedule:** 12:00 PM UTC on 1st of month
- **Purpose:** Post stats to community
- **Uses:** Analytics tables for fast queries

## Usage Examples

### Query Total Reviews Captured
```sql
SELECT metric_value FROM platform_metrics
WHERE metric_name = 'total_reviews_captured';
```

### Query Last 30 Days of Reviews
```sql
SELECT date, reviews_captured_today
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Get Reviews by Platform
```sql
SELECT reviews_by_platform
FROM daily_stats
ORDER BY date DESC
LIMIT 1;
```

### Calculate Monthly Growth
```sql
SELECT
  date_trunc('month', date) as month,
  SUM(accounts_created_today) as new_accounts,
  SUM(reviews_captured_today) as new_reviews
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;
```

### Get Active User Metrics
```sql
SELECT
  date,
  active_users_today,
  active_users_7day,
  active_users_30day
FROM daily_stats
ORDER BY date DESC
LIMIT 7;
```

## API Endpoints

### Manual Stats Calculation
```bash
curl -X GET "https://app.promptreviews.app/api/cron/calculate-daily-stats" \
  -H "Authorization: Bearer [CRON_SECRET_TOKEN]"
```

### Get Platform Metrics (Admin Only)
```sql
-- Via Supabase client
const { data } = await supabase
  .from('platform_metrics')
  .select('*');
```

### Get Daily Stats (Admin Only)
```sql
const { data } = await supabase
  .from('daily_stats')
  .select('*')
  .order('date', { ascending: false })
  .limit(30);
```

## Marketing Use Cases

### Headlines for Landing Page
- "Join 10,000+ businesses capturing reviews"
- "1M+ reviews captured and growing"
- "500+ Google Business locations connected"

### Growth Charts
- Daily/Weekly/Monthly review capture trends
- Account growth over time
- Platform distribution (Google vs Yelp vs Facebook)

### Retention Analysis
- 30-day retention rate
- Average time to first review
- Active users trends

### Feature Adoption
- % of accounts using widgets
- % of accounts using AI features
- % of accounts connected to GBP

## Performance Benefits

### Before Analytics Tables:
- Monthly stats query: ~5-10 seconds (counting millions of rows)
- Admin dashboard: ~3-5 seconds
- No historical data

### After Analytics Tables:
- Monthly stats query: ~100ms (single row lookup)
- Admin dashboard: ~200ms (pre-calculated)
- Full historical trends available

## Maintenance

### Backfill Historical Data
```sql
SELECT populate_historical_metrics();
```

### Recalculate Specific Day
```sql
-- Delete existing entry
DELETE FROM daily_stats WHERE date = '2025-10-19';

-- Trigger cron to recalculate
-- Or manually insert calculated values
```

### Check Trigger Status
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%trigger_%';
```

## Future Enhancements

### Phase 2 (Planned):
- Cohort analysis tables
- User behavior tracking
- A/B test results
- Email campaign metrics

### Phase 3 (Future):
- Real-time dashboard
- Alerts and notifications
- Custom report builder
- Data export API

## Migration Files
- `20251019200000_create_analytics_tables.sql` - Tables and functions
- `20251019200001_create_analytics_triggers.sql` - Auto-increment triggers

## Cron Jobs
- `/api/cron/calculate-daily-stats` - Daily at 1:00 AM UTC
- `/api/cron/post-monthly-stats` - Monthly on 1st at 12:00 PM UTC

## Security
- RLS enabled on both tables
- Admins only can read
- Service role only can write
- All updates through triggers or cron jobs
