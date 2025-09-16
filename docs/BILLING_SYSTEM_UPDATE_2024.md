# Billing System Update Documentation
## Date: August 2024

## Overview
This document outlines recent updates to the billing system, focusing on plan upgrades/downgrades, Stripe integration fixes, and UI/UX improvements.

## Issues Addressed

### 1. Stripe SDK Compatibility Issue
**Problem**: The billing preview API was failing with `stripe.invoices.retrieveUpcoming is not a function`
**Root Cause**: Outdated Stripe SDK v18.1.1 incompatible with newer API methods
**Solution**: 
- Updated Stripe SDK from v18.1.1 to v18.4.0
- Changed method from `retrieveUpcoming` to `createPreview` in `/src/app/api/preview-billing-change/route.ts`

### 2. Incorrect Proration Calculations
**Problem**: Plan changes showing $560.96 instead of ~$204 for annual upgrades
**Root Cause**: Invoice preview was including next year's renewal charges
**Solution**: 
- Added filtering to only include "Remaining time" lines in proration calculations
- Skip invoice lines that start more than 30 days in the future

### 3. Stripe Subscription Not Updating
**Problem**: Database showed Maven plan but Stripe subscription remained on Grower price
**Investigation**: Added detailed logging to track price IDs being sent to Stripe
**Removed**: Admin testing coupon logic that may have interfered with updates

### 4. UI/UX Improvements
**Fixed**:
- Success messages now properly display after plan changes
- Downgrade flow now shows confirmation modal before billing preview
- Simplified confusing proration messages
- Fixed capitalization: "Prompt Pages" (capitalized), other features sentence case
- Fixed alignment of wrapped text in plan feature lists

## Code Changes

### Modified Files

#### `/src/app/api/upgrade-subscription/route.ts`
- Removed admin testing coupon logic (TESTDEV_99)
- Added detailed logging for subscription updates
- Added console logs to track price IDs from environment variables
- Simplified update configuration

#### `/src/app/api/preview-billing-change/route.ts`
- Changed from `stripe.invoices.retrieveUpcoming` to `stripe.invoices.createPreview`
- Added filtering for invoice lines to exclude future renewals
- Improved downgrade detection and credit messaging
- Added proper error handling with user-friendly messages

#### `/src/app/dashboard/plan/page.tsx`
- Restructured modal flow: confirmation → billing preview
- Added success parameter detection in useEffect
- Fixed feature list alignment (items-start instead of items-center)
- Improved downgrade flow to show confirmation first

#### `/src/app/components/PricingModal.tsx`
- Updated capitalization for "Prompt Pages" throughout
- Maintained consistency across all plan tiers

#### `/package.json`
- Updated Stripe dependency from ^18.1.1 to ^18.4.0

## Testing Checklist

### Critical Tests

1. **Plan Upgrades**
   - [ ] Upgrade from Grower → Builder (monthly)
   - [ ] Upgrade from Grower → Builder (annual)
   - [ ] Upgrade from Builder → Maven (monthly)
   - [ ] Upgrade from Builder → Maven (annual)
   - [ ] Verify correct proration amount shows
   - [ ] Verify success message displays after upgrade
   - [ ] Check Stripe dashboard shows correct new price

2. **Plan Downgrades**
   - [ ] Downgrade from Maven → Builder
   - [ ] Downgrade from Maven → Grower
   - [ ] Downgrade from Builder → Grower
   - [ ] Verify "Confirm Plan Downgrade" modal appears first
   - [ ] Verify credit amount is calculated correctly
   - [ ] Verify credit message shows (not charge message)
   - [ ] Check Stripe dashboard shows correct new price

3. **Billing Period Changes**
   - [ ] Switch from monthly to annual (each plan)
   - [ ] Switch from annual to monthly (each plan)
   - [ ] Verify proration calculations are correct

4. **Edge Cases**
   - [ ] Free trial user attempting to upgrade
   - [ ] User with no Stripe customer ID
   - [ ] User attempting to select current plan
   - [ ] Network failure during billing preview fetch
   - [ ] Stripe API errors

5. **Database/Stripe Sync**
   - [ ] After upgrade, verify database plan matches Stripe subscription
   - [ ] After downgrade, verify database plan matches Stripe subscription
   - [ ] Check stripe_subscription_id is maintained correctly

## Known Issues & Next Steps

### To Investigate
1. **Stripe Subscription Update**: Monitor if subscriptions properly update to new price IDs
   - Check console logs for "Subscription update details" and "Stripe subscription updated"
   - Verify in Stripe dashboard that subscription items show correct price

2. **Webhook Handling**: Ensure Stripe webhooks properly update database after subscription changes

### To Implement
1. **Better Error Recovery**: Add retry logic for failed Stripe API calls
2. **Loading States**: Improve loading indicators during plan changes
3. **Email Notifications**: Verify users receive proper email confirmations

## Environment Variables Required
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_GROWER=price_...
STRIPE_PRICE_ID_BUILDER=price_...
STRIPE_PRICE_ID_MAVEN=price_...
STRIPE_PRICE_ID_GROWER_ANNUAL=price_...
STRIPE_PRICE_ID_BUILDER_ANNUAL=price_...
STRIPE_PRICE_ID_MAVEN_ANNUAL=price_...
```

## Console Logs to Monitor

During testing, watch for these console logs:

1. **Price IDs Loading**:
   ```
   💳 Stripe Price IDs loaded: {grower: {...}, builder: {...}, maven: {...}}
   ```

2. **Subscription Updates**:
   ```
   🔄 Subscription update details: {subscriptionId, targetPriceId, ...}
   ✅ Stripe subscription updated: {newPriceId, ...}
   ```

3. **Billing Preview**:
   ```
   📊 Preview billing change request: {...}
   📊 Invoice lines from Stripe: [...]
   ```

## Rollback Plan

If issues occur:
1. Revert Stripe SDK to v18.1.1 (not recommended due to API incompatibility)
2. Re-enable admin testing coupon if needed for testing
3. Previous working commit: Check git history before these changes

## Support & Documentation

- Stripe API Docs: https://stripe.com/docs/api
- Stripe SDK v18 Migration: https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md
- Internal Docs: `/docs/WIDGET_REFRESH_FIX.md`, `/CLAUDE.md`

## Notes for Future Developers

1. **Always test in Stripe Test Mode first** before deploying to production
2. **Monitor console logs** during plan changes to identify issues
3. **Check both database and Stripe** to ensure they stay in sync
4. **The billing preview API** is critical - if it fails, users can still proceed but won't see proration amounts
5. **Success messages** depend on URL parameters - ensure redirects preserve these

## Contact

For questions about these changes, check:
- Git commit history for context
- Console logs for debugging information
- Stripe dashboard for subscription status