/**
 * Account Management Context
 * 
 * Handles account-related operations:
 * - Account selection and switching
 * - Multi-account management
 * - Account data fetching and caching
 * - Account permissions
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCoreAuth } from './CoreAuthContext';
import { useSharedAccount } from './SharedAccountState';
import { createClient } from '../providers/supabase';
import { getAccountIdForUser, getAccountsForUser } from '../utils/accounts';
import { selectBestAccount } from '../utils/accountSelection';
import { Account } from '../types';

const supabase = createClient();

interface AccountState {
  // Account data
  accountId: string | null;
  account: Account | null;
  accounts: Account[];
  
  // Multi-account
  selectedAccountId: string | null;
  canSwitchAccounts: boolean;
  
  // Loading states
  accountLoading: boolean;
  accountsLoading: boolean;
  
  // Cache metadata
  accountCacheTime: number | null;
}

interface AccountContextType extends AccountState {
  // Account methods
  loadAccount: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  refreshAccount: () => Promise<void>;
  clearAccountCache: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const ACCOUNT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useCoreAuth();
  const sharedAccount = useSharedAccount();
  
  // Account state - use shared state for accountId
  const accountId = sharedAccount.accountId;
  const setAccountId = sharedAccount.setAccountId;
  const [account, setAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountCacheTime, setAccountCacheTime] = useState<number | null>(null);
  
  // Refs for caching
  const accountCache = useRef<{ data: Account | null; timestamp: number } | null>(null);
  const accountsCache = useRef<{ data: Account[]; timestamp: number } | null>(null);

  // Computed states
  const canSwitchAccounts = accounts.length > 1;

  // Clear account cache
  const clearAccountCache = useCallback(() => {
    accountCache.current = null;
    accountsCache.current = null;
    setAccountCacheTime(null);
  }, []);

  // Load all accounts for user
  const loadAccounts = useCallback(async () => {
    if (!user?.id) {
      setAccounts([]);
      return;
    }

    // Check cache
    if (accountsCache.current) {
      const cacheAge = Date.now() - accountsCache.current.timestamp;
      if (cacheAge < ACCOUNT_CACHE_DURATION) {
        setAccounts(accountsCache.current.data);
        return;
      }
    }

    setAccountsLoading(true);
    try {
      const userAccounts = await getAccountsForUser(user.id);
      setAccounts(userAccounts);
      
      // Update cache
      accountsCache.current = {
        data: userAccounts,
        timestamp: Date.now(),
      };
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
      if (cacheAge < ACCOUNT_CACHE_DURATION) {
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
        currentAccountId = await getAccountIdForUser(user.id);
        setAccountId(currentAccountId);
      }

      if (!currentAccountId) {
        console.warn('No account found for user');
        setAccount(null);
        return;
      }

      console.log('📊 AccountContext: Loading account data for:', currentAccountId);

      // Fetch account data
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', currentAccountId)
        .single();

      if (error) {
        console.error('Failed to load account:', error);
        setAccount(null);
        return;
      }

      console.log('✅ AccountContext: Account data loaded:', data?.business_name || data?.id);
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
  }, [user?.id, accountId]);

  // Switch to a different account
  const switchAccount = useCallback(async (newAccountId: string) => {
    if (!user?.id) return;

    setAccountLoading(true);
    try {
      // Verify user has access to this account
      // Note: Only filter by user_id due to RLS policies
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
        localStorage.setItem('selected_account_id', newAccountId);
      }

      // Clear cache to force reload
      clearAccountCache();
      
      // Reload account data
      await loadAccount();
    } catch (error) {
      console.error('Failed to switch account:', error);
      throw error;
    } finally {
      setAccountLoading(false);
    }
  }, [user?.id, clearAccountCache, loadAccount]);

  // Refresh account data
  const refreshAccount = useCallback(async () => {
    clearAccountCache();
    await Promise.all([loadAccount(), loadAccounts()]);
  }, [clearAccountCache, loadAccount, loadAccounts]);

  // Initialize account on auth change
  useEffect(() => {
    console.log('🔄 AccountContext: Auth state changed, isAuthenticated:', isAuthenticated, 'userId:', user?.id);
    
    // Don't do anything if we already have an account ID
    if (accountId && isAuthenticated && user?.id) {
      console.log('✅ AccountContext: Already have account ID:', accountId, 'skipping fetch');
      return;
    }
    
    if (isAuthenticated && user?.id) {
      // Add a small delay to ensure auth session is fully established
      const timeoutId = setTimeout(() => {
        // Get the account ID
        getAccountIdForUser(user.id).then((fetchedAccountId) => {
          console.log('🎯 AccountContext: Got account ID:', fetchedAccountId);
          if (fetchedAccountId) {
            console.log('📊 AccountContext: Setting account ID state to:', fetchedAccountId);
            // Set the shared account ID
            setAccountId(fetchedAccountId);
            setSelectedAccountId(() => fetchedAccountId);
            
            // Force a re-render by updating a timestamp
            setAccountCacheTime(Date.now());
            
            // Now load the full account data with the specific ID
            loadAccount(fetchedAccountId);
            
            // Load all accounts in parallel (for account switcher)
            loadAccounts();
          } else {
            console.warn('⚠️ AccountContext: No account ID returned for user:', user.id);
            // Don't set to null immediately - retry once after a longer delay
            setTimeout(() => {
              // Check again if we don't already have an account ID
              if (!accountId) {
                getAccountIdForUser(user.id).then((retryAccountId) => {
                  if (retryAccountId) {
                    console.log('✅ AccountContext: Retry successful, got account ID:', retryAccountId);
                    setAccountId(retryAccountId);
                    setSelectedAccountId(() => retryAccountId);
                    setAccountCacheTime(Date.now());
                    loadAccount(retryAccountId);
                    loadAccounts();
                  } else {
                    console.warn('⚠️ AccountContext: Retry also returned null, user may not have accounts');
                    // Only set to null after retry fails
                    setAccountId(null);
                    setSelectedAccountId(() => null);
                  }
                });
              }
            }, 1000); // Longer delay for retry
          }
        }).catch(error => {
          console.error('❌ AccountContext: Error getting account ID:', error);
        });
      }, 500); // Longer delay to ensure session is fully established
      
      return () => clearTimeout(timeoutId);
    } else if (!isAuthenticated) {
      console.log('🔄 AccountContext: Not authenticated, clearing account data');
      // Clear account data when not authenticated - use force flag
      setAccount(null);
      setAccountId(null, true); // Force clear on logout
      setAccounts([]);
      setSelectedAccountId(null);
      clearAccountCache();
    }
  }, [isAuthenticated, user?.id, accountId]);

  // Auto-refresh account data periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (accountCacheTime) {
        const cacheAge = Date.now() - accountCacheTime;
        if (cacheAge > ACCOUNT_CACHE_DURATION) {
          loadAccount();
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, accountCacheTime, loadAccount]);

  const value: AccountContextType = {
    // State
    accountId,
    account,
    accounts,
    selectedAccountId,
    canSwitchAccounts,
    accountLoading,
    accountsLoading,
    accountCacheTime,
    
    // Methods
    loadAccount,
    loadAccounts,
    switchAccount,
    refreshAccount,
    clearAccountCache,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}

export { AccountContext };