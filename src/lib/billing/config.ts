/**
 * Centralized Billing Configuration
 * 
 * Single source of truth for all billing-related constants and settings
 * This prevents duplication and ensures consistency across the application
 */

import Stripe from 'stripe';
import { StripeWithRetry } from './retry';

// Validate environment variables at module load time
const requiredEnvVars = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID_GROWER: process.env.STRIPE_PRICE_ID_GROWER,
  STRIPE_PRICE_ID_BUILDER: process.env.STRIPE_PRICE_ID_BUILDER,
  STRIPE_PRICE_ID_MAVEN: process.env.STRIPE_PRICE_ID_MAVEN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Optional environment variables
const optionalEnvVars = {
  STRIPE_PRICE_ID_GROWER_ANNUAL: process.env.STRIPE_PRICE_ID_GROWER_ANNUAL,
  STRIPE_PRICE_ID_BUILDER_ANNUAL: process.env.STRIPE_PRICE_ID_BUILDER_ANNUAL,
  STRIPE_PRICE_ID_MAVEN_ANNUAL: process.env.STRIPE_PRICE_ID_MAVEN_ANNUAL,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_PORTAL_RETURN_URL: process.env.NEXT_PUBLIC_PORTAL_RETURN_URL,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('❌ Missing required environment variables:', missingVars);
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

/**
 * Stripe API configuration
 */
export const STRIPE_CONFIG = {
  API_VERSION: '2025-06-30.basil' as Stripe.LatestApiVersion,
  SECRET_KEY: requiredEnvVars.STRIPE_SECRET_KEY!,
  WEBHOOK_SECRET: optionalEnvVars.STRIPE_WEBHOOK_SECRET,
  IS_TEST_MODE: requiredEnvVars.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false,
};

/**
 * Price IDs for each plan and billing period
 */
export const PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  grower: {
    monthly: requiredEnvVars.STRIPE_PRICE_ID_GROWER!,
    annual: optionalEnvVars.STRIPE_PRICE_ID_GROWER_ANNUAL || requiredEnvVars.STRIPE_PRICE_ID_GROWER!,
  },
  builder: {
    monthly: requiredEnvVars.STRIPE_PRICE_ID_BUILDER!,
    annual: optionalEnvVars.STRIPE_PRICE_ID_BUILDER_ANNUAL || requiredEnvVars.STRIPE_PRICE_ID_BUILDER!,
  },
  maven: {
    monthly: requiredEnvVars.STRIPE_PRICE_ID_MAVEN!,
    annual: optionalEnvVars.STRIPE_PRICE_ID_MAVEN_ANNUAL || requiredEnvVars.STRIPE_PRICE_ID_MAVEN!,
  },
};

/**
 * Plan features and limits
 */
export const PLAN_LIMITS = {
  grower: {
    maxUsers: 1,
    maxLocations: 1,
    promptPages: 3,
    contacts: 0,
    hasWorkflow: false,
    hasGoogleBusiness: true,
  },
  builder: {
    maxUsers: 3,
    maxLocations: 3,
    promptPages: 50,
    contacts: 1000,
    hasWorkflow: true,
    hasGoogleBusiness: true,
  },
  maven: {
    maxUsers: 5,
    maxLocations: 10,
    promptPages: 500,
    contacts: 10000,
    hasWorkflow: true,
    hasGoogleBusiness: true,
  },
};

/**
 * Plan display information
 */
export const PLAN_DISPLAY = {
  grower: {
    name: 'Grower',
    monthlyPrice: 15,
    annualPrice: 153, // $12.75/month
    order: 1,
  },
  builder: {
    name: 'Builder',
    monthlyPrice: 35,
    annualPrice: 357, // $29.75/month
    order: 2,
  },
  maven: {
    name: 'Maven',
    monthlyPrice: 100,
    annualPrice: 1020, // $85/month
    order: 3,
  },
};

/**
 * Portal Configuration IDs
 * These ensure customers see the Prompt Reviews-specific portal
 */
export const PORTAL_CONFIG = {
  // Test mode configuration
  TEST: 'bpc_1RzJ9bLqwlpgZPtwU6KEsJUN',
  // Live mode configuration - update this after creating live config
  LIVE: process.env.STRIPE_PORTAL_CONFIG_LIVE || '',
  // Helper to get the right config based on mode
  get CURRENT() {
    return STRIPE_CONFIG.IS_TEST_MODE ? this.TEST : this.LIVE;
  }
};

/**
 * URLs for redirects
 */
export const BILLING_URLS = {
  APP_URL: requiredEnvVars.NEXT_PUBLIC_APP_URL!,
  PORTAL_RETURN_URL: optionalEnvVars.NEXT_PUBLIC_PORTAL_RETURN_URL || 
    `${requiredEnvVars.NEXT_PUBLIC_APP_URL}/dashboard/plan?success=1&change=billing_period`,
  SUCCESS_URL: (changeType: string, plan: string, billing?: string) => 
    `${requiredEnvVars.NEXT_PUBLIC_APP_URL}/dashboard/plan?success=1&change=${changeType}&plan=${plan}${billing ? `&billing=${billing}` : ''}`,
  CANCEL_URL: `${requiredEnvVars.NEXT_PUBLIC_APP_URL}/dashboard?canceled=1`,
};

/**
 * Supabase configuration
 */
export const SUPABASE_CONFIG = {
  URL: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  SERVICE_ROLE_KEY: requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
};

/**
 * Helper function to create a configured Stripe instance
 */
export function createStripeClient(): Stripe {
  if (!STRIPE_CONFIG.SECRET_KEY) {
    throw new Error('Stripe secret key is not configured');
  }
  
  return new Stripe(STRIPE_CONFIG.SECRET_KEY, {
    apiVersion: STRIPE_CONFIG.API_VERSION,
  });
}

/**
 * Helper function to create a Stripe client with retry logic
 */
export function createStripeClientWithRetry(): StripeWithRetry {
  const stripe = createStripeClient();
  return new StripeWithRetry(stripe, {
    maxRetries: 3,
    initialDelay: 1000,
  });
}

/**
 * Helper function to get plan order for comparison
 */
export function getPlanOrder(plan: string): number {
  const planData = PLAN_DISPLAY[plan as keyof typeof PLAN_DISPLAY];
  return planData?.order ?? 0;
}

/**
 * Helper function to determine if a plan change is an upgrade or downgrade
 */
export function getPlanChangeType(currentPlan: string, targetPlan: string): 'upgrade' | 'downgrade' | 'same' {
  const currentOrder = getPlanOrder(currentPlan);
  const targetOrder = getPlanOrder(targetPlan);
  
  if (targetOrder > currentOrder) return 'upgrade';
  if (targetOrder < currentOrder) return 'downgrade';
  return 'same';
}

/**
 * Helper function to validate plan name
 */
export function isValidPlan(plan: string): boolean {
  return plan in PRICE_IDS;
}

/**
 * Helper function to get price ID for a plan and billing period
 */
export function getPriceId(plan: string, billingPeriod: 'monthly' | 'annual' = 'monthly'): string | null {
  const planPrices = PRICE_IDS[plan];
  if (!planPrices) return null;
  
  return planPrices[billingPeriod] || planPrices.monthly;
}

/**
 * Type definitions
 */
export type PlanKey = 'grower' | 'builder' | 'maven';
export type BillingPeriod = 'monthly' | 'annual';
export type PlanChangeType = 'upgrade' | 'downgrade' | 'same' | 'new' | 'billing_period';