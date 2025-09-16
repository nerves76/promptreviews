/**
 * Setup Testing Coupons
 * 
 * Creates special testing coupons that reduce prices to $1-3 for development
 * These coupons are for internal testing only
 * 
 * Test Coupons:
 * - TESTDEV_MONTHLY - $1/month for any monthly plan
 * - TESTDEV_ANNUAL - $3/year for any annual plan
 * - TESTDEV_50 - 50% off (good for partial testing)
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupTestingCoupons() {
  console.log('🧪 Setting up testing coupons for development...\n');
  
  try {
    // Check for existing test coupons first
    const existingCoupons = await stripe.coupons.list({ limit: 100 });
    const testCoupons = existingCoupons.data.filter(c => c.id.startsWith('TESTDEV_'));
    
    if (testCoupons.length > 0) {
      console.log('⚠️  Found existing test coupons:');
      testCoupons.forEach(c => {
        console.log(`   - ${c.id}: ${c.percent_off ? `${c.percent_off}%` : `$${(c.amount_off/100).toFixed(2)}`} off`);
      });
      console.log('\nDelete these first if you want to recreate them.\n');
    }
    
    // Skip amount_off coupons as they don't work well with 'forever' duration
    // We'll just use the 99% off coupon for everything
    
    // Create 99% off test coupon (makes everything ~$1)
    try {
      const percent99Off = await stripe.coupons.create({
        id: 'TESTDEV_99',
        name: 'Test Dev - 99% Off',
        percent_off: 99,
        duration: 'forever',
        metadata: {
          type: 'testing',
          description: 'Internal testing - 99% off everything',
          created_by: 'setup-testing-coupons',
          warning: 'DO NOT USE IN PRODUCTION'
        }
      });
      console.log('✅ Created TESTDEV_99 - 99% off everything (~$1)');
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        console.log('ℹ️  TESTDEV_99 already exists');
      } else {
        throw err;
      }
    }
    
    // Create promotion codes for easy use
    console.log('\n📝 Creating promotion codes for easy checkout...');
    
    try {
      // Promotion code for 99% off
      const promo99 = await stripe.promotionCodes.create({
        coupon: 'TESTDEV_99',
        code: 'TESTDEV99',
        active: true,
        metadata: {
          type: 'testing',
          warning: 'Internal testing only'
        }
      });
      console.log('✅ Created promo code: TESTDEV99 (99% off)');
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        console.log('ℹ️  Promo code TESTDEV99 already exists');
      } else if (err.code === 'promotion_code_already_exists') {
        console.log('ℹ️  Promo code TESTDEV99 already exists');
      } else {
        console.log('⚠️  Could not create promo code:', err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Testing Coupons Ready!\n');
    console.log('For checkout testing, use these:');
    console.log('  • Promo Code: TESTDEV99 - Makes everything ~$1');
    console.log('  • Direct coupons for API: TESTDEV_MONTHLY, TESTDEV_ANNUAL, TESTDEV_99');
    console.log('\n⚠️  WARNING: These are for TESTING ONLY!');
    console.log('Never use these in production or share with real customers.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error setting up testing coupons:', error);
    process.exit(1);
  }
}

// Also create a helper to apply test coupons programmatically
async function applyTestingCoupon(sessionConfig, testMode = 'monthly') {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Testing coupons should not be used in production!');
    return sessionConfig;
  }
  
  const couponMap = {
    'monthly': 'TESTDEV_MONTHLY',
    'annual': 'TESTDEV_ANNUAL', 
    '99off': 'TESTDEV_99'
  };
  
  const couponId = couponMap[testMode] || 'TESTDEV_99';
  
  // Add the coupon to the checkout session
  sessionConfig.discounts = [{
    coupon: couponId
  }];
  
  console.log(`🧪 Applied testing coupon: ${couponId}`);
  return sessionConfig;
}

// Run the setup
setupTestingCoupons();

module.exports = { applyTestingCoupon };