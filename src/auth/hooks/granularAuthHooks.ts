/**
 * Granular Authentication Hooks
 * 
 * These hooks provide selective subscriptions to specific parts of the auth state,
 * preventing unnecessary re-renders when unrelated auth data changes.
 * 
 * Instead of using the entire auth context, components can subscribe to only
 * the specific data they need.
 */

"use client";

import { useMemo } from 'react';
import { useCoreAuth } from '../context/CoreAuthContext';
import { useAccount } from '../context/AccountContext';
import { useBusiness } from '../context/BusinessContext';
import { useAdmin } from '../context/AdminContext';
import { useSubscription } from '../context/SubscriptionContext';

/**
 * Hook for components that only need user data
 * Won't re-render on session/token changes
 */
export function useAuthUser() {
  const { user, isAuthenticated } = useCoreAuth();
  
  return useMemo(() => ({
    user,
    isAuthenticated,
    userId: user?.id || null,
    userEmail: user?.email || null,
  }), [user, isAuthenticated]);
}

/**
 * Hook for components that only need session status
 * Won't re-render on user profile changes
 */
export function useAuthSession() {
  const { session, sessionExpiresAt, isSessionExpiringSoon } = useCoreAuth();
  
  return useMemo(() => ({
    hasSession: !!session,
    sessionExpiresAt,
    isSessionExpiringSoon,
  }), [session, sessionExpiresAt, isSessionExpiringSoon]);
}

/**
 * Hook for components that only need loading states
 */
export function useAuthLoading() {
  const { isLoading, isInitialized, refreshingSession } = useCoreAuth();
  
  return useMemo(() => ({
    isLoading,
    isInitialized,
    refreshingSession,
    isReady: isInitialized && !isLoading,
  }), [isLoading, isInitialized, refreshingSession]);
}

/**
 * Hook for components that only need auth methods
 * These are stable references that won't cause re-renders
 */
export function useAuthActions() {
  const { signIn, signUp, signOut, refreshSession, clearError, setError } = useCoreAuth();
  
  // These are already memoized in the context, so no need to memoize again
  return {
    signIn,
    signUp,
    signOut,
    refreshSession,
    clearError,
    setError,
  };
}

/**
 * Hook for components that only need account data
 * Won't re-render on auth state changes
 */
export function useAccountData() {
  const { account, accountId, selectedAccountId, accounts } = useAccount();
  
  return useMemo(() => ({
    account,
    accountId,
    selectedAccountId,
    accounts,
    hasAccount: !!account,
    accountName: account?.account_name || null,
    accountPlan: account?.plan || null,
  }), [account, accountId, selectedAccountId, accounts]);
}

/**
 * Hook for components that only need business data
 * Won't re-render on auth or account changes
 */
export function useBusinessData() {
  const { business, businesses, hasBusiness, requiresBusinessProfile } = useBusiness();
  
  return useMemo(() => ({
    business,
    businesses,
    hasBusiness,
    requiresBusinessProfile,
    businessName: business?.name || null,
    businessId: business?.id || null,
  }), [business, businesses, hasBusiness, requiresBusinessProfile]);
}

/**
 * Hook for components that only need admin status
 */
export function useAdminStatus() {
  const { isAdminUser, adminChecked } = useAdmin();
  
  return useMemo(() => ({
    isAdminUser,
    adminChecked,
    canAccessAdmin: isAdminUser && adminChecked,
  }), [isAdminUser, adminChecked]);
}

/**
 * Hook for components that only need subscription data
 */
export function useSubscriptionData() {
  const subscription = useSubscription();
  
  return useMemo(() => ({
    plan: subscription.plan,
    planDetails: subscription.planDetails,
    isFreePlan: subscription.isFreePlan,
    isPaidPlan: subscription.isPaidPlan,
    canAccessFeature: subscription.canAccessFeature,
  }), [
    subscription.plan,
    subscription.planDetails,
    subscription.isFreePlan,
    subscription.isPaidPlan,
    subscription.canAccessFeature,
  ]);
}

/**
 * Hook for components that need combined auth state
 * but with optimized re-rendering
 */
export function useOptimizedAuth() {
  const user = useAuthUser();
  const session = useAuthSession();
  const loading = useAuthLoading();
  const actions = useAuthActions();
  const account = useAccountData();
  const business = useBusinessData();
  
  return useMemo(() => ({
    ...user,
    ...session,
    ...loading,
    ...actions,
    ...account,
    ...business,
  }), [user, session, loading, actions, account, business]);
}

/**
 * Hook for components that only care if user is logged in
 * Extremely optimized - only re-renders on login/logout
 */
export function useIsLoggedIn() {
  const { isAuthenticated } = useCoreAuth();
  return isAuthenticated;
}

/**
 * Hook for API calls that need token access
 * Uses TokenManager directly to avoid React re-renders
 */
export function useApiToken() {
  const getToken = async () => {
    const { tokenManager } = await import('../services/TokenManager');
    return tokenManager.getAccessToken();
  };
  
  return { getToken };
}