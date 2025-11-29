# Review Source Attribution Tracking

This document describes the review source attribution tracking system that helps users understand where their reviews are coming from.

## Overview

The system tracks the origin of every review submission through URL parameters, allowing businesses to see which channels are most effective for collecting reviews.

## Source Channels

| Channel | Code | Description |
|---------|------|-------------|
| Direct Link | `prompt_page_direct` | User typed URL or used a bookmark |
| QR Code | `prompt_page_qr` | User scanned a QR code |
| Email Campaign | `email_campaign` | User clicked link in email |
| SMS Campaign | `sms_campaign` | User clicked link in text message |
| Widget CTA | `widget_cta` | User clicked "Leave a Review" in embedded widget |
| Google Import | `gbp_import` | Review imported from Google Business Profile |
| Social Share | `social_share` | User clicked shared link on social media |
| Referral | `referral` | User was referred by another person |
| Unknown | `unknown` | Legacy reviews or source not tracked |

## How It Works

### URL Parameters

When users access a prompt page, the system captures these URL parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `src` | Source channel identifier | `?src=email` |
| `crid` | Communication record ID (links to email/SMS) | `?crid=uuid` |
| `wid` | Widget ID | `?wid=uuid` |
| `qid` | QR code ID | `?qid=uuid` |
| `utm_source` | UTM source tag | `?utm_source=newsletter` |
| `utm_medium` | UTM medium tag | `?utm_medium=email` |
| `utm_campaign` | UTM campaign tag | `?utm_campaign=summer_promo` |

### Source Parameter Mapping

The `src` parameter maps to source channels:

- `direct` → `prompt_page_direct`
- `qr` → `prompt_page_qr`
- `email` → `email_campaign`
- `sms` → `sms_campaign`
- `widget` → `widget_cta`
- `social` → `social_share`
- `referral` → `referral`

## Database Schema

### New Fields on `review_submissions`

```sql
-- Source channel enum
CREATE TYPE review_source_channel AS ENUM (
  'prompt_page_direct', 'prompt_page_qr', 'email_campaign',
  'sms_campaign', 'widget_cta', 'gbp_import', 'social_share',
  'referral', 'unknown'
);

-- Attribution fields
source_channel    review_source_channel DEFAULT 'unknown'
source_id         UUID                  -- Generic source reference
communication_record_id UUID            -- Links to communication_records
widget_id         UUID                  -- Links to widgets table
referrer_url      TEXT                  -- HTTP referrer
utm_params        JSONB DEFAULT '{}'    -- All UTM parameters
entry_url         TEXT                  -- Full URL user entered on
```

## Integration Points

### 1. Prompt Pages (`/r/[slug]`)

**File:** `src/app/(app)/r/[slug]/page-client.tsx`

On page load, captures URL parameters and referrer:
```typescript
const attribution = extractAttributionFromParams(searchParams, document.referrer);
```

Passes attribution to API when submitting review:
```typescript
await fetch('/api/track-review', {
  body: JSON.stringify({
    ...reviewData,
    source_channel: attribution.source_channel,
    utm_params: attribution.utm_params,
    // ... other attribution fields
  })
});
```

### 2. Widget Embed Scripts

**Files:**
- `public/widgets/multi/widget-embed.js`
- `public/widgets/single/widget-embed.js`
- `public/widgets/photo/widget-embed.js`

Widgets add tracking parameters to CTA links:
```javascript
const trackedReviewUrl = actualWidgetId
  ? `https://app.promptreviews.app/r/${businessSlug}?src=widget&wid=${actualWidgetId}&utm_medium=widget`
  : `https://app.promptreviews.app/r/${businessSlug}?src=widget&utm_medium=widget`;
```

### 3. Email/SMS Campaigns

**File:** `src/utils/reviewUrlTracking.ts`

Generates tracked URLs for communication campaigns:
```typescript
// Email campaign URL
generateEmailTrackedUrl(baseUrl, slug, communicationRecordId)
// Result: https://app.promptreviews.app/r/slug?src=email&crid=uuid&utm_medium=email

// SMS campaign URL
generateSmsTrackedUrl(baseUrl, slug, communicationRecordId)
// Result: https://app.promptreviews.app/r/slug?src=sms&crid=uuid&utm_medium=sms
```

### 4. Analytics API

**File:** `src/app/(app)/api/reviews/sources/route.ts`

Returns review counts by source channel:
```typescript
GET /api/reviews/sources

Response:
{
  "stats": {
    "week": [{ "source_channel": "email_campaign", "count": 5, "percentage": 50 }],
    "month": [...],
    "year": [...],
    "all_time": [...]
  },
  "totals": {
    "week": 10,
    "month": 45,
    "year": 234,
    "all_time": 567
  }
}
```

### 5. Dashboard Page

**File:** `src/app/(app)/dashboard/reviews/sources/page.tsx`

Displays breakdown with:
- Time range selector (week/month/year/all time)
- Bar chart visualization by source
- Count and percentage for each channel
- Legend explaining each source type

## Account Isolation

All source tracking respects account isolation:

1. **Sources API** (`/api/reviews/sources`):
   - Uses `getRequestAccountId()` to get current account
   - Filters `review_submissions` by `account_id`

2. **Track Review API** (`/api/track-review`):
   - Derives `account_id` from `prompt_page.account_id`
   - Never trusts client-provided `account_id`

3. **Review Submissions API** (`/api/review-submissions`):
   - `account_id` is in `BLOCKED_FIELDS` - cannot be set by client
   - Derives `account_id` from prompt page lookup

## Troubleshooting

### Reviews showing as "Unknown"

**Cause:** Reviews collected before source tracking was implemented.

**Solution:** This is expected behavior. New reviews will track sources automatically.

### Widget clicks not tracking

**Check:**
1. Widget embed script is latest version
2. Widget has a valid `data-widget-id` attribute
3. Business slug is correct in widget config

**Debug:**
```javascript
// In browser console on page with widget
document.querySelector('[data-promptreviews-widget]').getAttribute('data-widget-id')
```

### Email/SMS links not tracking

**Check:**
1. URLs are generated using `generateEmailTrackedUrl()` or `generateSmsTrackedUrl()`
2. Communication record ID is being passed correctly

**Debug:**
```bash
# Check a review's attribution in database
SELECT source_channel, communication_record_id, utm_params, entry_url
FROM review_submissions
WHERE id = 'review-uuid';
```

### QR codes not tracking

**Check:**
1. QR code URLs include `?src=qr` parameter
2. If using campaign-specific QR codes, include `qid` parameter

**Generate tracked QR URL:**
```typescript
import { generateTrackedReviewUrl } from '@/utils/reviewUrlTracking';

const qrUrl = generateTrackedReviewUrl(baseUrl, slug, {
  source: 'qr',
  qrCodeId: 'unique-qr-id'
});
```

### Source counts don't match total

**Cause:** Percentage rounding can cause visual discrepancy.

**Note:** Percentages are rounded to nearest integer. Small differences are expected.

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20251129112617_add_review_attribution_tracking.sql` | Database schema changes |
| `src/app/(app)/r/[slug]/utils/attributionTracking.ts` | URL parameter extraction |
| `src/utils/reviewUrlTracking.ts` | Tracked URL generation |
| `src/app/(app)/api/track-review/route.ts` | Main review submission API |
| `src/app/(app)/api/review-submissions/route.ts` | Alternative submission API |
| `src/app/(app)/api/reviews/sources/route.ts` | Source analytics API |
| `src/app/(app)/dashboard/reviews/sources/page.tsx` | Dashboard analytics page |
| `public/widgets/*/widget-embed.js` | Widget embed scripts |

## Adding New Source Channels

To add a new source channel:

1. **Update database enum:**
```sql
ALTER TYPE review_source_channel ADD VALUE 'new_channel';
```

2. **Update validation in APIs:**
   - `src/app/(app)/api/track-review/route.ts` - `validSourceChannels` array
   - `src/app/(app)/api/review-submissions/route.ts` - `VALID_SOURCE_CHANNELS` set

3. **Update UI mappings:**
   - `src/app/(app)/api/reviews/sources/route.ts` - `SOURCE_CHANNEL_LABELS`
   - `src/app/(app)/dashboard/reviews/sources/page.tsx` - `SOURCE_ICONS` and `SOURCE_COLORS`

4. **Update attribution extraction:**
   - `src/app/(app)/r/[slug]/utils/attributionTracking.ts` - `SOURCE_PARAM_MAP`

5. **Update URL generation (if needed):**
   - `src/utils/reviewUrlTracking.ts` - add new generator function

## Future Enhancements

Potential improvements:
- [ ] Source attribution in review detail view
- [ ] Filter reviews list by source
- [ ] Export source data to CSV
- [ ] Source performance comparison charts
- [ ] A/B testing support for different channels
- [ ] Conversion funnel visualization (page view → review submitted)
