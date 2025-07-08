# STRIPE WEBHOOK SETUP GUIDE

## Setup Instructions

### For Local Development (Using Stripe CLI)

**Step 1: Install Stripe CLI**
```bash
# On macOS (using Homebrew)
brew install stripe/stripe-cli/stripe

# On other platforms, download from: https://github.com/stripe/stripe-cli/releases
```

**Step 2: Login to Stripe CLI**
```bash
stripe login
```

**Step 3: Forward webhooks to your local server**
```bash
stripe listen --forward-to localhost:3002/api/stripe-webhook
```

This command will:
- Create a temporary webhook endpoint that forwards to your local server
- Display a webhook signing secret (starts with `whsec_`)
- Show you the webhook endpoint URL

**Step 4: Copy the webhook secret**
The CLI will show output like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

Copy this secret and update your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Step 5: Restart your development server**
```bash
npm run dev
```

**Step 6: Test the webhook**
In another terminal, trigger a test webhook:
```bash
stripe trigger payment_intent.succeeded
```

### For Production Deployment

**Step 1: Create webhook endpoint in Stripe Dashboard**
1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/stripe-webhook`
4. Select API version: `2025-06-30.basil`
5. Select events (see Required Events section below)

**Step 2: Configure webhook secret**
1. Copy the webhook signing secret from the Stripe Dashboard
2. Add it to your production environment variables:
```
STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
```

## Testing Your Webhook

### Using Stripe CLI (Recommended)
```bash
# Test a successful payment
stripe trigger payment_intent.succeeded

# Test a failed payment
stripe trigger payment_intent.payment_failed

# Test subscription creation
stripe trigger customer.subscription.created
```

### Manual Testing
1. Create a test payment in your app
2. Check your server logs for webhook processing
3. Verify the account plan was updated in your database

## Troubleshooting

### Common Issues

**1. Webhook Secret Mismatch**
- Error: `Invalid signature`
- Solution: Ensure the webhook secret matches between Stripe and your `.env.local`

**2. Stripe CLI Not Forwarding**
- Error: `Connection refused`
- Solution: Ensure your dev server is running on port 3002 before starting `stripe listen`

**3. Missing Events**
- Error: Webhook receives unexpected event types
- Solution: Check your webhook configuration includes all required events

**4. Local Development Issues**
- Never use localhost URLs in Stripe Dashboard
- Always use Stripe CLI for local development
- Production webhooks need publicly accessible URLs

### Debug Commands
```bash
# Check Stripe CLI status
stripe listen --print-json

# View webhook logs
stripe logs tail

# Test webhook signature verification
node scripts/check-stripe-mode.js
```

## Required Events

Configure your webhook to listen for these events:

### Subscription Events
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Plan changes, status updates (including past_due)
- `customer.subscription.deleted` - Subscription cancellation
- `customer.subscription.trial_will_end` - Trial ending soon
- `customer.subscription.paused` - Subscription paused
- `customer.subscription.resumed` - Subscription resumed

### Payment Events
- `invoice.payment_succeeded` - Successful payment
- `invoice.payment_failed` - Failed payment
- `invoice.payment_action_required` - Payment requires action (expired card)
- `payment_method.automatically_updated` - Card updated automatically

## API Configuration

Your webhook endpoint should be configured with:
- **API Version**: `2025-06-30.basil`
- **Mode**: TEST (for development) or LIVE (for production)
- **URL**: Use Stripe CLI forwarding for local development

## Security Notes

1. **Never commit webhook secrets to version control**
2. **Always verify webhook signatures** (our code does this automatically)
3. **Use HTTPS in production** (required by Stripe)
4. **Implement idempotency** for webhook processing (our code handles this)

## Example: Complete Local Development Setup

```bash
# Terminal 1: Start your development server
npm run dev

# Terminal 2: Start Stripe CLI forwarding
stripe listen --forward-to localhost:3002/api/stripe-webhook

# Terminal 3: Test webhook
stripe trigger customer.subscription.created
```

Your output should show successful webhook processing in the development server logs.

## Monitoring

### Check Webhook Status
```bash
# View recent webhook deliveries
stripe logs tail

# Check webhook endpoint health
curl -X POST http://localhost:3002/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "ping"}'
```

### Important Log Messages to Watch For
- `✅ Webhook signature verified successfully`
- `🔄 Processing [event_type] for customer [customer_id]`
- `💰 Account plan updated: [old_plan] → [new_plan]`
- `❌ ERROR: [error_message]` 