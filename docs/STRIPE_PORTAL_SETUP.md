# Stripe Customer Portal Configuration for Prompt Reviews

## Overview
This document outlines the Stripe Customer Portal configuration for Prompt Reviews, ensuring users only see relevant options for their subscription management.

## Portal Configuration Details

### Test Mode Configuration
- **Configuration ID**: `bpc_1RzJ9bLqwlpgZPtwU6KEsJUN`
- **Created**: 2025-08-23
- **Status**: Active (needs to be set as default in Dashboard)

### Features Enabled

#### ✅ Customer Information Update
- Users can update: Email, Name, Address, Phone
- Ensures contact information stays current

#### ✅ Invoice History
- Users can view and download past invoices
- Important for accounting and expense tracking

#### ✅ Payment Method Update
- Users can update their credit card or payment method
- Critical for preventing payment failures

#### ✅ Subscription Cancellation
- Mode: Cancel at end of billing period (no immediate termination)
- Proration: None (users keep access until period ends)
- Cancellation reasons collected for feedback:
  - Too expensive
  - Missing features
  - Switched to another service
  - Unused
  - Customer service issues
  - Too complex
  - Low quality
  - Other

#### ❌ Features Disabled
- **Subscription Pause**: Not applicable for Prompt Reviews
- **Subscription Updates**: Disabled in portal (handled via app)
- **Login Page**: Not needed (access via app only)

### Return URL
After any portal action, users return to:
- Test: `http://localhost:3002/dashboard/plan?success=1`
- Production: `https://app.promptreviews.app/dashboard/plan?success=1`

## Setup Instructions

### 1. Make Configuration Default (Required)
1. Go to [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Find configuration `bpc_1RzJ9bLqwlpgZPtwU6KEsJUN`
3. Click "..." menu → "Set as default"

### 2. Enable Subscription Updates (Optional)
If you want users to change plans via the portal:
1. Edit the configuration in Dashboard
2. Enable "Subscription update"
3. Add your products and prices:
   - Grower Plan (monthly/annual)
   - Builder Plan (monthly/annual)
   - Maven Plan (monthly/annual)
4. Set proration behavior to "Always invoice"

### 3. Configure for Production
Repeat the process with live mode:
```bash
# Switch to live mode
stripe --live billing_portal configurations create \
  [same parameters as test mode]
```

## Testing the Portal

### Create Test Customer Session
```bash
# 1. Create a test customer
stripe customers create \
  --email="test@example.com" \
  --name="Test User"

# 2. Create portal session for that customer
stripe billing_portal sessions create \
  --customer="cus_xxxxx" \
  --return-url="http://localhost:3002/dashboard/plan?success=1"
```

### Test via Application
1. Sign up for a test account in your app
2. Subscribe to any plan
3. Go to Account/Plan page
4. Click "Manage Billing"
5. Verify portal shows only relevant options

## Important Considerations

### 1. Plan Changes
Currently disabled in portal because:
- Complex upgrade/downgrade logic handled in app
- Better UX with custom preview/confirmation
- Prevents accidental plan changes

If you enable it:
- Must configure specific products/prices
- Handle proration correctly
- Sync with app's plan change logic

### 2. Multi-App Isolation
Since you use Stripe for multiple apps:
- Each app should have its own portal configuration
- Use metadata to identify app-specific customers
- Consider separate Stripe accounts for complete isolation

### 3. Security
- Portal sessions expire after 24 hours
- Always create fresh sessions on demand
- Never share portal URLs between users
- Use webhook to sync cancellations immediately

## Webhook Integration
Ensure these events are handled in `/api/stripe-webhook`:
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations
- `billing_portal.session.created` - Track portal usage
- `billing_portal.configuration.updated` - Config changes

## Scripts and Tools

### Configuration Script
`/scripts/configure-stripe-portal-simple.sh`
- Creates portal configuration via CLI
- Sets all required parameters
- Works for both test and live modes

### Portal Session Creation (in app)
`/src/app/api/create-stripe-portal-session/route.ts`
- Creates portal sessions for authenticated users
- Checks for free accounts (blocks portal access)
- Returns portal URL for redirect

## Troubleshooting

### Portal Not Loading
- Check configuration is set as default
- Verify customer has valid Stripe ID
- Ensure return URL is whitelisted

### Features Not Showing
- Configuration might not be active
- Check feature flags in Dashboard
- Verify products/prices are configured

### Changes Not Syncing
- Check webhook configuration
- Verify webhook secret is correct
- Monitor webhook logs in Stripe Dashboard

## Next Steps

1. ✅ Test portal thoroughly with test customers
2. ⏳ Set configuration as default in Dashboard
3. ⏳ Configure production portal
4. ⏳ Update return URLs for production
5. ⏳ Add monitoring for portal usage