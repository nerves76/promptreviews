# Notifications System

This document describes the in-app notification system used for the bell icon in the header and related features.

## Overview

The notification system provides:
- **In-app notifications** (bell icon in header)
- **Email notifications** (configurable per notification type)
- **User preferences** for both channels
- **Account isolation** for multi-account support
- **Centralized registry** for easy addition of new notification types

## Architecture

The notification system uses a **centralized registry pattern** that makes adding new notification types simple. All configuration is defined in one place (`NOTIFICATION_REGISTRY`), and a single function (`sendNotification()`) handles both in-app and email notifications automatically.

### Key Files

| File | Purpose |
|------|---------|
| `/src/utils/notifications.ts` | Core notification logic and registry |
| `/src/utils/emailTemplates.ts` | Email template rendering and sending |
| `/src/app/(app)/api/notifications/route.ts` | API for fetching/updating notifications |
| `/src/app/(app)/api/notifications/preferences/route.ts` | API for user preferences |
| `/src/app/(app)/components/Header.tsx` | Bell icon UI |
| `/src/app/(app)/dashboard/account/page.tsx` | Notification toggles |

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
| `in_app_review_auto_verified` | BOOLEAN | Show auto-verified review alerts |
| `email_gbp_changes` | BOOLEAN | Email for GBP changes |
| `email_new_reviews` | BOOLEAN | Email for new reviews |
| `email_team_updates` | BOOLEAN | Email for team updates |
| `email_subscription_updates` | BOOLEAN | Email for subscription updates |
| `email_announcements` | BOOLEAN | Email for announcements |
| `email_review_auto_verified` | BOOLEAN | Email for auto-verified reviews |
| `email_digest_frequency` | TEXT | 'immediate', 'daily', 'weekly', 'none' |

### Notification Types

```typescript
type NotificationType =
  | 'gbp_change_detected'      // GBP Profile Protection alerts
  | 'new_review_received'      // New customer review
  | 'team_invitation'          // Team member invited
  | 'subscription_update'      // Plan/billing changes
  | 'system_announcement'      // System-wide announcements
  | 'review_auto_verified';    // Review verified on Google
```

## Notification Registry

The `NOTIFICATION_REGISTRY` in `/src/utils/notifications.ts` defines all notification types:

```typescript
export const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationConfig> = {
  'review_auto_verified': {
    inAppPrefField: 'in_app_review_auto_verified',
    emailPrefField: 'email_review_auto_verified',
    // emailTemplate defaults to type name if not specified
    getTitle: () => 'Review Verified on Google',
    getMessage: (data) => `${data.reviewerName} left a ${data.starRating}-star review...`,
    actionUrl: '/dashboard/reviews',
    actionLabel: 'View Reviews',
    getEmailVariables: (data, baseUrl) => ({
      firstName: data.firstName,
      reviewerName: data.reviewerName,
      // ... variables for email template
    }),
  },
  // ... other types
};
```

Each notification type config includes:
- `inAppPrefField` - Column name in `notification_preferences` for in-app toggle
- `emailPrefField` - Column name for email toggle
- `emailTemplate` - Template name in `email_templates` table (defaults to type name)
- `getTitle()` - Function to generate notification title
- `getMessage()` - Function to generate notification message
- `actionUrl` - Default link when notification is clicked
- `actionLabel` - Button text
- `getEmailVariables()` - Transform data for email template variables

## Creating Notifications

### The Simple Way (Recommended)

Use `sendNotification()` for automatic handling of both in-app and email:

```typescript
import { sendNotification } from '@/utils/notifications';

// Send notification to all account users
await sendNotification({
  accountId: 'uuid',
  type: 'review_auto_verified',
  data: {
    email: 'user@example.com',  // Required for email to be sent
    firstName: 'John',
    reviewerName: 'Jane Doe',
    reviewContent: 'Great service!',
    starRating: 5,
  }
});
```

This automatically:
1. Checks in-app preferences and creates notification if enabled
2. Checks email preferences and sends email if enabled
3. Uses the correct email template based on notification type
4. Marks the notification as email sent

### Send to All Account Users

For notifications visible to all team members (email goes to owner):

```typescript
import { sendNotificationToAccount } from '@/utils/notifications';

await sendNotificationToAccount(accountId, 'review_auto_verified', {
  reviewerName: 'Jane Doe',
  reviewContent: 'Great service!',
  starRating: 5,
});
```

This automatically:
1. Creates in-app notification visible to ALL users on the account
2. Gets the account owner's email from Supabase auth
3. Sends email to account owner only

### Send to Account Owner Only

For notifications that should only go to the account owner:

```typescript
import { sendNotificationToAccountOwner } from '@/utils/notifications';

await sendNotificationToAccountOwner(accountId, 'some_type', { ... });
```

This automatically:
1. Finds the account owner from `account_users` table
2. Gets their email from Supabase auth
3. Creates notification visible only to them
4. Sends email to them

### Legacy Functions (Deprecated)

These still work for backward compatibility but prefer `sendNotification()`:

```typescript
// Generic notification
await createNotification({
  accountId: 'uuid',
  userId: 'uuid',
  type: 'new_review_received',
  title: 'New Review',
  message: 'You received a 5-star review!',
  actionUrl: '/dashboard/reviews',
  metadata: { reviewId: 'uuid' }
});

// GBP-specific
await createGbpChangeNotification(accountId, locationName, fieldChanged, changeSource, alertId);

// Check email separately
if (await shouldSendEmail(accountId, 'gbp_change_detected')) {
  await sendEmail(...);
}
```

## Adding New Notification Types

Follow these steps to add a new notification type:

### 1. Database Migration

Create a migration file:

```sql
-- Add to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'your_new_type';

-- Add preference columns
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_your_new_type BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_your_new_type BOOLEAN DEFAULT TRUE;

-- Add email template
INSERT INTO email_templates (name, subject, html_content, text_content, is_active) VALUES (
  'your_new_type',
  'Subject with {{variable}}',
  '<div>HTML content with {{variable}}</div>',
  'Plain text with {{variable}}',
  true
) ON CONFLICT (name) DO UPDATE SET ...;
```

### 2. Update Notification Registry

Add your type to `/src/utils/notifications.ts`:

```typescript
// Add to NotificationType union
export type NotificationType =
  | 'gbp_change_detected'
  | 'new_review_received'
  // ...
  | 'your_new_type';  // ADD THIS

// Add to NOTIFICATION_REGISTRY
export const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationConfig> = {
  // ... existing types

  'your_new_type': {
    inAppPrefField: 'in_app_your_new_type',
    emailPrefField: 'email_your_new_type',
    // emailTemplate: 'your_new_type',  // Optional - defaults to type name
    getTitle: (data) => data.title || 'Default Title',
    getMessage: (data) => data.message || 'Default message',
    actionUrl: '/dashboard/your-page',
    actionLabel: 'View Details',
    getEmailVariables: (data, baseUrl) => ({
      firstName: data.firstName || 'there',
      yourVariable: data.yourVariable,
      yourUrl: `${baseUrl}/dashboard/your-page`,
    }),
  },
};
```

### 3. Update Preferences API

Add fields to allowed list in `/src/app/(app)/api/notifications/preferences/route.ts`:

```typescript
const allowedFields = [
  // ... existing fields
  'in_app_your_new_type',
  'email_your_new_type',
];
```

### 4. Add UI Toggle (Optional)

If users should be able to toggle this notification type, add to account settings:

```typescript
// In /src/app/(app)/dashboard/account/page.tsx

// Add to NotificationPreferences interface
interface NotificationPreferences {
  // ...
  email_your_new_type: boolean;
  in_app_your_new_type: boolean;
}

// Add state and handler
const [yourTypeSaving, setYourTypeSaving] = useState(false);

const handleYourTypeToggle = async () => {
  if (!notifPrefs) return;
  setYourTypeSaving(true);
  try {
    const newValue = !notifPrefs.email_your_new_type;
    await apiClient.put('/notifications/preferences', {
      email_your_new_type: newValue,
      in_app_your_new_type: newValue
    });
    setNotifPrefs({
      ...notifPrefs,
      email_your_new_type: newValue,
      in_app_your_new_type: newValue
    });
  } catch (error) {
    setError('Failed to update notification settings');
  }
  setYourTypeSaving(false);
};

// Add toggle UI in Notification settings section
```

### 5. Trigger the Notification

Call from your code:

```typescript
await sendNotification({
  accountId,
  type: 'your_new_type',
  data: {
    email: userEmail,  // Required for email
    firstName: userName,
    yourVariable: 'value',
  }
});
```

### 6. Run Prisma Sync

```bash
npx prisma db pull
npx prisma generate
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

### Auto-Verification (`/api/cron/verify-google-reviews`)

Creates notifications when Prompt Page reviews are verified on Google:
- Creates in-app notification via `sendNotificationToAccountOwner()`
- Sends email to account owner if `email_review_auto_verified` enabled

## Email Templates

Email templates are stored in the `email_templates` table and editable via admin UI at `/admin/email-templates`.

### Template Variables

Use `{{variableName}}` syntax in templates. Common variables:

```
{{firstName}}        - User's first name
{{dashboardUrl}}     - Link to dashboard
{{reviewsUrl}}       - Link to reviews page
{{accountUrl}}       - Link to account settings
{{reviewerName}}     - Name of reviewer (for review notifications)
{{reviewContent}}    - Review text content
{{starRatingStars}}  - Star rating as unicode (e.g., "★★★★★")
```

### Naming Convention

Email template names should match notification type names:
- `review_auto_verified` notification uses `review_auto_verified` template
- `gbp_change_detected` notification uses `gbp_protection_alert` template (can be overridden)

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

## Troubleshooting

### Notifications not appearing
1. Check account has correct plan (some features require Builder/Maven)
2. Verify `in_app_*` preference is enabled
3. Check browser console for API errors
4. Verify account isolation - correct account selected?

### Emails not sending
1. Check `email_*` preference is enabled
2. Verify `data.email` is provided in `sendNotification()` call
3. Check email service (Resend) logs
4. Verify `email_sent` isn't already true on the record
5. Check email template exists in `email_templates` table

### High database usage
1. Run cleanup function: `SELECT cleanup_old_notifications();`
2. Check indexes are in place
3. Consider reducing polling frequency

## Changelog

### 2024-12-09 - Centralized Registry Pattern
- Refactored to use `NOTIFICATION_REGISTRY` for all notification types
- Added `sendNotification()` as unified entry point
- Added `sendNotificationToAccountOwner()` helper
- Added `review_auto_verified` notification type
- Deprecated `createNotification()` and manual email preference checking
