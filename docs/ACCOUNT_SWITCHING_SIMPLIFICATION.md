# Account Switching Simplification Guide

## Overview
This document describes the major simplification of the account switching system completed on 2025-09-06, moving from a complex event-driven architecture to a simple localStorage + page reload approach.

## Previous Architecture (Complex)
The system previously used:
- Custom events (`accountSwitched`) dispatched across components
- SessionStorage flags (`account_switching`, `target_account`, `switching_user`)
- Complex coordination between AccountContext, dashboard layout, and account selection hooks
- Event listeners to update state without page reload
- Multiple retry mechanisms and timing delays

### Problems with Previous Approach
1. **Race conditions** - Events could fire before listeners were ready
2. **State synchronization issues** - Components could have stale data
3. **Logout bugs** - Users were getting logged out when switching accounts
4. **Redirect loops** - Users stuck on create-business page
5. **Complexity** - Hard to debug and maintain

## New Architecture (Simplified)
The simplified system uses:
- **localStorage** to persist account selection
- **Page reload** to apply changes
- **Single source of truth** - localStorage read on startup

### How It Works Now

1. **Account Selection Storage** (`/src/auth/utils/accountSelection.ts`)
   ```typescript
   // Store selection
   localStorage.setItem(`selected_account_${userId}`, accountId)
   
   // Read selection (checked first in getAccountIdForUser)
   localStorage.getItem(`selected_account_${userId}`)
   ```

2. **Switch Account Flow** (`/src/utils/accountSelectionHooks.ts`)
   ```typescript
   const switchAccount = async (accountId: string) => {
     // 1. Store selection in localStorage
     setStoredAccountSelection(currentUserId, accountId);
     
     // 2. Clear cached data
     const keysToRemove = [/* widget, form, cache keys */];
     keysToRemove.forEach(key => localStorage.removeItem(key));
     
     // 3. Simple reload to apply
     window.location.reload();
   };
   ```

3. **Account Loading on Startup** (`/src/auth/context/AccountContext.tsx`)
   - Simplified useEffect that runs once after auth is ready
   - Calls `getAccountIdForUser` which checks localStorage first
   - No event listeners or complex state management
   - Removed all sessionStorage flags

4. **Dashboard Layout** (`/src/app/(app)/dashboard/layout.tsx`)
   - Removed transition states and flags
   - Simple redirect logic for users without accounts
   - No complex timing or retry logic

## Files Modified During Simplification

### Core Changes
1. **`/src/utils/accountSelectionHooks.ts`**
   - Removed event dispatching
   - Simplified to localStorage + reload

2. **`/src/auth/context/AccountContext.tsx`**
   - Removed event listener for `accountSwitched`
   - Removed sessionStorage flag checking
   - Simplified initialization logic

3. **`/src/app/(app)/dashboard/layout.tsx`**
   - Removed `isTransitioning` state
   - Removed all sessionStorage flag checks
   - Simplified redirect logic

4. **`/src/app/(app)/dashboard/create-business/CreateBusinessClient.tsx`**
   - Removed sessionStorage flags for business creation
   - Simplified redirect after business creation

5. **`/src/app/(app)/dashboard/page.tsx`**
   - Fixed account missing error that appeared during loading
   - Added proper loading state checks

## Remaining Tasks for Developer

### 1. Business Name Updates in Account Switcher
**Problem**: When a business name is changed, the account switcher still shows the old name until page refresh.

**Solution Approach**:
```typescript
// In business update API or form submission:
// After successful business name update
const updatedAccount = { ...currentAccount, business_name: newName };

// Option 1: Update localStorage cache
localStorage.setItem(`account_data_${accountId}`, JSON.stringify(updatedAccount));

// Option 2: Trigger a refresh of account data
window.dispatchEvent(new CustomEvent('businessNameUpdated', { 
  detail: { accountId, newName } 
}));

// In Header.tsx or AccountSwitcher component:
useEffect(() => {
  const handleBusinessNameUpdate = (event) => {
    // Re-fetch accounts or update local state
    refetchAccounts();
  };
  
  window.addEventListener('businessNameUpdated', handleBusinessNameUpdate);
  return () => window.removeEventListener('businessNameUpdated', handleBusinessNameUpdate);
}, []);
```

### 2. Account Creation Testing on `/accounts`
**Areas to Test**:
- Create new account from `/accounts` page
- Verify account_users record is created with correct role
- Ensure user_id is properly set in accounts table
- Test account switching after creation
- Verify no redirect loops or logout issues

**Test Scenarios**:
1. User with no accounts → Create first account
2. User with existing account → Create additional account
3. Switch between newly created accounts
4. Verify account limits are enforced

### 3. Multi-User Account Management
**Features to Implement/Test**:

#### Adding Users to Account
```typescript
// API endpoint: /api/team/invite
// Database tables: account_invitations, account_users

// Test flow:
1. Owner sends invitation
2. New user receives email
3. User accepts invitation
4. account_users record created with correct role
5. User can switch to team account
```

#### Support Role Testing
**"Add Chris" Functionality**:
- Purpose: Add support@promptreviews.app as support role
- Database: Insert into account_users with role='support'
- Permissions: Read-only access to account data
- UI: Special button/option in team management

**Implementation Checklist**:
```sql
-- Add support user to account
INSERT INTO account_users (account_id, user_id, role, created_at)
VALUES (
  'current_account_id',
  'chris_user_id', -- Get from auth.users where email='support@promptreviews.app'
  'support',
  NOW()
);
```

**Test Cases**:
1. Add support user to account
2. Verify support user can view but not modify
3. Test account switching for support user
4. Verify support role appears correctly in UI

### 4. Edge Cases to Test

#### Authentication & Session
- [ ] Token refresh during account switch
- [ ] Multiple browser tabs with different accounts
- [ ] Account switch with expired session
- [ ] Account switch on mobile devices

#### Data Integrity
- [ ] Switching accounts clears all cached data
- [ ] Form data doesn't leak between accounts
- [ ] Widget settings isolated per account
- [ ] Review data properly filtered by account

#### UI/UX
- [ ] Account switcher shows correct current account
- [ ] Loading states during switch
- [ ] Error handling for invalid account selection
- [ ] Mobile account switcher functionality

## Database Schema Reference

### Key Tables
```sql
-- accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID, -- Optional, for single-user accounts
  business_name TEXT,
  email TEXT,
  plan TEXT,
  -- ... other fields
);

-- account_users table (many-to-many)
CREATE TABLE account_users (
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'support')),
  created_at TIMESTAMP,
  PRIMARY KEY (account_id, user_id)
);

-- account_invitations table
CREATE TABLE account_invitations (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  email TEXT,
  role TEXT,
  status TEXT, -- pending, accepted, rejected
  invited_by UUID,
  -- ... other fields
);
```

## Debugging Tools

### Check Current Account Selection
```javascript
// In browser console
const userId = 'current_user_id';
console.log('Selected account:', localStorage.getItem(`selected_account_${userId}`));
console.log('All localStorage:', Object.keys(localStorage).filter(k => k.includes('account')));
```

### Force Account Switch (Testing)
```javascript
// In browser console
const userId = 'current_user_id';
const newAccountId = 'target_account_id';
localStorage.setItem(`selected_account_${userId}`, newAccountId);
window.location.reload();
```

### Clear Account Cache
```javascript
// Clear all account-related data
Object.keys(localStorage)
  .filter(k => k.includes('account') || k.includes('widget') || k.includes('cache'))
  .forEach(k => localStorage.removeItem(k));
```

## Common Issues & Solutions

### Issue: Account not switching
**Check**:
1. localStorage has correct value
2. No errors in console during reload
3. getAccountIdForUser is reading localStorage
4. User has access to target account

### Issue: Wrong account after login
**Check**:
1. localStorage selection persists across sessions
2. No race condition in AccountContext initialization
3. Account selection priority in getAccountIdForUser

### Issue: Account switcher shows wrong name
**Solution**: 
- Implement real-time update mechanism (see task #1)
- Or accept that page reload updates it (current behavior)

## Migration Notes for Existing Users
- All sessionStorage flags have been removed
- localStorage keys remain the same
- No database changes required
- Backward compatible with existing account selections

## Contact & Support
For questions about this implementation:
1. Check git history for commits on 2025-09-06
2. Review this documentation
3. Test in development environment first
4. Create detailed bug reports with console logs

## Summary
The simplification successfully:
- ✅ Eliminated complex event system
- ✅ Removed race conditions
- ✅ Fixed logout issues
- ✅ Simplified debugging
- ✅ Improved reliability

The tradeoff is a page reload on account switch, which is acceptable for the improved stability and maintainability.