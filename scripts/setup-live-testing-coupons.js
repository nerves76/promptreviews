/**
 * Setup Testing Coupons for LIVE Mode
 * 
 * Creates special testing coupons in LIVE Stripe mode
 * for admin accounts to test with $1-3 pricing
 * 
 * WARNING: Run this script carefully as it creates LIVE coupons
 * that could be used by real customers if the code is shared
 */

require('dotenv').config({ path: '.env.vercel' });
const Stripe = require('stripe');

// Use LIVE key from .env.vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupLiveTestingCoupons() {
  console.log('🔴 LIVE MODE: Setting up testing coupons for production...\n');
  console.log('⚠️  WARNING: This will create REAL coupons in your LIVE Stripe account!\n');
  
  // Safety check
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.error('❌ This script requires a LIVE Stripe key (sk_live_*)');
    console.error('   Current key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 8));
    process.exit(1);
  }
  
  try {
    // Check for existing test coupons first
    console.log('🔍 Checking for existing TESTDEV_99 coupon...');
    
    try {
      const existing = await stripe.coupons.retrieve('TESTDEV_99');
      console.log('✅ TESTDEV_99 already exists in LIVE mode');
      console.log(`   - ${existing.percent_off}% off, duration: ${existing.duration}`);
      return;
    } catch (err) {
      if (err.code === 'resource_missing') {
        console.log('📝 TESTDEV_99 not found, creating it...');
      } else {
        throw err;
      }
    }
    
    // Create 99% off test coupon for admins
    const coupon = await stripe.coupons.create({
      id: 'TESTDEV_99',
      name: 'Admin Testing - 99% Off',
      percent_off: 99,
      duration: 'forever',
      metadata: {
        type: 'admin_testing',
        description: 'Internal admin testing - 99% off everything',
        created_by: 'setup-live-testing-coupons',
        warning: 'ADMIN USE ONLY - DO NOT SHARE'
      }
    });
    
    console.log('✅ Created TESTDEV_99 in LIVE mode - 99% off everything');
    console.log('   This makes all plans cost ~$1-3 for testing');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 LIVE Testing Coupon Ready!\n');
    console.log('⚠️  CRITICAL WARNINGS:');
    console.log('   1. This is a LIVE coupon that affects real payments');
    console.log('   2. Only share with admin accounts');
    console.log('   3. The code automatically applies this for is_admin=true accounts');
    console.log('   4. Monitor usage to prevent abuse');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error setting up LIVE testing coupons:', error.message);
    process.exit(1);
  }
}

// Add confirmation prompt for safety
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  This script will create coupons in your LIVE Stripe account.');
console.log('   These will affect REAL payments!\n');

rl.question('Type "yes" to continue: ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    setupLiveTestingCoupons().then(() => {
      rl.close();
    });
  } else {
    console.log('❌ Cancelled');
    rl.close();
  }
});