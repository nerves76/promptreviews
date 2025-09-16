# Google Business Profile Location Selection & Limits

## Overview
This document describes the Google Business Profile (GBP) location selection system that allows agencies and businesses to manage multiple locations within plan-based limits.

## Features

### 1. Location Selection Modal
- Appears after OAuth connection when multiple GBP locations are detected
- Allows users to select which locations to manage in PromptReviews
- Enforces plan-based limits with clear visual feedback
- Search functionality for finding specific locations
- "Select all" and "Clear all" quick actions

### 2. Plan-Based Limits
Default limits by plan:
- **Grower**: 0 locations (no GBP access)
- **Builder**: 5 locations
- **Maven**: 10 locations

### 3. Database-Configurable Limits
The `max_gbp_locations` column in the accounts table allows per-account overrides:

```sql
-- View current limit for an account
SELECT id, plan, max_gbp_locations FROM accounts WHERE id = 'account_id';

-- Update limit for specific account (e.g., for agencies)
UPDATE accounts SET max_gbp_locations = 50 WHERE id = 'account_id';

-- Reset to plan defaults
UPDATE accounts 
SET max_gbp_locations = CASE 
    WHEN plan = 'maven' THEN 10
    WHEN plan = 'builder' THEN 5
    ELSE 0
END
WHERE id = 'account_id';
```

## Implementation Details

### Database Schema

#### accounts table
- `max_gbp_locations` (INTEGER): Maximum allowed GBP locations
  - Can override plan defaults
  - Works like `max_prompt_pages` and `max_contacts`

#### selected_gbp_locations table (future)
```sql
CREATE TABLE selected_gbp_locations (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES auth.users(id),
  location_id TEXT NOT NULL,
  location_name TEXT,
  address TEXT,
  include_in_insights BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### POST `/api/social-posting/platforms/google-business-profile/save-selected-locations`
Saves selected GBP locations for an account.

**Request Body:**
```json
{
  "locations": [
    {
      "id": "locations/123456",
      "name": "Business Name",
      "address": "123 Main St"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully saved 3 selected locations",
  "count": 3,
  "maxAllowed": 5
}
```

**Error Response (limit exceeded):**
```json
{
  "error": "Plan limit exceeded. Your builder plan allows up to 5 locations.",
  "maxAllowed": 5,
  "requested": 7
}
```

### Components

#### LocationSelectionModal
- Path: `/src/components/GoogleBusinessProfile/LocationSelectionModal.tsx`
- Props:
  - `locations`: Array of available GBP locations
  - `planLimit`: Maximum allowed locations
  - `planName`: Current plan name
  - `onConfirm`: Callback with selected location IDs
  - `onCancel`: Cancel callback
  - `isLoading`: Loading state

## User Experience

### For Standard Users (1-5 locations)
1. Connect Google Business Profile
2. Locations auto-fetch
3. If multiple locations, selection modal appears
4. Select desired locations within plan limit
5. Confirm selection

### For Agencies (many locations)
1. Connect Google Business Profile with agency account
2. System fetches all accessible locations
3. Selection modal shows all locations with plan limit
4. Search/filter to find specific client locations
5. Select up to plan limit (or custom limit if set)
6. Can change selection anytime via "Change Locations" button

### Account Settings Integration
- New toggle: "Monthly GBP insights"
- Controls whether account receives monthly GBP performance emails
- Located in Account Settings page

## Admin Management

### Viewing Account Limits
```sql
-- See all accounts with custom GBP limits
SELECT 
  id, 
  plan, 
  max_gbp_locations,
  max_prompt_pages,
  max_contacts
FROM accounts
WHERE max_gbp_locations IS NOT NULL
ORDER BY max_gbp_locations DESC;
```

### Updating Limits
Use the script at `/scripts/update-gbp-limits.sql` for examples.

### Common Scenarios

#### Agency needs more locations
```sql
-- Agency with 50 client locations
UPDATE accounts 
SET max_gbp_locations = 50 
WHERE id = 'agency_account_id';
```

#### Temporary increase for migration
```sql
-- Temporary increase for data migration
UPDATE accounts 
SET max_gbp_locations = 100 
WHERE id = 'account_id';

-- Reset after migration
UPDATE accounts 
SET max_gbp_locations = 10 
WHERE id = 'account_id';
```

## Technical Notes

### Caching
- Selected locations stored in localStorage for persistence
- Cleared on disconnect
- Refreshed on location change

### Error Handling
- 401: Re-authentication required
- 403: Permission issues with GBP API
- 429: Rate limiting (shows countdown)
- 404: Location not found

### Performance
- Location fetching done in parallel
- Selection modal uses virtual scrolling for large lists (future)
- Debounced search with 300ms delay

## Migration Path

### From Unlimited to Limited
1. Existing users with connected GBP maintain all current locations
2. On next interaction, prompted to select within new limits
3. Admin can increase limits for affected accounts

### Plan Upgrades
1. User upgrades from Builder (5) to Maven (10)
2. Can immediately select 5 additional locations
3. No data loss, just expanded selection

## Future Enhancements

1. **Bulk Operations**
   - Select locations by state/region
   - Group selection by franchise

2. **Location Groups**
   - Create named groups of locations
   - Quick switch between groups

3. **Usage Analytics**
   - Track which locations are most active
   - Suggest optimal location selection

4. **API Improvements**
   - Webhook for location changes
   - Bulk location import/export

## Troubleshooting

### "TypeError: Cannot read properties of undefined"
- Issue: Caching problem with LocationSelectionModal
- Solution: Hard refresh browser (Cmd+Shift+R)
- Alternative: Use LocationSelectionModalV2 component

### Review count showing "247"
- Issue: Error line number displayed as review count
- Solution: Fixed in latest update, shows 0 for unverified businesses

### Locations not saving
- Check if `selected_gbp_locations` table exists
- Verify account has proper plan limits
- Check browser console for API errors

## Related Documentation
- [Google Business Profile API](https://developers.google.com/my-business)
- [Account Limits System](./ACCOUNT_LIMITS.md)
- [Billing System Update](./BILLING_SYSTEM_UPDATE_2024.md)