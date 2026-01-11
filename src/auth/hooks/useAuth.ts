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
 * Note: Return type is inferred from CompositeAuthProvider which extends AuthContextType
 */
export function useAuth() {
  return useCompositeAuth();
}

/**
 * Hook to ensure user is authenticated
 * Redirects to sign-in if not authenticated
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to sign-in page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/sign-in';
      }
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to ensure user is an admin
 * Redirects to home if not an admin
 */
export function useAdminGuard() {
  const { isAuthenticated, isAdminUser, isLoading, adminLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !adminLoading && isAuthenticated && !isAdminUser) {
      // Redirect non-admins to home
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, isAdminUser, isLoading, adminLoading]);

  return { isAuthenticated, isAdminUser, isLoading: isLoading || adminLoading };
}

/**
 * Hook to ensure user has a business
 * Redirects to business setup if no business profile
 */
export function useBusinessGuard() {
  const { isAuthenticated, hasBusiness, isLoading, businessLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !businessLoading && isAuthenticated && !hasBusiness) {
      // Redirect to business setup
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/business-profile';
      }
    }
  }, [isAuthenticated, hasBusiness, isLoading, businessLoading]);

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