#!/usr/bin/env node

/**
 * Script to create the TESTDEV_99 coupon in Stripe for admin testing
 * This coupon gives 99% off all plans for admin users
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ Missing STRIPE_SECRET_KEY in environment variables');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function createTestCoupon() {
  try {
    console.log('🎫 Creating TESTDEV_99 coupon for admin testing...');
    
    // Check if coupon already exists
    try {
      const existingCoupon = await stripe.coupons.retrieve('TESTDEV_99');
      if (existingCoupon) {
        console.log('✅ Coupon TESTDEV_99 already exists:');
        console.log(`   - Discount: ${existingCoupon.percent_off}% off`);
        console.log(`   - Duration: ${existingCoupon.duration}`);
        console.log(`   - Valid: ${existingCoupon.valid}`);
        return;
      }
    } catch (error) {
      // Coupon doesn't exist, continue to create it
      console.log('📝 Coupon does not exist, creating it now...');
    }
    
    // Create the coupon
    const coupon = await stripe.coupons.create({
      id: 'TESTDEV_99',
      percent_off: 99,
      duration: 'repeating',
      duration_in_months: 12, // Valid for 12 months
      metadata: {
        purpose: 'Admin testing',
        description: 'For admin accounts to test at $1-3 pricing'
      }
    });
    
    console.log('✅ Successfully created TESTDEV_99 coupon!');
    console.log('📊 Coupon details:');
    console.log(`   - ID: ${coupon.id}`);
    console.log(`   - Discount: ${coupon.percent_off}% off`);
    console.log(`   - Duration: ${coupon.duration} (${coupon.duration_in_months} months)`);
    console.log(`   - Valid: ${coupon.valid}`);
    console.log('');
    console.log('💡 How it works:');
    console.log('   1. Admin users (is_admin=true) will automatically get this discount');
    console.log('   2. Regular prices will show in the UI');
    console.log('   3. At checkout, prices will be reduced by 99%');
    console.log('   4. Final prices: ~$1/month or ~$3/year');
    
  } catch (error) {
    console.error('❌ Error creating coupon:', error.message);
    if (error.raw) {
      console.error('Stripe error details:', error.raw);
    }
    process.exit(1);
  }
}

// Run the script
createTestCoupon();