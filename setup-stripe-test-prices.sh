#!/bin/bash

# Setup Stripe Test Mode Products and Prices for PromptReviews
# This script creates products and prices in TEST MODE only

echo "🚀 Setting up Stripe Test Mode products and prices..."
echo "⚠️  Make sure you're logged into Stripe CLI: stripe login"
echo ""

# Create Grower Plan Product
echo "Creating Grower Plan product..."
GROWER_PRODUCT=$(stripe products create \
  --name="Grower" \
  --description="Perfect for small businesses getting started" \
  --metadata[plan]="grower" \
  --metadata[features]="1 team member, Universal prompt page, 3 custom prompt pages, Review widget, Analytics" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Grower Product ID: $GROWER_PRODUCT"

# Create Grower Plan Prices - $15/month (with 14-day trial) or annual pricing
GROWER_PRICE_MONTHLY=$(stripe prices create \
  --product="$GROWER_PRODUCT" \
  --unit-amount=1500 \
  --currency=usd \
  --recurring[interval]=month \
  --recurring[trial_period_days]=14 \
  --metadata[billing_period]="monthly" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

# Annual price for Grower (calculate based on savings pattern)
GROWER_PRICE_ANNUAL=$(stripe prices create \
  --product="$GROWER_PRODUCT" \
  --unit-amount=15300 \
  --currency=usd \
  --recurring[interval]=year \
  --recurring[trial_period_days]=14 \
  --metadata[billing_period]="annual" \
  --metadata[savings]="$27 per year" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Grower Monthly Price ID: $GROWER_PRICE_MONTHLY"
echo "Grower Annual Price ID: $GROWER_PRICE_ANNUAL"
echo ""

# Create Builder Plan Product
echo "Creating Builder Plan product..."
BUILDER_PRODUCT=$(stripe products create \
  --name="Builder" \
  --description="For growing businesses ready to scale" \
  --metadata[plan]="builder" \
  --metadata[features]="3 team members, Workflow management, Universal prompt page, 50 prompt pages, 1000 contacts, Review widget, Analytics, Google Business Profile management" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Builder Product ID: $BUILDER_PRODUCT"

# Create Builder Plan Prices - $35/month or $357/year (saves $63)
BUILDER_PRICE_MONTHLY=$(stripe prices create \
  --product="$BUILDER_PRODUCT" \
  --unit-amount=3500 \
  --currency=usd \
  --recurring[interval]=month \
  --metadata[billing_period]="monthly" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

BUILDER_PRICE_ANNUAL=$(stripe prices create \
  --product="$BUILDER_PRODUCT" \
  --unit-amount=35700 \
  --currency=usd \
  --recurring[interval]=year \
  --metadata[billing_period]="annual" \
  --metadata[savings]="$63 per year" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Builder Monthly Price ID: $BUILDER_PRICE_MONTHLY"
echo "Builder Annual Price ID: $BUILDER_PRICE_ANNUAL"
echo ""

# Create Maven Plan Product
echo "Creating Maven Plan product..."
MAVEN_PRODUCT=$(stripe products create \
  --name="Maven" \
  --description="For established businesses with multiple locations" \
  --metadata[plan]="maven" \
  --metadata[features]="5 team members, Up to 10 Business Locations, Workflow management, 500 prompt pages, 10000 contacts, Review widget, Analytics, Google Business Profile management" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Maven Product ID: $MAVEN_PRODUCT"

# Create Maven Plan Prices - $100/month or $1020/year (saves $180)
MAVEN_PRICE_MONTHLY=$(stripe prices create \
  --product="$MAVEN_PRODUCT" \
  --unit-amount=10000 \
  --currency=usd \
  --recurring[interval]=month \
  --metadata[billing_period]="monthly" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

MAVEN_PRICE_ANNUAL=$(stripe prices create \
  --product="$MAVEN_PRODUCT" \
  --unit-amount=102000 \
  --currency=usd \
  --recurring[interval]=year \
  --metadata[billing_period]="annual" \
  --metadata[savings]="$180 per year" \
  --format=json | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

echo "Maven Monthly Price ID: $MAVEN_PRICE_MONTHLY"
echo "Maven Annual Price ID: $MAVEN_PRICE_ANNUAL"
echo ""

# Output environment variables
echo "✅ Setup complete! Add these to your .env.local file:"
echo ""
echo "# Stripe Test Mode Price IDs (Monthly)"
echo "STRIPE_PRICE_ID_GROWER=$GROWER_PRICE_MONTHLY"
echo "STRIPE_PRICE_ID_BUILDER=$BUILDER_PRICE_MONTHLY"
echo "STRIPE_PRICE_ID_MAVEN=$MAVEN_PRICE_MONTHLY"
echo ""
echo "# Stripe Test Mode Price IDs (Annual)"
echo "STRIPE_PRICE_ID_GROWER_ANNUAL=$GROWER_PRICE_ANNUAL"
echo "STRIPE_PRICE_ID_BUILDER_ANNUAL=$BUILDER_PRICE_ANNUAL"
echo "STRIPE_PRICE_ID_MAVEN_ANNUAL=$MAVEN_PRICE_ANNUAL"
echo ""
echo "# Don't forget to also add your test keys:"
echo "# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..."
echo "# STRIPE_SECRET_KEY=sk_test_..."
echo ""
echo "🔧 To test webhooks locally, run:"
echo "stripe listen --forward-to localhost:3000/api/stripe/webhook"