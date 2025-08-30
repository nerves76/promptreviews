# Automatic Page Refresh Issue

## Issue Description
The application automatically refreshes/reloads pages on a timer, approximately every 55 minutes, without any user interaction. This happens across all dashboard pages.

## Current Status
**ACTIVE ISSUE** - Under investigation (as of August 2025)

## Symptoms
- Page completely reloads without warning
- Happens on all pages (dashboard, team, business profile, etc.)
- Occurs approximately every 55 minutes
- No user interaction triggers it
- Form data may be lost if not auto-saved

## Suspected Cause
The timing (~55 minutes) strongly suggests this is related to the Supabase auth token refresh cycle. Supabase tokens expire after 1 hour, and the system attempts to refresh them proactively about 5 minutes before expiry.

## Debugging Tools Deployed

### RefreshDebugger Component
Added to track all potential refresh triggers with stack traces.

### Console Commands Available
```javascript
// Show report of suspicious events
refreshDebugReport()

// Clear debug history
clearRefreshDebug()

// Show global refresh monitor report
refreshReport()
```

### What to Look For
When the refresh happens, check the console for:
1. Red error messages: "⚠️ REFRESH DETECTED!"
2. Stack traces showing the source
3. Events logged just before the refresh

## Workarounds

### For Users
1. **Save work frequently** - Use Ctrl/Cmd+S when possible
2. **Autosave is active** on most forms (widget editor, business profile)
3. **Be aware of the timing** - Refreshes happen roughly every 55 minutes

### For Developers
1. Implement autosave on any new forms
2. Use localStorage to persist form state
3. Add visual indicators when autosave is active

## Investigation Log

### Components Checked
- ✅ TokenManager (`/src/auth/services/TokenManager.ts`) - Schedules proactive refreshes
- ✅ CoreAuthContext - Configured to ignore TOKEN_REFRESHED events
- ✅ AccountSelection hooks - Has reload protection for widget page
- ✅ Old AuthContext files - Not in use, not imported anywhere

### Potential Culprits
1. **TokenManager proactive refresh** - May be triggering unintended side effects
2. **Supabase auth library** - Internal refresh mechanism may be forcing reload
3. **Unknown auth event handler** - Some component may be listening to auth changes

## Code Locations

### Key Files
- `/src/auth/services/TokenManager.ts` - Token refresh scheduling
- `/src/auth/context/CoreAuthContext.tsx` - Main auth context
- `/src/utils/accountSelectionHooks.ts` - Account switching logic
- `/src/app/(app)/components/RefreshDebugger.tsx` - Debug tracking
- `/src/app/(app)/components/GlobalRefreshMonitor.tsx` - Global refresh monitoring

### Token Refresh Logic
```typescript
// TokenManager.ts - Line 100-107
const expiresIn = (expiresAt * 1000) - Date.now();
const refreshIn = Math.max(expiresIn - (5 * 60 * 1000), 10000); // 5 min buffer

this.refreshTimer = setTimeout(() => {
  this.refreshTokenProactively();
}, refreshIn);
```

## Next Steps

1. **Monitor with RefreshDebugger** - Wait for next refresh, capture debug output
2. **Check Supabase version** - May be a known issue in the auth library
3. **Test disabling proactive refresh** - Temporarily disable TokenManager refresh
4. **Add more granular logging** - Track exact auth event sequence
5. **Consider session storage** - Move from localStorage to sessionStorage for persistence

## Related Issues
- [Widget Page Refresh Fix](/docs/WIDGET_REFRESH_FIX.md) - Previous refresh issue (resolved)

## Support
If users report data loss due to refreshes:
1. Check if autosave was active for that form
2. Look for data in localStorage: `localStorage.getItem('formStorageKey')`
3. Check RefreshDebugger output: `refreshDebugReport()`
4. File detailed bug report with console logs