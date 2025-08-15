/**
 * Admin Context for centralized admin status management
 * This context provides admin status across the entire application
 * and prevents multiple simultaneous database calls for admin checks
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient, getUserOrMock } from '@/auth/providers/supabase';

const supabase = createClient();
import { isAdmin, ensureAdminForEmail } from '@/auth/utils/admin';

interface AdminContextType {
  isAdminUser: boolean;
  isLoading: boolean;
  error: string | null;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);

  // Cache admin status for 5 minutes to prevent excessive database calls
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const checkAdminStatus = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous checks
    if (isChecking && !forceRefresh) {
      return;
    }

    // Check cache first
    const now = Date.now();
    if (!forceRefresh && now - lastCheck < CACHE_DURATION) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // 🔧 SIMPLIFIED: Use the same reliable session pattern as other components
      const { data: { user }, error } = await getUserOrMock(supabase);
      
      if (error || !user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('AdminContext: No user found');
        }
        setIsAdminUser(false);
        setIsLoading(false);
        return;
      }

      // Ensure admin for known admin emails
      if (user.email) {
        await ensureAdminForEmail({ id: user.id, email: user.email }, supabase);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('AdminContext: Checking admin status for user:', user.id);
      }
      
      const adminStatus = await isAdmin(user.id, supabase);
      if (process.env.NODE_ENV === 'development') {
        console.log('AdminContext: Admin status result:', adminStatus);
      }
      
      setIsAdminUser(adminStatus);
      setLastCheck(now);
    } catch (err) {
      console.error('AdminContext: Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Don't change admin status on error, keep previous state
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  }, [isChecking, lastCheck, CACHE_DURATION]);

  const refreshAdminStatus = async () => {
    await checkAdminStatus(true);
  };

  // Initial admin status check
  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('AdminContext: Auth state changed:', event, session?.user?.id);
        }
        
        // Skip token refresh events - they don't need admin status refresh
        if (event === 'TOKEN_REFRESHED') {
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Only refresh admin status for actual sign-ins, not token refreshes
          // Check if this is a real sign-in by seeing if we had a user before
          const wasSignedOut = !account?.user_id;
          if (wasSignedOut) {
            await checkAdminStatus(true);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear admin status on sign out
          setIsAdminUser(false);
          setIsLoading(false);
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  const value: AdminContextType = {
    isAdminUser,
    isLoading,
    error,
    refreshAdminStatus,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 