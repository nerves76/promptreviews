# Multi-Account Authentication Issues - Developer Handoff Document

## 🚨 URGENT: What You Need to Know
**Problem**: Users with businesses are stuck on create-business page  
**Root Cause**: BusinessContext never receives accountId from AccountContext  
**Key Finding**: Multiple Supabase client instances causing auth state inconsistency  
**User Impact**: Multi-account users cannot access their businesses  

## Executive Summary
Users with multiple accounts are being incorrectly redirected to the create-business page despite having existing businesses. The root cause appears to be multiple Supabase client instances and a React Context state propagation issue where `BusinessContext` receives `null` for `accountId` from `AccountContext`.

## Current Status: PARTIALLY RESOLVED
- ✅ RLS policies fixed (no more infinite recursion)
- ✅ Account selection logic working (selects team accounts with businesses)
- ❌ **CRITICAL ISSUE**: AccountContext still not passing accountId to BusinessContext
- ❌ Users still being redirected to create-business page

## Console Logs Showing the Issue
```javascript
// The critical sequence showing the problem:
🔍 BusinessProvider: Account context: {accountId: null, account: undefined, hasAccountContext: true}
🔄 AccountContext: Auth state changed, isAuthenticated: true userId: 12a68cba-4d23-421e-be37-c4f21d3ab64a
⚠️ No account_users records found for user: 12a68cba-4d23-421e-be37-c4f21d3ab64a
🎯 AccountContext: Got account ID: null
⚠️ AccountContext: No account ID returned for user: 12a68cba-4d23-421e-be37-c4f21d3ab64a

// Then later, the account IS found:
✅ Found 3 account_users records for user 12a68cba-4d23-421e-be37-c4f21d3ab64a
✅ Selected team account with paid plan: f2b6e9e4-98f2-4f42-a072-f277c2ab98f7 plan: builder
✅ CreateBusinessClient: Account ID: f2b6e9e4-98f2-4f42-a072-f277c2ab98f7

// But BusinessContext never receives it:
🔍 BusinessProvider: Account context: {accountId: null, account: undefined, hasAccountContext: true}
🔄 BusinessContext: Account changed to: null account object: undefined
📦 BusinessContext: No account ID, clearing business data
```

## Issues Encountered & Solutions Applied

### 1. RLS Policy Infinite Recursion ✅ FIXED
**Issue**: Database error "infinite recursion detected in policy for relation account_users"
**Cause**: Circular references in Row Level Security policies
**Solution**: Applied nuclear option migration removing complex policies
- Migration: `/supabase/migrations/20250814000020_nuclear_fix_rls_recursion.sql`
- Now using simple policies without cross-table references
- Access control moved to application layer

### 2. Import Path Errors ✅ FIXED
**Issue**: Multiple files importing from old `accountUtils.ts` which no longer exists
**Cause**: Auth system refactor moved utilities to new location
**Solution**: Updated all imports to use `@/auth/utils/accounts`
- Fixed files: `accountLimits.ts`, `authGuard.ts`, `update-status/route.ts`

### 3. Account Selection Logic ✅ FIXED
**Issue**: System was selecting user's owner account instead of team accounts with businesses
**Cause**: Wrong priority in account selection
**Solution**: Updated `getAccountIdForUser` in `/src/auth/utils/accounts.ts`
```javascript
// Priority order:
1. Support/team accounts with paid plans (likely have businesses)
2. Owned accounts with paid plans
3. Any account with data
4. Any owned account
5. Fallback to first account
```

### 4. AccountContext → BusinessContext Communication ❌ STILL BROKEN
**Issue**: BusinessContext receives `null` for accountId despite AccountContext having it
**Multiple attempted fixes**:

#### Attempt 1: Fix race condition in initialization
```javascript
// Before: Tried to use accounts array before it was loaded
loadAccounts().then(() => {
  if (accounts.length > 0) { // accounts was still empty!
    // Never reached here
  }
});

// After: Get accountId directly
getAccountIdForUser(user.id).then((fetchedAccountId) => {
  if (fetchedAccountId) {
    setAccountId(fetchedAccountId);
    loadAccount(fetchedAccountId);
  }
});
```

#### Attempt 2: Add timing buffer
Added 100ms delay in BusinessContext to ensure account data is ready

#### Attempt 3: Pass accountId parameter to loadAccount
Modified loadAccount to accept optional accountId parameter

## Context Provider Hierarchy
```
CompositeAuthProvider
  └── CoreAuthProvider (base - no dependencies)
      └── AccountProvider (depends on Core)
          └── BusinessProvider (depends on Account) ← ISSUE HERE
              └── AdminProvider (depends on Core & Account)
                  └── SubscriptionProvider (depends on Account)
```

## Key Files
1. **Context Providers**:
   - `/src/auth/context/CoreAuthContext.tsx` - Base authentication
   - `/src/auth/context/AccountContext.tsx` - Multi-account management
   - `/src/auth/context/BusinessContext.tsx` - Business profiles
   - `/src/auth/context/CompositeAuthProvider.tsx` - Combines all contexts

2. **Utilities**:
   - `/src/auth/utils/accounts.ts` - Account management functions
   - `/src/auth/utils/accountSelection.ts` - Account selection logic

3. **Database Migrations**:
   - `/supabase/migrations/20250814000020_nuclear_fix_rls_recursion.sql` - Fixed RLS

## The Core Problem (Still Unresolved)

### Timing Issue Analysis
From the console logs, we can see:
1. BusinessProvider renders BEFORE AccountContext has fetched the accountId
2. AccountContext initially returns `null` for accountId
3. Later, AccountContext successfully fetches the accountId
4. But BusinessContext never receives the update

### Suspected Root Causes
1. **React Context update propagation issue**: The accountId state update in AccountContext might not be triggering a re-render of BusinessContext
2. **useAccount hook not reactive**: The `useAccount()` hook in BusinessContext might be caching the initial null value
3. **Effect dependency issue**: The useEffect in BusinessContext that watches accountId might not be firing when accountId updates

## Critical Observation from Latest Logs

**THE REAL ISSUE**: Looking at the latest console logs, there's a critical sequence problem:

1. **Initial auth check fails** (user appears not authenticated):
   ```
   ⚠️ No account_users records found for user: 12a68cba-4d23-421e-be37-c4f21d3ab64a
   🎯 AccountContext: Got account ID: null
   ```

2. **Then SUCCESS in multiple places** (getAccountIdForUser is called multiple times):
   ```
   ✅ Found 3 account_users records for user 12a68cba-4d23-421e-be37-c4f21d3ab64a
   ✅ Selected team account with paid plan: f2b6e9e4-98f2-4f42-a072-f277c2ab98f7
   ```

3. **CreateBusinessClient gets the account ID** (but BusinessContext doesn't):
   ```
   ✅ CreateBusinessClient: Account ID: f2b6e9e4-98f2-4f42-a072-f277c2ab98f7
   ```

### The Problem: Multiple Supabase Client Instances
Note this warning in the logs:
```
Multiple GoTrueClient instances detected in the same browser context
```

This suggests different parts of the app are creating separate Supabase clients, causing:
- Authentication state inconsistency
- Some queries succeeding while others fail
- Context providers using different client instances

## Next Steps for Resolution

### 1. Fix Supabase Client Singleton
Ensure only ONE Supabase client instance exists:
```javascript
// In /src/auth/providers/supabase.ts
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(...);
  }
  return supabaseInstance;
}
```

### 2. Fix the Double Query Issue
The logs show `getAccountIdForUser` is being called multiple times simultaneously. This needs to be deduplicated:
```javascript
// Add request deduplication
const pendingRequests = new Map();

export async function getAccountIdForUser(userId: string) {
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId);
  }
  
  const promise = fetchAccountId(userId);
  pendingRequests.set(userId, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(userId);
  }
}
```

### 3. Fix AccountContext State Not Updating
The AccountContext's state setter might not be triggering:
```javascript
// In AccountContext, after getting accountId:
getAccountIdForUser(user.id).then((fetchedAccountId) => {
  if (fetchedAccountId) {
    // Force a fresh state update
    setAccountId(() => fetchedAccountId);
    setSelectedAccountId(() => fetchedAccountId);
    
    // Verify the update happened
    setTimeout(() => {
      console.log('AccountContext state after update:', { accountId });
    }, 0);
  }
});
```

### 4. Direct Prop Passing as Fallback
If context updates continue to fail, pass accountId directly:
```javascript
// In CompositeAuthProvider
export function CompositeAuthProvider({ children }: CompositeAuthProviderProps) {
  const [sharedAccountId, setSharedAccountId] = useState<string | null>(null);
  
  return (
    <CoreAuthProvider>
      <AccountProvider onAccountChange={setSharedAccountId}>
        <BusinessProvider accountIdOverride={sharedAccountId}>
          {/* ... */}
        </BusinessProvider>
      </AccountProvider>
    </CoreAuthProvider>
  );
}
```

## Testing Checklist
- [ ] User with single account can log in
- [ ] User with multiple accounts gets correct account selected
- [ ] BusinessContext receives accountId from AccountContext
- [ ] Business data loads for selected account
- [ ] User is NOT redirected to create-business if business exists
- [ ] Account switching works correctly

## User Impact
- Users with businesses are forced to create-business page
- Cannot access existing business data
- Account switching appears broken
- Multi-account support effectively non-functional

## Database Schema Notes
- `account_users` table links users to accounts with roles (owner, admin, member, support)
- `accounts` table has plan information
- `businesses` table linked to accounts via account_id
- RLS policies simplified to prevent recursion

## Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Contact Information
Previous work done by: Chris (via Claude)
Date: January 14, 2025
Last commit: "fix: Fix AccountContext race condition preventing BusinessContext from receiving accountId"