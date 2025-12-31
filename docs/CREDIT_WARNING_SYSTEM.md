# Credit Warning System

## Status: IMPLEMENTED (December 2024)

This document describes the credit warning notification system that alerts users when their credit balance is low or when scheduled checks are skipped due to insufficient credits.

## Overview

The credit warning system provides three types of notifications:

| Notification Type | Trigger | Delivery |
|-------------------|---------|----------|
| `credit_balance_low` | Balance < 20% of (monthly + purchased) credits | In-app + Email |
| `credit_warning_upcoming` | Scheduled check in next 24h needs more credits than available | In-app + Email |
| `credit_check_skipped` | Scheduled check was skipped due to insufficient credits | In-app + Email |

All notifications:
- Appear in the bell icon (in-app notifications)
- Send email if user has `email_credit_warnings` preference enabled
- Include a "Buy Credits" action button

## Low Balance Warning (`credit_balance_low`)

### Trigger Logic
- Runs via daily cron (`/api/cron/send-credit-warnings`)
- Calculates threshold as 20% of (monthly allocation + purchased credits)
- Only triggers if current balance is below threshold
- Maximum 2 warnings per billing period (tracked via `accounts.low_balance_warning_count`)
- Skips free accounts (they have 0 monthly credits)
- Counter resets when monthly credits are granted

### Threshold Calculation
```typescript
// Get monthly credits for the account's tier
const monthlyCredits = getTierCredits(account.plan); // 0, 100, 200, or 400

// Base amount = monthly allocation + purchased credits
// This way users who just bought credits have a proportionally higher threshold
const baseAmount = monthlyCredits + balance.purchasedCredits;

// Skip if no credits to track (free plan with no purchases)
if (baseAmount === 0) continue;

// Threshold is 20% of base amount
const threshold = Math.floor(baseAmount * 0.20);
```

### Example Scenarios
| Plan | Monthly Credits | Purchased | Total | Threshold (20%) | Warning if balance < |
|------|-----------------|-----------|-------|-----------------|---------------------|
| Free | 0 | 0 | 0 | N/A | Never warned |
| Free | 0 | 200 | 200 | 40 | 40 credits |
| Grower | 100 | 0 | 100 | 20 | 20 credits |
| Builder | 200 | 500 | 700 | 140 | 140 credits |
| Maven | 400 | 1000 | 1400 | 280 | 280 credits |

## Upcoming Check Warning (`credit_warning_upcoming`)

### Trigger Logic
- Runs via daily cron (`/api/cron/send-credit-warnings`)
- Checks all scheduled features in the next 24 hours
- Warns if account doesn't have enough credits for the scheduled check
- One warning per feature type per day (avoids spam)

### Supported Features
| Feature | Schedule Source | Credit Calculation |
|---------|-----------------|-------------------|
| Geo Grid | `geo_grid_configs.frequency` | `10 + cells + (keywords * 2)` |
| Rank Tracking | `rank_keyword_groups.check_frequency` | `keywordCount * 2` |
| LLM Visibility | `llm_visibility_configs.check_frequency` | `prompts * 3` |
| Concept Schedule | `concept_schedules.frequency` | Sum of all concepts |
| Backlinks | `backlink_domains.check_frequency` | 25 credits (full check) |

## Skip Notification (`credit_check_skipped`)

### Trigger Logic
- Triggered immediately when a scheduled check fails due to insufficient credits
- Sent from each cron job that runs scheduled checks
- Includes the feature name, required credits, and available credits

### Feature-Aware Messages
Each skip notification shows the correct feature name:

| Feature Key | Display Name |
|-------------|--------------|
| `geo_grid` | Local Ranking Grid |
| `rank_tracking` | Rank Tracking |
| `llm_visibility` | LLM Visibility |
| `concept_schedule` | Concept Schedule |
| `backlinks` | Backlink Check |

## Implementation Details

### Database Schema

```sql
-- Tracking warning count per billing period
ALTER TABLE accounts ADD COLUMN low_balance_warning_count INTEGER DEFAULT 0;
```

### Email Templates
Three templates in `email_templates` table:
- `credit_balance_low` - Low balance warning
- `credit_warning_upcoming` - Upcoming check warning (uses `{{featureName}}`)
- `credit_check_skipped` - Check skipped notification (uses `{{featureName}}`)

### Notification Registry
All notification types are registered in `/src/utils/notifications.ts`:

```typescript
export type NotificationType =
  | 'credit_balance_low'
  | 'credit_warning_upcoming'
  | 'credit_check_skipped'
  | // ... other types

const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  'credit_balance_low': {
    inAppPrefField: 'in_app_credit_warnings',
    emailPrefField: 'email_credit_warnings',
    getTitle: () => 'Credit balance low',
    getMessage: (data) => `Your credit balance (${data.available} credits) is running low...`,
    actionUrl: '/dashboard/credits',
    actionLabel: 'Buy Credits',
    // ...
  },
  // ...
};
```

### Cron Jobs

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/send-credit-warnings` | Daily | Send low balance + upcoming warnings |
| `/api/cron/refresh-monthly-credits` | Monthly | Grant credits + reset warning count |
| `/api/cron/run-scheduled-geogrids` | Every 15 min | Run geo-grid checks (sends skip notifications) |
| `/api/cron/run-scheduled-rank-checks` | Every 15 min | Run rank checks (sends skip notifications) |
| `/api/cron/run-scheduled-llm-checks` | Every 15 min | Run LLM checks (sends skip notifications) |
| `/api/cron/run-scheduled-concepts` | Every 15 min | Run concept checks (sends skip notifications) |
| `/api/cron/run-scheduled-backlink-checks` | Every 15 min | Run backlink checks (sends skip notifications) |

## Files Modified/Created

### New Migrations
- `20260130000000_add_credit_balance_low_email_template.sql` - Email templates
- `20260130000001_add_low_balance_warning_count.sql` - Warning count column

### Modified Files
| File | Changes |
|------|---------|
| `/src/utils/notifications.ts` | Added `credit_balance_low` type, made existing types feature-aware |
| `/src/app/(app)/api/cron/send-credit-warnings/route.ts` | Complete rewrite to check all features + low balance |
| `/src/app/(app)/api/cron/refresh-monthly-credits/route.ts` | Reset `low_balance_warning_count` on credit grant |
| `/src/app/(app)/api/cron/run-scheduled-geogrids/route.ts` | Added `feature: 'geo_grid'` to skip notification |
| `/src/app/(app)/api/cron/run-scheduled-concepts/route.ts` | Fixed key from `scheduleType` to `feature` |
| `/src/app/(app)/api/cron/run-scheduled-backlink-checks/route.ts` | Added missing skip notification |

## Testing Checklist

### Low Balance Warning
- [ ] Triggers when balance < 20% of (monthly + purchased)
- [ ] Maximum 2 warnings per billing period
- [ ] Counter resets when monthly credits are granted
- [ ] Free accounts with no purchases are skipped
- [ ] Email sent if preference enabled
- [ ] In-app notification appears in bell icon

### Feature-Specific Skip Notifications
- [ ] Geo-grid skip shows "Local Ranking Grid Check Skipped"
- [ ] Rank tracking skip shows "Rank Tracking Check Skipped"
- [ ] LLM visibility skip shows "LLM Visibility Check Skipped"
- [ ] Concept schedule skip shows "Concept Schedule Check Skipped"
- [ ] Backlinks skip shows "Backlink Check Skipped"
- [ ] Email includes correct feature name

### Upcoming Warning Coverage
- [ ] Geo-grid checks warned 24h ahead
- [ ] Rank tracking checks warned 24h ahead
- [ ] LLM visibility checks warned 24h ahead
- [ ] Concept schedule checks warned 24h ahead
- [ ] Backlink checks warned 24h ahead

## User Preferences

Users can control credit warning notifications via their notification preferences:
- `in_app_credit_warnings` - Show in bell icon
- `email_credit_warnings` - Send email notifications

These preferences are checked by `sendNotificationToAccount()` before sending.
