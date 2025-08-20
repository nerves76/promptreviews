/**
 * Testing Mode for Admin Users
 * 
 * Enables special testing features for admin accounts
 * including $1-3 pricing for all plans
 * 
 * This is tied to the is_admin flag in the accounts table
 * rather than hardcoded emails for better security and flexibility
 * 
 * ⚠️ TEMPORARY LIVE MODE ENABLED - REMOVE BEFORE PRODUCTION ⚠️
 * The coupon is currently applied in BOTH test and live modes.
 * To disable live mode discounts, remove "|| isLiveMode" from line 92
 */

import { createClient } from '@/auth/providers/supabase';

// Cache admin status for the request lifecycle
const adminCache = new Map<string, boolean>();

export async function isTestingAccount(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  
  // Check cache first
  if (adminCache.has(email)) {
    return adminCache.get(email) || false;
  }
  
  try {
    // Check if user has admin privileges
    const supabase = createClient();
    const { data, error } = await supabase
      .from('accounts')
      .select('is_admin')
      .eq('email', email.toLowerCase())
      .single();
    
    const isAdmin = data?.is_admin === true;
    
    // Cache the result
    adminCache.set(email, isAdmin);
    
    if (isAdmin) {
      console.log('👑 Admin testing mode available for:', email);
    }
    
    return isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export function getTestingCoupon(billingPeriod: 'monthly' | 'annual'): string | null {
  // Only in development or for specific accounts
  if (process.env.NODE_ENV === 'production') {
    // Even in production, allow for specific test accounts
    return 'TESTDEV_99'; // 99% off everything
  }
  
  // In development, use specific coupons
  return billingPeriod === 'annual' ? 'TESTDEV_ANNUAL' : 'TESTDEV_MONTHLY';
}

export interface TestingPricing {
  monthly: number;
  annual: number;
  displayMonthly: string;
  displayAnnual: string;
}

export function getTestingPrices(): TestingPricing {
  return {
    monthly: 100, // $1.00 in cents
    annual: 300,  // $3.00 in cents
    displayMonthly: '$1',
    displayAnnual: '$3'
  };
}

// Helper to modify checkout session for testing
export async function applyTestingMode(sessionConfig: any, email: string, billingPeriod: 'monthly' | 'annual') {
  const isAdmin = await isTestingAccount(email);
  
  if (!isAdmin) {
    return sessionConfig;
  }
  
  console.log('🧪 Admin testing mode activated for:', email);
  
  // Check Stripe mode
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
  
  // TEMPORARY: Apply coupon in both test AND live modes for admin testing
  // WARNING: Remove this for production to prevent accidental discounts
  if (isTestMode || isLiveMode) {
    console.log('💰 Applying 99% discount for admin testing (prices will be ~$1)');
    console.log(`📍 Mode: ${isTestMode ? 'TEST' : 'LIVE'} - Admin discount enabled`);
    
    // Apply 99% off coupon
    sessionConfig.discounts = [{
      coupon: 'TESTDEV_99'
    }];
    
    // Add metadata
    sessionConfig.metadata = {
      ...sessionConfig.metadata,
      testing_mode: 'true',
      admin_account: email,
      discount_applied: '99_percent',
      stripe_mode: isTestMode ? 'test' : 'live',
      warning: 'Admin testing discount applied'
    };
  } else {
    console.log('⚠️ Unknown Stripe mode - no discount applied');
    
    // Add metadata but no automatic discount
    sessionConfig.metadata = {
      ...sessionConfig.metadata,
      testing_mode: 'true',
      admin_account: email,
      stripe_mode: 'unknown',
      note: 'Manual discount required'
    };
  }
  
  // Allow promotion codes for additional testing
  sessionConfig.allow_promotion_codes = true;
  
  return sessionConfig;
}