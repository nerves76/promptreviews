/**
 * Composite Authentication Provider
 * 
 * Simplified 3-context architecture combining all auth-related contexts
 * This reduces complexity while maintaining all functionality
 */

"use client";

import React from 'react';
import { CoreAuthProvider, useCoreAuth } from './CoreAuthContext';
import { AccountBusinessProvider, useAccountBusiness, useAccount, useBusiness } from './AccountBusinessContext';
import { FeatureProvider, useFeatures, useAdmin, useSubscription, useAdminGuard } from './FeatureContext';

interface CompositeAuthProviderProps {
  children: React.ReactNode;
}

/**
 * ✨ SIMPLIFIED ARCHITECTURE ✨
 * =============================
 * 
 * Reduced from 6 contexts to 3 for better maintainability:
 * 
 * 1. CoreAuthProvider - Core authentication (user, session, sign in/out)
 * 2. AccountBusinessProvider - Account + Business data (merged AccountContext + BusinessContext + SharedAccountState)
 * 3. FeatureProvider - Admin + Subscription features (merged AdminContext + SubscriptionContext)
 * 
 * BENEFITS:
 * - Eliminates SharedAccountState complexity
 * - Reduces circular dependencies
 * - Groups related functionality logically
 * - Maintains all existing functionality
 * - Simpler provider hierarchy
 */
export function CompositeAuthProvider({ children }: CompositeAuthProviderProps) {
  return (
    <CoreAuthProvider>
      <AccountBusinessProvider>
        <FeatureProvider>
          {children}
        </FeatureProvider>
      </AccountBusinessProvider>
    </CoreAuthProvider>
  );
}

// Unified hook that combines all auth contexts
export function useAuth() {
  const core = useCoreAuth();
  const accountBusiness = useAccountBusiness();
  const features = useFeatures();
  
  // Combine all context values into a single object
  // This maintains backward compatibility with the original AuthContext
  return {
    // Core auth
    ...core,
    
    // Account & Business (from AccountBusinessContext)
    accountId: accountBusiness.accountId,
    account: accountBusiness.account,
    accounts: accountBusiness.accounts,
    selectedAccountId: accountBusiness.selectedAccountId,
    canSwitchAccounts: accountBusiness.canSwitchAccounts,
    accountLoading: accountBusiness.accountLoading,
    accountsLoading: accountBusiness.accountsLoading,
    loadAccount: accountBusiness.loadAccount,
    loadAccounts: accountBusiness.loadAccounts,
    switchAccount: accountBusiness.switchAccount,
    refreshAccount: accountBusiness.refreshAccount,
    
    business: accountBusiness.business,
    businesses: accountBusiness.businesses,
    hasBusiness: accountBusiness.hasBusiness,
    requiresBusinessProfile: accountBusiness.requiresBusinessProfile,
    businessLoading: accountBusiness.businessLoading,
    businessesLoading: accountBusiness.businessesLoading,
    loadBusiness: accountBusiness.loadBusiness,
    loadBusinesses: accountBusiness.loadBusinesses,
    createBusiness: accountBusiness.createBusiness,
    updateBusiness: accountBusiness.updateBusiness,
    refreshBusiness: accountBusiness.refreshBusiness,
    
    // Features (Admin + Subscription from FeatureContext)
    isAdminUser: features.isAdminUser,
    adminChecked: features.adminChecked,
    adminLoading: features.adminLoading,
    checkAdminStatus: features.checkAdminStatus,
    refreshAdminStatus: features.refreshAdminStatus,
    
    // Subscription data
    subscriptionStatus: features.subscriptionStatus,
    paymentStatus: features.paymentStatus,
    trialStatus: features.trialStatus,
    trialDaysRemaining: features.trialDaysRemaining,
    isTrialExpiringSoon: features.isTrialExpiringSoon,
    trialEndsAt: features.trialEndsAt,
    currentPlan: features.currentPlan,
    planDisplayName: features.planDisplayName,
    planTier: features.planTier,
    hasActivePlan: features.hasActivePlan,
    requiresPlanSelection: features.requiresPlanSelection,
    isFreePlan: features.isFreePlan,
    maxContacts: features.maxContacts,
    maxLocations: features.maxLocations,
    maxUsers: features.maxUsers,
    maxPromptPages: features.maxPromptPages,
    contactCount: features.contactCount,
    locationCount: features.locationCount,
    promptPageCount: features.promptPageCount,
    customPromptPageCount: features.customPromptPageCount,
    hasPaymentMethod: features.hasPaymentMethod,
    paymentMethodStatus: features.paymentMethodStatus,
    accountStatus: features.accountStatus,
    canAccessFeatures: features.canAccessFeatures,
    hasHadPaidPlan: features.hasHadPaidPlan,
    stripeCustomerId: features.stripeCustomerId,
    stripeSubscriptionId: features.stripeSubscriptionId,
    refreshSubscription: features.refreshSubscription,
    checkTrialStatus: features.checkTrialStatus,
    
    // Combined loading state
    isLoading: core.isLoading || accountBusiness.accountLoading || accountBusiness.businessLoading || features.adminLoading,
  };
}

// Export individual hooks for more granular usage
export { useCoreAuth } from './CoreAuthContext';
export { useAccountBusiness, useAccount, useBusiness } from './AccountBusinessContext';
export { useFeatures, useAdmin, useSubscription, useAdminGuard } from './FeatureContext';