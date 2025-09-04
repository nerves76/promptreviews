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

    // Check if we just created a business (skip cache in this case)
    const justCreatedBusiness = typeof window !== 'undefined' && 
      (window.location.search.includes('businessCreated=1') || 
       sessionStorage.getItem('business-creation-complete') === 'true');
    
    // Check cache (skip if we just created a business)
    if (!justCreatedBusiness && accountsCache.current) {
      const cacheAge = Date.now() - accountsCache.current.timestamp;
      if (cacheAge < ACCOUNT_CACHE_DURATION) {
        setAccounts(accountsCache.current.data);
        return;
      }
    }

    setAccountsLoading(true);
    try {
      const userAccounts = await getAccountsForUser(user.id);
      
      // If no accounts found for an authenticated user, ensure account exists
      if (userAccounts.length === 0) {
        // For new users, the database trigger creates the account asynchronously
        // We need to wait and retry instead of immediately calling ensure-account
        // which might fail due to session propagation issues
        
        // Wait for the trigger to create the account
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry loading accounts
        const retryAccounts = await getAccountsForUser(user.id);
        if (retryAccounts.length > 0) {
          setAccounts(retryAccounts);
          
          // Update cache
          accountsCache.current = {
            data: retryAccounts,
            timestamp: Date.now(),
          };
        } else {
          // No accounts found - this could be a data issue
          // Don't try to create accounts here - that should only happen on first sign-up
          console.warn('⚠️ No accounts found for user:', user.id);
          setAccounts([]);
        }
      } else {
        setAccounts(userAccounts);
        
        // Update cache
        accountsCache.current = {
          data: userAccounts,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
      
      // Don't try to create account for 406 errors - this means the query is wrong
      // 406 happens when using .single() but getting 0 or multiple rows
      // This should not trigger account creation
      console.error('Account fetch error - likely a query issue, not missing account');
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
        // ⚠️ CRITICAL: Pass supabase client to ensure auth session is used
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

  /**
   * Initialize account when authentication state changes
   * 
   * This effect is responsible for:
   * 1. Detecting when a user logs in/out
   * 2. Fetching the user's account ID
   * 3. Loading account details
   * 4. Propagating account ID to SharedAccountState
   * 
   * ⚠️ TIMING ISSUES THAT CAUSED 8-HOUR DEBUG:
   * - Supabase session might not be ready immediately after auth
   * - getAccountIdForUser might return null on first call
   * - That's why we have retry logic with delays
   * - SharedAccountState prevents setting null over existing ID
   * 
   * ⚠️ CRITICAL: Must pass supabase client to getAccountIdForUser!
   * Not passing the client causes new client creation without auth.
   */
  useEffect(() => {
    
    // Don't do anything if we already have an account ID
    if (accountId && isAuthenticated && user?.id) {
      return;
    }
    
    if (isAuthenticated && user?.id) {
      // Add a small delay to ensure auth session is fully established
      const timeoutId = setTimeout(() => {
        // Get the account ID
        // ⚠️ CRITICAL: ALWAYS pass supabase client as second parameter!
        // This ensures the same authenticated session is used.
        // Not passing this was a major cause of the 8-hour debugging session.
        getAccountIdForUser(user.id, supabase).then((fetchedAccountId) => {
          if (fetchedAccountId) {
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
                // ⚠️ CRITICAL: Pass supabase client on retry too!
                getAccountIdForUser(user.id, supabase).then((retryAccountId) => {
                  if (retryAccountId) {
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
      // Clear account data when not authenticated - use force flag
      setAccount(null);
      setAccountId(null, true); // Force clear on logout
      setAccounts([]);
      setSelectedAccountId(null);
      clearAccountCache();
    }
  }, [isAuthenticated, user?.id, accountId]);

  // DISABLED: Auto-refresh account data periodically
  // This was causing PageCard to disappear every minute and users to lose typed content
  // Account data is refreshed when needed through explicit user actions or auth changes
  // useEffect(() => {
  //   if (!isAuthenticated) return;

  //   const interval = setInterval(() => {
  //     if (accountCacheTime) {
  //       const cacheAge = Date.now() - accountCacheTime;
  //       if (cacheAge > ACCOUNT_CACHE_DURATION) {
  //         loadAccount();
  //       }
  //     }
  //   }, 30000); // Check every 30 seconds

  //   return () => clearInterval(interval);
  // }, [isAuthenticated, accountCacheTime, loadAccount]);

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