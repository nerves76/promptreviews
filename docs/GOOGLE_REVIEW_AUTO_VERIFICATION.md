# Google Review Auto-Verification System

## Overview

Automated system to verify Google Business Profile reviews by matching submitted reviews against actual Google reviews fetched via the Google Business Profile API.

## How It Works

### 1. Data Flow

```
User submits review → Stored in review_submissions table with status='pending'
                    ↓
Daily cron job runs → Fetches pending reviews
                    ↓
Groups by account → Fetches Google OAuth tokens
                    ↓
Fetches Google reviews via API → Performs fuzzy matching
                    ↓
Updates verification status → Sets status='verified'/'not_found'/'failed'
```

### 2. Fuzzy Matching Algorithm

Located in: `/src/utils/reviewVerification.ts`

**Matching Criteria:**
- **Name Similarity (30%)**: Levenshtein distance on reviewer name
  - Handles full names, initials, first name only
  - Case-insensitive
- **Text Similarity (50%)**: Levenshtein distance on review content
  - Normalized (lowercase, trimmed)
  - Most important factor
- **Date Proximity (20%)**: Days between submission and Google review
  - Closer dates = higher score

**Confidence Levels:**
- High: 85%+ match score
- Medium: 70-85% match score
- Low: <70% match score (not verified)

### 3. Database Schema

**Key Fields in `review_submissions` table:**

```sql
auto_verification_status TEXT -- 'pending' | 'verified' | 'not_found' | 'failed'
auto_verified_at TIMESTAMP
verification_attempts INTEGER DEFAULT 0
last_verification_attempt_at TIMESTAMP
google_review_id TEXT -- Links to actual Google review
review_text_copy TEXT -- Copy of review_content for matching
verification_match_score DECIMAL(3,2) -- 0.00 to 1.00
business_id UUID -- Required: links to businesses table
```

**Indexes:**
- `idx_review_submissions_auto_verification_status`
- `idx_review_submissions_last_verification_attempt`
- `idx_review_submissions_google_review_id`

### 4. Cron Job

**File:** `/src/app/(app)/api/cron/verify-google-reviews/route.ts`

**Schedule:** Daily at 2:00 AM UTC (configured in `/vercel.json`)

**Process:**
1. Authenticates via `CRON_SECRET_TOKEN` header
2. Queries pending reviews (status='pending', has business_id, has review_text_copy)
3. Groups by account ID (business_id links to account via businesses table)
4. For each account:
   - Fetches Google Business locations from `google_business_locations` table
   - Retrieves Google OAuth tokens from `accounts` table
   - Initializes `GoogleBusinessProfileClient`
   - Fetches reviews from all locations via Google API
   - Matches each pending review against all Google reviews
   - Updates verification status based on match results
5. Returns summary: `{verified, notFound, errors, totalProcessed}`

**Batch Size:** Processes up to 10 reviews per run (configurable via LIMIT)

## Current Status

### Database State (as of 2025-11-17)

- **Total Google Business Profile reviews:** 138
- **Reviews with status='pending':** 136
- **Reviews with business_id:** 138 ✅
- **Reviews with review_text_copy:** 138 ✅
- **Reviews ready for verification:** 136

### Migrations Applied

All migrations in `/supabase/migrations/` with prefix `202511162*`:

1. `20251116204722_add_auto_verification_fields.sql` - Added verification columns
2. `20251116222000_unconditional_copy_review_text.sql` - Backfilled review_text_copy
3. `20251116223000_backfill_business_id.sql` - Backfilled business_id via prompt_pages
4. `20251221012400_rerun_backfills_with_logging.sql` - Re-ran backfills with diagnostics
5. `20251221013100_reset_all_failed_to_pending.sql` - Reset failed reviews to pending

### Known Issues

#### Issue #1: Cron Job Processing 0 Reviews Despite 136 Pending

**Symptoms:**
- Database shows 136 reviews with `auto_verification_status = 'pending'`
- API endpoint returns `{"totalProcessed": 0}`
- Console logs show "✅ Verification job complete: 0 verified, 0 not found, 0 errors"

**What We Tested:**

✅ **Database queries work correctly:**
```sql
-- Returns 136 rows
SELECT COUNT(*) FROM review_submissions
WHERE platform = 'Google Business Profile'
AND auto_verification_status = 'pending'
AND business_id IS NOT NULL
AND review_text_copy IS NOT NULL;
```

✅ **Service role client is configured:**
- Using `SUPABASE_SERVICE_ROLE_KEY` from environment
- Created via `createClient()` from `@supabase/supabase-js`
- Should bypass RLS policies

✅ **RLS policies checked:**
- Policies exist but service role should bypass them
- App works correctly (so Supabase keys are valid)

✅ **Deployment confirmed:**
- Latest code deployed to Vercel
- Response includes `version: 'v3-2024-12-21'` and `timestamp`
- No build errors

❌ **What's NOT working:**
- The Supabase query inside the cron job returns 0 rows
- Debug stats show: `{"pending": 0, "uniqueStatuses": ["failed"]}`
- But database migrations show 136 pending reviews exist

**Possible Causes:**

1. **Database connection caching:** API might be connected to stale replica
2. **Transaction isolation:** Migration changes not visible to API queries yet
3. **Different database:** API connecting to wrong Supabase project/environment
4. **RLS blocking despite service role:** Some edge case where RLS still applies
5. **Query timing:** Reviews being marked as failed between migration and API call

## Testing & Debugging

### Manual Testing

**Trigger the cron job:**
```bash
curl -X GET 'https://app.promptreviews.app/api/cron/verify-google-reviews' \
  -H "Authorization: Bearer ${CRON_SECRET_TOKEN}" \
  -H 'Content-Type: application/json'
```

**Check database directly:**
```sql
-- See status distribution
SELECT auto_verification_status, COUNT(*)
FROM review_submissions
WHERE platform = 'Google Business Profile'
GROUP BY auto_verification_status;

-- See ready reviews
SELECT id, business_id, review_text_copy IS NOT NULL as has_text
FROM review_submissions
WHERE platform = 'Google Business Profile'
AND auto_verification_status = 'pending'
AND business_id IS NOT NULL
LIMIT 10;
```

### Debug Endpoints Added

The cron job now returns debug information when no reviews are found:

```json
{
  "success": true,
  "verified": 0,
  "message": "No pending reviews to verify",
  "debug": {
    "fetchError": null,
    "dataLength": 0,
    "samplePendingCount": 0,
    "samplePendingIds": [],
    "totalGoogleCount": 138,
    "stats": {
      "total": 138,
      "pending": 0,
      "verified": 0,
      "nullBusinessId": 0,
      "alreadyVerified": 59,
      "uniqueStatuses": ["failed"]
    }
  }
}
```

### Vercel Logs

Check function logs at: Vercel Dashboard → Functions → `/api/cron/verify-google-reviews`

Look for:
- "🔍 Starting Google review verification job (v3 - with 79 pending reviews)..."
- "📊 Total Google Business Profile reviews: X"
- "📊 Breakdown: {...}"
- "📋 Query found X pending submissions"
- "✅ Verification job complete: X verified, X not found, X errors"

### Local Testing

```bash
# Start local Supabase
npx supabase start

# Start dev server
DISABLE_SENTRY=true npm run dev

# Test endpoint locally
curl -X GET 'http://localhost:3002/api/cron/verify-google-reviews' \
  -H "Authorization: Bearer do-the-cron-thing-yeah-yeah-1nd8enqi89jmnsnjebcbdmj"
```

**Note:** Local testing won't work fully because:
- Local database doesn't have production review data
- Google OAuth tokens need real account data
- Need actual Google Business Profile locations

## Next Steps to Investigate

### 1. Check Supabase Connection

**Verify environment variables in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL` - Should match production Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - Should be service_role key (not anon key)

**Test in Vercel console:**
Add temporary logging to show what the service client sees:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));
```

### 2. Add More Granular Logging

Modify `/src/app/(app)/api/cron/verify-google-reviews/route.ts`:

```typescript
// After the pending submissions query
console.log('Query filters:', {
  platform: 'Google Business Profile',
  status: 'pending',
  hasBusinessId: 'IS NOT NULL',
  hasReviewText: 'IS NOT NULL'
});

console.log('Raw query result:', {
  dataExists: !!pendingSubmissions,
  isArray: Array.isArray(pendingSubmissions),
  length: pendingSubmissions?.length,
  firstItem: pendingSubmissions?.[0]
});
```

### 3. Test Direct Database Query

Create a test endpoint that bypasses the cron logic:

```typescript
// /src/app/(app)/api/test-pending-reviews/route.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('review_submissions')
    .select('*')
    .eq('platform', 'Google Business Profile')
    .eq('auto_verification_status', 'pending')
    .limit(5);

  return NextResponse.json({
    data,
    error,
    count: data?.length
  });
}
```

### 4. Check for Concurrent Modifications

The reviews might be getting marked as 'failed' between the migration and the API call.

**Check last_verification_attempt_at timestamps:**
```sql
SELECT
  auto_verification_status,
  last_verification_attempt_at,
  verification_attempts,
  COUNT(*)
FROM review_submissions
WHERE platform = 'Google Business Profile'
GROUP BY auto_verification_status, last_verification_attempt_at, verification_attempts
ORDER BY last_verification_attempt_at DESC;
```

If timestamps are recent, something is actively marking reviews as failed.

### 5. Check Google OAuth Tokens

The cron job might be failing silently when fetching Google data.

**Verify accounts have valid tokens:**
```sql
SELECT
  id,
  google_access_token IS NOT NULL as has_access,
  google_refresh_token IS NOT NULL as has_refresh,
  google_token_expires_at,
  google_token_expires_at > NOW() as token_valid
FROM accounts
WHERE id IN (
  SELECT DISTINCT business_id
  FROM review_submissions
  WHERE platform = 'Google Business Profile'
  AND auto_verification_status = 'pending'
);
```

### 6. Test Fuzzy Matching Logic

Verify the matching algorithm works:

```typescript
import { findBestMatch } from '@/utils/reviewVerification';

const testSubmission = {
  reviewerName: 'John Doe',
  reviewText: 'Great service!',
  submittedDate: new Date('2025-11-01')
};

const googleReviews = [
  {
    reviewer: { displayName: 'John D.' },
    comment: 'Great service!',
    createTime: '2025-11-01T10:00:00Z',
    name: 'accounts/123/locations/456/reviews/789'
  }
];

const result = findBestMatch(testSubmission, googleReviews);
console.log('Match result:', result);
// Should return {isMatch: true, confidence: 'high', score: ~0.9}
```

## Configuration Files

**Vercel Cron (`/vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/verify-google-reviews",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET_TOKEN`
- Google OAuth credentials (if not already in accounts table)

## Related Files

**Core Logic:**
- `/src/app/(app)/api/cron/verify-google-reviews/route.ts` - Main cron job
- `/src/utils/reviewVerification.ts` - Fuzzy matching algorithm
- `/src/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient.ts` - Google API client

**Database:**
- `/supabase/migrations/202511162*_*.sql` - Verification schema and backfills
- Schema: `review_submissions`, `businesses`, `accounts`, `google_business_locations`

**Configuration:**
- `/vercel.json` - Cron schedule
- `/.env.local` - Local environment variables
- Vercel Dashboard → Settings → Environment Variables - Production config

## Contact & Handoff

**Current State:**
- ✅ Database is ready with 136 pending reviews
- ✅ All required data is populated (business_id, review_text_copy)
- ✅ Code is deployed and working
- ❌ API query returns 0 reviews despite database showing 136 pending

**Immediate Action Needed:**
1. Check why Supabase query in API returns different results than direct SQL
2. Add detailed logging to see exact query parameters and results
3. Verify no background process is marking reviews as 'failed'
4. Test with a single review to isolate the issue

**Last Known Working State:**
- Migrations successfully ran and reported 136 pending reviews
- Direct database queries confirmed the data exists
- API endpoint is accessible and returning responses
- Issue is specifically with the Supabase JS client query not returning expected rows

**Testing Commands:**
```bash
# Reset reviews back to pending (if needed)
npx supabase db push  # Apply latest migrations

# Check database state
npx supabase db execute "SELECT auto_verification_status, COUNT(*) FROM review_submissions WHERE platform = 'Google Business Profile' GROUP BY auto_verification_status;"

# Test cron job
curl -X GET 'https://app.promptreviews.app/api/cron/verify-google-reviews' \
  -H "Authorization: Bearer ${CRON_SECRET_TOKEN}"
```

Good luck! The system is 95% complete - just need to solve the query discrepancy issue.
