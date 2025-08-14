/**
 * Legacy Authentication Context Wrapper
 * 
 * This file maintains backward compatibility with the original AuthContext
 * while using the new modular context architecture under the hood.
 * 
 * The actual implementation is now split across:
 * - CoreAuthContext: Core authentication (user, session)
 * - AccountContext: Account management
 * - BusinessContext: Business profile management  
 * - AdminContext: Admin functionality
 * - SubscriptionContext: Payment and subscription management
 * 
 * Migration Path:
 * 1. This wrapper ensures existing code continues to work
 * 2. New code should import specific contexts as needed
 * 3. Gradually migrate old code to use specific contexts
 * 4. Eventually deprecate this wrapper
 */

"use client";

import React from 'react';
import { 
  CompositeAuthProvider, 
  useAuth as useCompositeAuth,
  useCoreAuth,
  useAccount,
  useBusiness,
  useAdmin,
  useAdminGuard as useNewAdminGuard,
  useSubscription
} from './CompositeAuthProvider';

// Re-export the composite provider as AuthProvider for backward compatibility
export const AuthProvider = CompositeAuthProvider;

// Re-export the combined useAuth hook
export const useAuth = useCompositeAuth;

// Re-export the AuthContext for components that import it directly
export const AuthContext = React.createContext(null);

// Re-export guard hooks for backward compatibility
export function useAuthGuard() {
  const auth = useCompositeAuth();
  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    error: auth.error,
  };
}

export function useAdminGuard() {
  return useNewAdminGuard();
}

export function useBusinessGuard() {
  const auth = useCompositeAuth();
  return {
    hasBusiness: auth.hasBusiness,
    requiresBusinessProfile: auth.requiresBusinessProfile,
    isLoading: auth.businessLoading,
    business: auth.business,
  };
}

// Re-export specific context hooks for gradual migration
export {
  useCoreAuth,
  useAccount,
  useBusiness,
  useAdmin,
  useSubscription
};

// Export types for TypeScript compatibility
export type { User, Session } from '@supabase/supabase-js';
export type { Account } from '../types';