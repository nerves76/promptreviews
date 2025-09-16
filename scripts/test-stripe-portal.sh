#!/bin/bash

echo "🧪 Testing Stripe Customer Portal Configuration"
echo "=============================================="
echo ""

# Configuration ID from our setup
CONFIG_ID="bpc_1RzJ9bLqwlpgZPtwU6KEsJUN"

# Check if we have a test customer
echo "1️⃣ Finding or creating test customer..."
TEST_CUSTOMER=$(stripe customers list --limit 1 --email "portal-test@promptreviews.app" | grep -o '"id": "cus_[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEST_CUSTOMER" ]; then
    echo "   Creating new test customer..."
    TEST_CUSTOMER=$(stripe customers create \
        --email="portal-test@promptreviews.app" \
        --name="Portal Test User" \
        --description="Test customer for portal configuration" \
        --metadata="app=prompt_reviews" \
        --metadata="test=true" \
        | grep -o '"id": "cus_[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Created customer: $TEST_CUSTOMER"
else
    echo "   ✅ Using existing customer: $TEST_CUSTOMER"
fi

echo ""
echo "2️⃣ Creating portal session..."
PORTAL_SESSION=$(stripe billing_portal sessions create \
    --customer="$TEST_CUSTOMER" \
    --return-url="http://localhost:3002/dashboard/plan?success=1&test=true" \
    --configuration="$CONFIG_ID")

# Extract the URL
PORTAL_URL=$(echo "$PORTAL_SESSION" | grep -o '"url": "[^"]*"' | cut -d'"' -f4)

echo "   ✅ Portal session created!"
echo ""
echo "3️⃣ Portal Test URL:"
echo "   $PORTAL_URL"
echo ""
echo "📋 What to test:"
echo "   1. Click the URL above to open the portal"
echo "   2. Verify you see 'Manage Your Prompt Reviews Subscription' headline"
echo "   3. Check that these features are available:"
echo "      ✅ Update customer info (email, name, address, phone)"
echo "      ✅ View invoice history"
echo "      ✅ Update payment method"
echo "      ✅ Cancel subscription (with reason options)"
echo "   4. Check that these features are NOT available:"
echo "      ❌ Pause subscription"
echo "      ❌ Change subscription plan (unless configured)"
echo "   5. Try canceling (it's safe, it's a test customer)"
echo "   6. Verify return URL goes to: /dashboard/plan?success=1&test=true"
echo ""
echo "⚠️  Note: If you see the old portal configuration:"
echo "   1. Go to Stripe Dashboard → Settings → Billing → Customer portal"
echo "   2. Set configuration $CONFIG_ID as default"
echo "   3. Run this test again"