/**
 * Centralized Authentication Context
 * 
 * This context provides a single source of truth for all authentication state
 * and eliminates the need for multiple competing auth systems.
 * 
 * Features:
 * - Unified auth state management
 * - Performance optimized with proper caching
 * - Consistent error handling
 * - Admin status integration
 * - Business profile integration
 * - Session management
 * - Automatic refreshing
 * 
 * FUTURE ENHANCEMENTS (based on comprehensive auth state analysis):
 * 
 * HIGH PRIORITY:
 * - Email verification status (emailVerified, requiresEmailVerification)
 * - Granular payment states (paymentStatus, subscriptionStatus via Stripe)
 * - Enhanced trial states (trialStatus: 'active'|'expired'|'converted')
 * 
 * MEDIUM PRIORITY:
 * - Team role granularity (teamRole: 'owner'|'admin'|'member'|'pending')
 * - Account lifecycle (accountStatus: 'active'|'suspended'|'canceled')
 * 
 * LOW PRIORITY:
 * - Team invitation states (invited_team_member, team_pending)
 * - Payment failure states (grace_period, account_past_due)
 * - Card expiration tracking
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/auth/providers/supabase';
import { User, Session } from '@supabase/supabase-js';
import { isAdmin, ensureAdminForEmail } from '@/auth/utils/admin';
import { getAccountIdForUser } from '@/auth/utils/accounts';
import { Account } from '@/auth/utils/accounts';
import { AuthResponse } from '@supabase/supabase-js';

// Create singleton client instance
const supabase = createClient();

interface AuthState {
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
  
  // 💳 PAYMENT STATES - Full Stripe Integration
  // Subscription Management
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  paymentStatus: 'current' | 'past_due' | 'canceled' | 'requires_payment_method' | 'requires_action' | null;
  
  // Trial Management
  trialStatus: 'active' | 'expired' | 'converted' | 'none';
  trialDaysRemaining: number;
  isTrialExpiringSoon: boolean; // 3 days or less
  
  // Plan Management
  currentPlan: string | null;
  planTier: 'free' | 'tier1' | 'tier2' | 'tier3' | 'enterprise' | null;
  hasActivePlan: boolean;
  requiresPlanSelection: boolean;
  
  // Payment Method Status
  hasPaymentMethod: boolean;
  paymentMethodStatus: 'valid' | 'expired' | 'requires_action' | 'missing' | null;
  
  // Account Lifecycle
  accountStatus: 'active' | 'suspended' | 'canceled' | 'requires_action';
  canAccessFeatures: boolean;
  
  // Billing History
  hasHadPaidPlan: boolean;
  isReactivated: boolean;
  
  // Session management
  sessionExpiry: Date | null;
  sessionTimeRemaining: number;
  isSessionExpiringSoon: boolean;
  
  // Functions
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  refreshBusinessProfile: () => Promise<void>;
  refreshAccountDetails: () => Promise<void>;
  refreshPaymentStatus: () => Promise<void>; // NEW: Payment status refresh
  
  // Utility functions
  requireAuth: () => boolean;
  requireAdmin: () => boolean;
  requireBusiness: () => boolean;
  requireActivePlan: () => boolean; // NEW: Plan validation
  requirePaymentMethod: () => boolean; // NEW: Payment method validation
  
  // Error handling
  clearError: () => void;
}

interface AuthContextType extends AuthState {
  // Actions (matching AuthState interface)
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache durations
const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BUSINESS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const ACCOUNT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (includes trial and is_free data)
const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin state
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [lastAdminCheck, setLastAdminCheck] = useState<number>(0);
  
  // Business state
  const [accountId, setAccountId] = useState<string | null>(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [lastBusinessCheck, setLastBusinessCheck] = useState<number>(0);
  
  // Account state (including trial and is_free_account)
  const [account, setAccount] = useState<any | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [lastAccountCheck, setLastAccountCheck] = useState<number>(0);
  
  // Prevent multiple simultaneous operations
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isCheckingBusiness, setIsCheckingBusiness] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);

  // Use refs to prevent circular dependencies in useCallback
  const isRefreshingRef = useRef(false);
  
  // Update ref whenever state changes
  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Circuit breaker to prevent infinite loops
  const circuitBreaker = useRef({ 
    businessCalls: 0, 
    lastReset: Date.now(),
    isOpen: false 
  });

  // Computed values
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);
  
  // Email verification status
  const emailVerified = useMemo(() => !!user?.email_confirmed_at, [user]);
  const requiresEmailVerification = useMemo(() => !!user && !emailVerified, [user, emailVerified]);

  // 💳 PAYMENT STATE CALCULATIONS - Full Stripe Integration
  
  // Subscription Status (from Stripe via webhooks)
  const subscriptionStatus = useMemo(() => account?.subscription_status || null, [account]);
  
  // Payment Status (derived from subscription status)
  const paymentStatus = useMemo(() => {
    if (!subscriptionStatus) return null;
    
    switch (subscriptionStatus) {
      case 'active':
      case 'trialing':
        return 'current';
      case 'past_due':
        return 'past_due';
      case 'canceled':
        return 'canceled';
      case 'incomplete':
      case 'incomplete_expired':
        return 'requires_payment_method';
      case 'unpaid':
        return 'requires_action';
      default:
        return null;
    }
  }, [subscriptionStatus]);
  
  // Trial Management
  const trialStatus = useMemo(() => {
    if (!account) return 'none';
    
    const now = new Date();
    const trialStart = account.trial_start ? new Date(account.trial_start) : null;
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    
    if (!trialStart || !trialEnd) return 'none';
    
    // Check if converted to paid plan
    if (account.has_had_paid_plan && subscriptionStatus === 'active') {
      return 'converted';
    }
    
    // Check if trial is active
    if (now >= trialStart && now <= trialEnd) {
      return 'active';
    }
    
    // Trial has expired
    if (now > trialEnd) {
      return 'expired';
    }
    
    return 'none';
  }, [account, subscriptionStatus]);
  
  const trialDaysRemaining = useMemo(() => {
    if (!account?.trial_end || trialStatus !== 'active') return 0;
    
    const now = new Date();
    const trialEnd = new Date(account.trial_end);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [account, trialStatus]);
  
  const isTrialExpiringSoon = useMemo(() => {
    return trialStatus === 'active' && trialDaysRemaining <= 3;
  }, [trialStatus, trialDaysRemaining]);
  
  // Plan Management
  const currentPlan = useMemo(() => {
    if (!account?.plan || account.plan === 'no_plan' || account.plan === 'NULL') return null;
    return account.plan;
  }, [account]);
  
  const planTier = useMemo(() => {
    if (!currentPlan) return null;
    
    switch (currentPlan.toLowerCase()) {
      case 'grower':
        return 'tier1';
      case 'builder':
        return 'tier2';
      case 'maven':
        return 'tier3';
      case 'enterprise':
        return 'enterprise';
      default:
        return account?.is_free_account ? 'free' : null;
    }
  }, [currentPlan, account]);
  
  const hasActivePlan = useMemo(() => {
    return !!currentPlan && subscriptionStatus === 'active';
  }, [currentPlan, subscriptionStatus]);
  
  const requiresPlanSelection = useMemo(() => {
    return !currentPlan && trialStatus !== 'none';
  }, [currentPlan, trialStatus]);
  
  // Payment Method Status (we'll enhance this with Stripe API calls later)
  const hasPaymentMethod = useMemo(() => {
    return !!account?.stripe_customer_id && !!account?.stripe_subscription_id;
  }, [account]);
  
  const paymentMethodStatus = useMemo(() => {
    if (!hasPaymentMethod) return 'missing';
    
    // This will be enhanced with real Stripe API calls
    switch (paymentStatus) {
      case 'current':
        return 'valid';
      case 'past_due':
        return 'expired';
      case 'requires_action':
        return 'requires_action';
      case 'requires_payment_method':
        return 'missing';
      default:
        return 'valid';
    }
  }, [hasPaymentMethod, paymentStatus]);
  
  // Account Lifecycle
  const accountStatus = useMemo(() => {
    if (!account) return 'requires_action';
    
    // ============================================
    // CRITICAL FIX: Handle reactivation properly
    // If deleted_at exists but user is logged in, they're trying to return
    // ============================================
    if (account.deleted_at) {
      console.log('🔄 Deleted account detected - user needs reactivation');
      // Don't block them as 'canceled' - let them reactivate
      return 'requires_action'; // This will prompt plan selection
    }
    
    switch (subscriptionStatus) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
      case 'unpaid':
        return 'requires_action';
      case 'canceled':
        return 'canceled';
      case 'incomplete':
      case 'incomplete_expired':
        return 'suspended';
      default:
        return trialStatus === 'active' ? 'active' : 'requires_action';
    }
  }, [account, subscriptionStatus, trialStatus]);
  
  const canAccessFeatures = useMemo(() => {
    return accountStatus === 'active' || trialStatus === 'active';
  }, [accountStatus, trialStatus]);
  
  // Billing History
  const hasHadPaidPlan = useMemo(() => !!account?.has_had_paid_plan, [account]);
  const isReactivated = useMemo(() => {
    return hasHadPaidPlan && subscriptionStatus === 'active' && !!account?.stripe_subscription_id;
  }, [hasHadPaidPlan, subscriptionStatus, account]);
  
  // Session management updates
  const sessionExpiry = useMemo(() => {
    if (!session?.expires_at) return null;
    return new Date(session.expires_at * 1000);
  }, [session]);
  
  const sessionTimeRemaining = useMemo(() => {
    if (!sessionExpiry) return 0;
    const now = new Date();
    const remaining = sessionExpiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }, [sessionExpiry]);
  
  const isSessionExpiringSoon = useMemo(() => {
    return sessionTimeRemaining > 0 && sessionTimeRemaining < 300; // 5 minutes
  }, [sessionTimeRemaining]);

  // Listen for business creation events to refresh state
  useEffect(() => {
    const handleBusinessCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AuthContext: Business created event received, refreshing state...');
      }
      // Force refresh business state by calling the functions directly
      const currentUser = supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          // Use setTimeout to ensure the functions are available
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              // Dispatch a custom event to trigger a refresh
              window.dispatchEvent(new CustomEvent('forceRefreshBusiness'));
            }
          }, 100);
        }
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('businessCreated', handleBusinessCreated);
      // Only log during initial setup
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AuthContext: Event listener registered for businessCreated');
      }
      
      return () => {
        window.removeEventListener('businessCreated', handleBusinessCreated);
      };
    }
  }, []); // Empty dependency array - only register once

  // Declare the individual check functions first
  const checkAdminStatus = useCallback(async (currentUser: User, forceRefresh = false) => {
    if (isCheckingAdmin && !forceRefresh) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastAdminCheck < ADMIN_CACHE_DURATION) return;
    
    setIsCheckingAdmin(true);
    setAdminLoading(true);
    
    // Add timeout to prevent stuck state
    const timeout = setTimeout(() => {
      setAdminLoading(false);
      setIsCheckingAdmin(false);
      console.warn('⚠️ AuthContext: Admin check timeout after 10s');
    }, 10000); // Increased to 10s to prevent premature timeouts
    
    try {
      // Ensure admin for known admin emails
      if (currentUser.email) {
        await ensureAdminForEmail({ id: currentUser.id, email: currentUser.email }, supabase);
      }
      
      const adminStatus = await isAdmin(currentUser.id, supabase);
      setIsAdminUser(adminStatus);
      setLastAdminCheck(now);
      
    } catch (err) {
      console.error('AuthContext: Admin check failed:', err);
      // Don't change admin status on error
    } finally {
      clearTimeout(timeout);
      setAdminLoading(false);
      setIsCheckingAdmin(false);
    }
  }, [isCheckingAdmin, lastAdminCheck]);

  const checkBusinessProfile = useCallback(async (currentUser: User, forceRefresh = false) => {
    // Circuit breaker: Reset counter every 30 seconds
    const now = Date.now();
    if (now - circuitBreaker.current.lastReset > 30000) {
      circuitBreaker.current.businessCalls = 0;
      circuitBreaker.current.lastReset = now;
      circuitBreaker.current.isOpen = false;
    }
    
    // Circuit breaker: Prevent infinite calls
    if (circuitBreaker.current.businessCalls > 5) {
      if (!circuitBreaker.current.isOpen) {
        console.warn('🚨 AuthContext: Circuit breaker activated - too many business profile checks');
        circuitBreaker.current.isOpen = true;
      }
      return;
    }
    
    circuitBreaker.current.businessCalls++;
    
    if (isCheckingBusiness && !forceRefresh) return;
    
    if (!forceRefresh && now - lastBusinessCheck < BUSINESS_CACHE_DURATION) return;
    
    setIsCheckingBusiness(true);
    setBusinessLoading(true);
    
    // Add timeout to prevent stuck state
    const timeout = setTimeout(() => {
      setBusinessLoading(false);
      setIsCheckingBusiness(false);
      console.warn('⚠️ AuthContext: Business check timeout after 10s');
    }, 10000); // Increased to 10s to prevent premature timeouts
    
    try {
      const userAccountId = await getAccountIdForUser(currentUser.id, supabase);
      // Only log if account ID has changed
      if (accountId !== userAccountId && process.env.NODE_ENV === 'development') {
        console.log('🔍 AuthContext: User account ID:', userAccountId);
      }
      setAccountId(userAccountId);
      
      // 🔧 FIXED: Check for actual businesses, not just account existence
      if (userAccountId) {
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('account_id', userAccountId);
          
        if (businessError) {
          console.error('AuthContext: Error checking businesses:', {
            error: businessError,
            code: businessError.code,
            message: businessError.message,
            details: businessError.details,
            hint: businessError.hint,
            userAccountId
          });
          setHasBusiness(false);
        } else {
          // Only set hasBusiness to true if user has actual businesses
          const hasBusinesses = businesses && businesses.length > 0;
          
          // Only log if business status has changed or it's a force refresh
          if (forceRefresh && process.env.NODE_ENV === 'development') {
            console.log('🔍 AuthContext: Business check result:', {
              userAccountId,
              businessesCount: businesses?.length || 0,
              hasBusinesses,
              timestamp: new Date().toISOString(),
              isForceRefresh: forceRefresh
            });
            console.log('🔍 AuthContext: Setting hasBusiness to:', hasBusinesses);
          }
          setHasBusiness(hasBusinesses);
        }
      } else {
        setHasBusiness(false);
      }
      
      setLastBusinessCheck(now);
      
    } catch (err) {
      console.error('AuthContext: Business check failed:', err);
      // Don't change business status on error
    } finally {
      clearTimeout(timeout);
      setBusinessLoading(false);
      setIsCheckingBusiness(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingBusiness, lastBusinessCheck]); // REMOVED: accountId, hasBusiness to break circular dependency

  const checkAccountDetails = useCallback(async (currentUser: User, forceRefresh = false) => {
    if (isCheckingAccount && !forceRefresh) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastAccountCheck < ACCOUNT_CACHE_DURATION) return;
    
    setIsCheckingAccount(true);
    setAccountLoading(true);
    
    // Add timeout to prevent stuck state
    const timeout = setTimeout(() => {
      setAccountLoading(false);
      setIsCheckingAccount(false);
      console.warn('⚠️ AuthContext: Account check timeout after 10s');
    }, 10000); // Increased to 10s to prevent premature timeouts
    
    try {
      const userAccountId = await getAccountIdForUser(currentUser.id, supabase);
      
      if (!userAccountId) {
        setAccount(null);
        setLastAccountCheck(now);
        return;
      }

      // Fetch full account details including trial and is_free_account data
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', userAccountId)
        .single();

      if (accountError) {
        console.error('AuthContext: Account details check failed:', accountError);
        // Don't change account data on error
        return;
      }

      setAccount(accountData);
      setLastAccountCheck(now);
      
    } catch (err) {
      console.error('AuthContext: Account details check failed:', err);
      // Don't change account data on error, but ensure loading states are cleared
      setAccountLoading(false);
      setIsCheckingAccount(false);
    } finally {
      // Always clear loading states, even if there was an error
      clearTimeout(timeout);
      setAccountLoading(false);
      setIsCheckingAccount(false);
      console.log('✅ AuthContext: Account loading completed, accountLoading set to false');
    }
  }, [isCheckingAccount, lastAccountCheck]);

  // Core authentication function (declared after individual check functions to avoid hoisting issues)
  const checkAuthState = useCallback(async (forceRefresh = false) => {
    // Use ref for isRefreshing to avoid dependency on state
    if (isRefreshingRef.current && !forceRefresh) {
      console.log('⏭️ AuthContext: Skipping check - already refreshing');
      return;
    }
    
    try {
      console.log('🔍 AuthContext: Starting auth check...');
      setIsRefreshing(true);
      setError(null);
      // Clear loading states if this is a refresh
      if (forceRefresh) {
        setIsLoading(false);
        setAccountLoading(false);
        setAdminLoading(false);
        setBusinessLoading(false);
      }
      
      // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
      if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
        const devBypass = localStorage.getItem('dev_auth_bypass');
        if (devBypass === 'true') {
          console.log('🔧 DEV MODE: Using authentication bypass');
          const mockUser = {
            id: '12345678-1234-5678-9abc-123456789012', // Use existing account ID
            email: 'test@example.com',
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            user_metadata: {
              first_name: 'Dev',
              last_name: 'User'
            },
            email_confirmed_at: new Date().toISOString()
          } as User;
          
          const mockSession = {
            access_token: 'dev-token',
            refresh_token: 'dev-refresh',
            expires_in: 3600,
            expires_at: Date.now() + 3600000,
            token_type: 'bearer',
            user: mockUser
          } as Session;
          
          setSession(mockSession);
          setUser(mockUser);
          setAccountId('12345678-1234-5678-9abc-123456789012'); // Use existing account
          setHasBusiness(true);
          setAccount({
            id: '12345678-1234-5678-9abc-123456789012', // Use existing account
            user_id: '12345678-1234-5678-9abc-123456789012',
            email: 'test@example.com',
            first_name: 'Dev',
            last_name: 'User',
            business_name: 'Dev Business',
            plan: 'maven'
          });
          setIsAdminUser(true);
          setIsInitialized(true);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
      
      // Add timeout to prevent hanging on production
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout after 10s')), 10000)
      );
      
      let currentSession = null;
      let sessionError = null;
      
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        currentSession = result?.data?.session || null;
        sessionError = result?.error || null;
      } catch (err) {
        console.error('❌ Session check failed or timed out:', err);
        sessionError = err;
      }
      
      if (sessionError) {
        console.error('AuthContext: Session error:', sessionError);
        setError(sessionError.message);
        setUser(null);
        setSession(null);
        setIsInitialized(true);
        setIsLoading(false); // FIX: Clear loading state on error
        setIsRefreshing(false);
        
        // Redirect to login if we have a session error on a protected page
        if (typeof window !== 'undefined' && 
            window.location.pathname.startsWith('/dashboard')) {
          console.log('🔄 AuthContext: Session error on dashboard, redirecting to login');
          window.location.href = '/auth/sign-in';
        }
        return;
      }
      
      if (!currentSession) {
        setUser(null);
        setSession(null);
        setAccountId(null);
        setHasBusiness(false);
        setIsAdminUser(false);
        setIsInitialized(true);
        setIsLoading(false); // FIX: Clear loading state when no session
        setIsRefreshing(false);
        
        // Redirect to login if no session on dashboard pages
        if (typeof window !== 'undefined' && 
            window.location.pathname.startsWith('/dashboard')) {
          console.log('🔄 AuthContext: No session on dashboard, redirecting to login');
          window.location.href = '/auth/sign-in';
        }
        return;
      }
      
      setSession(currentSession);
      setUser(currentSession.user);
      setIsInitialized(true);
      
      // Check admin status, business profile, and account details in parallel
      if (currentSession.user) {
        await Promise.all([
          checkAdminStatus(currentSession.user),
          checkBusinessProfile(currentSession.user),
          checkAccountDetails(currentSession.user)
        ]).catch(err => {
          console.error('AuthContext: Error checking user details:', err);
          // Don't fail auth if these checks fail
        });
      }
      
    } catch (err) {
      console.error('AuthContext: Auth check failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication check failed');
      setIsInitialized(true);
    } finally {
      // CRITICAL: Always set loading to false to unblock the UI
      console.log('🏁 AuthContext: Auth check complete, clearing loading state');
      setIsLoading(false);
      setIsRefreshing(false);
      setAccountLoading(false);
      setAdminLoading(false);
      setBusinessLoading(false);
      isRefreshingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependencies to prevent circular dependency chain

  // Public API functions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Return the actual AuthResponse from Supabase
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      // Return a properly formatted AuthResponse for catch errors
      return {
        data: { user: null, session: null },
        error: { message: errorMessage, name: 'SignInError' } as any
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      
      // Clear all state
      setUser(null);
      setSession(null);
      setAccountId(null);
      setHasBusiness(false);
      setAccount(null);
      setIsAdminUser(false);
      setLastAdminCheck(0);
      setLastBusinessCheck(0);
      setLastAccountCheck(0);
      
    } catch (err) {
      console.error('AuthContext: Sign out failed:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    await checkAuthState(true);
  }, [checkAuthState]);

  const refreshAdminStatus = useCallback(async () => {
    if (user) {
      await checkAdminStatus(user, true);
    }
  }, [user, checkAdminStatus]);

  const refreshBusinessProfile = useCallback(async () => {
    console.log('🔄 AuthContext: refreshBusinessProfile called with user:', user?.id);
    if (user) {
      await checkBusinessProfile(user, true);
    } else {
      console.log('🔄 AuthContext: refreshBusinessProfile called but no user found');
    }
  }, [user, checkBusinessProfile]);

  const refreshAccountDetails = useCallback(async () => {
    if (user) {
      await checkAccountDetails(user, true);
    }
  }, [user, checkAccountDetails]);

  // Listen for force refresh events (after functions are initialized)
  useEffect(() => {
    const handleForceRefresh = (event: Event) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AuthContext: Force refresh event received', {
          eventType: event.type,
          timestamp: new Date().toISOString()
        });
      }
      // Get current user state from supabase instead of relying on hook dependency
      supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
        if (currentUser) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 AuthContext: Calling checkBusinessProfile with forceRefresh=true for user:', currentUser.id);
          }
          // Call the functions directly without dependencies to avoid initialization issues
          setTimeout(() => {
            checkBusinessProfile(currentUser, true);
            checkAccountDetails(currentUser, true);
          }, 100);
        } else {
          console.log('🔄 AuthContext: No current user found for refresh');
        }
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('forceRefreshBusiness', handleForceRefresh);
      // Only log during initial setup
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 AuthContext: Force refresh event listener registered');
      }
      
      return () => {
        window.removeEventListener('forceRefreshBusiness', handleForceRefresh);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent re-creating listener

  // Navigation guards
  const requireAuth = useCallback((redirectTo = '/auth/sign-in') => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [isAuthenticated, router]);

  const requireAdmin = useCallback((redirectTo = '/dashboard') => {
    if (!isAuthenticated) {
      router.push('/auth/sign-in');
      return false;
    }
    if (!isAdminUser) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [isAuthenticated, isAdminUser, router]);

  const requireBusiness = useCallback((redirectTo = '/dashboard/create-business') => {
    if (!isAuthenticated) {
      router.push('/auth/sign-in');
      return false;
    }
    if (!hasBusiness) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [isAuthenticated, hasBusiness, router]);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);



  // 💳 PAYMENT STATUS FUNCTIONS
  
  // Refresh payment status from Stripe
  const refreshPaymentStatus = useCallback(async () => {
    if (!isAuthenticated || !accountId) return;
    
    try {
      // This will trigger a fresh fetch of account data which includes Stripe status
      await refreshAccountDetails();
    } catch (error) {
      console.error('Error refreshing payment status:', error);
    }
  }, [isAuthenticated, accountId, refreshAccountDetails]);
  
  // Plan validation functions
  const requireActivePlan = useCallback(() => {
    if (!hasActivePlan) {
      setError('Active paid plan required');
      return false;
    }
    return true;
  }, [hasActivePlan]);
  
  const requirePaymentMethod = useCallback(() => {
    if (!hasPaymentMethod) {
      setError('Valid payment method required');
      return false;
    }
    return true;
  }, [hasPaymentMethod]);

  // Initialize auth state
  useEffect(() => {
    // Only run if not already initialized
    // CRITICAL FIX: Don't check isLoading here as it starts as true
    // We need to actually start the auth check!
    if (!isInitialized) {
      console.log('🚀 AuthContext: Initializing auth state');
      checkAuthState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount to prevent circular dependencies

  // Listen for auth state changes (with infinite loop prevention)
  useEffect(() => {
    let isProcessing = false; // Prevent concurrent processing
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Auth state changed:', event, session?.user?.id);
        }
        
        // Prevent concurrent processing of auth events
        if (isProcessing) {
          console.log('AuthContext: Skipping event, already processing:', event);
          return;
        }
        
        isProcessing = true;
        
        try {
          if (event === 'SIGNED_IN' && session) {
            setSession(session);
            setUser(session.user);
            setError(null);
            
            // Check admin, business status, and account details for new session
            if (session.user) {
              await Promise.all([
                checkAdminStatus(session.user, true),
                checkBusinessProfile(session.user, true),
                checkAccountDetails(session.user, true)
              ]);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
            setAccountId(null);
            setHasBusiness(false);
            setAccount(null);
            setIsAdminUser(false);
            setError(null);
            setIsLoading(false);
            setIsRefreshing(false);
            
            // Redirect to login if on dashboard
            if (typeof window !== 'undefined' && 
                window.location.pathname.startsWith('/dashboard')) {
              console.log('🔄 AuthContext: User signed out on dashboard, redirecting to login');
              window.location.href = '/auth/sign-in';
            }
          } else if (event === 'TOKEN_REFRESHED' && session) {
            setSession(session);
            setUser(session.user);
            // Don't trigger full checks for token refresh
          } else if (event === 'INITIAL_SESSION') {
            // Don't process INITIAL_SESSION here - let checkAuthState handle initial load
            console.log('AuthContext: Ignoring INITIAL_SESSION event to prevent duplicated checks');
          }
        } finally {
          isProcessing = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, []); // Empty dependencies to prevent re-creating listener

  // REMOVED: Custom auto-refresh that was causing form resets
  // Supabase already handles session refresh automatically via autoRefreshToken: true
  // This built-in mechanism doesn't trigger state updates or cause form resets

  // 🚨 SAFETY: Force clear loading states if they get stuck
  // IMPORTANT: Two-phase timeout - quick for normal loads, longer for OAuth
  useEffect(() => {
    // Only set timeout if we're actually loading and not already initialized
    if ((isLoading || accountLoading || businessLoading || adminLoading) && !isInitialized) {
      // First timeout - 8 seconds for normal page loads
      const quickTimeout = setTimeout(() => {
        // Check if we're in an OAuth flow (URL contains callback or oauth params)
        const isOAuthFlow = typeof window !== 'undefined' && 
          (window.location.pathname.includes('/callback') || 
           window.location.search.includes('code=') ||
           window.location.search.includes('error='));
        
        if (!isOAuthFlow) {
          console.warn('⚡ AuthContext: Quick timeout - clearing stuck loading states', {
            isLoading,
            accountLoading,
            businessLoading,
            adminLoading,
            user: user?.id ? 'present' : 'missing',
            timestamp: new Date().toISOString()
          });
          setIsLoading(false);
          setAccountLoading(false);
          setAdminLoading(false);
          setBusinessLoading(false);
          setIsInitialized(true);
          setIsRefreshing(false);
          setIsCheckingAccount(false);
          setIsCheckingAdmin(false);
          setIsCheckingBusiness(false);
        }
      }, 8000); // 8 seconds for normal loads
      
      // Second timeout - 20 seconds for OAuth flows
      const longTimeout = setTimeout(() => {
        console.warn('🚨 AuthContext: Final timeout - force clearing all loading states', {
          isLoading,
          accountLoading,
          businessLoading,
          adminLoading,
          user: user?.id ? 'present' : 'missing',
          timestamp: new Date().toISOString()
        });
        setIsLoading(false);
        setAccountLoading(false);
        setAdminLoading(false);
        setBusinessLoading(false);
        setIsInitialized(true);
        setIsRefreshing(false);
        setIsCheckingAccount(false);
        setIsCheckingAdmin(false);
        setIsCheckingBusiness(false);
      }, 20000); // 20 seconds max for OAuth
      
      return () => {
        clearTimeout(quickTimeout);
        clearTimeout(longTimeout);
      };
    }
  }, [isLoading, accountLoading, businessLoading, adminLoading, isInitialized]);

  // Context value
  const value: AuthContextType = useMemo(() => ({
    // Core State
    user,
    session,
    isAuthenticated,
    emailVerified,
    requiresEmailVerification,
    isLoading,
    isInitialized,
    error,
    
    // Admin & Account
    isAdminUser,
    adminLoading,
    accountId,
    hasBusiness,
    businessLoading,
    account,
    accountLoading,
    
    // 💳 Payment States
    subscriptionStatus,
    paymentStatus,
    trialStatus,
    trialDaysRemaining,
    isTrialExpiringSoon,
    currentPlan,
    planTier,
    hasActivePlan,
    requiresPlanSelection,
    hasPaymentMethod,
    paymentMethodStatus,
    accountStatus,
    canAccessFeatures,
    hasHadPaidPlan,
    isReactivated,
    
    // Session Management
    sessionExpiry,
    sessionTimeRemaining,
    isSessionExpiringSoon,
    
    // Actions
    signIn,
    signOut,
    refreshAuth,
    refreshAdminStatus,
    refreshBusinessProfile,
    refreshAccountDetails,
    refreshPaymentStatus,
    
    // Guards
    requireAuth,
    requireAdmin,
    requireBusiness,
    requireActivePlan,
    requirePaymentMethod,
    
    // Utilities
    clearError,
  }), [
    user, session, isAuthenticated, emailVerified, requiresEmailVerification, isLoading, isInitialized, error,
    isAdminUser, adminLoading, accountId, hasBusiness, businessLoading, account, accountLoading,
    subscriptionStatus, paymentStatus, trialStatus, trialDaysRemaining, isTrialExpiringSoon,
    currentPlan, planTier, hasActivePlan, requiresPlanSelection, hasPaymentMethod, paymentMethodStatus,
    accountStatus, canAccessFeatures, hasHadPaidPlan, isReactivated,
    sessionExpiry, sessionTimeRemaining, isSessionExpiringSoon,
    signIn, signOut, refreshAuth, refreshAdminStatus, refreshBusinessProfile, refreshAccountDetails, refreshPaymentStatus,
    requireAuth, requireAdmin, requireBusiness, requireActivePlan, requirePaymentMethod,
    clearError
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for specific use cases
export function useAuthGuard() {
  const { isAuthenticated, isLoading, requireAuth } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      requireAuth();
    }
  }, [isAuthenticated, isLoading, requireAuth]);
  
  return { isAuthenticated, isLoading };
}

export function useAdminGuard() {
  const { isAuthenticated, isAdminUser, isLoading, adminLoading, requireAdmin } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !adminLoading && isAuthenticated && !isAdminUser) {
      requireAdmin();
    }
  }, [isAuthenticated, isAdminUser, isLoading, adminLoading, requireAdmin]);
  
  return { isAuthenticated, isAdminUser, isLoading: isLoading || adminLoading };
}

export function useBusinessGuard() {
  const { isAuthenticated, hasBusiness, isLoading, businessLoading, requireBusiness } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !businessLoading && isAuthenticated && !hasBusiness) {
      requireBusiness();
    }
  }, [isAuthenticated, hasBusiness, isLoading, businessLoading, requireBusiness]);
  
  return { isAuthenticated, hasBusiness, isLoading: isLoading || businessLoading };
} 