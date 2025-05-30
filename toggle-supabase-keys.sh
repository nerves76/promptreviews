#!/bin/bash

SUPABASE_FILE="src/utils/supabase.ts"
RESEND_FILE="src/utils/resend.ts"
STRIPE_PORTAL_FILE="src/app/api/create-stripe-portal-session/route.ts"
STRIPE_WEBHOOK_FILE="src/app/api/stripe-webhook/route.ts"
STRIPE_CHECKOUT_FILE="src/app/api/create-checkout-session/route.ts"
HARDCODED_URL="\"https://ltneloufqjktdplodvao.supabase.co\""
HARDCODED_KEY="\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmVsb3VmcWprdGRwbG9kdmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNDE1NzgsImV4cCI6MjA2MzYxNzU3OH0.ypbH1mu5m6a4jHFtpJfZPWeQVndtzZcmVELfNdqvgLw\""
HARDCODED_RESEND_KEY="\"re_test_hardcoded_resend_key\""
HARDCODED_STRIPE_SECRET="\"sk_test_hardcoded_key\""
HARDCODED_STRIPE_WEBHOOK="\"whsec_hardcoded_secret\""
HARDCODED_STRIPE_BUILDER="\"price_123\""
HARDCODED_STRIPE_MAVEN="\"price_456\""

if grep -q 'process.env.NEXT_PUBLIC_SUPABASE_URL' "$SUPABASE_FILE"; then
  # Swap to hard-coded
  sed -i '' "s|process.env.NEXT_PUBLIC_SUPABASE_URL|$HARDCODED_URL|g" "$SUPABASE_FILE"
  sed -i '' "s|process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY|$HARDCODED_KEY|g" "$SUPABASE_FILE"
  sed -i '' "s|process.env.RESEND_API_KEY|$HARDCODED_RESEND_KEY|g" "$RESEND_FILE"
  sed -i '' "s|process.env.STRIPE_SECRET_KEY|$HARDCODED_STRIPE_SECRET|g" "$STRIPE_PORTAL_FILE"
  sed -i '' "s|process.env.STRIPE_SECRET_KEY|$HARDCODED_STRIPE_SECRET|g" "$STRIPE_WEBHOOK_FILE"
  sed -i '' "s|process.env.STRIPE_SECRET_KEY|$HARDCODED_STRIPE_SECRET|g" "$STRIPE_CHECKOUT_FILE"
  sed -i '' "s|process.env.STRIPE_WEBHOOK_SECRET|$HARDCODED_STRIPE_WEBHOOK|g" "$STRIPE_WEBHOOK_FILE"
  sed -i '' "s|process.env.STRIPE_PRICE_ID_BUILDER|$HARDCODED_STRIPE_BUILDER|g" "$STRIPE_CHECKOUT_FILE"
  sed -i '' "s|process.env.STRIPE_PRICE_ID_MAVEN|$HARDCODED_STRIPE_MAVEN|g" "$STRIPE_CHECKOUT_FILE"
  echo "[toggle-supabase-keys] Swapped to hard-coded Supabase, Resend, and Stripe keys."
else
  # Swap back to env vars
  sed -i '' "s|$HARDCODED_URL|process.env.NEXT_PUBLIC_SUPABASE_URL|g" "$SUPABASE_FILE"
  sed -i '' "s|$HARDCODED_KEY|process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY|g" "$SUPABASE_FILE"
  sed -i '' "s|$HARDCODED_RESEND_KEY|process.env.RESEND_API_KEY|g" "$RESEND_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_SECRET|process.env.STRIPE_SECRET_KEY|g" "$STRIPE_PORTAL_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_SECRET|process.env.STRIPE_SECRET_KEY|g" "$STRIPE_WEBHOOK_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_SECRET|process.env.STRIPE_SECRET_KEY|g" "$STRIPE_CHECKOUT_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_WEBHOOK|process.env.STRIPE_WEBHOOK_SECRET|g" "$STRIPE_WEBHOOK_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_BUILDER|process.env.STRIPE_PRICE_ID_BUILDER|g" "$STRIPE_CHECKOUT_FILE"
  sed -i '' "s|$HARDCODED_STRIPE_MAVEN|process.env.STRIPE_PRICE_ID_MAVEN|g" "$STRIPE_CHECKOUT_FILE"
  echo "[toggle-supabase-keys] Swapped back to environment variables."
fi 