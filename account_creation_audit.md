# Account Creation Logic Audit Report

## Issues Identified

### 1. **Plan Initialization Inconsistency** ⚠️ Critical Issue

**Problem**: Different parts of the system set different default plan values for new users.

**Locations with conflicts**:

- **`/api/create-account/route.ts`** (Line 59): Sets `plan: 'no_plan'`
```typescript
plan: 'no_plan', // Use 'no_plan' as the default for new users
```

- **`/auth/callback/route.ts`** (Line 111): Sets `plan: 'grower'`
```typescript
plan: 'grower', // Use proper plan value instead of 'NULL'
```

- **Database schema**: Defaults to `plan: 'grower'`
```sql
"plan" "text" DEFAULT 'grower'::"text" NOT NULL,
```

**Impact**: New users may have inconsistent plan values (`'no_plan'`, `'grower'`, or `null`), causing the pricing modal trigger logic to fail.

### 2. **Pricing Modal Trigger Logic Issue** ⚠️ Critical Issue

**Problem**: The logic in `Dashboard.tsx` expects `'no_plan'` but users might have different plan values due to initialization inconsistency.

**Current logic** (`src/app/dashboard/page.tsx`, Lines 280-281):
```typescript
const shouldShowPricingModal = 
  // New user who hasn't selected a plan yet (no plan or 'no_plan' and has created a business)
  ((!data?.account?.plan || data?.account?.plan === 'no_plan') && (data?.businesses?.length || 0) > 0) ||
  // Or trial has expired
  (isTrialExpired && !isPaidUser);
```

**Issue**: If a user gets `plan: 'grower'` from the callback route, this condition `data?.account?.plan === 'no_plan'` will be false, preventing the pricing modal from showing.

### 3. **Signup Flow Analysis** ✅ Working Correctly

**Current flow**:
1. User signs up → Email confirmation sent
2. User clicks email link → `/auth/callback` processes confirmation
3. New users redirected to `/dashboard/create-business`
4. After business creation → Redirect to `/dashboard?businessCreated=true`
5. Dashboard detects `businessCreated=true` parameter → Should trigger pricing modal

**The redirect logic works correctly**, but the modal doesn't show due to plan value inconsistency.

## Root Cause Analysis

The core issue is **inconsistent plan initialization** across different code paths:

1. **Direct signup via `/api/create-account`**: Gets `'no_plan'` ✅
2. **OAuth callback via `/auth/callback`**: Gets `'grower'` ❌
3. **Manual account creation scripts**: May get various values ❌

## Recommended Fixes

### Fix 1: Standardize Plan Initialization (HIGH PRIORITY)

**Choose ONE default plan value for all new users**. I recommend using `'no_plan'` since:
- It clearly indicates a user who hasn't selected a plan
- It's already used in the API endpoint
- The pricing modal logic expects it

**Changes needed**:

1. **Update `/auth/callback/route.ts`** (Line 111):
```typescript
// BEFORE:
plan: 'grower', // Use proper plan value instead of 'NULL'

// AFTER:
plan: 'no_plan', // Consistent with API endpoint - user must select plan
```

2. **Update database schema default** (if needed):
```sql
-- Consider changing default from 'grower' to 'no_plan'
"plan" "text" DEFAULT 'no_plan'::"text" NOT NULL,
```

3. **Update any other account creation scripts** to use `'no_plan'`

### Fix 2: Improve Pricing Modal Logic (MEDIUM PRIORITY)

**Make the trigger logic more robust** to handle edge cases:

```typescript
// More robust logic in Dashboard.tsx
const shouldShowPricingModal = 
  // New user who hasn't selected a plan yet
  ((!data?.account?.plan || 
    data?.account?.plan === 'no_plan' || 
    data?.account?.plan === 'NULL' ||
    data?.account?.plan === null) && 
   (data?.businesses?.length || 0) > 0) ||
  // Or trial has expired
  (isTrialExpired && !isPaidUser);
```

### Fix 3: Add Logging for Debugging (LOW PRIORITY)

**Add logging to track plan selection flow**:

```typescript
// In Dashboard.tsx pricing modal logic
console.log('🔍 Plan selection debug:', {
  accountPlan: data?.account?.plan,
  businessCount: data?.businesses?.length,
  shouldShowModal: shouldShowPricingModal,
  businessCreatedParam: params.get("businessCreated")
});
```

## Testing Recommendations

### Test Case 1: Fresh Signup
1. Create new account via signup form
2. Confirm email
3. Create business profile
4. Verify pricing modal appears

### Test Case 2: OAuth Signup
1. Sign up via OAuth (if implemented)
2. Create business profile  
3. Verify pricing modal appears

### Test Case 3: Existing Users
1. Existing users with businesses should NOT see modal
2. Users with expired trials SHOULD see modal

## Implementation Priority

1. **🔥 URGENT**: Fix plan initialization inconsistency
2. **📋 HIGH**: Update pricing modal trigger logic
3. **🔧 MEDIUM**: Add comprehensive logging
4. **✅ LOW**: Update tests and documentation

## Additional Notes

- The business creation flow (`SimpleBusinessForm.tsx`) correctly redirects with `?businessCreated=true`
- The welcome popup logic works correctly
- The plan selection UI (`PricingModal.tsx`) is properly implemented
- The issue is specifically in the trigger logic due to inconsistent plan values

## Expected Outcome After Fixes

✅ New users will consistently get `plan: 'no_plan'`
✅ Pricing modal will appear after business creation
✅ Plan selection will work as intended
✅ Users will complete the full onboarding flow