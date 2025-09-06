/**
 * Feature Management Context
 * 
 * Unified context that combines:
 * - Admin permissions and status (from AdminContext)
 * - Subscription and billing data (from SubscriptionContext)
 * - Feature access control and limits
 * 
 * This consolidation simplifies feature-based authorization and billing logic.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useAccountBusiness } from './AccountBusinessContext';
import { isAdmin as checkIsAdmin, ensureAdminForEmail } from '../utils/admin';
import { getPlanDisplayName, getMaxContactsForPlan, getMaxLocationsForPlan } from '../utils/planUtils';

interface FeatureState {
  // Admin Management
  isAdminUser: boolean;
  adminChecked: boolean;
  adminLoading: boolean;
  
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
  
  // Cache metadata
  adminCacheTime: number | null;
}

interface FeatureContextType extends FeatureState {
  // Admin methods
  checkAdminStatus: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  
  // Subscription methods
  refreshSubscription: () => Promise<void>;
  checkTrialStatus: () => void;
  
  // Unified methods
  refreshAll: () => Promise<void>;
  clearCache: () => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useCoreAuth();
  const { account } = useAccountBusiness();
  
  // Admin state
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminCacheTime, setAdminCacheTime] = useState<number | null>(null);
  
  // Cache for admin status
  const adminCacheRef = React.useRef<{ isAdmin: boolean; timestamp: number } | null>(null);

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
    let subscriptionStatus: FeatureState['subscriptionStatus'] = null;
    let paymentStatus: FeatureState['paymentStatus'] = null;
    
    if (account.subscription_status) {
      subscriptionStatus = account.subscription_status as FeatureState['subscriptionStatus'];
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
    const paymentMethodStatus: FeatureState['paymentMethodStatus'] = 
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
    let planTier: FeatureState['planTier'] = null;
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

    let accountStatus: FeatureState['accountStatus'] = 'active';
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

  // Clear all caches
  const clearCache = useCallback(() => {
    adminCacheRef.current = null;
    setAdminCacheTime(null);
    setAdminChecked(false);
  }, []);

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id || !account?.id) {
      setIsAdminUser(false);
      setAdminChecked(true);
      return;
    }

    // Check cache
    if (adminCacheRef.current) {
      const cacheAge = Date.now() - adminCacheRef.current.timestamp;
      if (cacheAge < ADMIN_CACHE_DURATION) {
        setIsAdminUser(adminCacheRef.current.isAdmin);
        setAdminCacheTime(adminCacheRef.current.timestamp);
        setAdminChecked(true);
        return;
      }
    }

    setAdminLoading(true);
    try {
      // Check if user is admin
      const adminStatus = await checkIsAdmin();
      setIsAdminUser(adminStatus);
      
      // If user has admin email, ensure they have admin status
      if (user.email) {
        await ensureAdminForEmail({ id: user.id, email: user.email });
      }
      
      // Update cache
      adminCacheRef.current = {
        isAdmin: adminStatus,
        timestamp: Date.now(),
      };
      setAdminCacheTime(Date.now());
      setAdminChecked(true);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdminUser(false);
      setAdminChecked(true);
    } finally {
      setAdminLoading(false);
    }
  }, [user?.id, user?.email, account?.id]);

  // Refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    clearCache();
    await checkAdminStatus();
  }, [clearCache, checkAdminStatus]);

  // Refresh subscription data (placeholder for future Stripe integration)
  const refreshSubscription = useCallback(async () => {
    // This would trigger a refresh of the account data
    // In a real implementation, this might fetch fresh data from Stripe
  }, []);

  // Check trial status (for notifications)
  const checkTrialStatus = useCallback(() => {
    const trial = calculateTrialStatus();
    if (trial.isExpiringSoon && trial.status === 'active') {
      console.warn(`Trial expiring in ${trial.daysRemaining} days`);
    }
  }, [calculateTrialStatus]);

  // Refresh all feature data
  const refreshAll = useCallback(async () => {
    clearCache();
    await Promise.all([
      checkAdminStatus(),
      refreshSubscription(),
    ]);
  }, [clearCache, checkAdminStatus, refreshSubscription]);

  // Initialize admin status on auth/account change
  useEffect(() => {
    if (isAuthenticated && account) {
      checkAdminStatus();
    } else {
      setIsAdminUser(false);
      setAdminChecked(false);
      clearCache();
    }
  }, [isAuthenticated, account?.id, checkAdminStatus, clearCache]);

  // Auto-refresh admin status periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (adminCacheTime) {
        const cacheAge = Date.now() - adminCacheTime;
        if (cacheAge > ADMIN_CACHE_DURATION) {
          checkAdminStatus();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, adminCacheTime, checkAdminStatus]);

  // Check trial status periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    checkTrialStatus();
    const interval = setInterval(checkTrialStatus, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTrialStatus]);

  // Memoized calculations
  const trial = useMemo(() => calculateTrialStatus(), [calculateTrialStatus]);
  const subscription = useMemo(() => calculateSubscriptionStatus(), [calculateSubscriptionStatus]);
  const plan = useMemo(() => calculatePlanDetails(), [calculatePlanDetails]);
  const accountStatusInfo = useMemo(() => calculateAccountStatus(), [calculateAccountStatus]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<FeatureContextType>(() => ({
    // Admin Management
    isAdminUser,
    adminChecked,
    adminLoading,
    adminCacheTime,
    
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
    checkAdminStatus,
    refreshAdminStatus,
    refreshSubscription,
    checkTrialStatus,
    refreshAll,
    clearCache,
  }), [
    isAdminUser, adminChecked, adminLoading, adminCacheTime,
    subscription, trial, plan, accountStatusInfo,
    account, checkAdminStatus, refreshAdminStatus,
    refreshSubscription, checkTrialStatus, refreshAll, clearCache
  ]);

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}

// Backward compatibility hooks
export function useAdmin() {
  const context = useFeatures();
  return {
    isAdminUser: context.isAdminUser,
    adminChecked: context.adminChecked,
    adminLoading: context.adminLoading,
    adminCacheTime: context.adminCacheTime,
    checkAdminStatus: context.checkAdminStatus,
    refreshAdminStatus: context.refreshAdminStatus,
    clearAdminCache: context.clearCache,
  };
}

export function useSubscription() {
  const context = useFeatures();
  return {
    // Subscription Management
    subscriptionStatus: context.subscriptionStatus,
    paymentStatus: context.paymentStatus,
    
    // Trial Management  
    trialStatus: context.trialStatus,
    trialDaysRemaining: context.trialDaysRemaining,
    isTrialExpiringSoon: context.isTrialExpiringSoon,
    trialEndsAt: context.trialEndsAt,
    
    // Plan Management
    currentPlan: context.currentPlan,
    planDisplayName: context.planDisplayName,
    planTier: context.planTier,
    hasActivePlan: context.hasActivePlan,
    requiresPlanSelection: context.requiresPlanSelection,
    isFreePlan: context.isFreePlan,
    
    // Plan Limits
    maxContacts: context.maxContacts,
    maxLocations: context.maxLocations,
    maxUsers: context.maxUsers,
    maxPromptPages: context.maxPromptPages,
    
    // Usage
    contactCount: context.contactCount,
    locationCount: context.locationCount,
    promptPageCount: context.promptPageCount,
    customPromptPageCount: context.customPromptPageCount,
    
    // Payment Method Status
    hasPaymentMethod: context.hasPaymentMethod,
    paymentMethodStatus: context.paymentMethodStatus,
    
    // Account Lifecycle
    accountStatus: context.accountStatus,
    canAccessFeatures: context.canAccessFeatures,
    
    // Billing History
    hasHadPaidPlan: context.hasHadPaidPlan,
    stripeCustomerId: context.stripeCustomerId,
    stripeSubscriptionId: context.stripeSubscriptionId,
    
    // Methods
    refreshSubscription: context.refreshSubscription,
    checkTrialStatus: context.checkTrialStatus,
  };
}

// Guard hook for admin-only areas
export function useAdminGuard() {
  const { isAdminUser, adminChecked, adminLoading } = useAdmin();
  const { isAuthenticated, isInitialized } = useCoreAuth();
  
  return {
    isAdmin: isAdminUser,
    isLoading: !isInitialized || adminLoading || !adminChecked,
    canAccess: isAuthenticated && isAdminUser,
  };
}

export { FeatureContext };