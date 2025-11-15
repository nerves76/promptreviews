# Review Share Tracking API Documentation

## Overview

The Review Share Tracking API provides endpoints for tracking and analyzing when users share reviews on social platforms. This system tracks share events, provides analytics, and ensures proper account isolation.

## Table of Contents

- [Endpoints](#endpoints)
- [Authentication](#authentication)
- [Account Isolation](#account-isolation)
- [Share CTA Link Handling](#share-cta-link-handling)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Business Logo Support](#business-logo-support)
- [Examples](#examples)

---

## Endpoints

### POST /api/review-shares

Creates a new share event for tracking when a user shares a review on a social platform.

**Request:**
```typescript
POST /api/review-shares
Authorization: Bearer {token}
X-Selected-Account: {accountId} // Optional - uses selected account from context
Content-Type: application/json

{
  "review_id": "uuid",
  "platform": "facebook" | "linkedin" | "twitter" | "bluesky" | "reddit" | "pinterest" | "email" | "text" | "copy_link"
}
```

**Response (Success):**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "review_id": "uuid",
    "account_id": "uuid",
    "user_id": "uuid",
    "platform": "facebook",
    "timestamp": "2025-10-04T12:18:45.000Z",
    "created_at": "2025-10-04T12:18:45.000Z",
    "updated_at": "2025-10-04T12:18:45.000Z"
  }
}
```

**Validation:**
- Verifies user authentication
- Validates review exists and belongs to user's account
- Ensures platform is a valid enum value
- Enforces account isolation via business ownership

**Error Codes:**
- `400` - Missing or invalid fields
- `401` - Authentication required or invalid token
- `403` - User doesn't have permission to track shares for this review
- `404` - Review or account not found
- `500` - Server error

---

### GET /api/review-shares?reviewId={id}

Gets the share history for a specific review, grouped by platform.

**Request:**
```typescript
GET /api/review-shares?reviewId={uuid}
Authorization: Bearer {token}
X-Selected-Account: {accountId} // Optional
```

**Response (Success):**
```typescript
{
  "review_id": "uuid",
  "total_shares": 42,
  "shares_by_platform": [
    {
      "platform": "facebook",
      "count": 15,
      "last_shared_at": "2025-10-04T12:18:45.000Z"
    },
    {
      "platform": "linkedin",
      "count": 12,
      "last_shared_at": "2025-10-03T15:30:00.000Z"
    }
  ],
  "events": [
    {
      "id": "uuid",
      "review_id": "uuid",
      "account_id": "uuid",
      "user_id": "uuid",
      "platform": "facebook",
      "timestamp": "2025-10-04T12:18:45.000Z",
      "created_at": "2025-10-04T12:18:45.000Z",
      "updated_at": "2025-10-04T12:18:45.000Z"
    }
    // ... more events
  ]
}
```

**Error Codes:**
- `400` - Missing reviewId parameter
- `401` - Authentication required or invalid token
- `403` - User doesn't have permission to view shares for this review
- `404` - Review or account not found
- `500` - Server error

---

### GET /api/review-shares/analytics

Gets aggregated share analytics for the user's account.

**Request:**
```typescript
GET /api/review-shares/analytics?start_date={ISO8601}&end_date={ISO8601}&platform={platform}&limit={number}
Authorization: Bearer {token}
X-Selected-Account: {accountId} // Optional

// All query parameters are optional:
// - start_date: Filter events after this date (ISO 8601)
// - end_date: Filter events before this date (ISO 8601)
// - platform: Filter by specific platform
// - limit: Number of top reviews to return (default: 10)
```

**Response (Success):**
```typescript
{
  "total_shares": 156,
  "shares_by_platform": [
    {
      "platform": "facebook",
      "count": 45,
      "percentage": 29
    },
    {
      "platform": "linkedin",
      "count": 38,
      "percentage": 24
    }
    // ... more platforms
  ],
  "most_shared_reviews": [
    {
      "review_id": "uuid",
      "review_content": "This is an amazing product! It changed my life...",
      "reviewer_name": "John Doe",
      "share_count": 23,
      "platforms": ["facebook", "linkedin", "twitter"]
    }
    // ... more reviews
  ],
  "time_period": {
    "start_date": "2025-09-01T00:00:00.000Z",
    "end_date": "2025-10-04T23:59:59.000Z"
  }
}
```

**Error Codes:**
- `401` - Authentication required or invalid token
- `404` - Account not found
- `500` - Server error

---

### GET /api/review-shares/[id]

Gets a specific share event by ID.

**Request:**
```typescript
GET /api/review-shares/{shareEventId}
Authorization: Bearer {token}
X-Selected-Account: {accountId} // Optional
```

**Response (Success):**
```typescript
{
  "success": true,
  "data": {
    "id": "uuid",
    "review_id": "uuid",
    "account_id": "uuid",
    "user_id": "uuid",
    "platform": "facebook",
    "timestamp": "2025-10-04T12:18:45.000Z",
    "created_at": "2025-10-04T12:18:45.000Z",
    "updated_at": "2025-10-04T12:18:45.000Z"
  }
}
```

**Error Codes:**
- `400` - Missing share event ID
- `401` - Authentication required or invalid token
- `404` - Share event not found
- `500` - Server error

---

### DELETE /api/review-shares/[id]

Deletes a specific share event. Useful for cleaning up false positives or accidental shares.

**Request:**
```typescript
DELETE /api/review-shares/{shareEventId}
Authorization: Bearer {token}
X-Selected-Account: {accountId} // Optional
```

**Response (Success):**
```typescript
{
  "success": true,
  "message": "Share event deleted successfully"
}
```

**Validation:**
- Verifies user authentication
- Validates share event exists and belongs to user's account
- Enforces account isolation

**Error Codes:**
- `400` - Missing share event ID
- `401` - Authentication required or invalid token
- `403` - User doesn't have permission to delete this share event
- `404` - Share event not found
- `500` - Server error

---

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```typescript
Authorization: Bearer {supabase_access_token}
```

Tokens are validated using Supabase Auth. Expired or invalid tokens return a 401 error.

---

## Account Isolation

**CRITICAL SECURITY REQUIREMENT:**

All endpoints enforce strict account isolation to prevent cross-account data leakage. This is implemented through:

1. **Account ID Verification**: Every request validates the user has access to the requested account via the `account_users` table.

2. **RLS Policies**: Database-level Row Level Security ensures users can only access share events for their own accounts.

3. **Business Ownership**: Review access is validated by checking the review's business belongs to the user's account.

4. **Double-Check Pattern**: All delete operations verify account_id in the WHERE clause for extra security.

See CLAUDE.md Recent Issues Log for details on past account isolation vulnerabilities.

---

## Share CTA Link Handling

When users share a review, they typically need a Call-To-Action (CTA) link to direct traffic. The system determines the CTA link using the following priority:

### Default CTA Link Logic

1. **Business Website (Primary)**: Use `businesses.business_website` for the account's business
   - Field: `businesses.business_website` (String, nullable)
   - Validation: Must be valid HTTPS URL
   - Example: `https://www.example.com`

2. **Account Website URL (Fallback)**: If business doesn't have a website, use account-level setting
   - Field: `accounts.website_url` (String, nullable)
   - Validation: Must be valid HTTPS URL
   - Example: `https://www.company.com`

3. **Prompt Page Override (Optional)**: Specific prompt pages can override the default CTA
   - Field: `prompt_pages.offer_url` (String, nullable)
   - Use case: Special landing pages, offers, or campaigns
   - Validation: Must be valid HTTPS URL

### Implementation Notes

**Database Fields:**
```typescript
// Business-level (most common)
businesses.business_website: string | null

// Account-level (fallback)
accounts.website_url: string | null

// Prompt page-level (override)
prompt_pages.offer_url: string | null
prompt_pages.offer_learn_more_url: string | null
```

**Retrieval Logic (Recommended):**
```typescript
async function getShareCTALink(reviewId: string, accountId: string): Promise<string | null> {
  // 1. Get review to find associated prompt page
  const review = await getReview(reviewId);

  // 2. If review has a prompt page with custom offer URL, use it
  if (review.prompt_page_id) {
    const promptPage = await getPromptPage(review.prompt_page_id);
    if (promptPage.offer_url) {
      return promptPage.offer_url;
    }
  }

  // 3. Get business and check for business website
  const business = await getBusiness(review.business_id);
  if (business.business_website) {
    return business.business_website;
  }

  // 4. Fall back to account-level website
  const account = await getAccount(accountId);
  return account.website_url || null;
}
```

**URL Validation:**
- All URLs must use HTTPS protocol
- URLs should be validated before storage
- Invalid URLs should fall back to next priority level
- Consider adding URL reachability checks (optional)

**Future Enhancements:**
- UTM parameter tracking for analytics
- Short URL generation for social platforms
- Per-platform URL customization
- A/B testing different landing pages

---

## Type Definitions

See `/src/types/review-shares.ts` for complete TypeScript definitions:

```typescript
export type SharePlatform =
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'bluesky'
  | 'reddit'
  | 'pinterest'
  | 'email'
  | 'text'
  | 'copy_link';

export interface ReviewShareEvent {
  id: string;
  review_id: string;
  account_id: string;
  user_id: string;
  platform: SharePlatform;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

// See file for complete type definitions
```

---

## Error Handling

All endpoints follow a consistent error response format:

```typescript
{
  "error": "Human-readable error message",
  "details": "Technical details (optional, for 500 errors)"
}
```

**Common Error Patterns:**

1. **Authentication Errors (401)**:
   - Missing Authorization header
   - Invalid or expired token
   - Token format incorrect

2. **Authorization Errors (403)**:
   - User doesn't own the resource
   - Account isolation violation

3. **Validation Errors (400)**:
   - Missing required fields
   - Invalid enum values
   - Malformed input data

4. **Not Found Errors (404)**:
   - Resource doesn't exist
   - Account not found
   - Review not found

5. **Server Errors (500)**:
   - Database connection issues
   - Unexpected exceptions
   - External service failures

---

## Business Logo Support

Logos are proxied through `/api/review-shares/logo` to avoid exposing the
service-role key or raw storage paths. The proxy now **requires signed tokens**
to prevent arbitrary bucket reads.

### Configuration

1. Set `LOGO_PROXY_SIGNING_SECRET` (32+ random bytes) in `.env.local`. The proxy
   falls back to `EMBED_SESSION_SECRET` for backwards compatibility, but it is
   recommended to provide a dedicated secret.
2. Generate signed URLs server-side using `createSignedLogoUrl(bucket, path)`.
   The helper lives in `src/lib/review-shares/logoProxy.ts`.

### How logos are resolved

1. Fully-qualified URLs (e.g. CDN images) are used as-is.
2. Supabase Storage references (`logos/company.png` or
   `storage/v1/object/public/logos/company.png`) are converted to signed proxy
   URLs via `createSignedLogoUrl`. The OG route already performs this conversion.

Because every proxy request must include a valid signature, unauthenticated
attackers cannot enumerate other buckets even though the proxy runs with the
service role key.

---

## Examples

### Example 1: Track a Facebook Share

```typescript
const response = await fetch('/api/review-shares', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Selected-Account': accountId
  },
  body: JSON.stringify({
    review_id: 'abc-123-def-456',
    platform: 'facebook'
  })
});

const result = await response.json();
console.log('Share tracked:', result.data);
```

### Example 2: Get Review Share History

```typescript
const reviewId = 'abc-123-def-456';
const response = await fetch(`/api/review-shares?reviewId=${reviewId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Selected-Account': accountId
  }
});

const history = await response.json();
console.log('Total shares:', history.total_shares);
console.log('By platform:', history.shares_by_platform);
```

### Example 3: Get Analytics with Date Range

```typescript
const startDate = '2025-09-01T00:00:00.000Z';
const endDate = '2025-10-04T23:59:59.000Z';

const response = await fetch(
  `/api/review-shares/analytics?start_date=${startDate}&end_date=${endDate}&limit=5`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Selected-Account': accountId
    }
  }
);

const analytics = await response.json();
console.log('Most shared reviews:', analytics.most_shared_reviews);
```

### Example 4: Delete a Share Event

```typescript
const shareEventId = 'xyz-789-uvw-012';
const response = await fetch(`/api/review-shares/${shareEventId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Selected-Account': accountId
  }
});

const result = await response.json();
console.log('Deleted:', result.success);
```

---

## Database Schema

The share events are stored in the `review_share_events` table:

```sql
CREATE TABLE public.review_share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform share_platform NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_review_share_events_review_id` - Fast review lookups
- `idx_review_share_events_account_id` - Account isolation
- `idx_review_share_events_user_id` - User analytics
- `idx_review_share_events_platform` - Platform analytics
- `idx_review_share_events_timestamp` - Time-based queries
- `idx_review_share_events_account_platform` - Combined queries
- `idx_review_share_events_review_platform` - Review-platform queries

**Row Level Security (RLS):**
- Users can only view/create/delete share events for their own accounts
- Enforced via `account_users` table join on `auth.uid()`
- See migration file for complete policy definitions

---

## Notes

1. **Review ID Flexibility**: The `review_id` field can reference either `review_submissions` or `widget_reviews` tables. Validation is enforced in the API layer, not via foreign key constraints.

2. **Soft vs Hard Delete**: Currently using hard delete for share events. Consider soft delete if analytics history is important.

3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse or accidental duplicate tracking.

4. **Duplicate Detection**: The API currently allows multiple share events for the same review+platform combination. Consider adding deduplication logic if needed.

5. **Webhook Support**: Future enhancement could include webhooks for real-time share notifications.

6. **Privacy Compliance**: Ensure share tracking complies with privacy regulations (GDPR, CCPA) and user consent requirements.
