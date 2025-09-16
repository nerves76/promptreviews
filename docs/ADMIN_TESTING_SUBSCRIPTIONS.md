# Admin Testing Subscriptions Guide

## Overview
Admin accounts can test subscriptions at $1-3 pricing using a special 99% discount coupon. This allows for thorough testing of subscription flows without significant costs.

## How It Works

### 1. Admin Account Setup
Admin accounts are identified by the `is_admin` flag in the `accounts` table:
```sql
UPDATE accounts SET is_admin = true WHERE email = 'admin@example.com';
```

### 2. Automatic Discount Application
When an admin account creates or modifies a subscription:
- The system checks if the account has `is_admin = true`
- In TEST mode (dev): Automatically applies `TESTDEV_99` coupon (99% off)
- In LIVE mode (production): Logs but doesn't apply discount automatically

### 3. Pricing with 99% Discount
- **Monthly Plans**: ~$1/month
  - Grower: $9.99 → $0.10
  - Builder: $99 → $0.99
  - Maven: $249 → $2.49
  
- **Annual Plans**: ~$3/year
  - Grower: $99/year → $0.99
  - Builder: $990/year → $9.90
  - Maven: $2490/year → $24.90

## Switching Between Plans

### Monthly ↔ Annual Switching
Yes, admin accounts can freely switch between monthly and annual billing:

1. **From Monthly to Annual**: 
   - Go to `/dashboard/plan`
   - Toggle billing period to "Annual"
   - Click upgrade - discount applies automatically
   - Cost: ~$3/year with 99% off

2. **From Annual to Monthly**:
   - Go to `/dashboard/plan`
   - Toggle billing period to "Monthly"  
   - Click change plan - discount applies automatically
   - Cost: ~$1/month with 99% off

3. **Plan Upgrades/Downgrades**:
   - Works the same way with discount
   - Proration is handled by Stripe
   - Example: Builder ($0.99) → Maven ($2.49) monthly

### API Endpoints That Support Testing Mode

1. **Create Checkout Session** (`/api/create-checkout-session`)
   - Applies discount for new subscriptions
   - Supports both monthly and annual

2. **Upgrade Subscription** (`/api/upgrade-subscription`)
   - Applies discount when switching plans
   - Handles billing period changes
   - Prorates the difference

3. **Cancel Subscription** (`/api/cancel-subscription`)
   - Standard cancellation, no special handling needed

## Setup Instructions

### For Development (TEST mode)

1. **Create the test coupon** (one-time setup):
```bash
node scripts/setup-testing-coupons.js
```

2. **Mark account as admin**:
```sql
-- In Supabase SQL editor
UPDATE accounts 
SET is_admin = true 
WHERE email = 'your-admin@example.com';
```

3. **Test the checkout**:
- Login as admin account
- Go to `/dashboard/plan`
- Select any plan/billing period
- Checkout will show ~$1-3 pricing

### For Production (LIVE mode)

**Option 1: Manual Discount**
- Admin creates subscription at full price
- Manually apply discount in Stripe Dashboard

**Option 2: Enable Auto-Discount** (Use with caution!)
```bash
# This creates REAL coupons in LIVE Stripe!
node scripts/setup-live-testing-coupons.js
```

## Monitoring & Security

### Check Admin Status
```sql
-- See all admin accounts
SELECT email, is_admin, plan, billing_period 
FROM accounts 
WHERE is_admin = true;
```

### View Applied Discounts
Check Stripe Dashboard > Customers > [Customer] > Subscriptions to see applied coupons.

### Security Considerations
1. **Never share coupon codes publicly**
2. **Limit admin accounts to trusted team members**
3. **Monitor usage in Stripe Dashboard**
4. **In production, consider manual discounts instead**

## Troubleshooting

### "Coupon not found" error
- Run `node scripts/setup-testing-coupons.js` to create coupons
- Check you're using the correct Stripe keys (test vs live)

### Discount not applying
- Verify account has `is_admin = true` in database
- Check console logs for "🧪 Admin testing mode" messages
- Ensure STRIPE_SECRET_KEY matches coupon environment

### Can't switch billing periods
- Ensure subscription is active
- Check for any pending invoices
- Try from `/dashboard/plan` page

## Cost Summary for Admins

With 99% discount applied:

| Plan | Monthly | Annual |
|------|---------|---------|
| Grower | $0.10 | $0.99 |
| Builder | $0.99 | $9.90 |
| Maven | $2.49 | $24.90 |

This allows comprehensive testing of all subscription features at minimal cost.