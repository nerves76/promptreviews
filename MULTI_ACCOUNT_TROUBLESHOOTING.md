# Multi-Account & Multi-Business Troubleshooting Guide

## ⚠️ CRITICAL: Read This First

This application supports:
1. **Multiple accounts per user** (team accounts, personal accounts, etc.)
2. **Multiple businesses per account** (from mergers, migrations, duplicates)

**Breaking either of these assumptions will cause 8+ hours of debugging.**

---

## Common Issues & Solutions

### 1. Navigation Gets Disabled After Account Switching

**Symptoms:**
- Nav items are grayed out after switching accounts
- Works on first login, breaks after switching
- Console shows `hasBusiness: false`

**Root Cause:**
Account has multiple businesses and code is using `.single()` or `.maybeSingle()`

**Error in Console:**
```json
{
  "code": "PGRST116",
  "message": "JSON object requested, multiple (or no) rows returned",
  "details": "Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row"
}
```

**Solution:**
NEVER use `.single()` or `.maybeSingle()` when fetching businesses. Always fetch array:
```typescript
// ❌ WRONG - Will break with multiple businesses
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('account_id', accountId)
  .single(); // THIS WILL FAIL!

// ✅ CORRECT - Handles multiple businesses
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('account_id', accountId)
  .order('created_at', { ascending: true });

// Use first business if multiple exist
const business = data?.[0];
```

---

### 2. User Redirected to Create Business (When They Shouldn't Be)

**Symptoms:**
- User with existing business redirected to /dashboard/create-business
- Happens especially with team members or after account switching

**Root Causes:**

1. **Wrong BusinessGuard being used**
   - Check: `/src/components/Providers.tsx`
   - Should import from `@/auth/guards/BusinessGuard`
   - NOT from `./BusinessGuard` (old version)

2. **Business fetch failing silently**
   - Check BusinessContext logs for errors
   - Likely cause: Multiple businesses (see Issue #1)

3. **Account ID not propagating**
   - SharedAccountState might be null
   - AccountContext not passing Supabase client

**Debug Steps:**
```javascript
// Check these in console logs:
1. 🔄 SharedAccountState: Setting account ID to: [should not be null]
2. 🏢 Loading business for account: [should have account ID]
3. Failed to load business: [check error details]
```

---

### 3. Account ID Not Being Set

**Symptoms:**
- `accountId: null` in BusinessContext
- `SharedAccountState` shows null
- Business never loads

**Root Causes:**

1. **Request deduplication caching null**
   - `getAccountIdForUser` returns null on first call (session not ready)
   - Null gets cached, all retries return cached null

2. **Different Supabase clients**
   - AccountContext not passing its client to `getAccountIdForUser`
   - Creates new client without auth session

**Solutions:**
```typescript
// In AccountContext, ALWAYS pass the supabase client:
getAccountIdForUser(user.id, supabase) // ✅ Pass client
// NOT:
getAccountIdForUser(user.id) // ❌ Creates new client
```

---

### 4. RLS (Row Level Security) Errors

**Symptoms:**
- 406 or 403 errors when fetching businesses
- Navigation disabled despite user having proper access

**Debug:**
```sql
-- Check RLS policies on businesses table
SELECT * FROM pg_policies WHERE tablename = 'businesses';

-- Check if user has access to account
SELECT * FROM account_users 
WHERE user_id = 'USER_ID' 
AND account_id = 'ACCOUNT_ID';
```

---

## Architecture Gotchas

### Context Hierarchy Matters!
```tsx
// Correct order in CompositeAuthProvider:
<CoreAuthProvider>
  <SharedAccountProvider>  // Must be before AccountProvider
    <AccountProvider>       // Depends on SharedAccount
      <BusinessProvider>    // Depends on Account
        <AdminProvider>
          <SubscriptionProvider>
```

### Two BusinessGuards Existed!
- `/src/auth/guards/BusinessGuard.tsx` - ✅ NEW (with fixes)
- `/src/components/BusinessGuard.tsx` - ❌ OLD (deleted, but check it's gone)

### Account Selection Priority
```javascript
// Order matters! System selects first matching:
1. Team accounts with paid plans (builder, maven)
2. Owned accounts with paid plans
3. Any account (fallback)
```

---

## Prevention Checklist

Before deploying auth changes:

- [ ] Test with user having **multiple accounts**
- [ ] Test with account having **multiple businesses**
- [ ] Test account switching (nav should stay enabled)
- [ ] Check no `.single()` or `.maybeSingle()` on businesses table
- [ ] Verify SharedAccountProvider is in context hierarchy
- [ ] Confirm using BusinessGuard from `@/auth/guards/`
- [ ] Test with team member (non-owner) accounts
- [ ] Check AccountContext passes supabase client to utils

---

## Emergency Fixes

### If everything is broken:

1. **Clear browser storage:**
```javascript
localStorage.clear();
sessionStorage.clear();
// Then hard refresh
```

2. **Check which account is selected:**
```javascript
// In console:
localStorage.getItem('selectedAccountId')
```

3. **Force business reload:**
```javascript
// In console (if you have access to context):
clearBusinessCache();
loadBusiness();
```

---

## Related Files (Handle with Care!)

Critical files that can break multi-account/multi-business:
- `/src/auth/context/BusinessContext.tsx` - Business loading logic
- `/src/auth/context/AccountContext.tsx` - Account selection
- `/src/auth/context/SharedAccountState.tsx` - Shared state between contexts
- `/src/auth/utils/accounts.ts` - Account fetching with deduplication
- `/src/auth/guards/BusinessGuard.tsx` - Redirect logic
- `/src/components/Providers.tsx` - Context setup

---

## Time Saved: 8+ Hours

If this guide helped you, you owe Chris a coffee ☕