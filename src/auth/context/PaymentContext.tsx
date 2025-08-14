/**
 * Payment and Subscription Context
 * Handles all payment, subscription, and trial-related state
 */

import { useMemo } from 'react';
import { Account } from '../types';

export interface PaymentState {
  // Subscription Management
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  paymentStatus: 'current' | 'past_due' | 'canceled' | 'requires_payment_method' | 'requires_action' | null;
  
  // Trial Management
  trialStatus: 'active' | 'expired' | 'converted' | 'none';
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
  
  // Plan Management
  currentPlan: string | null;
  planTier: 'free' | 'tier1' | 'tier2' | 'tier3' | 'enterprise' | null;
  hasActivePlan: boolean;
  requiresPlanSelection: boolean;
  
  // Payment Method Status
  hasPaymentMethod: boolean;
  paymentMethodStatus: 'valid' | 'expired' | 'requires_action' | 'missing' | null;
  
  // Account Lifecycle
  accountStatus: 'active' | 'suspended' | 'canceled' | 'requires_action';
  canAccessFeatures: boolean;
  
  // Billing History
  hasHadPaidPlan: boolean;
  isReactivated: boolean;
}

/**
 * Calculate payment state from account data
 */
export function usePaymentState(account: Account | null): PaymentState {
  // Subscription Status (from Stripe via webhooks)
  const subscriptionStatus = useMemo(() => account?.subscription_status || null, [account]) as PaymentState['subscriptionStatus'];
  
  // Payment Status (derived from subscription status)
  const paymentStatus = useMemo(() => {
    if (!subscriptionStatus) return null;
    
    switch (subscriptionStatus) {
      case 'active':
      case 'trialing':
        return 'current';
      case 'past_due':
        return 'past_due';
      case 'canceled':
        return 'canceled';
      case 'incomplete':
      case 'incomplete_expired':
        return 'requires_payment_method';
      case 'unpaid':
        return 'requires_action';
      default:
        return null;
    }
  }, [subscriptionStatus]) as PaymentState['paymentStatus'];
  
  // Trial Management
  const trialStatus = useMemo(() => {
    if (!account) return 'none';
    
    const now = new Date();
    const trialStart = account.trial_start ? new Date(account.trial_start) : null;
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    
    if (!trialStart || !trialEnd) return 'none';
    
    // Check if converted to paid plan
    if (account.has_had_paid_plan && subscriptionStatus === 'active') {
      return 'converted';
    }
    
    // Check if trial is active
    if (now >= trialStart && now <= trialEnd) {
      return 'active';
    }
    
    // Trial has expired
    if (now > trialEnd) {
      return 'expired';
    }
    
    return 'none';
  }, [account, subscriptionStatus]) as PaymentState['trialStatus'];
  
  const trialDaysRemaining = useMemo(() => {
    if (!account?.trial_end || trialStatus !== 'active') return 0;
    
    const now = new Date();
    const trialEnd = new Date(account.trial_end);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [account, trialStatus]);
  
  const isTrialExpiringSoon = useMemo(() => {
    return trialStatus === 'active' && trialDaysRemaining <= 3;
  }, [trialStatus, trialDaysRemaining]);
  
  // Plan Management
  const currentPlan = useMemo(() => {
    if (!account?.plan || account.plan === 'no_plan' || account.plan === 'NULL') return null;
    return account.plan;
  }, [account]);
  
  const planTier = useMemo(() => {
    if (!currentPlan) return null;
    
    switch (currentPlan.toLowerCase()) {
      case 'grower':
        return 'tier1';
      case 'builder':
        return 'tier2';
      case 'maven':
        return 'tier3';
      case 'enterprise':
        return 'enterprise';
      default:
        return account?.is_free_account ? 'free' : null;
    }
  }, [currentPlan, account]) as PaymentState['planTier'];
  
  const hasActivePlan = useMemo(() => {
    return !!currentPlan && subscriptionStatus === 'active';
  }, [currentPlan, subscriptionStatus]);
  
  const requiresPlanSelection = useMemo(() => {
    return !currentPlan && trialStatus !== 'none';
  }, [currentPlan, trialStatus]);
  
  // Payment Method Status
  const hasPaymentMethod = useMemo(() => {
    return !!account?.stripe_customer_id && !!account?.stripe_subscription_id;
  }, [account]);
  
  const paymentMethodStatus = useMemo(() => {
    if (!hasPaymentMethod) return 'missing';
    
    switch (paymentStatus) {
      case 'current':
        return 'valid';
      case 'past_due':
        return 'expired';
      case 'requires_action':
        return 'requires_action';
      case 'requires_payment_method':
        return 'missing';
      default:
        return 'valid';
    }
  }, [hasPaymentMethod, paymentStatus]) as PaymentState['paymentMethodStatus'];
  
  // Account Lifecycle
  const accountStatus = useMemo(() => {
    if (!account) return 'requires_action';
    
    // Handle reactivation properly
    if (account.deleted_at) {
      console.log('🔄 Deleted account detected - user needs reactivation');
      return 'requires_action';
    }
    
    switch (subscriptionStatus) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
      case 'unpaid':
        return 'requires_action';
      case 'canceled':
        return 'canceled';
      case 'incomplete':
      case 'incomplete_expired':
        return 'suspended';
      default:
        return trialStatus === 'active' ? 'active' : 'requires_action';
    }
  }, [account, subscriptionStatus, trialStatus]) as PaymentState['accountStatus'];
  
  const canAccessFeatures = useMemo(() => {
    return accountStatus === 'active' || trialStatus === 'active';
  }, [accountStatus, trialStatus]);
  
  // Billing History
  const hasHadPaidPlan = useMemo(() => !!account?.has_had_paid_plan, [account]);
  const isReactivated = useMemo(() => {
    return hasHadPaidPlan && subscriptionStatus === 'active' && !!account?.stripe_subscription_id;
  }, [hasHadPaidPlan, subscriptionStatus, account]);
  
  return {
    subscriptionStatus,
    paymentStatus,
    trialStatus,
    trialDaysRemaining,
    isTrialExpiringSoon,
    currentPlan,
    planTier,
    hasActivePlan,
    requiresPlanSelection,
    hasPaymentMethod,
    paymentMethodStatus,
    accountStatus,
    canAccessFeatures,
    hasHadPaidPlan,
    isReactivated
  };
}