# Diagnosing Why Google Business Posts Aren't Publishing

## The Problem
- Posts scheduled for Sept 23, 2025 (6 days ago)
- Still showing "Pending" status
- Should have been processed by daily cron job

## Most Likely Causes

### 1. Cron Job Not Running on Vercel
**Check:** Go to Vercel Dashboard → Functions → Crons
- Look for `/api/cron/process-google-business-scheduled`
- Check last execution time
- Should run daily at 1 PM UTC (13:00 UTC)

**If not running:**
- Vercel free plan has limited cron jobs
- May need to upgrade plan
- Or cron configuration might be missing from deployment

### 2. CRON_SECRET_TOKEN Missing or Wrong
**Check:** Vercel Dashboard → Settings → Environment Variables
- Look for `CRON_SECRET_TOKEN`
- Must match what's in the cron job code

**Test manually:**
```bash
curl -X GET "https://app.promptreviews.app/api/cron/process-google-business-scheduled" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

### 3. Database Connection Issue
The cron might not be able to connect to production Supabase from Vercel.

**Check environment variables in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL` - Should be your production Supabase URL (not localhost)
- `SUPABASE_SERVICE_ROLE_KEY` - Needed for cron to bypass RLS

### 4. Posts Stuck Due to Error
**Run this SQL in Supabase to check:**
```sql
-- Check if posts have error logs
SELECT
    id,
    post_kind,
    scheduled_date,
    status,
    error_log,
    updated_at
FROM google_business_scheduled_posts
WHERE scheduled_date = '2025-09-23';

-- Check post results table for errors
SELECT *
FROM google_business_scheduled_post_results
WHERE scheduled_post_id IN (
    SELECT id
    FROM google_business_scheduled_posts
    WHERE scheduled_date = '2025-09-23'
);
```

## Immediate Actions

### 1. Check Vercel Cron Logs
Go to: https://vercel.com/[your-team]/promptreviews/functions
- Click on the cron function
- Check logs for the last few days
- Look for execution at 1 PM UTC daily

### 2. Test the Cron Manually
From your local machine with production credentials:
```bash
# Set your production credentials
export CRON_SECRET_TOKEN="[get from Vercel env vars]"

# Test the endpoint
curl -X GET "https://app.promptreviews.app/api/cron/process-google-business-scheduled" \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Force Process the Posts
If you need them to go out immediately, run this SQL in Supabase:

```sql
-- Reset to pending and today's date to force reprocessing
UPDATE google_business_scheduled_posts
SET
    scheduled_date = CURRENT_DATE,
    status = 'pending',
    error_log = NULL,
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';
```

Then manually trigger the cron.

### 4. Check User's Google Token
```sql
-- Check if user has valid Google tokens
SELECT
    p.id,
    p.scheduled_date,
    gbp.user_id,
    gbp.access_token IS NOT NULL as has_token,
    gbp.refresh_token IS NOT NULL as has_refresh,
    gbp.expires_at,
    gbp.expires_at > NOW() as token_valid
FROM google_business_scheduled_posts p
LEFT JOIN google_business_profiles gbp ON gbp.user_id = p.user_id
WHERE p.scheduled_date = '2025-09-23';
```

## Debug Checklist
- [ ] Vercel cron job showing executions?
- [ ] CRON_SECRET_TOKEN exists in Vercel env?
- [ ] Supabase credentials in Vercel env?
- [ ] Manual curl test returns success?
- [ ] Posts have valid Google tokens?
- [ ] No errors in error_log column?