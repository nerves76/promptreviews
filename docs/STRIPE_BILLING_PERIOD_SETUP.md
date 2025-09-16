# Stripe Billing Period Setup Guide

## Overview
This guide explains how billing period changes (monthly ↔ annual) are handled in Prompt Reviews and how to configure Stripe to support these changes.

## How Billing Period Changes Work

### In-App Changes
1. **Same Plan, Different Billing Period**: When a customer clicks their current plan but with a different billing period (e.g., Builder Monthly → Builder Annual), the system:
   - Shows a confirmation dialog explaining the change
   - Uses the `/api/upgrade-subscription` endpoint to update the Stripe subscription
   - Updates the billing_period in the database
   - Applies proration automatically

2. **UI Indicators**:
   - Button shows "Switch to Annual" or "Switch to Monthly" when applicable
   - Current billing period displayed in plan badge
   - Billing toggle defaults to current period

### Database Tracking
- `billing_period` column stores 'monthly' or 'annual'
- Updated by webhook when subscription changes
- Displayed on Account and Plan pages

## Stripe Customer Portal Configuration

To allow customers to change billing periods through Stripe's Customer Portal:

1. **Go to Stripe Dashboard** → Settings → Customer Portal
   
2. **Enable Subscription Switching**:
   - Toggle ON "Customers can switch plans"
   - Add all your price IDs (both monthly and annual) to the allowed plans

3. **Configure Products & Prices**:
   - Ensure each plan has both monthly and annual price IDs
   - Price IDs should be properly set in environment variables:
     ```
     STRIPE_PRICE_ID_GROWER_ANNUAL=price_xxx
     STRIPE_PRICE_ID_BUILDER_ANNUAL=price_xxx
     STRIPE_PRICE_ID_MAVEN_ANNUAL=price_xxx
     ```

4. **Proration Settings**:
   - Enable "Prorate subscription changes"
   - This ensures fair billing when switching periods

## How Proration Works

### Monthly → Annual
- Customer is charged the prorated amount for the remainder of the year
- They get an immediate credit for unused time in current month
- Net effect: Pay the difference to upgrade to annual

### Annual → Monthly
- Customer gets a credit for unused annual time
- Credit is applied to future monthly charges
- No immediate refund (credit on account)

## Testing Billing Period Changes

1. **In Development**:
   ```bash
   # Use Stripe test mode price IDs
   # Test with Stripe's test credit cards
   ```

2. **Test Scenarios**:
   - Monthly to Annual mid-cycle
   - Annual to Monthly mid-cycle
   - Billing period change with plan upgrade
   - Billing period change with plan downgrade

## Webhook Handling

The Stripe webhook (`/api/stripe-webhook`) automatically:
1. Detects billing interval from `price.recurring.interval`
2. Updates `billing_period` in database
3. Maintains sync between Stripe and your database

## Customer Experience

### Through Your App:
- Toggle between Monthly/Annual on /dashboard/plan
- Click current plan with different billing to switch
- Immediate update with proration

### Through Stripe Portal:
- Access via "Manage Billing & Payment" button
- Change subscription and billing period
- Changes sync back via webhook

## Troubleshooting

### Issue: Billing period not updating
- Check webhook logs in Stripe Dashboard
- Verify `billing_period` column exists in database
- Ensure webhook endpoint is receiving events

### Issue: Proration not working correctly
- Verify `proration_behavior: "always_invoice"` in upgrade-subscription endpoint
- Check Stripe subscription settings
- Review invoice in Stripe Dashboard

## Support Notes

When customers ask about billing period changes:
1. They can switch anytime through the Plan page
2. Proration is automatic and fair
3. Annual saves 15% (almost 2 months free)
4. Changes take effect immediately
5. Credits for unused time are applied automatically