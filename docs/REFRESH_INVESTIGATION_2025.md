# Automatic Refresh Investigation - January 2025

## Issue Description
The application experiences unexpected automatic page refreshes that occur more frequently than the documented 55-minute auth token refresh cycle. Traditional logging approaches have failed to identify the root cause.

## Investigation Findings

### Identified Refresh Mechanisms

#### 1. Timer-Based Systems (Most Likely Culprits)

**5-Minute Session Check Interval**
- **Location**: `/src/auth/context/CoreAuthContext.tsx:343`
- **Frequency**: Every 5 minutes
- **Purpose**: Validates session and auto-refreshes if expiring soon
- **Impact**: Most frequent automatic trigger in the system

**Token Manager Proactive Refresh**
- **Location**: `/src/auth/services/TokenManager.ts:86-104`
- **Frequency**: ~55 minutes (5 minutes before token expiry)
- **Purpose**: Refreshes auth tokens before they expire
- **Impact**: Aligns with documented 55-minute refresh issue

**Global Refresh Monitor**
- **Location**: `/src/app/(app)/components/GlobalRefreshMonitor.tsx:79-88`
- **Frequency**: Every 500ms
- **Purpose**: Monitors location changes for debugging
- **Impact**: Could detect false positives or cause performance issues

#### 2. Event-Triggered Refreshes

**Account Switching**
- **Location**: `/src/utils/accountSelectionHooks.ts:189`
- **Trigger**: Account selection change
- **Action**: Forces `window.location.reload()` except on widget pages
- **Impact**: Could be triggered inadvertently by state changes

**Error Boundaries**
- **Locations**: 
  - `/src/components/ErrorBoundary.tsx:90`
  - `/src/app/(app)/dashboard/widget/components/ErrorBoundary.tsx:97`
- **Trigger**: Unhandled React errors
- **Action**: Provides refresh button or auto-refresh
- **Impact**: Silent errors could trigger unexpected refreshes

**Auth State Changes**
- **Location**: `/src/auth/context/CoreAuthContext.tsx:284-340`
- **Triggers**: SIGNED_OUT, PASSWORD_RECOVERY events
- **Action**: Router navigation which may feel like refresh
- **Impact**: Auth events could cascade into refreshes

#### 3. Dashboard-Specific Refreshes

Multiple dashboard pages contain refresh logic:
- Dashboard main page: Session refresh failure reload
- Account page: Account update reload
- Business creation: Error recovery reload
- Plan page: Plan change reload
- Style modal: Style update reload

### System Interactions

The investigation revealed **three competing timer systems** that could interact unexpectedly:

1. **TokenManager** (~55 minutes) - Token refresh
2. **CoreAuthContext** (5 minutes) - Session validation
3. **GlobalRefreshMonitor** (500ms) - Location monitoring

These timers could create cascading effects where one timer triggers changes detected by another, leading to unexpected refresh patterns.

### Pattern Analysis

Based on the investigation, the refresh pattern likely follows this sequence:

1. 5-minute session check fires
2. Session check detects token needs refresh soon
3. Token refresh triggers TOKEN_REFRESHED event
4. Despite attempts to isolate, some component reacts to the event
5. State change triggers location change
6. Location change detected by monitor
7. Cascade results in page refresh

## Debugging Tools Deployed

### UltimateRefreshDebugger
A comprehensive debugging tool has been deployed that:
- Intercepts ALL timer and interval creation
- Tracks auth events and state changes
- Monitors location.reload() calls with stack traces
- Persists refresh history across page loads
- Provides pattern analysis tools

### Console Commands Available

```javascript
// Analyze refresh patterns and timing
ultimateDebug()

// View historical refresh events
refreshHistory()

// Clear refresh history
clearRefreshHistory()

// Existing debug commands
refreshReport()        // Global refresh monitor report
refreshDebugReport()   // Suspicious event report
clearRefreshDebug()    // Clear debug history
```

## Recommendations

### Immediate Actions

1. **Monitor with New Debugger**: Run the application with UltimateRefreshDebugger active and capture the exact trigger when refresh occurs.

2. **Review Timer Interactions**: The 5-minute session check is the most frequent timer and should be investigated first.

3. **Check Error Boundaries**: Silent errors in production could be triggering error boundary refreshes.

### Potential Fixes

1. **Reduce Session Check Frequency**: Consider increasing the 5-minute interval to 15-30 minutes.

2. **Improve TOKEN_REFRESHED Isolation**: Ensure no components are reacting to TOKEN_REFRESHED events.

3. **Remove Location Monitor in Production**: The 500ms location check should only run in development.

4. **Add Refresh Throttling**: Implement a mechanism to prevent rapid successive refreshes.

5. **Centralize Refresh Logic**: Create a single refresh manager to coordinate all refresh triggers.

## Files Modified

- `/src/app/(app)/components/UltimateRefreshDebugger.tsx` - New comprehensive debugging tool
- `/src/app/(app)/layout.tsx` - Added UltimateRefreshDebugger to root layout

## Next Steps

1. Deploy changes to affected environment
2. Wait for refresh to occur (should happen within 5-10 minutes based on session check interval)
3. Run `ultimateDebug()` immediately after refresh
4. Analyze the output to identify exact trigger
5. Implement targeted fix based on findings

## Related Issues

- Previous 55-minute refresh issue documented in `/docs/AUTOMATIC_REFRESH_ISSUE.md`
- Widget refresh fix documented in `/docs/WIDGET_REFRESH_FIX.md`
- Auth system documentation in `/AUTH_SYSTEM_DOCUMENTATION.md`