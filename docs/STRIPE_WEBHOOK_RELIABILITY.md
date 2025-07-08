# Stripe Webhook Reliability Guide

## Overview
This document outlines how to prevent payment-plan mismatch issues where users successfully pay for plans but their account isn't updated correctly.

## The Problem
Users can experience a critical bug where:
1. They successfully pay for a plan (e.g., Maven) through Stripe
2. Stripe webhook fails to update their account plan
3. Their account remains on `'no_plan'` despite successful payment
4. UI shows incorrect states (pricing modal persists, features locked)

## Root Causes
1. **Missing Stripe Customer ID**: Account has `stripe_customer_id: null`
2. **Webhook Lookup Failures**: Webhook can't find account to update
3. **Email Mismatch**: Email in Stripe doesn't match account email exactly
4. **Insufficient Fallback Logic**: Limited recovery mechanisms

## Prevention Measures

### 1. Improved Checkout Session Creation
**File:** `src/app/api/create-checkout-session/route.ts`

**What it does:**
- Creates Stripe customer if `stripe_customer_id` is missing
- Updates account with customer ID before checkout
- Adds comprehensive metadata for webhook fallback

**Key improvements:**
```typescript
// CRITICAL FIX: If no stripe_customer_id exists, create one now
if (!stripeCustomerId) {
  const customer = await stripe.customers.create({
    email: account.email,
    metadata: { userId: userId }
  });
  stripeCustomerId = customer.id;
  
  // Update account with new customer ID
  await supabase
    .from("accounts")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", userId);
}
```

### 2. Enhanced Webhook Reliability
**File:** `src/app/api/stripe-webhook/route.ts`

**What it does:**
- Multiple fallback methods to find accounts
- Comprehensive error logging
- Always sets `stripe_customer_id` when found

**Fallback sequence:**
1. **Primary:** Find by `stripe_customer_id`
2. **Method 1:** Use email from checkout metadata
3. **Method 2:** Fetch customer email from Stripe
4. **Method 3:** Find account by `userId` from metadata
5. **Method 4:** Update by email if found
6. **Method 5:** Update by `userId` as last resort

### 3. Monitoring & Detection
**File:** `scripts/detect-payment-plan-mismatches.js`

**Purpose:** Proactively detect users who paid but account wasn't updated

**Usage:**
```bash
node scripts/detect-payment-plan-mismatches.js
```

**What it checks:**
- Accounts with `stripe_customer_id: null`
- Accounts with `plan: 'no_plan'`
- Cross-references with active Stripe subscriptions
- Reports mismatches requiring manual intervention

### 4. Client-Side Safety Checks
**File:** `src/app/dashboard/page.tsx`

**What it does:**
- Detects when payment succeeded but plan not updated
- Shows user-friendly error messages
- Logs critical debugging information

**Detection logic:**
```typescript
// SAFETY CHECK: Detect if user has paid but account wasn't updated
if (user && account && searchParams.get('success') === '1') {
  const planFromUrl = searchParams.get('plan');
  const changeType = searchParams.get('change');
  
  if (planFromUrl && changeType === 'upgrade' && account.plan !== planFromUrl) {
    console.error('🚨 PAYMENT SUCCESS BUT PLAN NOT UPDATED!');
    toast.error('Payment successful but account update pending...');
  }
}
```

## Regular Maintenance

### Daily Checks
Run the detection script daily to catch issues early:
```bash
# Add to cron job
0 9 * * * cd /path/to/app && node scripts/detect-payment-plan-mismatches.js
```

### Weekly Reviews
1. Check webhook logs for failed updates
2. Monitor Stripe dashboard for successful payments
3. Cross-reference with account plan updates
4. Review any manual interventions needed

### Monthly Audits
1. Full sync check between Stripe and Supabase
2. Verify all paid users have correct plans
3. Check for orphaned Stripe subscriptions
4. Update detection scripts as needed

## Emergency Response

### If Issue Detected
1. **Immediate:** Run detection script to identify affected users
2. **Verify:** Check Stripe dashboard for successful payments
3. **Fix:** Use manual update script for critical cases
4. **Monitor:** Watch for additional webhook failures

### Manual Fix Process
```bash
# 1. Detect issues
node scripts/detect-payment-plan-mismatches.js

# 2. Fix specific user (if needed)
node scripts/fix-specific-user.js <user-email>

# 3. Verify fix
node scripts/verify-account-sync.js <user-email>
```

## Testing & Validation

### Test Scenarios
1. **New User Signup:** Verify customer ID creation
2. **Plan Upgrade:** Test webhook processing
3. **Webhook Failure:** Simulate and test fallback logic
4. **Edge Cases:** Test email mismatches, metadata issues

### Validation Steps
1. Create test user with no `stripe_customer_id`
2. Process payment through checkout
3. Verify account updated correctly
4. Test all fallback methods work
5. Confirm monitoring detects issues

## Key Metrics to Monitor
- **Webhook Success Rate:** % of successful account updates
- **Customer ID Coverage:** % of accounts with `stripe_customer_id`
- **Plan Sync Rate:** % of paid users with correct plans
- **Detection Response Time:** Time to identify and fix issues

## Best Practices
1. **Always** create customer ID before checkout
2. **Never** rely on single webhook lookup method
3. **Monitor** webhook success rates continuously
4. **Test** edge cases regularly
5. **Document** all manual interventions
6. **Alert** on webhook failures immediately

## Related Files
- `src/app/api/create-checkout-session/route.ts` - Checkout creation
- `src/app/api/stripe-webhook/route.ts` - Webhook processing
- `scripts/detect-payment-plan-mismatches.js` - Detection script
- `src/app/dashboard/page.tsx` - Client-side safety checks

This comprehensive approach ensures payment-plan mismatches are prevented, detected early, and resolved quickly when they occur. 