#!/usr/bin/env node

/**
 * Setup Simplified Stripe Reactivation Coupons
 * 
 * This replaces the old time-based coupons with simple:
 * - 50% off first month for monthly billing
 * - 20% off first year for annual billing
 * 
 * Usage:
 *   npm run setup:simplified-coupons
 *   
 * Or for production:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-simplified-coupons.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Validate environment
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY environment variable');
  console.error('Please add it to your .env file');
  process.exit(1);
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil'
});

// Old coupons to clean up
const OLD_COUPONS = [
  'COMEBACK50',
  'WINBACK25',
  'LOYALTY20',
  'PR_WELCOME_BACK_50',
  'PR_MISSED_YOU_25',
  'PR_VALUED_CUSTOMER_20',
  'PR_THANKS_20'
];

// New simplified coupons
const NEW_COUPONS = [
  {
    id: 'PR_WELCOME_BACK_MONTHLY',
    percent_off: 50,
    duration: 'once',
    name: 'Welcome Back - 50% Off First Month',
    metadata: {
      type: 'reactivation',
      billing: 'monthly',
      description: 'For returning users on monthly plans'
    }
  },
  {
    id: 'PR_WELCOME_BACK_ANNUAL',
    percent_off: 20,
    duration: 'once', 
    name: 'Welcome Back - 20% Off First Year',
    metadata: {
      type: 'reactivation',
      billing: 'annual',
      description: 'For returning users on annual plans'
    }
  }
];

async function deleteOldCoupons() {
  console.log('\n🧹 Cleaning up old time-based coupons...');
  console.log('=========================================');
  
  let deleted = 0;
  let notFound = 0;
  
  for (const couponId of OLD_COUPONS) {
    try {
      await stripe.coupons.del(couponId);
      console.log(`✅ Deleted: ${couponId}`);
      deleted++;
    } catch (error) {
      if (error.code === 'resource_missing') {
        console.log(`⏭️  Not found: ${couponId}`);
        notFound++;
      } else {
        console.error(`❌ Error deleting ${couponId}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Cleanup complete: ${deleted} deleted, ${notFound} not found`);
}

async function createNewCoupons() {
  console.log('\n🎟️ Creating simplified coupons...');
  console.log('=========================================');
  
  let created = 0;
  let existing = 0;
  let failed = 0;
  
  for (const config of NEW_COUPONS) {
    try {
      console.log(`\n📋 Processing: ${config.name}`);
      console.log(`   ID: ${config.id}`);
      console.log(`   Discount: ${config.percent_off}%`);
      
      // Check if coupon already exists
      try {
        const existingCoupon = await stripe.coupons.retrieve(config.id);
        console.log(`   ✅ Already exists`);
        existing++;
        continue;
      } catch (err) {
        if (err.code !== 'resource_missing') {
          throw err;
        }
        // Coupon doesn't exist, create it
      }
      
      // Create the coupon
      const coupon = await stripe.coupons.create({
        id: config.id,
        percent_off: config.percent_off,
        duration: config.duration,
        name: config.name,
        metadata: config.metadata
      });
      
      console.log(`   ✅ Created successfully!`);
      created++;
      
      // Try to create a promotion code
      try {
        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: config.id,
          metadata: {
            ...config.metadata,
            auto_generated: 'true'
          }
        });
        console.log(`   ✅ Promo code created: ${promoCode.code}`);
      } catch (promoError) {
        if (promoError.code === 'resource_already_exists') {
          console.log(`   ℹ️  Promo code already exists`);
        } else {
          console.log(`   ⚠️  Could not create promo code: ${promoError.message}`);
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Creation complete: ${created} created, ${existing} existing, ${failed} failed`);
}

async function main() {
  console.log('🚀 Stripe Coupon Simplification');
  console.log('================================\n');
  
  // Check which mode we're in
  try {
    const balance = await stripe.balance.retrieve();
    const isTestMode = balance.livemode === false;
    console.log(`📍 Stripe Mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
    
    if (!isTestMode) {
      console.log('\n⚠️  WARNING: You are in LIVE mode!');
      console.log('This will affect real production coupons.\n');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Stripe:', error.message);
    process.exit(1);
  }
  
  // Step 1: Delete old coupons
  await deleteOldCoupons();
  
  // Step 2: Create new coupons
  await createNewCoupons();
  
  // Step 3: List final state
  console.log('\n📋 Final Reactivation Coupons:');
  console.log('=========================================');
  
  try {
    const coupons = await stripe.coupons.list({ limit: 100 });
    const reactivationCoupons = coupons.data.filter(c => c.metadata?.type === 'reactivation');
    
    if (reactivationCoupons.length === 0) {
      console.log('No reactivation coupons found');
    } else {
      reactivationCoupons.forEach(c => {
        console.log(`\n• ${c.id}: ${c.percent_off}% off`);
        console.log(`  Name: ${c.name}`);
        console.log(`  Billing: ${c.metadata?.billing || 'any'}`);
        console.log(`  Valid: ${c.valid ? '✅' : '❌'}`);
      });
    }
  } catch (error) {
    console.error('Could not list coupons:', error.message);
  }
  
  // Summary
  console.log('\n=========================================');
  console.log('✅ SIMPLIFIED SETUP COMPLETE');
  console.log('=========================================');
  console.log('\nWhat\'s changed:');
  console.log('  ❌ Removed: Time-based tiers (7 days, 30 days, etc.)');
  console.log('  ✅ Added: Simple 50% off monthly / 20% off annual');
  console.log('\nAll returning users now get:');
  console.log('  • Monthly plans: 50% off first month');
  console.log('  • Annual plans: 20% off first year');
  console.log('\nNo time limits, no complexity!');
}

// Run
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});