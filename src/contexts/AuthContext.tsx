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

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';
import { User, Session } from '@supabase/supabase-js';
import { isAdmin, ensureAdminForEmail } from '@/utils/admin';
import { getAccountIdForUser } from '@/utils/accountUtils';

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
  
  // Business profile
  accountId: string | null;
  hasBusiness: boolean;
  businessLoading: boolean;
  
  // Account details (including trial and is_free_account)
  account: any | null;
  accountLoading: boolean;
  
  // Session info
  sessionExpiry: Date | null;
  sessionTimeRemaining: number | null;
}

interface AuthContextType extends AuthState {
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  refreshBusinessProfile: () => Promise<void>;
  refreshAccountDetails: () => Promise<void>;
  
  // Navigation guards
  requireAuth: (redirectTo?: string) => boolean;
  requireAdmin: (redirectTo?: string) => boolean;
  requireBusiness: (redirectTo?: string) => boolean;
  
  // Utility functions
  clearError: () => void;
  isSessionExpiringSoon: () => boolean;
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

  // Computed values
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);
  
  // Email verification status
  const emailVerified = useMemo(() => !!user?.email_confirmed_at, [user]);
  const requiresEmailVerification = useMemo(() => !!user && !emailVerified, [user, emailVerified]);
  
  const sessionExpiry = useMemo(() => {
    if (!session?.expires_at) return null;
    return new Date(session.expires_at * 1000);
  }, [session]);
  
  const sessionTimeRemaining = useMemo(() => {
    if (!sessionExpiry) return null;
    return Math.max(0, sessionExpiry.getTime() - Date.now());
  }, [sessionExpiry]);

  // Core authentication functions
  const checkAuthState = useCallback(async (forceRefresh = false) => {
    if (isRefreshing && !forceRefresh) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AuthContext: Session error:', sessionError);
        setError(sessionError.message);
        setUser(null);
        setSession(null);
        setIsInitialized(true);
        return;
      }
      
      if (!currentSession) {
        setUser(null);
        setSession(null);
        setAccountId(null);
        setHasBusiness(false);
        setIsAdminUser(false);
        setIsInitialized(true);
        return;
      }
      
      setSession(currentSession);
      setUser(currentSession.user);
      setIsInitialized(true);
      
      // Check admin status, business profile, and account details in parallel
      if (currentSession.user) {
        checkAdminStatus(currentSession.user);
        checkBusinessProfile(currentSession.user);
        checkAccountDetails(currentSession.user);
      }
      
    } catch (err) {
      console.error('AuthContext: Auth check failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication check failed');
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const checkAdminStatus = useCallback(async (currentUser: User, forceRefresh = false) => {
    if (isCheckingAdmin && !forceRefresh) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastAdminCheck < ADMIN_CACHE_DURATION) return;
    
    setIsCheckingAdmin(true);
    setAdminLoading(true);
    
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
      setAdminLoading(false);
      setIsCheckingAdmin(false);
    }
  }, [isCheckingAdmin, lastAdminCheck]);

  const checkBusinessProfile = useCallback(async (currentUser: User, forceRefresh = false) => {
    if (isCheckingBusiness && !forceRefresh) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastBusinessCheck < BUSINESS_CACHE_DURATION) return;
    
    setIsCheckingBusiness(true);
    setBusinessLoading(true);
    
    try {
      const userAccountId = await getAccountIdForUser(currentUser.id, supabase);
      setAccountId(userAccountId);
      setHasBusiness(!!userAccountId);
      setLastBusinessCheck(now);
      
    } catch (err) {
      console.error('AuthContext: Business check failed:', err);
      // Don't change business status on error
    } finally {
      setBusinessLoading(false);
      setIsCheckingBusiness(false);
    }
  }, [isCheckingBusiness, lastBusinessCheck]);

  const checkAccountDetails = useCallback(async (currentUser: User, forceRefresh = false) => {
    if (isCheckingAccount && !forceRefresh) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastAccountCheck < ACCOUNT_CACHE_DURATION) return;
    
    setIsCheckingAccount(true);
    setAccountLoading(true);
    
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
      // Don't change account data on error
    } finally {
      setAccountLoading(false);
      setIsCheckingAccount(false);
    }
  }, [isCheckingAccount, lastAccountCheck]);

  // Public API functions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Auth state will be updated via the auth state change listener
      return { success: true };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      return { success: false, error: errorMessage };
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
    if (user) {
      await checkBusinessProfile(user, true);
    }
  }, [user, checkBusinessProfile]);

  const refreshAccountDetails = useCallback(async () => {
    if (user) {
      await checkAccountDetails(user, true);
    }
  }, [user, checkAccountDetails]);

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

  const isSessionExpiringSoon = useCallback(() => {
    return sessionTimeRemaining !== null && sessionTimeRemaining < SESSION_WARNING_THRESHOLD;
  }, [sessionTimeRemaining]);

  // Initialize auth state
  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AuthContext: Auth state changed:', event, session?.user?.id);
        }
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          setError(null);
          
          // Check admin, business status, and account details for new session
          if (session.user) {
            checkAdminStatus(session.user, true);
            checkBusinessProfile(session.user, true);
            checkAccountDetails(session.user, true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setAccountId(null);
          setHasBusiness(false);
          setAccount(null);
          setIsAdminUser(false);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminStatus, checkBusinessProfile, checkAccountDetails]);

  // Context value
  const value: AuthContextType = useMemo(() => ({
    // State
    user,
    session,
    isAuthenticated,
    emailVerified,
    requiresEmailVerification,
    isLoading,
    isInitialized,
    error,
    isAdminUser,
    adminLoading,
    accountId,
    hasBusiness,
    businessLoading,
    account,
    accountLoading,
    sessionExpiry,
    sessionTimeRemaining,
    
    // Actions
    signIn,
    signOut,
    refreshAuth,
    refreshAdminStatus,
    refreshBusinessProfile,
    refreshAccountDetails,
    
    // Guards
    requireAuth,
    requireAdmin,
    requireBusiness,
    
    // Utilities
    clearError,
    isSessionExpiringSoon,
  }), [
    user, session, isAuthenticated, emailVerified, requiresEmailVerification, isLoading, isInitialized, error,
    isAdminUser, adminLoading, accountId, hasBusiness, businessLoading,
    account, accountLoading, sessionExpiry, sessionTimeRemaining,
    signIn, signOut, refreshAuth, refreshAdminStatus, refreshBusinessProfile, refreshAccountDetails,
    requireAuth, requireAdmin, requireBusiness,
    clearError, isSessionExpiringSoon
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