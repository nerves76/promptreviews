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

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../providers/supabase';
import { User, Session, AuthResponse } from '@supabase/supabase-js';

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

export function CoreAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initializationStarted = useRef(false);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on the server side
  const isServer = typeof window === 'undefined';

  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isServer); // Don't show loading on server
  const [isInitialized, setIsInitialized] = useState(isServer); // Mark as initialized on server
  const [error, setError] = useState<string | null>(null);
  const [refreshingSession, setRefreshingSession] = useState(false);

  // Computed states
  const isAuthenticated = !!user && !!session;
  const emailVerified = user?.email_confirmed_at ? true : false;
  const requiresEmailVerification = !!user && !emailVerified;
  
  const sessionExpiresAt = session?.expires_at 
    ? new Date(session.expires_at * 1000) 
    : null;
    
  const isSessionExpiringSoon = sessionExpiresAt
    ? sessionExpiresAt.getTime() - Date.now() < SESSION_WARNING_THRESHOLD
    : false;

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (refreshingSession) return;
    
    setRefreshingSession(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setError('Session refresh failed');
    } finally {
      setRefreshingSession(false);
    }
  }, [refreshingSession]);

  // Check session validity
  const checkSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Auto-refresh if expiring soon
        const expiresAt = new Date(currentSession.expires_at! * 1000);
        if (expiresAt.getTime() - Date.now() < SESSION_WARNING_THRESHOLD) {
          await refreshSession();
        }
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }, [refreshSession]);

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

  // Initialize auth state
  useEffect(() => {
    // Don't initialize auth on the server side
    if (isServer) return;
    
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
        console.log('Auth state change:', event);
        
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
        } else {
          setSession(null);
          setUser(null);
        }

        // Handle specific events
        switch (event) {
          case 'SIGNED_OUT':
            router.push('/auth/sign-in');
            break;
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

    // Set up session check interval
    sessionCheckInterval.current = setInterval(checkSession, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      subscription.unsubscribe();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [checkSession, router]);

  const value: CoreAuthContextType = {
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
    
    // Methods
    signIn,
    signUp,
    signOut,
    refreshSession,
    checkSession,
    clearError,
    setError,
  };

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
        checkSession: async () => {},
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