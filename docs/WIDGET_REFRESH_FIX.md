# Widget Page Refresh Fix Documentation

## Problem Summary
Users were experiencing frequent page refreshes on the widget management page (`/dashboard/widget`), causing:
- Loss of typed content in forms
- PageCard component disappearing and reappearing
- Form data being cleared unexpectedly
- Frustrating user experience with lost work

## Root Causes Identified

### 1. Duplicate Widget Fetching
- `fetchWidgets()` was being called multiple times after CRUD operations
- Operations like `createWidget`, `updateWidget`, `deleteWidget` already trigger refresh internally
- Additional manual calls caused unnecessary re-renders

### 2. Auth Token Refresh Side Effects
- Token refreshes (every ~55 minutes) were triggering full component re-renders
- AUTH_TOKEN_REFRESHED events weren't properly isolated from UI updates
- Form state was being reset on token refresh

### 3. Missing Autosave Protection
- No autosave mechanism for widget review editing
- Character limit truncation (250 chars) would lose overflow text
- No visual indicators for over-limit content

## Solutions Implemented

### 1. Removed Duplicate fetchWidgets Calls

**Files Modified:**
- `/src/app/dashboard/widget/page.tsx`
- `/src/app/dashboard/widget/WidgetList.tsx`
- `/src/app/dashboard/widget/hooks/useWidgets.ts`

**Changes:**
```typescript
// Before - duplicate calls
const handleSaveDesign = async () => {
  await saveWidgetDesign(selectedWidget.id, design);
  fetchWidgets(); // Redundant - saveWidgetDesign already fetches
};

// After - no duplicate
const handleSaveDesign = async () => {
  await saveWidgetDesign(selectedWidget.id, design);
  // Don't call fetchWidgets - saveWidgetDesign already does it internally
};
```

### 2. Smart Autosave with Over-Limit Text Preservation

**File:** `/src/app/dashboard/widget/components/ReviewManagementModal.tsx`

**Features:**
- Preserves full text even when over 250 character limit
- Stores in localStorage with versioning
- Debounced save (1 second delay)
- Restores on component mount

**Implementation:**
```typescript
const dataToSave = {
  editedReviews,  // Full text preserved, even if over 250 chars
  editedNames,
  editedRoles,
  editedRatings,
  timestamp: Date.now(),
  widgetId,
  version: 2  // Versioning for future compatibility
};
localStorage.setItem(formStorageKey, JSON.stringify(dataToSave));
```

### 3. Visual Indicators for Over-Limit Content

**Visual Changes:**
- Yellow border and background when text exceeds 250 characters
- Warning icon with message "Text will be truncated when saved"
- Character counter changes color (gray → yellow) when over limit

**Code Example:**
```jsx
<textarea
  value={editedReviews[review.review_id] || ""}
  onChange={(e) => handleReviewEdit(review.review_id, e.target.value)}
  className={`w-full p-2 border rounded-md ${
    (editedReviews[review.review_id] || "").length > 250
      ? 'border-yellow-500 bg-yellow-50'
      : 'border-gray-300'
  }`}
/>
```

### 4. Auth Token Refresh Isolation

**File:** `/src/auth/context/CoreAuthContext.tsx`

**Fix:**
```typescript
if (event === 'TOKEN_REFRESHED') {
  // Pure token refresh - update session silently without re-renders
  if (newSession?.user?.id === user?.id) {
    setSession(prev => {
      // Only update if access token actually changed
      if (prev?.access_token !== newSession.access_token) {
        return newSession;
      }
      return prev;
    });
    return; // Skip all other updates
  }
}
```

### 5. Refresh Prevention Monitoring

**New File:** `/src/app/dashboard/widget/hooks/useRefreshPrevention.ts`

**Purpose:**
- Detects and logs rapid re-renders
- Monitors location changes
- Helps identify sources of unexpected refreshes
- Development tool for debugging

**Usage:**
```typescript
export default function WidgetPage() {
  // Use refresh prevention hook
  useRefreshPrevention('WidgetPage');
  // ... rest of component
}
```

## Testing Guidelines

### 1. Verify No Data Loss
- Fill out review editing form with > 250 characters
- Wait for autosave indicator
- Refresh page manually
- Verify full text is restored (not truncated)

### 2. Check Visual Indicators
- Type more than 250 characters in review textarea
- Verify yellow border appears
- Verify warning message shows
- Verify character counter turns yellow

### 3. Monitor for Refreshes
- Open browser console
- Work on widget page for 5+ minutes
- Look for refresh prevention logs
- Should see minimal re-renders

### 4. Test Token Refresh
- Work on widget page for ~55 minutes
- Monitor for TOKEN_REFRESHED events in console
- Verify forms don't clear
- Verify PageCard doesn't disappear

## Monitoring

### Console Logs to Watch
```javascript
// Normal operation
"📝 Restored widget design from localStorage"
"💾 Auto-saved widget design to localStorage"

// Potential issues
"⚠️ RAPID RE-RENDER DETECTED in WidgetPage!"
"🔄 WidgetPage has rendered X times"
"🌐 Location changed in WidgetPage"
```

## Rollback Plan

If issues arise, revert these commits:
1. `b55e04ff` - Visual indicators and refresh prevention
2. `1e8356db` - Remove duplicate fetchWidgets calls
3. `54ac3fef` - Smart autosave implementation

## Future Improvements

1. **Persist to Database**: Consider saving drafts to database instead of localStorage
2. **Conflict Resolution**: Add UI for handling conflicts when autosave and manual save differ
3. **Undo/Redo**: Implement undo/redo functionality for review edits
4. **Real-time Sync**: Add WebSocket support for real-time collaboration

## Related Files

- `/src/auth/context/CoreAuthContext.tsx` - Auth token refresh handling
- `/src/app/dashboard/widget/page.tsx` - Main widget page component
- `/src/app/dashboard/widget/components/ReviewManagementModal.tsx` - Review editing with autosave
- `/src/app/dashboard/widget/hooks/useWidgets.ts` - Widget data fetching hook
- `/src/app/dashboard/widget/hooks/useRefreshPrevention.ts` - Refresh monitoring

## Support

If users continue experiencing refresh issues:
1. Check browser console for refresh prevention logs
2. Clear localStorage: `localStorage.clear()`
3. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Report issue with console logs to development team