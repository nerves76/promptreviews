/**
 * Account & Business Management Context
 * 
 * Unified context that combines:
 * - Account data and switching (from AccountContext)
 * - Business profile management (from BusinessContext)  
 * - Account ID state management (from SharedAccountState)
 * 
 * This consolidation eliminates the need for SharedAccountState and reduces complexity.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { createClient } from '../providers/supabase';
import { getAccountIdForUser, getAccountsForUser } from '../utils/accounts';
import { Account } from '../types';

const supabase = createClient();

interface Business {
  id: string;
  account_id: string;
  name: string;
  address?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  // Industry & services
  industry?: string[];
  industries_other?: string;
  industry_other?: string;
  services_offered?: string[] | string;
  industries_served?: string;
  // Business details
  about_us?: string;
  differentiators?: string;
  years_in_business?: number | string;
  created_at: string;
  updated_at: string;
}

interface AccountBusinessState {
  // Account data
  accountId: string | null;
  account: Account | null;
  accounts: Account[];
  
  // Multi-account support
  selectedAccountId: string | null;
  canSwitchAccounts: boolean;
  
  // Business data
  business: Business | null;
  businesses: Business[];
  
  // Status flags
  hasBusiness: boolean;
  requiresBusinessProfile: boolean;
  
  // Loading states
  accountLoading: boolean;
  accountsLoading: boolean;
  businessLoading: boolean;
  businessesLoading: boolean;
  
  // Cache metadata
  accountCacheTime: number | null;
  businessCacheTime: number | null;
}

interface AccountBusinessContextType extends AccountBusinessState {
  // Account methods
  loadAccount: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  refreshAccount: () => Promise<void>;
  
  // Business methods
  loadBusiness: () => Promise<void>;
  loadBusinesses: () => Promise<void>;
  createBusiness: (businessData: Partial<Business>) => Promise<Business>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  
  // Unified methods
  refreshAll: () => Promise<void>;
  clearCache: () => void;
  
  // Account ID management (replaces SharedAccountState)
  setAccountId: (id: string | null, force?: boolean) => void;
}

const AccountBusinessContext = createContext<AccountBusinessContextType | undefined>(undefined);

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function AccountBusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useCoreAuth();
  
  // Account state
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountCacheTime, setAccountCacheTime] = useState<number | null>(null);
  
  // Business state
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessCacheTime, setBusinessCacheTime] = useState<number | null>(null);
  
  // Refs for caching
  const accountCache = useRef<{ data: Account | null; timestamp: number } | null>(null);
  const accountsCache = useRef<{ data: Account[]; timestamp: number } | null>(null);
  const businessCache = useRef<{ data: Business | null; timestamp: number } | null>(null);
  const businessesCache = useRef<{ data: Business[]; timestamp: number } | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Computed states
  const canSwitchAccounts = accounts.length > 1;
  const hasBusiness = !!business;
  
  // Only require business profile for free accounts or new accounts without any plan
  const isPaidAccount = account?.plan && !['free', 'no_plan', null, undefined].includes(account.plan);
  const requiresBusinessProfile = isAuthenticated && !hasBusiness && !isPaidAccount;

  // Account ID management (replaces SharedAccountState functionality)
  const setAccountId = useCallback((id: string | null, force: boolean = false) => {
    // Don't overwrite a valid account ID with null unless forced (prevents race conditions)
    if (accountId && !id && !force) {
      return;
    }
    setAccountIdState(id);
    setUpdateCounter(prev => prev + 1); // Force re-render of consumers
  }, [accountId]);

  // Clear all caches
  const clearCache = useCallback(() => {
    accountCache.current = null;
    accountsCache.current = null;
    businessCache.current = null;
    businessesCache.current = null;
    setAccountCacheTime(null);
    setBusinessCacheTime(null);
  }, []);

  // Load all accounts for user
  const loadAccounts = useCallback(async () => {
    if (!user?.id) {
      setAccounts([]);
      return;
    }

    // Check if we just created a business (skip cache)
    const justCreatedBusiness = typeof window !== 'undefined' && 
      (window.location.search.includes('businessCreated=1') || 
       sessionStorage.getItem('business-creation-complete') === 'true');
    
    // Check cache (skip if we just created a business)
    if (!justCreatedBusiness && accountsCache.current) {
      const cacheAge = Date.now() - accountsCache.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setAccounts(accountsCache.current.data);
        return;
      }
    }

    setAccountsLoading(true);
    try {
      const userAccounts = await getAccountsForUser(user.id);
      
      if (userAccounts.length === 0) {
        // Wait for database trigger to create account asynchronously
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry loading accounts
        const retryAccounts = await getAccountsForUser(user.id);
        if (retryAccounts.length > 0) {
          setAccounts(retryAccounts);
          accountsCache.current = {
            data: retryAccounts,
            timestamp: Date.now(),
          };
        } else {
          console.warn('⚠️ No accounts found for user:', user.id);
          setAccounts([]);
        }
      } else {
        setAccounts(userAccounts);
        accountsCache.current = {
          data: userAccounts,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [user?.id]);

  // Load current account
  const loadAccount = useCallback(async (overrideAccountId?: string) => {
    const targetAccountId = overrideAccountId || accountId;
    
    if (!user?.id) {
      setAccount(null);
      setAccountId(null);
      return;
    }

    // Check cache
    if (accountCache.current && targetAccountId === accountCache.current.data?.id) {
      const cacheAge = Date.now() - accountCache.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setAccount(accountCache.current.data);
        setAccountCacheTime(accountCache.current.timestamp);
        return;
      }
    }

    setAccountLoading(true);
    try {
      // Get account ID if not set
      let currentAccountId = targetAccountId;
      if (!currentAccountId) {
        currentAccountId = await getAccountIdForUser(user.id, supabase);
        setAccountId(currentAccountId);
      }

      if (!currentAccountId) {
        console.warn('No account found for user');
        setAccount(null);
        return;
      }

      // Fetch account data
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', currentAccountId)
        .single();

      if (error) {
        console.error('Failed to load account:', error);
        
        if (error.code === 'PGRST116') {
          console.error('⚠️ 406 Error: Account query returned multiple or no rows', {
            accountId: currentAccountId,
            userId: user.id,
            errorDetails: error.details,
            hint: error.hint,
          });
          
          if (currentAccountId === user.id) {
            console.error('❌ CRITICAL: Using user.id as account.id - this is wrong for multi-account users!');
            setAccountId(null);
          }
        }
        
        setAccount(null);
        return;
      }

      setAccount(data);
      
      // Update cache
      accountCache.current = {
        data,
        timestamp: Date.now(),
      };
      setAccountCacheTime(Date.now());
    } catch (error) {
      console.error('Failed to load account:', error);
      setAccount(null);
    } finally {
      setAccountLoading(false);
    }
  }, [user?.id, accountId, setAccountId]);

  // Switch to a different account
  const switchAccount = useCallback(async (newAccountId: string) => {
    if (!user?.id) return;

    setAccountLoading(true);
    try {
      // Verify user has access to this account
      const { data: userAccounts, error: verifyError } = await supabase
        .from('account_users')
        .select('account_id, role')
        .eq('user_id', user.id);
      
      const accountUser = userAccounts?.find((ua: any) => ua.account_id === newAccountId);

      if (verifyError || !accountUser) {
        throw new Error('You do not have access to this account');
      }

      // Update selected account
      setAccountId(newAccountId);
      setSelectedAccountId(newAccountId);
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem(`promptreviews_selected_account_${user.id}`, newAccountId);
      }

      // Clear cache to force reload
      clearCache();
      
      // Reload account and business data
      await Promise.all([
        loadAccount(),
        loadBusiness()
      ]);
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw error;
    } finally {
      setAccountLoading(false);
    }
  }, [user?.id, clearCache, loadAccount, setAccountId]);

  // Refresh account data
  const refreshAccount = useCallback(async () => {
    accountCache.current = null;
    accountsCache.current = null;
    await Promise.all([loadAccount(), loadAccounts()]);
  }, [loadAccount, loadAccounts]);

  // Load business for current account
  const loadBusiness = useCallback(async () => {
    if (!accountId) {
      setBusiness(null);
      return;
    }

    // Check cache
    if (businessCache.current) {
      const cacheAge = Date.now() - businessCache.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        setBusiness(businessCache.current.data);
        setBusinessCacheTime(businessCache.current.timestamp);
        return;
      }
    }

    setBusinessLoading(true);
    try {
      // ⚠️ CRITICAL: DO NOT ADD .single() - accounts can have multiple businesses
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load businesses:', error);
        setBusiness(null);
        return;
      }
      
      if (!data || data.length === 0) {
        setBusiness(null);
        return;
      }
      
      // Use first business (oldest)
      const businessData = data[0];
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
      if (cacheAge < CACHE_DURATION) {
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
      
      // Clear cache
      businessCache.current = null;
      businessesCache.current = null;
      
      return data;
    } finally {
      setBusinessLoading(false);
    }
  }, [accountId]);

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
      
      // Clear cache
      businessCache.current = null;
      businessesCache.current = null;
    } finally {
      setBusinessLoading(false);
    }
  }, [business?.id]);

  // Refresh business data
  const refreshBusiness = useCallback(async () => {
    businessCache.current = null;
    businessesCache.current = null;
    await Promise.all([loadBusiness(), loadBusinesses()]);
  }, [loadBusiness, loadBusinesses]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    clearCache();
    await Promise.all([
      loadAccount(),
      loadAccounts(),
      loadBusiness(),
      loadBusinesses()
    ]);
  }, [clearCache, loadAccount, loadAccounts, loadBusiness, loadBusinesses]);

  // Initialize on authentication state changes
  useEffect(() => {
    if (!accountId && isAuthenticated && user?.id) {
      // Check if we have a newly created account ID from business creation
      const newlyCreatedAccountId = typeof window !== 'undefined' && user?.id
        ? localStorage.getItem(`promptreviews_new_account_${user.id}`)
        : null;
      
      if (newlyCreatedAccountId) {
        console.log('🆕 Found newly created account ID:', newlyCreatedAccountId);
        setAccountId(newlyCreatedAccountId);
        setSelectedAccountId(newlyCreatedAccountId);
        setAccountCacheTime(Date.now());
        loadAccount(newlyCreatedAccountId);
        loadAccounts();
        // Clear the flag after using it
        if (user?.id) {
          localStorage.removeItem(`promptreviews_new_account_${user.id}`);
        }
        return;
      }
      
      const timeoutId = setTimeout(() => {
        getAccountIdForUser(user.id, supabase).then((fetchedAccountId) => {
          if (fetchedAccountId) {
            setAccountId(fetchedAccountId);
            setSelectedAccountId(fetchedAccountId);
            setAccountCacheTime(Date.now());

            // Store in localStorage for apiClient to use
            if (typeof window !== 'undefined') {
              localStorage.setItem(`promptreviews_selected_account_${user.id}`, fetchedAccountId);
              localStorage.setItem('promptreviews_last_user_id', user.id);
            }

            // Load account and business data
            loadAccount(fetchedAccountId);
            loadAccounts();
          } else {
            console.warn('⚠️ No account ID returned for user:', user.id);
            // Retry once after longer delay
            setTimeout(() => {
              if (!accountId) {
                getAccountIdForUser(user.id, supabase).then((retryAccountId) => {
                  if (retryAccountId) {
                    setAccountId(retryAccountId);
                    setSelectedAccountId(retryAccountId);
                    setAccountCacheTime(Date.now());

                    // Store in localStorage for apiClient to use
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`promptreviews_selected_account_${user.id}`, retryAccountId);
                      localStorage.setItem('promptreviews_last_user_id', user.id);
                    }

                    loadAccount(retryAccountId);
                    loadAccounts();
                  } else {
                    console.warn('⚠️ Retry also returned null, user may not have accounts yet');
                    // Don't set a fallback - user genuinely has no accounts
                    // They'll need to create one through the business creation flow
                    setAccountId(null);
                    setSelectedAccountId(null);
                  }
                });
              }
            }, 1000);
          }
        }).catch(error => {
          console.error('❌ Error getting account ID:', error);
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else if (!isAuthenticated) {
      // Clear all data when not authenticated
      setAccount(null);
      setAccountId(null, true); // Force clear on logout
      setAccounts([]);
      setSelectedAccountId(null);
      setBusiness(null);
      setBusinesses([]);
      clearCache();
    }
  }, [isAuthenticated, user?.id, accountId, loadAccount, loadAccounts, setAccountId, clearCache]);

  // Load business data when account changes
  useEffect(() => {
    if (accountId) {
      const timer = setTimeout(() => {
        loadBusiness();
        loadBusinesses();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setBusiness(null);
      setBusinesses([]);
      businessCache.current = null;
      businessesCache.current = null;
    }
  }, [accountId, loadBusiness, loadBusinesses]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AccountBusinessContextType>(() => ({
    // Account data
    accountId,
    account,
    accounts,
    selectedAccountId,
    canSwitchAccounts,
    accountLoading,
    accountsLoading,
    accountCacheTime,
    
    // Business data
    business,
    businesses,
    hasBusiness,
    requiresBusinessProfile,
    businessLoading,
    businessesLoading,
    businessCacheTime,
    
    // Account methods
    loadAccount,
    loadAccounts,
    switchAccount,
    refreshAccount,
    
    // Business methods
    loadBusiness,
    loadBusinesses,
    createBusiness,
    updateBusiness,
    refreshBusiness,
    
    // Unified methods
    refreshAll,
    clearCache,
    setAccountId,
  }), [
    accountId, account, accounts, selectedAccountId, canSwitchAccounts,
    accountLoading, accountsLoading, accountCacheTime,
    business, businesses, hasBusiness, requiresBusinessProfile,
    businessLoading, businessesLoading, businessCacheTime,
    loadAccount, loadAccounts, switchAccount, refreshAccount,
    loadBusiness, loadBusinesses, createBusiness, updateBusiness, refreshBusiness,
    refreshAll, clearCache, setAccountId
  ]);

  return (
    <AccountBusinessContext.Provider value={value}>
      {children}
    </AccountBusinessContext.Provider>
  );
}

export function useAccountBusiness() {
  const context = useContext(AccountBusinessContext);
  if (context === undefined) {
    throw new Error('useAccountBusiness must be used within an AccountBusinessProvider');
  }
  return context;
}

// Backward compatibility hooks
export function useAccount() {
  const context = useAccountBusiness();
  return {
    accountId: context.accountId,
    account: context.account,
    accounts: context.accounts,
    selectedAccountId: context.selectedAccountId,
    canSwitchAccounts: context.canSwitchAccounts,
    accountLoading: context.accountLoading,
    accountsLoading: context.accountsLoading,
    loadAccount: context.loadAccount,
    loadAccounts: context.loadAccounts,
    switchAccount: context.switchAccount,
    refreshAccount: context.refreshAccount,
    clearAccountCache: context.clearCache,
  };
}

export function useBusiness() {
  const context = useAccountBusiness();
  return {
    business: context.business,
    businesses: context.businesses,
    hasBusiness: context.hasBusiness,
    requiresBusinessProfile: context.requiresBusinessProfile,
    businessLoading: context.businessLoading,
    businessesLoading: context.businessesLoading,
    businessCacheTime: context.businessCacheTime,
    loadBusiness: context.loadBusiness,
    loadBusinesses: context.loadBusinesses,
    createBusiness: context.createBusiness,
    updateBusiness: context.updateBusiness,
    refreshBusiness: context.refreshBusiness,
    clearBusinessCache: context.clearCache,
  };
}

export { AccountBusinessContext };