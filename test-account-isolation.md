# Account Isolation Testing Plan

## Overview
This document outlines comprehensive tests for verifying account isolation fixes across the dashboard. These tests should be performed by switching between accounts and ensuring no data leakage occurs.

## Prerequisites
- Have at least 2 accounts with different data
- Access to account switcher dropdown
- Browser developer tools open to check for errors

## Test Scenarios

### 1. Business Profile Page (/dashboard/business-profile)

#### Test Steps:
1. **Initial State**
   - Login and select Account A
   - Navigate to `/dashboard/business-profile`
   - Note the business name, logo, services, and other details
   - Take screenshot for reference

2. **Switch Accounts**
   - Use account switcher to select Account B
   - Wait for page to reload/update
   - Verify different business information is displayed
   - Ensure Account A data is completely gone

3. **Edit and Save**
   - Edit business information (name, services, etc.)
   - Save changes
   - Verify success message

4. **Verify Isolation**
   - Switch back to Account A
   - Confirm Account A data is unchanged
   - Switch to Account B again
   - Confirm saved changes persist

#### Expected Results:
- ✅ Each account shows distinct business data
- ✅ Changes saved to one account don't affect others
- ✅ No flickering or temporary display of wrong data
- ✅ Console shows correct account ID in debug logs

#### Common Issues to Watch For:
- Business data from Account A appearing briefly in Account B
- Form data persisting between accounts
- API calls using wrong account ID

---

### 2. Account Settings Page (/dashboard/account)

#### Test Steps:
1. **View Account A Settings**
   - Navigate to `/dashboard/account`
   - Note plan type, billing period, account ID
   - Check notification settings
   - Take screenshot

2. **Switch to Account B**
   - Use account switcher
   - Verify different account information displayed
   - Check that Account ID changed
   - Verify different plan/billing if applicable

3. **Modify Settings**
   - Toggle notification settings
   - Verify changes save correctly
   - Note success messages

4. **Cross-Account Verification**
   - Switch back to Account A
   - Confirm settings unchanged
   - Switch to Account B
   - Confirm changes persist

#### Expected Results:
- ✅ Account ID changes between accounts
- ✅ Plan information is account-specific
- ✅ Setting changes isolated per account
- ✅ Billing information separated

---

### 3. Plan Page (/dashboard/plan)

#### Test Steps:
1. **View Plan for Account A**
   - Navigate to `/dashboard/plan`
   - Note current plan and billing period
   - Check plan limits and features
   - Screenshot for reference

2. **Switch to Account B**
   - Use account switcher
   - Verify different plan information if applicable
   - Check upgrade/downgrade options are account-specific

3. **Plan Changes (if possible)**
   - Attempt to view billing portal
   - Verify correct Stripe customer ID used
   - Cancel if in test environment

4. **Isolation Check**
   - Switch between accounts multiple times
   - Confirm plan info stays consistent per account

#### Expected Results:
- ✅ Plan details are account-specific
- ✅ Billing portal uses correct customer ID
- ✅ Upgrade/downgrade options match account status
- ✅ No cross-account plan confusion

---

### 4. Create Business Flow

#### Test Steps:
1. **Create Business for Account A**
   - Navigate to `/dashboard/create-business`
   - Fill out business creation form
   - Submit and complete creation
   - Note which account the business was created under

2. **Switch to Account B**
   - Verify the new business doesn't appear
   - Check business profile shows Account B's data only

3. **Verify Database**
   - Check that new business has correct account_id
   - Ensure no cross-contamination

#### Expected Results:
- ✅ New business created under correct account
- ✅ Business doesn't appear in other accounts
- ✅ Database shows correct account_id association

---

### 5. Business Info Editor Component

#### Test Steps:
1. **AI-Powered Features Test**
   - In Account A business profile
   - Use "Import business description using AI"
   - Generate content and save

2. **Account Switch Test**
   - Switch to Account B
   - Verify AI-generated content doesn't appear
   - Use AI features for Account B
   - Verify different content generated

3. **Form Persistence Test**
   - Start editing business info in Account A
   - Switch to Account B mid-edit
   - Verify no form data bleeds between accounts

#### Expected Results:
- ✅ AI-generated content is account-specific
- ✅ Form data doesn't persist between accounts
- ✅ Autosave works per account

---

## Testing Checklist

### Before Starting:
- [ ] Clear browser cache and localStorage
- [ ] Open browser developer tools
- [ ] Have at least 2 test accounts ready
- [ ] Take screenshots for documentation

### During Testing:
- [ ] Monitor browser console for errors
- [ ] Check network tab for API calls with correct account IDs
- [ ] Verify no error messages or warnings
- [ ] Document any unexpected behavior

### After Each Test:
- [ ] Record results (pass/fail)
- [ ] Screenshot any issues
- [ ] Note account IDs used in API calls
- [ ] Check database if issues found

## API Endpoints to Monitor

Watch these API calls in browser developer tools:

1. `/api/businesses/[accountId]` - Should use correct account ID
2. `/api/accounts/[accountId]` - Account-specific calls
3. `/api/stripe-*` - Billing API calls with correct customer ID
4. `/api/ai/*` - AI generation calls should be account-scoped

## Expected Console Debug Output

Look for these debug messages:
```
🔍 BusinessProfile: Account selection state { selectedAccount: 'account-123', ... }
📊 Account data loaded: { id: 'account-123', plan: 'builder', ... }
🔄 Loading business profile for account: account-123
```

## Common Failure Patterns

### 1. Wrong Account ID in API Calls
- **Symptom**: API calls show account-123 when account-456 is selected
- **Cause**: Component using cached or wrong account ID
- **Check**: Network tab for actual API calls

### 2. Data Flickering
- **Symptom**: Brief flash of Account A data when switching to Account B
- **Cause**: State not properly cleared during account switch
- **Check**: React DevTools for state changes

### 3. Form Data Persistence
- **Symptom**: Form fields pre-filled with data from previous account
- **Cause**: localStorage or component state not cleared
- **Check**: localStorage keys and component state

### 4. Database Cross-Contamination
- **Symptom**: Changes appear in wrong account
- **Cause**: RLS policies not working or bypassed incorrectly
- **Check**: Direct database queries

## Automated Testing Commands

Run these in browser console to help debug:

```javascript
// Check current selected account
console.log('Selected Account:', window.localStorage.getItem('selectedAccountId'));

// Check auth state
console.log('Auth State:', JSON.parse(localStorage.getItem('supabase.auth.token') || '{}'));

// Monitor account switches
window.addEventListener('storage', (e) => {
  if (e.key === 'selectedAccountId') {
    console.log('Account switched:', e.oldValue, '->', e.newValue);
  }
});
```

## Issue Reporting Template

When issues are found, use this template:

```markdown
## Issue: [Brief Description]

**Test**: [Which test scenario]
**Account A**: [account-id-123]
**Account B**: [account-id-456]

**Expected**: [What should happen]
**Actual**: [What actually happened]

**Screenshots**: [Attach screenshots]
**Console Errors**: [Any error messages]
**API Calls**: [Relevant network requests]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Database State**: [If checked]
**Priority**: [High/Medium/Low]
```

## Success Criteria

All tests pass when:

✅ **No Cross-Account Data Leakage**: Each account shows only its own data
✅ **API Isolation**: All API calls use correct account IDs  
✅ **Form Isolation**: No form data bleeds between accounts
✅ **Database Integrity**: All records have correct account_id associations
✅ **State Management**: Account switching properly updates all components
✅ **Error Handling**: No console errors or warnings during account switches

## Post-Test Actions

After testing is complete:

1. **Document Results**: Update this file with test outcomes
2. **File Issues**: Create GitHub issues for any problems found
3. **Update Code**: Fix any identified problems
4. **Re-test**: Verify fixes work correctly
5. **Deploy**: Push fixes to production after verification

---

*Last Updated: 2025-09-02*
*Tested By: [Your Name]*
*Test Environment: [Local/Staging/Production]*