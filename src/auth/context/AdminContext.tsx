/**
 * Admin Context
 * 
 * Handles admin-related operations:
 * - Admin status checking
 * - Admin privilege management
 * - Admin caching
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useAccount } from './AccountContext';
import { isAdmin as checkIsAdmin, ensureAdminForEmail } from '../utils/admin';

interface AdminState {
  // Admin status
  isAdminUser: boolean;
  adminChecked: boolean;
  
  // Loading state
  adminLoading: boolean;
  
  // Cache metadata
  adminCacheTime: number | null;
}

interface AdminContextType extends AdminState {
  // Admin methods
  checkAdminStatus: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  clearAdminCache: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ADMIN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useCoreAuth();
  const { account } = useAccount();
  
  // Admin state
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminCacheTime, setAdminCacheTime] = useState<number | null>(null);
  
  // Ref for caching
  const adminCache = useRef<{ isAdmin: boolean; timestamp: number } | null>(null);

  // Clear admin cache
  const clearAdminCache = useCallback(() => {
    adminCache.current = null;
    setAdminCacheTime(null);
    setAdminChecked(false);
  }, []);

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id || !account?.id) {
      setIsAdminUser(false);
      setAdminChecked(true);
      return;
    }

    // Check cache
    if (adminCache.current) {
      const cacheAge = Date.now() - adminCache.current.timestamp;
      if (cacheAge < ADMIN_CACHE_DURATION) {
        setIsAdminUser(adminCache.current.isAdmin);
        setAdminCacheTime(adminCache.current.timestamp);
        setAdminChecked(true);
        return;
      }
    }

    setAdminLoading(true);
    try {
      // Check if user is admin
      const adminStatus = await checkIsAdmin();
      setIsAdminUser(adminStatus);
      
      // If user has admin email, ensure they have admin status
      if (user.email) {
        await ensureAdminForEmail({ id: user.id, email: user.email });
      }
      
      // Update cache
      adminCache.current = {
        isAdmin: adminStatus,
        timestamp: Date.now(),
      };
      setAdminCacheTime(Date.now());
      setAdminChecked(true);
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setIsAdminUser(false);
      setAdminChecked(true);
    } finally {
      setAdminLoading(false);
    }
  }, [user?.id, user?.email, account?.id]);

  // Refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    clearAdminCache();
    await checkAdminStatus();
  }, [clearAdminCache, checkAdminStatus]);

  // Initialize admin status on auth/account change
  useEffect(() => {
    if (isAuthenticated && account) {
      checkAdminStatus();
    } else {
      setIsAdminUser(false);
      setAdminChecked(false);
      clearAdminCache();
    }
  }, [isAuthenticated, account?.id]);

  // Auto-refresh admin status periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (adminCacheTime) {
        const cacheAge = Date.now() - adminCacheTime;
        if (cacheAge > ADMIN_CACHE_DURATION) {
          checkAdminStatus();
        }
      }
    }, 5 * 60000); // Check every 5 minutes instead of every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, adminCacheTime, checkAdminStatus]);

  const value: AdminContextType = {
    // State
    isAdminUser,
    adminChecked,
    adminLoading,
    adminCacheTime,
    
    // Methods
    checkAdminStatus,
    refreshAdminStatus,
    clearAdminCache,
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

// Guard hook for admin-only areas
export function useAdminGuard() {
  const { isAdminUser, adminChecked, adminLoading } = useAdmin();
  const { isAuthenticated, isInitialized } = useCoreAuth();
  
  return {
    isAdmin: isAdminUser,
    isLoading: !isInitialized || adminLoading || !adminChecked,
    canAccess: isAuthenticated && isAdminUser,
  };
}

export { AdminContext };