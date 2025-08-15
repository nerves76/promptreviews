/**
 * Optimized Core Authentication Context
 * 
 * This is an improved version of CoreAuthContext that prevents
 * cascading re-renders during TOKEN_REFRESHED events.
 * 
 * Key improvements:
 * - Memoized context values
 * - Stable function references
 * - Selective state updates
 * - Integration with TokenManager
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../providers/supabase';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { tokenManager } from '../services/TokenManager';

// Create singleton client instance
const supabase = createClient();

interface CoreAuthState {
  // Core authentication
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  
  // Email verification
  emailVerified: boolean;
  requiresEmailVerification: boolean;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Error handling
  error: string | null;
  
  // Session management
  sessionExpiresAt: Date | null;
  isSessionExpiringSoon: boolean;
  refreshingSession: boolean;
}

interface CoreAuthContextType extends CoreAuthState {
  // Authentication methods
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, metadata?: any) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  
  // Session methods
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  setError: (error: string) => void;
}

const CoreAuthContext = createContext<CoreAuthContextType | undefined>(undefined);

const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export function OptimizedCoreAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initializationStarted = useRef(false);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastSessionId = useRef<string | null>(null);

  // Core state - MUST have same initial values on server and client to avoid hydration errors
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingSession, setRefreshingSession] = useState(false);

  // Memoized computed states to prevent recalculation
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);
  const emailVerified = useMemo(() => user?.email_confirmed_at ? true : false, [user?.email_confirmed_at]);
  const requiresEmailVerification = useMemo(() => !!user && !emailVerified, [user, emailVerified]);
  
  const sessionExpiresAt = useMemo(() => 
    session?.expires_at ? new Date(session.expires_at * 1000) : null,
    [session?.expires_at]
  );
    
  const isSessionExpiringSoon = useMemo(() => 
    sessionExpiresAt ? sessionExpiresAt.getTime() - Date.now() < SESSION_WARNING_THRESHOLD : false,
    [sessionExpiresAt]
  );

  // Stable function references using useCallback
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorStable = useCallback((error: string) => {
    setError(error);
  }, []);

  // Refresh session with stable reference
  const refreshSession = useCallback(async () => {
    if (refreshingSession) return;
    
    setRefreshingSession(true);
    try {
      // Use TokenManager for silent refresh
      const token = await tokenManager.getAccessToken();
      if (token) {
        const currentSession = tokenManager.getSession();
        if (currentSession) {
          // Only update if session actually changed
          setSession(prev => {
            if (prev?.access_token !== currentSession.access_token) {
              return currentSession;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setError('Session refresh failed');
    } finally {
      setRefreshingSession(false);
    }
  }, [refreshingSession]);

  // Check session validity with stable reference
  const checkSession = useCallback(async () => {
    try {
      const currentSession = tokenManager.getSession();
      
      if (currentSession) {
        // Only update if user changed (not just token)
        setSession(prev => {
          if (prev?.user?.id !== currentSession.user?.id) {
            return currentSession;
          }
          return prev;
        });
        setUser(prev => {
          if (prev?.id !== currentSession.user?.id) {
            return currentSession.user;
          }
          return prev;
        });
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, []);

  // Sign in with stable reference
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        setError(response.error.message);
        return response;
      }

      if (response.data.user && response.data.session) {
        setUser(response.data.user);
        setSession(response.data.session);
      }

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up with stable reference
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: any
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (response.error) {
        setError(response.error.message);
        return response;
      }

      if (response.data.user && response.data.session) {
        setUser(response.data.user);
        setSession(response.data.session);
      }

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out with stable reference
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setUser(null);
      setSession(null);
      
      // Navigate to sign-in
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Initialize auth state with TokenManager integration
  useEffect(() => {
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error);
          setError('Failed to initialize authentication');
        }

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          lastSessionId.current = initialSession.user?.id || null;
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up TokenManager callbacks for critical events only
    tokenManager.onUserChange((userId) => {
      if (userId !== lastSessionId.current) {
        console.log('User changed, updating auth state');
        lastSessionId.current = userId;
        checkSession();
      }
    });

    tokenManager.onSessionExpire(() => {
      console.log('Session expired, clearing auth state');
      setUser(null);
      setSession(null);
      router.push('/auth/sign-in');
    });

    // Set up minimal auth state listener for non-token events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // IGNORE TOKEN_REFRESHED completely - TokenManager handles it
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔇 Ignoring TOKEN_REFRESHED in CoreAuth - handled by TokenManager');
          return;
        }
        
        console.log('Auth state change (non-token):', event);
        
        // Handle actual user state changes
        if (event === 'SIGNED_IN' && newSession?.user?.id !== user?.id) {
          setSession(newSession);
          setUser(newSession?.user || null);
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          router.push('/auth/sign-in');
        }
        
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password');
        }
      }
    );

    // Use TokenManager for session checks instead of interval
    // TokenManager already handles proactive refresh

    return () => {
      subscription.unsubscribe();
      tokenManager.dispose();
    };
  }, [checkSession, router, user?.id]);

  // Memoize the entire context value to prevent unnecessary re-renders
  const contextValue = useMemo<CoreAuthContextType>(() => ({
    // State
    user,
    session,
    isAuthenticated,
    emailVerified,
    requiresEmailVerification,
    isLoading,
    isInitialized,
    error,
    sessionExpiresAt,
    isSessionExpiringSoon,
    refreshingSession,
    
    // Methods (already stable via useCallback)
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSession,
    clearError,
    setError: setErrorStable,
  }), [
    // Only include state that should trigger re-renders
    user,
    session,
    isAuthenticated,
    emailVerified,
    requiresEmailVerification,
    isLoading,
    isInitialized,
    error,
    sessionExpiresAt,
    isSessionExpiringSoon,
    refreshingSession,
    // Methods are stable, include them for completeness
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSession,
    clearError,
    setErrorStable,
  ]);

  return (
    <CoreAuthContext.Provider value={contextValue}>
      {children}
    </CoreAuthContext.Provider>
  );
}

export function useOptimizedCoreAuth() {
  const context = useContext(CoreAuthContext);
  
  if (context === undefined) {
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Return default values for SSR
      return {
        user: null,
        session: null,
        isAuthenticated: false,
        emailVerified: false,
        requiresEmailVerification: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        sessionExpiresAt: null,
        isSessionExpiringSoon: false,
        refreshingSession: false,
        signIn: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => {},
        refreshSession: async () => {},
        checkSession: async () => {},
        clearError: () => {},
        setError: () => {},
      };
    }
    
    throw new Error('useOptimizedCoreAuth must be used within a OptimizedCoreAuthProvider');
  }
  
  return context;
}

export { CoreAuthContext as OptimizedCoreAuthContext };