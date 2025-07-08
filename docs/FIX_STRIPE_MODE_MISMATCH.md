# 🚨 CRITICAL: Fix Stripe Mode Mismatch

## Problem Identified
**Root Cause:** Stripe API key and webhook secret are in different modes, causing webhook signature verification to fail.

**Current State:**
- API Key: `sk_test_...` (TEST MODE)
- Webhook Secret: `whsec_ce4875d7b...` (PRODUCTION MODE)

**Result:** Payments succeed but accounts never get updated because webhooks fail signature verification.

## 🛠️ Solution Options

### Option A: Full Test Mode (Recommended for Development)

**Use test mode for everything:**

1. **Keep current test API key** (`sk_test_...`)
2. **Get test webhook secret** from Stripe Dashboard:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
   - Make sure you're in **Test Mode** (toggle in top left)
   - Find your webhook endpoint
   - Click "Reveal" to get the test webhook secret
   - It should start with `whsec_test_...`

3. **Update `.env.local`**:
   ```bash
   # Keep test API key
   STRIPE_SECRET_KEY=sk_test_...
   
   # Replace with TEST webhook secret
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

### Option B: Full Production Mode (For Live Environment)

**Use production mode for everything:**

1. **Replace API key** with production key:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Keep current webhook secret** (already production):
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_ce4875d7b...
   ```

3. **Update webhook endpoint** to point to production URL
4. **Ensure webhook is in live mode** in Stripe Dashboard

## 🔧 Implementation Steps

### For Development (Test Mode - Recommended)

1. **Get Test Webhook Secret:**
   ```bash
   # Log into Stripe Dashboard
   # Switch to Test Mode (toggle in top left)
   # Go to Webhooks → [Your Endpoint] → Signing secret
   # Copy the whsec_test_... secret
   ```

2. **Update Environment:**
   ```bash
   # In .env.local
   STRIPE_WEBHOOK_SECRET=whsec_test_your_actual_test_secret_here
   ```

3. **Restart Development Server:**
   ```bash
   npm run dev
   ```

4. **Test Payment Flow:**
   - Create a test payment
   - Check webhook logs for successful processing
   - Verify account plan updates correctly

### For Production (Live Mode)

1. **Get Production API Key:**
   ```bash
   # In Stripe Dashboard Live Mode
   # Go to API Keys → Secret Key
   # Copy sk_live_... key
   ```

2. **Update Environment:**
   ```bash
   # In .env.local (or production environment)
   STRIPE_SECRET_KEY=sk_live_your_actual_live_key_here
   STRIPE_WEBHOOK_SECRET=whsec_ce4875d7b...  # Keep existing
   ```

3. **Update Webhook Endpoint:**
   - Point webhook to production URL
   - Ensure it's in live mode

## 🧪 Testing the Fix

After implementing the fix, verify everything works:

1. **Run Mode Check:**
   ```bash
   node scripts/check-stripe-mode.js
   ```
   Should show: ✅ Mode consistency: Both API and webhook are in [MODE] mode

2. **Test Payment:**
   - Go through checkout process
   - Check webhook logs for successful processing
   - Verify account plan updates immediately

3. **Run Detection Script:**
   ```bash
   node scripts/detect-payment-plan-mismatches.js
   ```
   Should show no new mismatches

## 🔍 Verification Commands

```bash
# Check current mode status
node scripts/check-stripe-mode.js

# Test for mismatches
node scripts/detect-payment-plan-mismatches.js

# Check webhook logs
# Look for "✅ Account successfully updated" messages
```

## 📋 Mode Consistency Checklist

- [ ] API key mode matches webhook secret mode
- [ ] Webhook endpoint configured for correct mode
- [ ] Environment variables updated
- [ ] Server restarted
- [ ] Test payment processed successfully
- [ ] Account plan updated immediately
- [ ] No webhook signature verification errors

## 🚨 Emergency: If Users Are Already Affected

1. **Fix mode mismatch first** (above steps)
2. **Run detection script** to find affected users
3. **Manually update accounts** for critical cases:
   ```bash
   # For each affected user
   node scripts/fix-specific-user.js user@email.com
   ```

## 💡 Prevention

To prevent this in the future:

1. **Always use matching modes** for all Stripe configuration
2. **Run mode check** before deploying
3. **Include mode verification** in CI/CD pipeline
4. **Document current mode** in environment setup

## 🎯 Expected Outcome

After fixing the mode mismatch:
- ✅ Payments process correctly
- ✅ Webhooks verify successfully  
- ✅ Accounts update immediately
- ✅ No more plan mismatches
- ✅ Modal behavior works correctly

**This fix will resolve the core issue that caused your payment-plan mismatch problem!** 