# Google Business Profile Integration Fixes

## Overview
This document details the critical fixes applied to the Google Business Profile integration on 2025-08-12. These fixes address authentication issues, UI bugs, and improve overall reliability.

## Critical Issues Fixed

### 1. TypeError: Cannot read properties of undefined (reading 'replace')
**Problem:** When selecting a business from the dropdown, the app would crash with a TypeError.

**Root Cause:** The `location.id` field was undefined when trying to call `.replace()` method.

**Solution:**
- Added null checks before calling string methods on `location.id`
- Implemented fallback ID generation: `location-${Date.now()}-${Math.random()}`
- Added proper data transformation validation

**Files Modified:**
- `src/app/dashboard/google-business/page.tsx` (lines 554, 2180)

### 2. Disconnect Functionality Not Working
**Problem:** Clicking disconnect would appear to work but the user remained connected.

**Root Cause:** 
- Disconnect API was using service role client to delete tokens
- Platforms API was using regular client with RLS policies
- Potential caching of connection state

**Solution:**
- Added cache-busting to platforms API calls with timestamp parameter
- Increased delay before reloading platforms from 1.5s to 2s
- Clear loading ref to ensure loadPlatforms can run after disconnect
- Added `cache: 'no-store'` header to fetch requests

**Files Modified:**
- `src/app/dashboard/google-business/page.tsx` (lines 509-513, 803-810)
- `src/app/api/social-posting/platforms/google-business-profile/disconnect/route.ts`

### 3. Business Selector Dropdown Issues

#### 3a. Business Names Not Showing
**Problem:** Dropdown only showed addresses, not business names.

**Root Cause:** Data transformation was looking for correct fields (`location_name`) but display logic needed adjustment.

**Solution:**
- Enhanced data transformation with better logging
- Improved display logic with proper fallbacks
- Added JSON stringification for debugging

#### 3b. All Businesses Selected When Clicking One
**Problem:** Selecting one checkbox would select all businesses.

**Root Cause:** Using `<label>` wrapper was causing event bubbling issues.

**Solution:**
- Changed from `<label>` to `<div>` wrapper
- Added duplicate prevention logic
- Removed unnecessary event propagation handlers

**Files Modified:**
- `src/app/dashboard/google-business/page.tsx` (lines 2161-2213)

### 4. Confusing Status Badges
**Problem:** Red/yellow/green status badges showing "active", "pending", etc. were misleading.

**Root Cause:** Database `status` field defaults to 'UNKNOWN' and isn't populated with actual Google Business Profile verification status.

**Solution:**
- Removed all status badge displays from:
  - Main business selector dropdown
  - PhotoManagement component
  - LocationSelector component (overview page)
- Made status field optional in TypeScript interfaces

**Files Modified:**
- `src/app/dashboard/google-business/page.tsx`
- `src/app/components/PhotoManagement.tsx`
- `src/components/GoogleBusinessProfile/LocationSelector.tsx`

### 5. Incorrect Tab Naming
**Problem:** Photos tab was labeled "Respond to Reviews".

**Solution:**
- Renamed all references from `respond-reviews` to `photos`
- Updated tab labels and navigation

## Testing Checklist

After these fixes, verify:

- [ ] Can select businesses from dropdown without errors
- [ ] Business names display correctly
- [ ] Businesses without addresses show properly
- [ ] Can select/deselect individual businesses without affecting others
- [ ] Disconnect functionality works and UI updates immediately
- [ ] No confusing status badges appear
- [ ] Photos tab is correctly labeled

## Database Considerations

The `google_business_locations` table has a `status` field that defaults to 'UNKNOWN'. This field appears intended for Google's business verification status but isn't being populated. Consider either:
1. Implementing proper status fetching from Google's API
2. Removing the field entirely if not needed

## Future Improvements

1. **Status Field**: Either populate with real Google verification status or remove entirely
2. **Error Recovery**: Add retry logic for failed API calls
3. **Loading States**: Improve loading indicators during disconnect/reconnect
4. **Data Validation**: Add schema validation for API responses
5. **Caching Strategy**: Implement proper cache invalidation strategy

## Related Files

- `/src/app/dashboard/google-business/page.tsx` - Main dashboard component
- `/src/app/api/social-posting/platforms/route.ts` - Platforms API endpoint
- `/src/app/api/social-posting/platforms/google-business-profile/disconnect/route.ts` - Disconnect endpoint
- `/src/components/GoogleBusinessProfile/LocationSelector.tsx` - Location selector component
- `/src/app/components/PhotoManagement.tsx` - Photo management component

## Migration Reference

Database schema defined in:
- `supabase/migrations/0121_create_google_business_profile_tables.sql`

## Support Notes

If users report continued issues:
1. Check browser console for transformation logs
2. Verify database tokens are properly deleted after disconnect
3. Check for any cached authentication state in localStorage
4. Ensure the Supabase session tokens are healthy (clear `sb-*` cookies/localStorage and re-authenticate if needed)
