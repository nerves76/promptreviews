/**
 * Business Profile Context
 * 
 * Handles business-related operations:
 * - Business profile fetching
 * - Business validation
 * - Business caching
 * - Business requirements checking
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useAccount } from './AccountContext';
import { createClient } from '../providers/supabase';

const supabase = createClient();

interface Business {
  id: string;
  account_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface BusinessState {
  // Business data
  business: Business | null;
  businesses: Business[];
  
  // Status flags
  hasBusiness: boolean;
  requiresBusinessProfile: boolean;
  
  // Loading states
  businessLoading: boolean;
  businessesLoading: boolean;
  
  // Cache metadata
  businessCacheTime: number | null;
}

interface BusinessContextType extends BusinessState {
  // Business methods
  loadBusiness: () => Promise<void>;
  loadBusinesses: () => Promise<void>;
  createBusiness: (businessData: Partial<Business>) => Promise<Business>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  clearBusinessCache: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const BUSINESS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useCoreAuth();
  const { accountId, account } = useAccount();
  
  // Business state
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessCacheTime, setBusinessCacheTime] = useState<number | null>(null);
  
  // Refs for caching
  const businessCache = useRef<{ data: Business | null; timestamp: number } | null>(null);
  const businessesCache = useRef<{ data: Business[]; timestamp: number } | null>(null);

  // Computed states
  const hasBusiness = !!business;
  const requiresBusinessProfile = isAuthenticated && !hasBusiness && account?.plan !== 'no_plan';

  // Clear business cache
  const clearBusinessCache = useCallback(() => {
    businessCache.current = null;
    businessesCache.current = null;
    setBusinessCacheTime(null);
  }, []);

  // Load business for current account
  const loadBusiness = useCallback(async () => {
    if (!accountId) {
      setBusiness(null);
      return;
    }

    // Check cache
    if (businessCache.current) {
      const cacheAge = Date.now() - businessCache.current.timestamp;
      if (cacheAge < BUSINESS_CACHE_DURATION) {
        setBusiness(businessCache.current.data);
        setBusinessCacheTime(businessCache.current.timestamp);
        return;
      }
    }

    setBusinessLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', accountId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No business found - this is expected for new accounts
          setBusiness(null);
        } else {
          console.error('Failed to load business:', error);
          setBusiness(null);
        }
        return;
      }

      setBusiness(data);
      
      // Update cache
      businessCache.current = {
        data,
        timestamp: Date.now(),
      };
      setBusinessCacheTime(Date.now());
    } catch (error) {
      console.error('Failed to load business:', error);
      setBusiness(null);
    } finally {
      setBusinessLoading(false);
    }
  }, [accountId]);

  // Load all businesses for account
  const loadBusinesses = useCallback(async () => {
    if (!accountId) {
      setBusinesses([]);
      return;
    }

    // Check cache
    if (businessesCache.current) {
      const cacheAge = Date.now() - businessesCache.current.timestamp;
      if (cacheAge < BUSINESS_CACHE_DURATION) {
        setBusinesses(businessesCache.current.data);
        return;
      }
    }

    setBusinessesLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load businesses:', error);
        setBusinesses([]);
        return;
      }

      setBusinesses(data || []);
      
      // Update cache
      businessesCache.current = {
        data: data || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to load businesses:', error);
      setBusinesses([]);
    } finally {
      setBusinessesLoading(false);
    }
  }, [accountId]);

  // Create a new business
  const createBusiness = useCallback(async (businessData: Partial<Business>): Promise<Business> => {
    if (!accountId) {
      throw new Error('No account selected');
    }

    setBusinessLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          ...businessData,
          account_id: accountId,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create business:', error);
        throw error;
      }

      // Update state
      setBusiness(data);
      setBusinesses(prev => [data, ...prev]);
      
      // Clear cache to force refresh
      clearBusinessCache();
      
      return data;
    } finally {
      setBusinessLoading(false);
    }
  }, [accountId, clearBusinessCache]);

  // Update existing business
  const updateBusiness = useCallback(async (businessId: string, updates: Partial<Business>) => {
    setBusinessLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update business:', error);
        throw error;
      }

      // Update state
      if (business?.id === businessId) {
        setBusiness(data);
      }
      
      setBusinesses(prev => 
        prev.map(b => b.id === businessId ? data : b)
      );
      
      // Clear cache to force refresh
      clearBusinessCache();
    } finally {
      setBusinessLoading(false);
    }
  }, [business?.id, clearBusinessCache]);

  // Refresh business data
  const refreshBusiness = useCallback(async () => {
    clearBusinessCache();
    await Promise.all([loadBusiness(), loadBusinesses()]);
  }, [clearBusinessCache, loadBusiness, loadBusinesses]);

  // Initialize business on account change
  useEffect(() => {
    if (accountId) {
      loadBusiness();
      loadBusinesses();
    } else {
      setBusiness(null);
      setBusinesses([]);
      clearBusinessCache();
    }
  }, [accountId]);

  // Auto-refresh business data periodically
  useEffect(() => {
    if (!accountId) return;

    const interval = setInterval(() => {
      if (businessCacheTime) {
        const cacheAge = Date.now() - businessCacheTime;
        if (cacheAge > BUSINESS_CACHE_DURATION) {
          loadBusiness();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [accountId, businessCacheTime, loadBusiness]);

  const value: BusinessContextType = {
    // State
    business,
    businesses,
    hasBusiness,
    requiresBusinessProfile,
    businessLoading,
    businessesLoading,
    businessCacheTime,
    
    // Methods
    loadBusiness,
    loadBusinesses,
    createBusiness,
    updateBusiness,
    refreshBusiness,
    clearBusinessCache,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

export { BusinessContext };