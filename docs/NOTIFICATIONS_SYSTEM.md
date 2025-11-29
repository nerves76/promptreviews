# Notifications System

This document describes the in-app notification system used for the bell icon in the header and related features.

## Overview

The notification system provides:
- **In-app notifications** (bell icon in header)
- **Email notifications** (configurable per notification type)
- **User preferences** for both channels
- **Account isolation** for multi-account support

## Database Schema

### Tables

#### `notifications`
Main table storing all notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `account_id` | UUID | Account this notification belongs to |
| `user_id` | UUID | Specific user (NULL = all users on account) |
| `type` | notification_type | Category of notification |
| `title` | TEXT | Short title displayed in UI |
| `message` | TEXT | Longer description |
| `action_url` | TEXT | Link when notification is clicked |
| `action_label` | TEXT | Button text (optional) |
| `metadata` | JSONB | Type-specific data (e.g., alertId, locationName) |
| `read` | BOOLEAN | Whether user has seen it |
| `read_at` | TIMESTAMPTZ | When marked as read |
| `dismissed` | BOOLEAN | Whether user dismissed it |
| `dismissed_at` | TIMESTAMPTZ | When dismissed |
| `email_sent` | BOOLEAN | Whether email was sent |
| `email_sent_at` | TIMESTAMPTZ | When email was sent |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `notification_preferences`
Per-account preferences for notification channels.

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | UUID | Account (unique) |
| `in_app_gbp_changes` | BOOLEAN | Show GBP changes in bell icon |
| `in_app_new_reviews` | BOOLEAN | Show new reviews in bell icon |
| `in_app_team_updates` | BOOLEAN | Show team updates in bell icon |
| `in_app_subscription_updates` | BOOLEAN | Show subscription updates |
| `in_app_announcements` | BOOLEAN | Show system announcements |
| `email_gbp_changes` | BOOLEAN | Email for GBP changes |
| `email_new_reviews` | BOOLEAN | Email for new reviews |
| `email_team_updates` | BOOLEAN | Email for team updates |
| `email_subscription_updates` | BOOLEAN | Email for subscription updates |
| `email_announcements` | BOOLEAN | Email for announcements |
| `email_digest_frequency` | TEXT | 'immediate', 'daily', 'weekly', 'none' |

### Notification Types

```typescript
type NotificationType =
  | 'gbp_change_detected'     // GBP Profile Protection alerts
  | 'new_review_received'     // New customer review
  | 'team_invitation'         // Team member invited
  | 'subscription_update'     // Plan/billing changes
  | 'system_announcement';    // System-wide announcements
```

## API Endpoints

### GET `/api/notifications`

Fetch notifications for the current account.

**Query Parameters:**
- `unread=true` - Only return unread notifications
- `limit=20` - Number of notifications (1-100, default 20)

**Response:**
```json
{
  "notifications": [...],
  "unreadCount": 5
}
```

**Security:**
- Rate limited: 30 requests/minute per user
- Filters by account_id from X-Selected-Account header
- Only returns notifications for current user or account-wide (user_id IS NULL)

### POST `/api/notifications`

Mark notifications as read or dismissed.

**Request Body:**
```json
{
  "action": "mark_read" | "mark_all_read" | "dismiss",
  "notificationIds": ["uuid1", "uuid2"]  // Required for mark_read/dismiss
}
```

**Security:**
- Rate limited: 30 requests/minute per user
- UUID validation on all notification IDs
- Max 100 IDs per request
- User can only modify their own notifications

### GET/PUT `/api/notifications/preferences`

Manage notification preferences.

**GET Response:**
```json
{
  "preferences": {
    "in_app_gbp_changes": true,
    "email_gbp_changes": true,
    ...
  }
}
```

**PUT Request:**
```json
{
  "email_gbp_changes": false,
  "in_app_gbp_changes": false
}
```

## Creating Notifications

### From Backend Code

Use the helper functions in `/src/utils/notifications.ts`:

```typescript
import { createNotification, createGbpChangeNotification } from '@/utils/notifications';

// Generic notification
await createNotification({
  accountId: 'uuid',
  userId: 'uuid',  // Optional - null for account-wide
  type: 'new_review_received',
  title: 'New Review',
  message: 'You received a 5-star review!',
  actionUrl: '/dashboard/reviews',
  actionLabel: 'View Review',
  metadata: { reviewId: 'uuid' }
});

// GBP-specific notification
await createGbpChangeNotification(
  accountId,
  locationName,
  fieldChanged,
  changeSource,  // 'google' | 'owner'
  alertId
);
```

### Checking Email Preferences

Before sending emails, check user preferences:

```typescript
import { shouldSendEmail } from '@/utils/notifications';

if (await shouldSendEmail(accountId, 'gbp_change_detected')) {
  await sendEmail(...);
}
```

## Frontend Integration

### Header Bell Icon

The Header component (`/src/app/(app)/components/Header.tsx`) handles:

1. **Fetching notifications** - On mount and when account switches
2. **Polling** - Every 2 minutes when tab is visible (uses Page Visibility API)
3. **Unread badge** - Shows count on bell icon
4. **Mark as read** - When dropdown opens
5. **Dismiss** - X button on hover for each notification

### Using apiClient

Always use `apiClient` for notification API calls to ensure proper headers:

```typescript
import { apiClient } from '@/utils/apiClient';

// Fetch
const data = await apiClient.get('/notifications?limit=20');

// Dismiss
await apiClient.post('/notifications', {
  action: 'dismiss',
  notificationIds: [id]
});
```

## Cron Jobs

### Notification Cleanup (`/api/cron/cleanup-notifications`)

Runs daily at 3 AM UTC to prevent database bloat:
- Deletes notifications older than 30 days that are read OR dismissed
- Deletes all notifications older than 90 days

### GBP Monitor (`/api/cron/monitor-gbp-changes`)

Creates notifications when GBP profile changes are detected:
- Creates in-app notification via `createGbpChangeNotification()`
- Sends email if user has `email_gbp_changes` enabled
- Tracks email sent status per-alert

## Security Considerations

### RLS Policies

- Users can only SELECT/UPDATE notifications for their accounts
- No INSERT policy for regular users (only service role can create)
- Service role bypasses RLS for cron jobs and webhooks

### Rate Limiting

In-memory rate limiting on notification API:
- 30 requests per minute per user
- Returns 429 Too Many Requests when exceeded

### Input Validation

- UUID format validation for notification IDs
- Batch size limited to 100 IDs
- Query limit clamped to 1-100

### Account Isolation

- All queries filter by `account_id` from `getRequestAccountId()`
- User-specific notifications additionally filter by `user_id`
- Account switching triggers re-fetch of notifications

## Database Indexes

```sql
-- Primary queries
CREATE INDEX idx_notifications_account_id ON notifications(account_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_account_user ON notifications(account_id, user_id, read, dismissed);

-- Unread count
CREATE INDEX idx_notifications_read ON notifications(account_id, read) WHERE NOT read;
CREATE INDEX idx_notifications_unread_count ON notifications(account_id, created_at DESC) WHERE NOT read AND NOT dismissed;

-- Cleanup job
CREATE INDEX idx_notifications_cleanup ON notifications(created_at, read, dismissed);
```

## Adding New Notification Types

1. Add to `notification_type` enum in migration
2. Add preference columns to `notification_preferences` table
3. Update `NotificationType` in `/src/utils/notifications.ts`
4. Update preference field maps in `createNotification()` and `shouldSendEmail()`
5. Add UI toggle in account settings if needed

## Troubleshooting

### Notifications not appearing
1. Check account has correct plan (some features require Builder/Maven)
2. Verify `in_app_*` preference is enabled
3. Check browser console for API errors
4. Verify account isolation - correct account selected?

### Emails not sending
1. Check `email_*` preference is enabled
2. Verify `shouldSendEmail()` returns true
3. Check email service (Resend) logs
4. Verify `email_sent` isn't already true on the record

### High database usage
1. Run cleanup function: `SELECT cleanup_old_notifications();`
2. Check indexes are in place
3. Consider reducing polling frequency
