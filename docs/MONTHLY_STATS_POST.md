# Monthly Community Stats Post

## Overview
Automated monthly community post that shares platform-wide statistics with all PromptReviews users in the Community section.

## Feature Details

### What It Does
On the 1st of every month at 12:00 PM UTC, the system automatically creates a community post in the "General" channel with:
- Total number of PromptReviews accounts
- Total reviews captured across the platform
- Number of new reviews captured in the previous month

### Post Format
```
Title: Happy [Current Month] Star Catchers! 🌟

Body:
How many reviews did you capture last month?

📊 **[Previous Month] Platform Stats**

**PromptReviews Accounts:** [formatted number]
**Total Reviews Captured:** [formatted number]
**New Reviews in [Previous Month]:** [formatted number]

Keep up the amazing work capturing those reviews! 💫
```

### Example
```
Title: Happy October Star Catchers! 🌟

Body:
How many reviews did you capture last month?

📊 **September Platform Stats**

**PromptReviews Accounts:** 1,234
**Total Reviews Captured:** 45,678
**New Reviews in September:** 2,345

Keep up the amazing work capturing those reviews! 💫
```

## Implementation

### Cron Job
- **Endpoint:** `/api/cron/post-monthly-stats`
- **Schedule:** `0 12 1 * *` (12:00 PM UTC on the 1st of each month)
- **Authentication:** Requires `CRON_SECRET_TOKEN` in Authorization header

### PromptyBot User
The posts are created by a special system user:
- **Email:** promptybot@promptreviews.app
- **Username:** prompty-bot
- **Display Name:** Prompty Bot

This user is automatically created on the first run if it doesn't exist.

### Community Channel
Posts are created in the "General" channel:
- **Channel ID:** `641f29a9-155a-4e01-9c6f-91861cd25e5b`
- **Slug:** general
- **Name:** General

## Data Sources

### Statistics Calculated
1. **Total Accounts:** Count from `accounts` table
2. **Total Reviews:** Count from `review_submissions` table
3. **Last Month Reviews:** Count from `review_submissions` where `created_at` is between the 1st and last day of the previous month

### Database Tables Used
- `accounts` - For total account count
- `review_submissions` - For review statistics
- `posts` - Where the community post is created
- `community_profiles` - For PromptyBot's community profile
- `auth.users` - For PromptyBot's user account

## Deployment

### Vercel Configuration
The cron job is configured in `vercel.json`:
```json
{
  "path": "/api/cron/post-monthly-stats",
  "schedule": "0 12 1 * *"
}
```

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `CRON_SECRET_TOKEN` - Secret token for cron authentication

### Deployment Steps
1. Code is already committed and ready
2. Push to main branch
3. Vercel will automatically deploy
4. Cron job will be registered with Vercel's cron service
5. First run will be on the 1st of the next month at 12:00 PM UTC

## File Locations
- **API Endpoint:** `/src/app/(app)/api/cron/post-monthly-stats/route.ts`
- **Vercel Config:** `/vercel.json`
- **Documentation:** `/docs/MONTHLY_STATS_POST.md`

## Error Handling
The endpoint handles various error cases:
- Missing CRON_SECRET_TOKEN
- Invalid authorization token
- Failed to create PromptyBot user
- Failed to fetch statistics
- Failed to create community post

All errors are logged to console and return appropriate HTTP status codes.

## Monitoring
After deployment, you can verify the cron job:
1. Check Vercel dashboard for cron job status
2. View posts in the Community General channel
3. Check Vercel function logs for execution details

## Manual Testing (Production Only)
To manually trigger the post in production:
```bash
curl -X GET "https://app.promptreviews.app/api/cron/post-monthly-stats" \
  -H "Authorization: Bearer [CRON_SECRET_TOKEN]"
```

⚠️ **Note:** This will create a real post in the community, so use sparingly.

## Future Enhancements
Possible improvements:
- Add comparison to previous month (growth percentage)
- Include top platforms by review count
- Add platform health score
- Include top contributing accounts (anonymized)
- Add trending topics or popular posts from the month
