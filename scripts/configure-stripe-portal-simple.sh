#!/bin/bash

# Configure Stripe Customer Portal for Prompt Reviews
# This script creates a tailored portal configuration

echo "🔧 Configuring Stripe Customer Portal for Prompt Reviews..."
echo ""

# Create the portal configuration with all necessary settings
stripe billing_portal configurations create \
  --business-profile.headline="Manage Your Prompt Reviews Subscription" \
  --business-profile.privacy-policy-url="https://app.promptreviews.app/privacy" \
  --business-profile.terms-of-service-url="https://app.promptreviews.app/terms" \
  --default-return-url="http://localhost:3002/dashboard/plan?success=1" \
  --features.customer-update.enabled=true \
  --features.customer-update.allowed-updates="email" \
  --features.customer-update.allowed-updates="name" \
  --features.customer-update.allowed-updates="address" \
  --features.customer-update.allowed-updates="phone" \
  --features.invoice-history.enabled=true \
  --features.payment-method-update.enabled=true \
  --features.subscription-cancel.enabled=true \
  --features.subscription-cancel.mode="at_period_end" \
  --features.subscription-cancel.proration-behavior="none" \
  --features.subscription-cancel.cancellation-reason.enabled=true \
  --features.subscription-cancel.cancellation-reason.options="too_expensive" \
  --features.subscription-cancel.cancellation-reason.options="missing_features" \
  --features.subscription-cancel.cancellation-reason.options="switched_service" \
  --features.subscription-cancel.cancellation-reason.options="unused" \
  --features.subscription-cancel.cancellation-reason.options="customer_service" \
  --features.subscription-cancel.cancellation-reason.options="too_complex" \
  --features.subscription-cancel.cancellation-reason.options="low_quality" \
  --features.subscription-cancel.cancellation-reason.options="other" \
  --features.subscription-update.enabled=false \
  --login-page.enabled=false

echo ""
echo "✅ Portal configuration created!"
echo ""
echo "Note: To enable subscription updates (plan changes), you'll need to:"
echo "1. Configure specific products and prices in the Stripe Dashboard"
echo "2. Go to Settings → Billing → Customer portal"
echo "3. Edit the configuration to add allowed products for updates"