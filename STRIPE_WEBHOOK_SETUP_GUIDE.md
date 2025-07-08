# 🔗 Stripe Webhook Setup Guide

## Problem
Your Stripe webhook secret is from production mode, but your API key is test mode, causing webhook verification failures.

## Solution
Create a test mode webhook endpoint for your app and get the correct test webhook secret.

## Step-by-Step Instructions

### 1. Access Stripe Dashboard
- Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
- **CRITICAL**: Switch to **TEST MODE** (toggle in top-left corner)
- Navigate to **Developers** → **Webhooks**

### 2. Create New Endpoint
Click **"Add endpoint"** and configure:

**Endpoint URL:**
```
http://localhost:3002/api/stripe-webhook
```

**Events to Send:**
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Get Webhook Secret
- Click on your newly created endpoint
- Find **"Signing secret"** section
- Click **"Reveal"**
- Copy the secret (starts with `whsec_test_...`)

### 4. Update Environment
In your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_test_your_copied_secret_here
```

### 5. Test the Setup
```bash
# Restart server
npm run dev

# Verify configuration
node scripts/check-stripe-mode.js
```

## Expected Result
```
✅ Mode consistency: Both API and webhook are in TEST mode
```

## Important Notes
- **Always use TEST mode** for development
- **Webhook URL** must match your app's route exactly
- **Events** must include subscription and payment events
- **Webhook secret** must be from the same mode as your API key

## If You Need Production Setup Later
For production deployment:
1. Switch to **LIVE MODE** in Stripe
2. Update API key to `sk_live_...`
3. Create live webhook endpoint
4. Use live webhook secret `whsec_...` (no "test" prefix)

This will fix the mode mismatch and enable proper webhook processing! 