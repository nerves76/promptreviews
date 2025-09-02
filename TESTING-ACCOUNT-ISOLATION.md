# Quick Account Isolation Testing Guide

## 🚀 Quick Start

1. **Open the app**: `http://localhost:3002`
2. **Open browser console** (F12 → Console tab)
3. **Load test script**: Copy and paste the contents of `test-account-isolation.js`
4. **Run tests**: `runAllTests()`

## 📋 Manual Testing Checklist

### Business Profile Page (`/dashboard/business-profile`)

**✅ Passing Criteria**:
- Different business names/data between accounts
- Form fields clear when switching accounts
- API calls in Network tab use correct account IDs
- No console errors during account switches

**🔬 Test Steps**:
1. Go to `/dashboard/business-profile`
2. Run: `switchAccount('acc-123')`
3. Fill in some business data
4. Run: `switchAccount('acc-456')`
5. Verify form is clear/shows different data
6. Check Network tab for API calls with correct account IDs

---

### Account Settings Page (`/dashboard/account`)

**✅ Passing Criteria**:
- Account IDs are different between accounts
- Plan information is account-specific
- Settings changes don't affect other accounts

**🔬 Test Steps**:
1. Go to `/dashboard/account`
2. Note Account ID and plan info
3. Switch accounts with account selector
4. Verify Account ID changes
5. Toggle notification settings
6. Switch back to first account
7. Verify settings unchanged

---

### Plan Page (`/dashboard/plan`)

**✅ Passing Criteria**:
- Plan details match the selected account
- Billing portal uses correct Stripe customer
- Upgrade/downgrade buttons work correctly

**🔬 Test Steps**:
1. Go to `/dashboard/plan`
2. Note current plan and billing period
3. Switch accounts
4. Verify different plan info (if applicable)
5. Test "Update billing info" button
6. Verify Stripe portal loads correct customer

---

## 🔧 Quick Console Commands

```javascript
// Switch between test accounts
switchAccount('acc-123');
switchAccount('acc-456');

// Run all automated tests
runAllTests();

// Check current account state
console.log('Current account:', localStorage.getItem('selectedAccountId'));

// Enable debug mode
localStorage.setItem('dev_auth_bypass', 'true');

// Monitor API calls
window.AccountIsolationTest.apiCalls.forEach(call => 
  console.log(call.url)
);
```

## ❌ Common Issues to Watch For

### 1. Data Leakage
- Business name from Account A appearing in Account B
- Form fields pre-filled with wrong account data
- API calls using incorrect account IDs

### 2. Console Errors
```
🔍 BusinessProfile: Account selection state
❌ Error loading account data
🔄 Account switched detected
```

### 3. Network Tab Issues
- API calls to `/api/businesses/wrong-account-id`
- Missing or incorrect `x-selected-account` headers
- 401 unauthorized errors

## ✅ Success Indicators

### Console Logs to Look For
```
✅ Business profile loaded for account: acc-123
✅ Account data loaded: { id: 'acc-456', plan: 'builder' }
🔄 Account switched: acc-123 → acc-456
```

### Network Tab Success
- `/api/businesses/acc-123` (not acc-456 when acc-123 selected)
- Status: 200 OK for account-specific calls
- Correct account IDs in request URLs

### UI Success
- Clean form fields when switching accounts
- Different business names/data per account
- Account-specific plan information
- Proper account IDs displayed

---

## 🐛 If You Find Issues

1. **Screenshot the problem**
2. **Copy console errors**
3. **Note the API calls from Network tab**
4. **Document steps to reproduce**

### Issue Reporting Template:
```
**Issue**: [Brief description]
**Account A**: acc-123
**Account B**: acc-456
**Page**: /dashboard/business-profile
**Expected**: Different business data
**Actual**: Same business name showing
**Console Errors**: [paste errors]
**API Calls**: [wrong account IDs used]
```

---

## 📊 Test Results

After running tests, results will be saved to:
```javascript
// View all test results
window.AccountIsolationTest.results

// Generate summary report  
generateReport()
```

**Expected Results**: All tests should pass with ✅ status
**If tests fail**: Document the specific issues and review the code changes needed

---

*Testing completed? Update the main results file with your findings!*