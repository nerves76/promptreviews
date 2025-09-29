# Google Business Optimizer Embed - Automatic Source Tracking

## Overview
The Google Business Optimizer embed now **automatically detects and tracks** where leads come from without requiring any manual URL tagging. The system automatically captures the parent page URL where the iframe is embedded and creates a unique source identifier.

## How It Works

### Automatic Detection (No Configuration Needed!)
The embed automatically:
1. **Detects the parent page URL** using `document.referrer`
2. **Extracts the domain and path** where the iframe is embedded
3. **Creates a unique source identifier** from the URL (e.g., `example-com-blog-seo-tips`)
4. **Stores all tracking data** with the lead record

### What Gets Captured Automatically
- **Full embed URL** - The complete URL of the page containing the iframe
- **Domain** - The hostname where the embed is placed
- **Path** - The page path (e.g., `/blog/seo-tips`)
- **Auto-generated source** - A readable identifier created from the URL

## Tracking Parameters Supported

### Primary Parameter
- **`source`** - Custom identifier for the embed location (recommended)

### UTM Parameters
- **`utm_source`** - Standard UTM source parameter
- **`utm_medium`** - Standard UTM medium parameter
- **`utm_campaign`** - Standard UTM campaign parameter

## Implementation Examples

### SIMPLEST APPROACH - Just Embed It! (Automatic Tracking)

You don't need to add ANY parameters. Just embed the iframe and tracking happens automatically:

```html
<!-- Just embed it - tracking is automatic! -->
<iframe
  src="https://app.promptreviews.app/embed/google-business-optimizer"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

**What gets tracked automatically:**
- If embedded on `https://example.com/services/seo` → Source: `example-com-services-seo`
- If embedded on `https://blog.site.com/post/tips` → Source: `blog-site-com-post-tips`
- Full URL is stored as `referrer_url` in the database

### Example 1: Homepage Embed (with optional manual override)
```html
<iframe
  src="https://app.promptreviews.app/embed/google-business-optimizer?source=homepage"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

### Example 2: Blog Post Embed
```html
<iframe
  src="https://app.promptreviews.app/embed/google-business-optimizer?source=blog-seo-guide"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

### Example 3: Partner Website with UTM Parameters
```html
<iframe
  src="https://app.promptreviews.app/embed/google-business-optimizer?source=partner-abc&utm_source=partner&utm_medium=embed&utm_campaign=q1-2025"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

### Example 4: Email Campaign Landing Page
```html
<iframe
  src="https://app.promptreviews.app/embed/google-business-optimizer?source=email-landing&utm_source=email&utm_medium=newsletter&utm_campaign=jan-2025"
  width="100%"
  height="800"
  frameborder="0">
</iframe>
```

## Tracking Data Storage

The tracking data is stored in the `optimizer_leads` table with the following fields:
- `source_business` - Auto-generated source identifier (e.g., `example-com-blog-post-title`)
- `source_domain` - The domain where embed is hosted (e.g., `example.com`)
- `referrer_url` - Full URL of the page containing the embed
- `additional_data` - JSON field containing `embedPath` and other metadata
- `utm_source`, `utm_medium`, `utm_campaign` - Optional UTM parameters if provided

## Viewing Lead Sources

To analyze where your leads are coming from:

1. **In Supabase Dashboard**:
   - Navigate to Table Editor → `optimizer_leads`
   - View the `source_business`, `utm_source`, `utm_medium`, and `utm_campaign` columns
   - Filter by specific source values to segment leads

2. **SQL Query Examples**:

```sql
-- Count leads by source
SELECT
  source_business,
  COUNT(*) as lead_count
FROM optimizer_leads
GROUP BY source_business
ORDER BY lead_count DESC;

-- View all tracking data for recent leads
SELECT
  created_at,
  email,
  source_business,
  source_domain,
  utm_source,
  utm_medium,
  utm_campaign
FROM optimizer_leads
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Analyze conversion by campaign
SELECT
  utm_campaign,
  COUNT(*) as leads,
  COUNT(CASE WHEN google_account_email IS NOT NULL THEN 1 END) as connected_google
FROM optimizer_leads
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign;
```

## Best Practices

1. **Just Embed It**: The automatic tracking will handle everything - no configuration needed!

2. **Override When Needed**: Use the `source` parameter only when you want a custom identifier

3. **Check Console Logs**: Look for "📍 Embed tracking captured" in browser console to verify tracking

4. **Use UTM for Campaigns**: Add UTM parameters when running specific marketing campaigns

5. **Review Auto-Generated Sources**: Check the `source_business` field to see how URLs are converted to sources

## Technical Implementation Details

### Files Modified
- `/src/app/(embed)/embed/google-business-optimizer/GoogleBusinessOptimizerEmbed.tsx` - Captures URL parameters
- `/src/app/(embed)/api/embed/auth/google-business/route.ts` - Passes parameters to OAuth state
- `/src/app/(embed)/api/embed/auth/google-business/callback/route.ts` - Saves tracking data with lead

### How Automatic Detection Works
1. Embed loads in an iframe on any website
2. JavaScript detects parent page URL via `document.referrer`
3. URL is parsed to extract domain and path
4. Auto-source is generated: `example.com/blog/post` → `example-com-blog-post`
5. All tracking data passes through OAuth flow
6. Lead is created with full context about embed location

## Troubleshooting

### Parameters Not Being Captured
- Ensure parameters are properly encoded in the URL
- Check browser console for the log message: "🎯 Tracking parameters captured"
- Verify the iframe src URL is correct

### Data Not Appearing in Database
- Check `optimizer_leads` table for the lead record
- Verify the OAuth flow completed successfully
- Check application logs for any errors during lead creation

### Testing Locally
When testing locally, you can use:
```html
<iframe
  src="http://localhost:3002/embed/google-business-optimizer?source=local-test"
  width="100%"
  height="800">
</iframe>
```

## Future Enhancements

Potential improvements to consider:
- Add a dashboard view for lead source analytics
- Implement conversion tracking (lead → customer)
- Add A/B testing support with variant tracking
- Create automated reports for lead source performance