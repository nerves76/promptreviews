/**
 * Core Authentication Context
 * 
 * Handles fundamental authentication operations:
 * - User session management
 * - Sign in/out/up operations
 * - Email verification
 * - Session refresh
 * 
 * This is the foundation context that other auth contexts depend on.
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
  refreshSession: () => Promise<void>; // Minimal implementation - delegates to TokenManager
  
  // Utility methods
  clearError: () => void;
  setError: (error: string) => void;
}

const CoreAuthContext = createContext<CoreAuthContextType | undefined>(undefined);

const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export function CoreAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initializationStarted = useRef(false);
  // Removed sessionCheckInterval - no longer needed as TokenManager handles refresh

  // Core state - MUST have same initial values on server and client to avoid hydration errors
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Always start with loading true
  const [isInitialized, setIsInitialized] = useState(false); // Always start with initialized false
  const [error, setError] = useState<string | null>(null);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const manualSignOutRef = useRef(false);
  const sessionRecoveryInProgress = useRef(false);

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

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Minimal refresh session - just delegates to TokenManager
  // Kept for backward compatibility with components that call it
  const refreshSession = useCallback(async () => {
    try {
      // TokenManager handles the actual refresh
      const token = await tokenManager.getAccessToken();
      if (!token) {
        // If no token, try to get session from Supabase directly
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }, []);

  // Sign in
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
        // Update TokenManager with new session
        tokenManager.updateSession(response.data.session);
      }

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign up
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
        // Update TokenManager with new session
        tokenManager.updateSession(response.data.session);
      }

      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    manualSignOutRef.current = true;
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setUser(null);
      setSession(null);
      // Clear TokenManager session
      tokenManager.updateSession(null);
      
      // Navigate to sign-in
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
      manualSignOutRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const attemptSessionRecovery = useCallback(async () => {
    if (sessionRecoveryInProgress.current) {
      return false;
    }

    sessionRecoveryInProgress.current = true;
    setRefreshingSession(true);

    try {
      console.warn('⚠️ Auth: Unexpected sign-out detected, attempting silent recovery');

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        console.warn('✅ Auth: Session recovered via getSession()');
        setSession(currentSession);
        setUser(currentSession.user);
        tokenManager.updateSession(currentSession);
        return true;
      }

      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('❌ Auth: Silent refresh failed:', refreshError);
      }

      if (refreshed?.session) {
        console.warn('✅ Auth: Session recovered via refreshSession()');
        setSession(refreshed.session);
        setUser(refreshed.session.user);
        tokenManager.updateSession(refreshed.session);
        return true;
      }

      return false;
    } catch (error) {
      console.error('💥 Auth: Session recovery attempt failed:', error);
      return false;
    } finally {
      sessionRecoveryInProgress.current = false;
      setRefreshingSession(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Skip if already initialized or initializing
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
          // Sync with TokenManager
          tokenManager.updateSession(initialSession);
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        
        // Handle different auth events appropriately
        // TOKEN_REFRESHED: Silent token refresh, no UI updates needed
        // SIGNED_IN: Could be initial load OR token refresh with same user
        // INITIAL_SESSION: First session check on page load
        
        if (event === 'TOKEN_REFRESHED') {
          // COMPLETELY IGNORE TOKEN_REFRESHED - TokenManager handles it
          return; // Skip ALL updates for token refresh
        }
        
        if (event === 'SIGNED_IN' && newSession?.user?.id === user?.id) {
          // SIGNED_IN with same user = likely a token refresh
          // Only update session if the access token actually changed
          setSession(prev => {
            // Check if the access token is different
            if (prev?.access_token !== newSession?.access_token) {
              return newSession;
            }
            // Same token, no update needed
            return prev;
          });
          return;
        }
        
        if (event === 'INITIAL_SESSION') {
          // Initial page load - let it proceed normally
        }
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else {
          setSession(null);
          setUser(null);
        }

        // Handle specific events
        switch (event) {
          case 'SIGNED_OUT': {
            if (manualSignOutRef.current) {
              manualSignOutRef.current = false;
              break;
            }

            const recovered = await attemptSessionRecovery();
            if (!recovered) {
              router.push('/auth/sign-in');
            }
            break;
          }
          case 'PASSWORD_RECOVERY':
            router.push('/reset-password');
            break;
          case 'USER_UPDATED':
            // Refresh user data
            if (newSession?.user) {
              setUser(newSession.user);
            }
            break;
        }
      }
    );

    // REMOVED: 5-minute session check interval - redundant with TokenManager
    // TokenManager already handles proactive token refresh before expiry
    // The onAuthStateChange listener handles session state updates
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, user?.id, attemptSessionRecovery]);

  // Memoize the entire context value to prevent unnecessary re-renders
  const value = useMemo<CoreAuthContextType>(() => ({
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
    clearError,
    setError,
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
    // Methods are stable references
    signIn,
    signUp,
    signOut,
    refreshSession,
    clearError,
    setError,
  ]);

  return (
    <CoreAuthContext.Provider value={value}>
      {children}
    </CoreAuthContext.Provider>
  );
}

export function useCoreAuth() {
  const context = useContext(CoreAuthContext);
  
  // Return default values during SSR or when context is not available
  if (context === undefined) {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Return default values for SSR
      return {
        // State
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
        
        // Methods (no-op functions for SSR)
        signIn: async () => ({ data: { user: null, session: null }, error: null }),
        signUp: async () => ({ data: { user: null, session: null }, error: null }),
        signOut: async () => {},
        refreshSession: async () => {},
        clearError: () => {},
        setError: () => {},
      };
    }
    
    // On client side, throw error if context is not available
    throw new Error('useCoreAuth must be used within a CoreAuthProvider');
  }
  
  return context;
}

export { CoreAuthContext };
