/**
 * Stripe Reactivation Offers (Simplified)
 * 
 * CRITICAL: Manages Stripe coupons for returning customers
 * Simple offer: 20% off for 3 months (monthly) or 20% off once (annual)
 * 
 * @description No time-based tiers, just a welcome back discount
 */

import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil'
});

// ============================================
// TYPES
// ============================================

export interface ReactivationOffer {
  isEligible: boolean;
  monthlyDiscount: number;
  annualDiscount: number;
  message: string;
  monthlyCouponCode?: string;
  annualCouponCode?: string;
}

// ============================================
// COUPON DEFINITIONS
// ============================================

// Simple, clean offer structure
const REACTIVATION_COUPONS = {
  monthly: {
    id: 'COMEBACK20_MONTHLY',
    percentOff: 20,
    duration: 'repeating' as const,
    durationInMonths: 3,
    name: 'Comeback Offer - 20% off for 3 months',
    metadata: {
      type: 'reactivation',
      billing: 'monthly'
    }
  },
  annual: {
    id: 'COMEBACK20_ANNUAL', 
    percentOff: 20,
    duration: 'once' as const,
    name: 'Comeback Offer - 20% off annual plan',
    metadata: {
      type: 'reactivation',
      billing: 'annual'
    }
  }
};

// ============================================
// COUPON MANAGEMENT
// ============================================

/**
 * Ensure reactivation coupons exist in Stripe
 */
export async function ensureReactivationCoupons(): Promise<void> {
  console.log('🎟️ Setting up simplified reactivation coupons...');
  
  for (const [billingType, config] of Object.entries(REACTIVATION_COUPONS)) {
    try {
      // Check if coupon exists
      try {
        await stripe.coupons.retrieve(config.id);
        console.log(`✅ Coupon ${config.id} already exists`);
        continue;
      } catch (err: any) {
        if (err.code !== 'resource_missing') {
          throw err;
        }
        // Coupon doesn't exist, create it
      }
      
      // Create the coupon
      const coupon = await stripe.coupons.create({
        id: config.id,
        percent_off: config.percentOff,
        duration: config.duration,
        name: config.name,
        metadata: config.metadata
      });
      
      console.log(`✅ Created coupon: ${coupon.id}`);
      
      // Also create a promotion code
      const promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: config.id,
        metadata: {
          ...config.metadata,
          auto_generated: 'true'
        }
      });
      
      console.log(`✅ Created promo code: ${promoCode.code}`);
      
    } catch (error) {
      console.error(`❌ Error managing coupon ${config.id}:`, error);
    }
  }
}

/**
 * Get reactivation offer for any returning user
 * No time-based logic - everyone gets the same offer
 */
export async function getReactivationOffer(
  userId: string,
  accountDeleted: boolean
): Promise<ReactivationOffer> {
  console.log('🎁 Checking reactivation offer eligibility', {
    userId,
    accountDeleted
  });
  
  // Simple check - if account was deleted, they get the offer
  if (!accountDeleted) {
    return {
      isEligible: false,
      monthlyDiscount: 0,
      annualDiscount: 0,
      message: 'No reactivation offer needed'
    };
  }
  
  return {
    isEligible: true,
    monthlyDiscount: 20,
    annualDiscount: 20,
    message: 'Welcome back! Get 20% off your first 3 months (monthly) or 20% off your first year (annual).',
    monthlyCouponCode: REACTIVATION_COUPONS.monthly.id,
    annualCouponCode: REACTIVATION_COUPONS.annual.id
  };
}

/**
 * Apply reactivation offer to a checkout session
 * Chooses the right coupon based on billing period
 */
export async function applyReactivationOffer(
  sessionConfig: any,
  userId: string,
  isReactivation: boolean,
  billingPeriod: 'monthly' | 'annual'
): Promise<any> {
  if (!isReactivation) {
    console.log('📊 Not a reactivation - no offer to apply');
    return sessionConfig;
  }
  
  const couponId = billingPeriod === 'annual' 
    ? REACTIVATION_COUPONS.annual.id
    : REACTIVATION_COUPONS.monthly.id;
  
  console.log(`🎟️ Applying reactivation coupon: ${couponId}`);
  
  // Add coupon to checkout session
  return {
    ...sessionConfig,
    discounts: [{
      coupon: couponId
    }],
    metadata: {
      ...sessionConfig.metadata,
      reactivation_offer: 'true',
      reactivation_billing: billingPeriod,
      reactivation_discount: '20',
      discount_duration: billingPeriod === 'annual' ? 'once' : '3_months'
    }
  };
}

/**
 * Delete old coupons (cleanup)
 */
export async function deleteOldReactivationCoupons(): Promise<void> {
  const oldCouponIds = [
    'COMEBACK50',
    'WINBACK25', 
    'LOYALTY20',
    'PR_WELCOME_BACK_50',
    'PR_MISSED_YOU_25',
    'PR_VALUED_CUSTOMER_20',
    'PR_THANKS_20'
  ];
  
  console.log('🧹 Cleaning up old reactivation coupons...');
  
  for (const couponId of oldCouponIds) {
    try {
      await stripe.coupons.del(couponId);
      console.log(`✅ Deleted old coupon: ${couponId}`);
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        console.log(`⏭️ Coupon ${couponId} doesn't exist`);
      } else {
        console.error(`❌ Error deleting ${couponId}:`, error.message);
      }
    }
  }
}

/**
 * CLI command to setup new coupons
 */
export async function setupSimplifiedCoupons(): Promise<void> {
  console.log('🚀 Setting up simplified reactivation coupons...');
  
  try {
    // First, clean up old coupons
    await deleteOldReactivationCoupons();
    
    // Then create new ones
    await ensureReactivationCoupons();
    
    console.log('✅ Simplified coupons are ready!');
    
    // List the new coupons
    const coupons = await stripe.coupons.list({ limit: 10 });
    console.log('\n📋 Available reactivation coupons:');
    coupons.data
      .filter(c => c.metadata?.type === 'reactivation')
      .forEach(c => {
        console.log(`  - ${c.id}: ${c.percent_off}% off`);
      });
      
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}