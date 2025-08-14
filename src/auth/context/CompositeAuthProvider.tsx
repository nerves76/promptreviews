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
 * ⚠️ CRITICAL: PROVIDER ORDER MATTERS! ⚠️
 * ========================================
 * 
 * The order of these providers is ESSENTIAL for proper operation.
 * Changing the order WILL break multi-account support and cause:
 * - AccountContext not propagating accountId to BusinessContext
 * - Users being redirected to create-business when they have businesses
 * - Navigation getting disabled after account switching
 * - 8+ hours of debugging pain
 * 
 * REQUIRED ORDER:
 * 1. CoreAuthProvider - Base authentication (user, session)
 * 2. SharedAccountProvider - MUST be before Account & Business (shares state between them)
 * 3. AccountProvider - Depends on CoreAuth for user and SharedAccount for state
 * 4. BusinessProvider - Depends on SharedAccount for accountId
 * 5. AdminProvider - Depends on both CoreAuth and Account
 * 6. SubscriptionProvider - Depends on Account for subscription data
 * 
 * WHY THIS ORDER:
 * - SharedAccountProvider creates the shared accountId state
 * - AccountProvider writes to this shared state
 * - BusinessProvider reads from this shared state
 * - If SharedAccount isn't before both, they can't share state
 * - If Account isn't before Business, Business won't get accountId
 * 
 * See MULTI_ACCOUNT_TROUBLESHOOTING.md for debugging help.
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