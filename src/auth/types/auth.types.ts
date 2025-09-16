/**
 * Authentication Type Definitions
 * Centralized type definitions for the authentication system
 */

import { User, Session, AuthResponse } from '@supabase/supabase-js';

/**
 * Account type from accountUtils
 */
export interface Account {
  id: string;
  name?: string;
  created_at: string;
  // Stripe-related fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;
  plan?: string;
  trial_start?: string;
  trial_end?: string;
  has_had_paid_plan?: boolean;
  is_free_account?: boolean;
  free_plan_level?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  business_name?: string;
  deleted_at?: string;
  is_admin?: boolean;
  // Business relation
  businesses?: any[];
}

/**
 * Core authentication state
 */
export interface AuthState {
  // Core authentication
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // Email verification status
  emailVerified: boolean;
  requiresEmailVerification: boolean;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error handling
  error: string | null;
  
  // Admin status
  isAdminUser: boolean;
  adminLoading: boolean;
  
  // Account management
  accountId: string | null;
  account: Account | null;
  accountLoading: boolean;
  hasBusiness: boolean;
  businessLoading: boolean;
  
  // Payment states
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  paymentStatus: 'current' | 'past_due' | 'canceled' | 'requires_payment_method' | 'requires_action' | null;
  
  // Trial management
  trialStatus: 'active' | 'expired' | 'converted' | 'none';
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean;
  
  // Plan management
  currentPlan: string | null;
  planTier: 'free' | 'tier1' | 'tier2' | 'tier3' | 'enterprise' | null;
  hasActivePlan: boolean;
  requiresPlanSelection: boolean;
  
  // Payment method status
  hasPaymentMethod: boolean;
  paymentMethodStatus: 'valid' | 'expired' | 'requires_action' | 'missing' | null;
  
  // Account lifecycle
  accountStatus: 'active' | 'suspended' | 'canceled' | 'requires_action';
  canAccessFeatures: boolean;
  
  // Billing history
  hasHadPaidPlan: boolean;
  isReactivated: boolean;
  
  // Session management
  sessionExpiry: Date | null;
  sessionTimeRemaining: number;
  isSessionExpiringSoon: boolean;
}

/**
 * Authentication context type with actions
 */
export interface AuthContextType extends AuthState {
  // Actions
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  refreshBusinessProfile: () => Promise<void>;
  refreshAccountDetails: () => Promise<void>;
  refreshPaymentStatus: () => Promise<void>;
  
  // Navigation guards
  requireAuth: (redirectTo?: string) => boolean;
  requireAdmin: (redirectTo?: string) => boolean;
  requireBusiness: (redirectTo?: string) => boolean;
  requireActivePlan: () => boolean;
  requirePaymentMethod: () => boolean;
  
  // Utility functions
  clearError: () => void;
}

/**
 * Account user relationship
 */
export interface AccountUser {
  account_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

/**
 * User account for selection
 */
export interface UserAccount {
  account_id: string;
  role: 'owner' | 'admin' | 'member';
  account_name?: string;
  plan?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  is_primary?: boolean;
}