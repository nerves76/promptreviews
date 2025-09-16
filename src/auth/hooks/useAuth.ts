/**
 * Authentication Hooks
 * Custom hooks for authentication functionality
 */

import { useEffect } from 'react';
import { useAuth as useCompositeAuth } from '../context/CompositeAuthProvider';
import type { AuthContextType } from '../types';

/**
 * Main authentication hook
 * Now delegates to the CompositeAuthProvider's useAuth
 */
export function useAuth(): AuthContextType {
  return useCompositeAuth() as AuthContextType;
}

/**
 * Hook to ensure user is authenticated
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading, requireAuth } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      requireAuth();
    }
  }, [isAuthenticated, isLoading, requireAuth]);
  
  return { isAuthenticated, isLoading };
}

/**
 * Hook to ensure user is an admin
 */
export function useAdminGuard() {
  const { isAuthenticated, isAdminUser, isLoading, adminLoading, requireAdmin } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !adminLoading && isAuthenticated && !isAdminUser) {
      requireAdmin();
    }
  }, [isAuthenticated, isAdminUser, isLoading, adminLoading, requireAdmin]);
  
  return { isAuthenticated, isAdminUser, isLoading: isLoading || adminLoading };
}

/**
 * Hook to ensure user has a business
 */
export function useBusinessGuard() {
  const { isAuthenticated, hasBusiness, isLoading, businessLoading, requireBusiness } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !businessLoading && isAuthenticated && !hasBusiness) {
      requireBusiness();
    }
  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, requireBusiness]);
  
  return { isAuthenticated, hasBusiness, isLoading: isLoading || businessLoading };
}

/**
 * Hook to get current user
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to get admin status
 */
export function useIsAdmin() {
  const { isAdminUser, adminLoading } = useAuth();
  return { isAdmin: isAdminUser, loading: adminLoading };
}

/**
 * Hook to get account information
 */
export function useAccount() {
  const { account, accountId, accountLoading } = useAuth();
  return { account, accountId, loading: accountLoading };
}

/**
 * Hook to get business status
 */
export function useHasBusiness() {
  const { hasBusiness, businessLoading } = useAuth();
  return { hasBusiness, loading: businessLoading };
}

/**
 * Hook to get payment/subscription status
 */
export function usePaymentStatus() {
  const { 
    subscriptionStatus, 
    paymentStatus, 
    trialStatus, 
    trialDaysRemaining,
    currentPlan,
    hasActivePlan 
  } = useAuth();
  
  return {
    subscriptionStatus,
    paymentStatus,
    trialStatus,
    trialDaysRemaining,
    currentPlan,
    hasActivePlan
  };
}