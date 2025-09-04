/**
 * Subscription & Payment Context
 * 
 * Handles subscription and payment-related operations:
 * - Trial status management
 * - Plan management
 * - Payment status tracking
 * - Billing history
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useAccount } from './AccountContext';
import { getPlanDisplayName, getMaxContactsForPlan, getMaxLocationsForPlan } from '../utils/planUtils';

interface SubscriptionState {
  // Subscription Management
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  paymentStatus: 'current' | 'past_due' | 'canceled' | 'requires_payment_method' | 'requires_action' | null;
  
  // Trial Management
  trialStatus: 'active' | 'expired' | 'converted' | 'none';
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
  trialEndsAt: Date | null;
  
  // Plan Management
  currentPlan: string | null;
  planDisplayName: string | null;
  planTier: 'free' | 'tier1' | 'tier2' | 'tier3' | 'enterprise' | null;
  hasActivePlan: boolean;
  requiresPlanSelection: boolean;
  isFreePlan: boolean;
  
  // Plan Limits
  maxContacts: number;
  maxLocations: number;
  maxUsers: number;
  maxPromptPages: number;
  
  // Usage
  contactCount: number;
  locationCount: number;
  promptPageCount: number;
  customPromptPageCount: number;
  
  // Payment Method Status
  hasPaymentMethod: boolean;
  paymentMethodStatus: 'valid' | 'expired' | 'requires_action' | 'missing' | null;
  
  // Account Lifecycle
  accountStatus: 'active' | 'suspended' | 'canceled' | 'requires_action';
  canAccessFeatures: boolean;
  
  // Billing History
  hasHadPaidPlan: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  // Methods
  refreshSubscription: () => Promise<void>;
  checkTrialStatus: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useCoreAuth();
  const { account } = useAccount();

  // Calculate trial status
  const calculateTrialStatus = useCallback(() => {
    if (!account) {
      return {
        status: 'none' as const,
        daysRemaining: 0,
        isExpiringSoon: false,
        endsAt: null,
      };
    }

    const now = new Date();
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const trialStart = account.trial_start ? new Date(account.trial_start) : null;

    if (!trialEnd || !trialStart) {
      return {
        status: 'none' as const,
        daysRemaining: 0,
        isExpiringSoon: false,
        endsAt: null,
      };
    }

    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isExpiringSoon = daysRemaining <= 3;

    let status: 'active' | 'expired' | 'converted' | 'none';
    if (account.has_had_paid_plan) {
      status = 'converted';
    } else if (daysRemaining > 0) {
      status = 'active';
    } else {
      status = 'expired';
    }

    return {
      status,
      daysRemaining,
      isExpiringSoon,
      endsAt: trialEnd,
    };
  }, [account]);

  // Calculate subscription status
  const calculateSubscriptionStatus = useCallback(() => {
    if (!account) {
      return {
        subscriptionStatus: null,
        paymentStatus: null,
        hasPaymentMethod: false,
        paymentMethodStatus: 'missing' as const,
      };
    }

    // Determine subscription status based on account data
    let subscriptionStatus: SubscriptionState['subscriptionStatus'] = null;
    let paymentStatus: SubscriptionState['paymentStatus'] = null;
    
    if (account.subscription_status) {
      subscriptionStatus = account.subscription_status as SubscriptionState['subscriptionStatus'];
    } else if (account.plan && account.plan !== 'no_plan') {
      // Infer status from plan
      const trial = calculateTrialStatus();
      if (trial.status === 'active') {
        subscriptionStatus = 'trialing';
        paymentStatus = 'current';
      } else if (account.has_had_paid_plan) {
        subscriptionStatus = 'active';
        paymentStatus = 'current';
      }
    }

    // Payment method status
    const hasPaymentMethod = !!account.stripe_customer_id;
    const paymentMethodStatus: SubscriptionState['paymentMethodStatus'] = 
      hasPaymentMethod ? 'valid' : 'missing';

    return {
      subscriptionStatus,
      paymentStatus,
      hasPaymentMethod,
      paymentMethodStatus,
    };
  }, [account, calculateTrialStatus]);

  // Calculate plan details
  const calculatePlanDetails = useCallback(() => {
    if (!account) {
      return {
        currentPlan: null,
        planDisplayName: null,
        planTier: null,
        hasActivePlan: false,
        requiresPlanSelection: false,
        isFreePlan: false,
        maxContacts: 0,
        maxLocations: 0,
        maxUsers: 1,
        maxPromptPages: 0,
      };
    }

    const currentPlan = account.plan || null;
    const planDisplayName = getPlanDisplayName(currentPlan);
    const isFreePlan = account.is_free_account || currentPlan === 'no_plan' || !currentPlan;
    const hasActivePlan = !isFreePlan && currentPlan !== null;
    const requiresPlanSelection = !hasActivePlan && !isFreePlan;

    // Determine plan tier
    let planTier: SubscriptionState['planTier'] = null;
    if (isFreePlan) {
      planTier = 'free';
    } else if (currentPlan === 'grower') {
      planTier = 'tier1';
    } else if (currentPlan === 'accelerator') {
      planTier = 'tier2';
    } else if (currentPlan === 'maven') {
      planTier = 'tier3';
    } else if (currentPlan === 'enterprise') {
      planTier = 'enterprise';
    }

    return {
      currentPlan,
      planDisplayName,
      planTier,
      hasActivePlan,
      requiresPlanSelection,
      isFreePlan,
      maxContacts: account.max_contacts || getMaxContactsForPlan(currentPlan),
      maxLocations: account.max_locations || getMaxLocationsForPlan(currentPlan),
      maxUsers: account.max_users || 1,
      maxPromptPages: account.max_prompt_pages || 10,
    };
  }, [account]);

  // Calculate account status
  const calculateAccountStatus = useCallback(() => {
    if (!account) {
      return {
        accountStatus: 'requires_action' as const,
        canAccessFeatures: false,
      };
    }

    const { subscriptionStatus, paymentStatus } = calculateSubscriptionStatus();
    const trial = calculateTrialStatus();

    let accountStatus: SubscriptionState['accountStatus'] = 'active';
    let canAccessFeatures = true;

    if (subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid') {
      accountStatus = 'canceled';
      canAccessFeatures = false;
    } else if (subscriptionStatus === 'past_due') {
      accountStatus = 'suspended';
      canAccessFeatures = false;
    } else if (paymentStatus === 'requires_payment_method' || paymentStatus === 'requires_action') {
      accountStatus = 'requires_action';
      canAccessFeatures = trial.status === 'active'; // Can access during trial
    }

    return {
      accountStatus,
      canAccessFeatures,
    };
  }, [account, calculateSubscriptionStatus, calculateTrialStatus]);

  // Memoized calculations
  const trial = useMemo(() => calculateTrialStatus(), [calculateTrialStatus]);
  const subscription = useMemo(() => calculateSubscriptionStatus(), [calculateSubscriptionStatus]);
  const plan = useMemo(() => calculatePlanDetails(), [calculatePlanDetails]);
  const accountStatusInfo = useMemo(() => calculateAccountStatus(), [calculateAccountStatus]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    // This would trigger a refresh of the account data
    // In a real implementation, this might fetch fresh data from Stripe
  }, []);

  // Check trial status (for notifications)
  const checkTrialStatus = useCallback(() => {
    if (trial.isExpiringSoon && trial.status === 'active') {
      console.warn(`Trial expiring in ${trial.daysRemaining} days`);
    }
  }, [trial]);

  // Check trial status periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    checkTrialStatus();
    const interval = setInterval(checkTrialStatus, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTrialStatus]);

  const value: SubscriptionContextType = {
    // Subscription Management
    subscriptionStatus: subscription.subscriptionStatus,
    paymentStatus: subscription.paymentStatus,
    
    // Trial Management
    trialStatus: trial.status,
    trialDaysRemaining: trial.daysRemaining,
    isTrialExpiringSoon: trial.isExpiringSoon,
    trialEndsAt: trial.endsAt,
    
    // Plan Management
    currentPlan: plan.currentPlan,
    planDisplayName: plan.planDisplayName,
    planTier: plan.planTier,
    hasActivePlan: plan.hasActivePlan,
    requiresPlanSelection: plan.requiresPlanSelection,
    isFreePlan: plan.isFreePlan,
    
    // Plan Limits
    maxContacts: plan.maxContacts,
    maxLocations: plan.maxLocations,
    maxUsers: plan.maxUsers,
    maxPromptPages: plan.maxPromptPages,
    
    // Usage
    contactCount: account?.contact_count || 0,
    locationCount: account?.location_count || 0,
    promptPageCount: account?.prompt_page_count || 0,
    customPromptPageCount: account?.custom_prompt_page_count || 0,
    
    // Payment Method Status
    hasPaymentMethod: subscription.hasPaymentMethod,
    paymentMethodStatus: subscription.paymentMethodStatus,
    
    // Account Lifecycle
    accountStatus: accountStatusInfo.accountStatus,
    canAccessFeatures: accountStatusInfo.canAccessFeatures,
    
    // Billing History
    hasHadPaidPlan: account?.has_had_paid_plan || false,
    stripeCustomerId: account?.stripe_customer_id || null,
    stripeSubscriptionId: account?.stripe_subscription_id || null,
    
    // Methods
    refreshSubscription,
    checkTrialStatus,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export { SubscriptionContext };