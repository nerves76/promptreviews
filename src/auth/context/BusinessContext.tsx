/**
 * Business Profile Context
 * 
 * Handles business-related operations:
 * - Business profile fetching
 * - Business validation
 * - Business caching
 * - Business requirements checking
 * 
 * ⚠️ CRITICAL: MULTIPLE BUSINESSES WARNING ⚠️
 * ============================================
 * This system supports MULTIPLE businesses per account!
 * 
 * DO NOT use .single() or .maybeSingle() when fetching businesses.
 * These will fail with PGRST116 error if an account has multiple businesses.
 * 
 * ALWAYS fetch all businesses and handle the array:
 * - Use .select('*') without .single()
 * - If you need one business, take the first from the array
 * - Order by created_at for consistency
 * 
 * Breaking this will cause:
 * - Navigation to be disabled (hasBusiness = false)
 * - Users getting redirected to create-business
 * - 8+ hours of debugging pain
 * 
 * See loadBusiness() method for the correct implementation.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useAccount } from './AccountContext';
import { useSharedAccount } from './SharedAccountState';
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
  const accountContext = useAccount();
  const sharedAccount = useSharedAccount();
  // Use shared account ID to ensure we get updates
  const accountId = sharedAccount.accountId;
  const { account } = accountContext;
  
  // Debug log to verify we're getting the account context
  console.log('🔍 BusinessProvider: Account context:', { 
    sharedAccountId: sharedAccount.accountId,
    contextAccountId: accountContext.accountId, 
    account: accountContext.account?.id,
    hasAccountContext: !!accountContext 
  });
  
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
  // Only require business profile for free accounts or new accounts without any plan
  // Paid accounts can operate without a business (they might be team members or in transition)
  const isPaidAccount = account?.plan && !['free', 'no_plan', null, undefined].includes(account.plan);
  const requiresBusinessProfile = isAuthenticated && !hasBusiness && !isPaidAccount;

  // Clear business cache
  const clearBusinessCache = useCallback(() => {
    businessCache.current = null;
    businessesCache.current = null;
    setBusinessCacheTime(null);
  }, []);

  // Load business for current account
  // ⚠️ WARNING: DO NOT CHANGE TO .single() or .maybeSingle() - accounts can have MULTIPLE businesses!
  // This caused an 8-hour debugging session when it broke navigation for multi-business accounts
  const loadBusiness = useCallback(async () => {
    console.log('🏢 loadBusiness called with accountId:', accountId);
    if (!accountId) {
      console.log('🏢 No accountId, clearing business');
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
      console.log('🏢 Loading business for account:', accountId);
      
      // ⚠️ CRITICAL: DO NOT ADD .single() or .maybeSingle() here!
      // Accounts can have multiple businesses (e.g., from mergers, migrations, or duplicates)
      // Using .single() will cause PGRST116 error and break navigation
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true }); // Get ALL businesses, handle array

      if (error) {
        console.error('Failed to load businesses:', error);
        console.error('Error details:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          accountId
        }, null, 2));
        
        // If it's an RLS error, we might not have access - treat as no business
        if (error.code === '42501' || error.message?.includes('RLS')) {
          console.log('📭 RLS policy prevented business fetch - treating as no business for account:', accountId);
        }
        
        setBusiness(null);
        return;
      }
      
      if (!data || data.length === 0) {
        // No business found - this is expected for new accounts
        console.log('📭 No business found for account:', accountId);
        setBusiness(null);
        return;
      }
      
      // If multiple businesses exist, use the first one (oldest)
      const businessData = data[0];
      if (data.length > 1) {
        console.log(`📊 Found ${data.length} businesses for account, using first one:`, businessData?.name || businessData?.id);
      }
      
      console.log('✅ Business loaded:', businessData?.name || businessData?.id);

      setBusiness(businessData);
      
      // Update cache
      businessCache.current = {
        data: businessData,
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
    console.log('🔄 BusinessContext: Account changed to:', accountId, 'account object:', account?.id);
    console.log('🔍 BusinessContext: Full account context state:', {
      sharedAccountId: accountId,
      contextAccountId: accountContext.accountId,
      hasAccount: !!accountContext.account,
      accountLoading: accountContext.accountLoading,
      selectedAccountId: accountContext.selectedAccountId
    });
    
    if (accountId) {
      console.log('📦 BusinessContext: Loading business for new account:', accountId);
      // Small delay to ensure account data is fully loaded
      const timer = setTimeout(() => {
        loadBusiness();
        loadBusinesses();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('📦 BusinessContext: No account ID, clearing business data');
      setBusiness(null);
      setBusinesses([]);
      clearBusinessCache();
    }
  }, [accountId, loadBusiness, loadBusinesses, clearBusinessCache]);

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