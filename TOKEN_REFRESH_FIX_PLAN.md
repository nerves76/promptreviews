# Token Refresh Cascading Fix Plan

## Problem Analysis

The TOKEN_REFRESHED event from Supabase auth causes cascading re-renders throughout the application:

1. **Root Cause**: Token refreshes every ~55 minutes trigger auth state changes
2. **Cascade Effect**: 
   - CoreAuthContext updates → triggers all dependent contexts
   - AccountContext re-renders → triggers account-dependent components
   - BusinessContext re-renders → triggers business-dependent components
   - All pages using these contexts unmount/remount components
   - Users lose form data, modal states, and work in progress

## Current Architecture Issues

```
TOKEN_REFRESHED event
    ↓
CoreAuthContext (updates session)
    ↓
AccountContext (re-renders)
    ↓
BusinessContext (re-renders)
    ↓
All consuming components (unmount/remount)
```

## Solution Strategy

### Phase 1: Token Isolation (Priority: HIGH)
**Goal**: Separate token management from UI state

1. **Create TokenManager** - A non-React service that handles tokens
   ```typescript
   // src/auth/services/TokenManager.ts
   class TokenManager {
     private token: string | null = null;
     private refreshTimer: NodeJS.Timeout | null = null;
     
     // Silently refresh tokens without triggering React updates
     async silentRefresh() { ... }
     
     // Get current token for API calls
     getAccessToken() { ... }
   }
   ```

2. **Update CoreAuthContext** to ignore TOKEN_REFRESHED for UI
   - Already partially done, but needs strengthening
   - Only update React state for actual user changes

### Phase 2: Memoization Strategy (Priority: HIGH)
**Goal**: Prevent unnecessary re-renders

1. **Memoize Context Values**
   ```typescript
   const contextValue = useMemo(() => ({
     user,
     session,
     // other values
   }), [user?.id, session?.user?.id]); // Only essential deps
   ```

2. **Use Stable References**
   - Replace inline objects with useRef for non-changing data
   - Use useCallback for all context methods

3. **Split Read/Write Contexts**
   ```typescript
   // Separate contexts for data and actions
   const AuthDataContext = createContext(data);
   const AuthActionsContext = createContext(actions);
   ```

### Phase 3: Component Optimization (Priority: MEDIUM)
**Goal**: Make components resilient to context changes

1. **Selective Subscriptions**
   ```typescript
   // Instead of using the whole context
   const { user, session } = useAuth();
   
   // Use specific hooks
   const user = useAuthUser();
   const session = useAuthSession();
   ```

2. **Local State Management**
   - Use localStorage for form persistence (already done for some)
   - Implement autosave for all critical forms

### Phase 4: Event-Based Updates (Priority: LOW)
**Goal**: Use events instead of context for some updates

1. **Create Event Emitter**
   ```typescript
   // For non-UI updates like token refreshes
   const authEvents = new EventEmitter();
   authEvents.on('token-refreshed', updateLocalToken);
   ```

2. **API Client Integration**
   - Update API clients to get tokens from TokenManager
   - Remove token dependencies from React components

## Implementation Steps

### Step 1: Create Token Manager (Week 1)
- [ ] Create TokenManager service
- [ ] Integrate with Supabase client
- [ ] Update API calls to use TokenManager

### Step 2: Update CoreAuthContext (Week 1)
- [ ] Strengthen TOKEN_REFRESHED handling
- [ ] Add better session comparison
- [ ] Memoize context value

### Step 3: Optimize Other Contexts (Week 2)
- [ ] Memoize AccountContext
- [ ] Memoize BusinessContext
- [ ] Add stable references

### Step 4: Create Granular Hooks (Week 2)
- [ ] useAuthUser()
- [ ] useAuthSession()
- [ ] useAccount()
- [ ] useBusiness()

### Step 5: Update Critical Pages (Week 3)
- [ ] Widget page
- [ ] Dashboard
- [ ] Business profile
- [ ] Review management

## Testing Plan

1. **Token Refresh Testing**
   - Set token expiry to 1 minute for testing
   - Monitor component re-renders
   - Verify form data persistence

2. **Performance Metrics**
   - Measure render counts before/after
   - Check memory usage
   - Monitor network requests

3. **User Experience Testing**
   - Test form persistence during token refresh
   - Verify modal states are maintained
   - Check for UI flickers

## Success Criteria

- [ ] Zero component unmounts on TOKEN_REFRESHED
- [ ] Form data persists through token refreshes
- [ ] No UI flickers during token updates
- [ ] Reduced render count by >50%
- [ ] All autosave features working

## Rollback Plan

If issues arise:
1. Keep old auth system in parallel
2. Use feature flags to toggle between systems
3. Gradual rollout by user percentage

## Timeline

- **Week 1**: Token isolation and CoreAuth updates
- **Week 2**: Context optimization and granular hooks
- **Week 3**: Page updates and testing
- **Week 4**: Monitoring and refinement

## Notes

- The current partial fix in CoreAuthContext (lines 269-280) is a good start
- SharedAccountState pattern could be extended for other shared state
- Consider using React Query or SWR for data fetching to reduce context dependencies