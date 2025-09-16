# 🚨 CRITICAL: Stripe Mode Mismatch Fix

## Problem Found
- **API Key:** TEST mode (`sk_test_...`)
- **Webhook Secret:** PRODUCTION mode (`whsec_ce4875d7b...`)
- **Result:** Webhooks fail signature verification → accounts never update

## Quick Fix (Test Mode)

1. **Get Test Webhook Secret:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
   - Switch to **Test Mode** (toggle top left)
   - Find your webhook → "Reveal" signing secret
   - Copy the `whsec_test_...` secret

2. **Update `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_test_your_actual_test_secret_here
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

4. **Verify fix:**
   ```bash
   node scripts/check-stripe-mode.js
   ```

## Expected Result
✅ Mode consistency: Both API and webhook are in TEST mode

**This will fix the webhook failures and prevent future payment-plan mismatches!** 