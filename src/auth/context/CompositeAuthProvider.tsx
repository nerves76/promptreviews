/**
 * Composite Authentication Provider
 * 
 * Combines all auth-related contexts into a single provider
 * This ensures proper context hierarchy and dependency management
 */

"use client";

import React from 'react';
import { CoreAuthProvider, useCoreAuth } from './CoreAuthContext';
import { AccountProvider, useAccount } from './AccountContext';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { AdminProvider, useAdmin } from './AdminContext';
import { SubscriptionProvider, useSubscription } from './SubscriptionContext';
import { SharedAccountProvider } from './SharedAccountState';

interface CompositeAuthProviderProps {
  children: React.ReactNode;
}

/**
 * The order of providers matters:
 * 1. CoreAuthProvider - Base authentication (user, session)
 * 2. SharedAccountProvider - Manages shared account ID state
 * 3. AccountProvider - Depends on CoreAuth for user and SharedAccount for state
 * 4. BusinessProvider - Depends on SharedAccount for accountId
 * 5. AdminProvider - Depends on both CoreAuth and Account
 * 6. SubscriptionProvider - Depends on Account for subscription data
 */
export function CompositeAuthProvider({ children }: CompositeAuthProviderProps) {
  return (
    <CoreAuthProvider>
      <SharedAccountProvider>
        <AccountProvider>
          <BusinessProvider>
            <AdminProvider>
              <SubscriptionProvider>
                {children}
              </SubscriptionProvider>
            </AdminProvider>
          </BusinessProvider>
        </AccountProvider>
      </SharedAccountProvider>
    </CoreAuthProvider>
  );
}

// Unified hook that combines all auth contexts
export function useAuth() {
  const core = useCoreAuth();
  const account = useAccount();
  const business = useBusiness();
  const admin = useAdmin();
  const subscription = useSubscription();
  
  // Combine all context values into a single object
  // This maintains backward compatibility with the original AuthContext
  return {
    // Core auth
    ...core,
    
    // Account
    accountId: account.accountId,
    account: account.account,
    accounts: account.accounts,
    selectedAccountId: account.selectedAccountId,
    canSwitchAccounts: account.canSwitchAccounts,
    accountLoading: account.accountLoading,
    accountsLoading: account.accountsLoading,
    loadAccount: account.loadAccount,
    loadAccounts: account.loadAccounts,
    switchAccount: account.switchAccount,
    refreshAccount: account.refreshAccount,
    
    // Business
    business: business.business,
    businesses: business.businesses,
    hasBusiness: business.hasBusiness,
    requiresBusinessProfile: business.requiresBusinessProfile,
    businessLoading: business.businessLoading,
    businessesLoading: business.businessesLoading,
    loadBusiness: business.loadBusiness,
    loadBusinesses: business.loadBusinesses,
    createBusiness: business.createBusiness,
    updateBusiness: business.updateBusiness,
    refreshBusiness: business.refreshBusiness,
    
    // Admin
    isAdminUser: admin.isAdminUser,
    adminChecked: admin.adminChecked,
    adminLoading: admin.adminLoading,
    checkAdminStatus: admin.checkAdminStatus,
    refreshAdminStatus: admin.refreshAdminStatus,
    
    // Subscription
    ...subscription,
    
    // Combined loading state
    isLoading: core.isLoading || account.accountLoading || business.businessLoading || admin.adminLoading,
  };
}

// Export individual hooks for more granular usage
export { useCoreAuth } from './CoreAuthContext';
export { useAccount } from './AccountContext';
export { useBusiness } from './BusinessContext';
export { useAdmin, useAdminGuard } from './AdminContext';
export { useSubscription } from './SubscriptionContext';