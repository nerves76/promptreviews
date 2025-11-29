# GBP Profile Protection

This document describes the Google Business Profile Protection feature that monitors GBP locations for changes and alerts users.

## Overview

GBP Profile Protection monitors connected Google Business Profile locations for:
- **Google-suggested changes** - When Google recommends edits to your profile
- **Direct profile edits** - Changes made by owners, team members, or third parties

## Feature Availability

| Plan | Monitoring Frequency |
|------|---------------------|
| Grower | Not available |
| Builder | Daily at 8 AM UTC |
| Maven | Daily at 8 AM UTC |

## Database Schema

### Tables

#### `gbp_protection_settings`
Per-account settings for the protection feature.

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | UUID | Account (unique) |
| `enabled` | BOOLEAN | Feature enabled (default: true) |
| `protected_fields` | TEXT[] | Fields to monitor |
| `notification_frequency` | TEXT | 'immediate', 'daily', 'weekly' |

#### `gbp_location_snapshots`
Stored state of each monitored location for comparison.

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | UUID | Account |
| `location_id` | TEXT | Google location ID |
| `location_name` | TEXT | Display name |
| `title` | TEXT | Business name |
| `address` | JSONB | Address data |
| `phone` | TEXT | Phone number |
| `website` | TEXT | Website URL |
| `hours` | JSONB | Business hours |
| `description` | TEXT | Business description |
| `categories` | JSONB | Business categories |
| `snapshot_hash` | TEXT | MD5 hash for quick comparison |
| `snapshot_at` | TIMESTAMPTZ | When snapshot was taken |

#### `gbp_change_alerts`
Detected changes awaiting user action.

| Column | Type | Description |
|--------|------|-------------|
| `account_id` | UUID | Account |
| `location_id` | TEXT | Google location ID |
| `location_name` | TEXT | Display name |
| `field_changed` | TEXT | Which field changed |
| `old_value` | JSONB | Previous value |
| `new_value` | JSONB | New value |
| `change_source` | TEXT | 'google' or 'owner' |
| `status` | TEXT | 'pending', 'accepted', 'rejected' |
| `email_sent` | BOOLEAN | Email notification sent |
| `email_sent_at` | TIMESTAMPTZ | When email was sent |

### Unique Constraint

Prevents duplicate pending alerts:
```sql
CREATE UNIQUE INDEX idx_gbp_change_alerts_unique_pending
ON gbp_change_alerts(account_id, location_id, field_changed)
WHERE status = 'pending';
```

## Monitored Fields

Default fields monitored (configurable per account):
- `title` - Business Name
- `address` - Address
- `phone` - Phone Number
- `website` - Website
- `hours` - Business Hours
- `description` - Business Description
- `categories` - Business Categories

## How It Works

### 1. Cron Job Execution

The cron job (`/api/cron/monitor-gbp-changes`) runs daily at 8 AM UTC:

```
┌─────────────────────────────────────────────────────────┐
│  For each account with GBP connected + Builder/Maven:   │
├─────────────────────────────────────────────────────────┤
│  1. Check if protection is enabled                      │
│  2. Get selected locations                              │
│  3. For each location:                                  │
│     a. Fetch current data from Google API               │
│     b. Check for Google-suggested updates               │
│     c. Compare with stored snapshot                     │
│     d. If changes detected:                             │
│        - Create alert in gbp_change_alerts              │
│        - Create in-app notification                     │
│        - Send email (if enabled)                        │
│     e. Update snapshot                                  │
└─────────────────────────────────────────────────────────┘
```

### 2. Change Source Attribution

Changes are attributed per-field:

```typescript
// If Google has pending suggestions for this field, it's a Google change
const changeSource = googleSuggestedFields.has(change.field)
  ? 'google'
  : 'owner';
```

This means if Google suggests a phone number change AND the user changed the website, the phone alert shows "Google" and the website alert shows "Owner".

### 3. Notification Flow

```
Change Detected
      │
      ├──► Create gbp_change_alerts record
      │
      ├──► Create in-app notification (bell icon)
      │    └── Uses createGbpChangeNotification()
      │
      └──► Send email (if enabled)
           └── Uses sendGbpProtectionAlertEmail()
           └── Tracks email_sent per alert
```

## API Endpoints

### GET `/api/gbp-protection/alerts`

Fetch protection stats and alerts.

**Response:**
```json
{
  "stats": {
    "profileProtection": true,
    "accepted": 5,
    "rejected": 2,
    "pending": 1
  },
  "alerts": [...],
  "monitoredLocations": [
    { "location_id": "...", "location_name": "Main Office" }
  ]
}
```

### POST `/api/gbp-protection/alerts`

Accept or reject an alert.

**Request:**
```json
{
  "alertId": "uuid",
  "action": "accept" | "reject"
}
```

### GET/PUT `/api/gbp-protection/settings`

Manage protection settings.

## Email Notifications

Two different email templates based on change source:

### Google-Suggested Change
- **Subject:** "Google suggested a change to [Location]"
- **Color scheme:** Amber/orange
- **Message:** Explains Google detected potential inaccuracies

### Owner/Third-Party Change
- **Subject:** "Your business profile was changed"
- **Color scheme:** Blue
- **Message:** Explains someone edited the profile directly

## UI Components

### Protection Tab (`/dashboard/google-business?tab=protection`)

Shows:
- Protection status (enabled/disabled)
- Stats (pending, accepted, rejected in last 30 days)
- List of monitored locations
- Pending alerts with Accept/Reject actions

### Account Settings

Toggle for GBP Protection email notifications under notification preferences.

## Security Considerations

### Cron Job Authentication

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Account Isolation

All queries filter by `account_id` from `getRequestAccountId()`.

### Rate Limiting

Cron job processes accounts sequentially to avoid API rate limits with Google.

## Error Handling

### Notification Failures

```typescript
try {
  const notifResult = await createGbpChangeNotification(...);
  if (!notifResult.success) {
    console.error(`Failed to create notification:`, notifResult.error);
    totalNotificationErrors++;
  }
} catch (notifError) {
  console.error(`Exception creating notification:`, notifError);
  totalNotificationErrors++;
}
```

Notification failures don't break the cron job - they're logged and counted.

### Email Failures

Each alert tracks its own `email_sent` status. If an email fails, only that alert remains unmarked, and it won't be retried automatically.

### Duplicate Prevention

Uses upsert with `ON CONFLICT` to prevent duplicate alerts:

```typescript
await supabase.from('gbp_change_alerts').upsert({
  ...alertData
}, {
  onConflict: 'account_id,location_id,field_changed',
  ignoreDuplicates: true
});
```

## Cron Job Output

The cron job returns detailed stats:

```json
{
  "success": true,
  "summary": {
    "accountsProcessed": 50,
    "locationsChecked": 120,
    "changesDetected": 5,
    "emailsSent": 3,
    "notificationErrors": 0,
    "durationMs": 15432
  },
  "results": [
    {
      "accountId": "uuid",
      "plan": "builder",
      "locationsChecked": 2,
      "changesDetected": 1,
      "emailsSent": 1
    }
  ]
}
```

## Troubleshooting

### Changes not detected
1. Verify account has Builder or Maven plan
2. Check protection is enabled in settings
3. Verify locations are selected in `selected_gbp_locations`
4. Check GBP OAuth tokens aren't expired

### Emails not sending
1. Check `email_gbp_changes` preference is enabled
2. Check `notification_frequency` is 'immediate'
3. Verify Resend API is configured
4. Check `email_sent` on the alert record

### Duplicate alerts
1. Unique index should prevent duplicates
2. If seeing duplicates, check index exists:
   ```sql
   SELECT * FROM pg_indexes WHERE indexname = 'idx_gbp_change_alerts_unique_pending';
   ```

### Wrong change source
1. Change source is determined per-field based on Google's `diffMask`
2. If Google API doesn't return a diffMask, changes default to 'owner'
3. Check Google Business Profile API response for debugging
