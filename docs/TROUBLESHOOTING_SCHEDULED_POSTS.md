# Troubleshooting Google Business Scheduled Posts

## Issue: Scheduled post didn't go out

### 1. Cron Job Configuration
✅ **Cron is configured correctly in `vercel.json`:**
- Path: `/api/cron/process-google-business-scheduled`
- Schedule: `0 13 * * *` (Daily at 1 PM UTC)
- Max jobs per run: 25 (configurable via `GBP_SCHEDULED_MAX_JOBS`)

### 2. Common Failure Reasons

#### A. Authentication Issues
- **Token Expired**: Google access tokens expire. Check if the user's token in `google_business_profiles` table is still valid
- **Missing Token**: User may not have Google Business Profile connected
- **Wrong Account**: The selected Google Business account might not have access to the locations

#### B. Cron Job Not Running
- **Vercel Cron Limits**: Free tier has limitations on cron jobs
- **Authorization Failure**: Cron job requires `CRON_SECRET_TOKEN` environment variable
- **Check Vercel Logs**: Look for cron execution at 1 PM UTC daily

#### C. Post Configuration Issues
- **Invalid scheduled_date**: Post must have `scheduled_date <= today` to be processed
- **No Locations Selected**: Post must have at least one location in `selected_locations`
- **Status Not Pending**: Only posts with `status = 'pending'` are processed

#### D. API Failures
- **Rate Limiting**: Google Business API has rate limits (5 second delay between operations)
- **Invalid Media**: Photos might be missing or in wrong format
- **Missing Content**: Posts require summary text

### 3. How to Investigate

#### Step 1: Check Vercel Dashboard
1. Go to Vercel Dashboard → Functions tab
2. Look for `/api/cron/process-google-business-scheduled`
3. Check execution logs around 1 PM UTC
4. Look for error messages or timeouts

#### Step 2: Run SQL Queries
Use the queries in `/scripts/check-scheduled-posts.sql` to:
- Find posts that should have been processed
- Check for authentication issues
- Review error logs
- See posts stuck in 'processing' status

#### Step 3: Check Specific Post
```sql
-- Replace POST_ID with your actual post ID
SELECT
    *,
    jsonb_pretty(error_log) as formatted_error,
    jsonb_pretty(selected_locations) as locations
FROM google_business_scheduled_posts
WHERE id = 'POST_ID';
```

#### Step 4: Check User's Google Connection
```sql
-- Replace USER_ID with the actual user ID
SELECT
    user_id,
    access_token IS NOT NULL as has_token,
    refresh_token IS NOT NULL as has_refresh,
    expires_at,
    expires_at > NOW() as token_valid,
    selected_account_id,
    selected_account_name
FROM google_business_profiles
WHERE user_id = 'USER_ID';
```

### 4. Manual Troubleshooting

#### Test Cron Job Manually (Local)
```bash
# Test the cron endpoint locally
curl -X GET "http://localhost:3002/api/cron/process-google-business-scheduled" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

#### Force Retry a Failed Post
```sql
-- Reset a failed post to pending (use with caution)
UPDATE google_business_scheduled_posts
SET
    status = 'pending',
    error_log = NULL,
    updated_at = NOW()
WHERE id = 'POST_ID'
    AND status = 'failed';
```

### 5. Common Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Missing Google Business authentication tokens" | User hasn't connected Google Business or tokens deleted | User needs to reconnect Google Business Profile |
| "Token expired" | Access token expired | Refresh token should auto-refresh, check refresh_token exists |
| "No locations selected" | Post created without locations | Add locations to the post |
| "Unable to determine Google Business account ID" | Location doesn't have associated account | Check `google_business_locations` table for account mapping |
| "Status already updated" | Post already being processed | Check for stuck 'processing' status |

### 6. Monitoring Recommendations

1. **Set up alerts** for failed posts:
   ```sql
   SELECT COUNT(*)
   FROM google_business_scheduled_posts
   WHERE status = 'failed'
     AND updated_at > NOW() - INTERVAL '1 day';
   ```

2. **Daily health check** query:
   ```sql
   SELECT
       DATE(scheduled_date) as date,
       COUNT(*) FILTER (WHERE status = 'completed') as succeeded,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'processing') as processing
   FROM google_business_scheduled_posts
   WHERE scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
   GROUP BY DATE(scheduled_date)
   ORDER BY date DESC;
   ```

### 7. Prevention Tips

1. **Verify Connection**: Before scheduling, verify Google Business connection is active
2. **Test Post**: Try creating an immediate post before scheduling
3. **Monitor Tokens**: Set up monitoring for expiring tokens
4. **Check Locations**: Ensure selected locations are still accessible
5. **Log Reviews**: Regularly review cron job logs in Vercel

### 8. Emergency Actions

If posts are critical and not going out:

1. **Manual Publish**: Use the Google Business Profile manager directly
2. **Check Vercel Status**: Ensure Vercel cron jobs are operational
3. **Contact Support**: If systematic failure, may need infrastructure investigation

## Next Steps for Your Case

1. Run the SQL queries in `/scripts/check-scheduled-posts.sql`
2. Check Vercel Dashboard for cron execution logs
3. Look for specific error in the `error_log` column
4. Verify the user's Google Business tokens are valid

The most likely causes are:
- Token expiration
- Cron job not running (check Vercel logs)
- Post scheduled date/timezone mismatch
- Missing or invalid location selection