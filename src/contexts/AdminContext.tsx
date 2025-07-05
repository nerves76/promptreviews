/**
 * Admin Context for centralized admin status management
 * This context provides admin status across the entire application
 * and prevents multiple simultaneous database calls for admin checks
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUserOrMock } from '@/utils/supabaseClient';
import { isAdmin, ensureAdminForEmail } from '@/utils/admin';

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

  const checkAdminStatus = async (forceRefresh = false) => {
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
        console.log('AdminContext: No user found');
        setIsAdminUser(false);
        setIsLoading(false);
        return;
      }

      // Ensure admin for known admin emails
      if (user.email) {
        await ensureAdminForEmail({ id: user.id, email: user.email }, supabase);
      }

      console.log('AdminContext: Checking admin status for user:', user.id);
      
      const adminStatus = await isAdmin(user.id, supabase);
      console.log('AdminContext: Admin status result:', adminStatus);
      
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
  };

  const refreshAdminStatus = async () => {
    await checkAdminStatus(true);
  };

  // Initial admin status check
  useEffect(() => {
    checkAdminStatus();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AdminContext: Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Force refresh admin status on sign in
          await checkAdminStatus(true);
        } else if (event === 'SIGNED_OUT') {
          // Clear admin status on sign out
          setIsAdminUser(false);
          setIsLoading(false);
          setError(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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