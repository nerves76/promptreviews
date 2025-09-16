# Account Reactivation System (Simplified)

## Overview

A streamlined reactivation system that welcomes back cancelled users with a simple, consistent offer:
- **Monthly Plans**: 50% off first month
- **Annual Plans**: 20% off first year (vs standard 15% discount)

No time-based tiers, no complexity - just a straightforward welcome back discount.

## User Journey

### 1. Cancellation
- User cancels subscription
- Account soft-deleted (90-day retention)
- Stripe subscription cancelled
- Can return anytime within 90 days

### 2. Return & Recognition
- User logs in with existing credentials
- System detects `deleted_at` timestamp
- Shows welcome back screen with offer
- All data intact (within 90 days)

### 3. Reactivation
- User clicks "Reactivate Account"
- Sees pricing with special offer banner
- Selects monthly or annual plan
- Stripe checkout shows appropriate discount

### 4. Payment & Access
- Completes payment at discounted rate
- Account fully restored
- All data and settings preserved
- Back to full access immediately

## Stripe Integration

### Active Coupons

**Production & Test:**
- `PR_WELCOME_BACK_MONTHLY` - 50% off first payment
- `PR_WELCOME_BACK_ANNUAL` - 20% off first payment

### How It Works

```typescript
// Automatic application in checkout session
if (isReactivation) {
  const couponId = billingPeriod === 'annual' 
    ? 'PR_WELCOME_BACK_ANNUAL'
    : 'PR_WELCOME_BACK_MONTHLY';
  
  sessionConfig.discounts = [{ coupon: couponId }];
}
```

### Setup Commands

```bash
# Setup/update coupons (test & production)
npm run setup:stripe-coupons

# Test the reactivation flow
npm run test:reactivation
```

## File Structure

```
/src/
  lib/
    stripe-reactivation-offers.ts  # Stripe coupon management
    account-reactivation.ts        # Reactivation logic
    
  components/
    AccountReactivation.tsx         # Welcome back UI
    
  app/
    api/
      create-checkout-session/      # Applies discounts
      cancel-account/               # Handles cancellation
      cancel-subscription/          # Cancels Stripe subscription
    reactivate/page.tsx            # Reactivation page
    
/scripts/
  setup-simplified-coupons.js      # Creates Stripe coupons
  test-reactivation-flow.js        # Test script
  
/prisma/
  schema.prisma                     # Database schema with:
    - reactivated_at
    - reactivation_count
    - last_cancellation_reason
    - account_events table
```

## Database Schema

```sql
-- Accounts table additions
reactivated_at TIMESTAMPTZ         -- When last reactivated
reactivation_count INTEGER         -- Times reactivated
last_cancellation_reason TEXT      -- Why they left

-- Account events tracking
account_events (
  id UUID PRIMARY KEY,
  account_id UUID,
  event_type TEXT,              -- 'reactivation', 'cancellation'
  event_data JSONB,
  created_at TIMESTAMPTZ
)
```

## Pricing Examples

### Monthly Plans
| Plan    | Regular | With Offer | Savings |
|---------|---------|------------|---------|
| Grower  | $15     | $7.50      | $7.50   |
| Builder | $35     | $17.50     | $17.50  |
| Maven   | $100    | $50        | $50     |

### Annual Plans
| Plan    | Regular | With Offer | Savings |
|---------|---------|------------|---------|
| Grower  | $153    | $122.40    | $30.60  |
| Builder | $357    | $285.60    | $71.40  |
| Maven   | $1,020  | $816       | $204    |

## Key Benefits

### For Users
- **Simple & Clear**: One offer, no confusion
- **Generous**: 50% off monthly is substantial
- **Flexible**: Choose monthly or annual
- **No Pressure**: No time limits or expiry

### For Business
- **Higher Conversion**: Simple offers convert better
- **Reduced Support**: No confusion about eligibility
- **Better Tracking**: Clean analytics without tiers
- **Easy Maintenance**: Less code, fewer edge cases

## Monitoring & Analytics

### Key Metrics
```sql
-- Reactivation rate
SELECT 
  COUNT(*) FILTER (WHERE reactivated_at IS NOT NULL) * 100.0 / 
  COUNT(*) as reactivation_rate
FROM accounts 
WHERE deleted_at IS NOT NULL;

-- Average time to return
SELECT AVG(reactivated_at - deleted_at) as avg_return_time
FROM accounts 
WHERE reactivated_at IS NOT NULL;

-- Billing choice on reactivation
SELECT 
  COUNT(*) FILTER (WHERE plan LIKE '%_annual') as chose_annual,
  COUNT(*) FILTER (WHERE plan LIKE '%_monthly') as chose_monthly
FROM account_events 
WHERE event_type = 'reactivation';
```

### Stripe Dashboard
Monitor in Stripe Dashboard:
1. Go to **Products → Coupons**
2. Filter by `PR_WELCOME_BACK_*`
3. View usage statistics
4. Track redemption rates

## Testing

### Manual Test Flow
1. Create test account
2. Cancel subscription
3. Log back in
4. Verify offer shows
5. Select plan
6. Confirm discount in Stripe checkout
7. Complete payment
8. Verify access restored

### Automated Test
```bash
npm run test:reactivation
```

## Troubleshooting

### Offer Not Showing
- Check `deleted_at` is set on account
- Verify user is authenticated
- Check console for errors
- Ensure coupons exist in Stripe

### Discount Not Applied
- Verify coupon IDs match
- Check Stripe API keys (test vs live)
- Ensure `isReactivation` flag is passed
- Check billing period is correct

### Account Not Reactivating
- Run Prisma migrations
- Check database fields exist
- Verify 90-day retention period
- Check AuthContext returns 'requires_action'

## Security Considerations

- **One-time use**: Coupons apply once per subscription
- **Automatic**: No manual codes to share/abuse
- **Tracked**: Reactivation count prevents gaming
- **Logged**: All events tracked in account_events

## Future Enhancements

Consider adding:
- Email reminders at 30/60/80 days
- Win-back email campaigns
- A/B test different discount amounts
- Special offers for high-value customers
- Referral bonuses for returning users

## Environment Variables

```env
# Required for Stripe integration
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx

# Price IDs for each plan
STRIPE_PRICE_ID_GROWER=price_xxx
STRIPE_PRICE_ID_GROWER_ANNUAL=price_xxx
STRIPE_PRICE_ID_BUILDER=price_xxx
STRIPE_PRICE_ID_BUILDER_ANNUAL=price_xxx
STRIPE_PRICE_ID_MAVEN=price_xxx
STRIPE_PRICE_ID_MAVEN_ANNUAL=price_xxx
```

## Success Criteria

✅ System is working when:
- Cancelled users can log in
- Welcome back offer displays
- Correct discount applied (50% monthly / 20% annual)
- Stripe checkout shows discounted price
- Subscription created successfully
- Account fully reactivated with all data

## Contact

For issues or questions about the reactivation system:
- Check logs in Stripe Dashboard
- Review account_events table
- Monitor failed_webhooks for issues