/**
 * Account Selection State Management
 * Handles user's manual account selection for multi-account support
 */

import { useState, useEffect } from 'react';
import { createClient } from './supabaseClient';

const SELECTED_ACCOUNT_KEY = 'promptreviews_selected_account';

export interface UserAccount {
  account_id: string;
  role: 'owner' | 'admin' | 'member';
  account_name?: string;
  plan?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  is_primary?: boolean; // The account that would be selected by default algorithm
}

export interface AccountSelectionState {
  selectedAccountId: string | null;
  availableAccounts: UserAccount[];
  loading: boolean;
  error: string | null;
}

/**
 * Get user's manually selected account from localStorage
 */
export function getStoredAccountSelection(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(`${SELECTED_ACCOUNT_KEY}_${userId}`);
    return stored;
  } catch (error) {
    console.error('Error reading stored account selection:', error);
    return null;
  }
}

/**
 * Store user's account selection in localStorage
 */
export function setStoredAccountSelection(userId: string, accountId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(`${SELECTED_ACCOUNT_KEY}_${userId}`, accountId);
  } catch (error) {
    console.error('Error storing account selection:', error);
  }
}

/**
 * Clear stored account selection
 */
export function clearStoredAccountSelection(userId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(`${SELECTED_ACCOUNT_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing stored account selection:', error);
  }
}

/**
 * Fetch all accounts available to a user
 */
export async function fetchUserAccounts(userId: string): Promise<UserAccount[]> {
  try {
    const client = createClient();
    
    // Get ALL account relationships for this user with account details
    const { data: accountUsers, error } = await client
      .from("account_users")
      .select(`
        account_id, 
        role,
        accounts (
          id,
          plan,
          first_name,
          last_name,
          business_name
        )
      `)
      .eq("user_id", userId)
      .order("role", { ascending: true });

    if (error) {
      console.error('Error fetching user accounts:', error);
      throw error;
    }

    if (!accountUsers || accountUsers.length === 0) {
      return [];
    }

    // Transform the data and determine which would be the primary account
    const accounts: UserAccount[] = accountUsers.map((au: any) => ({
      account_id: au.account_id,
      role: au.role,
      plan: au.accounts?.plan,
      first_name: au.accounts?.first_name,
      last_name: au.accounts?.last_name,
      business_name: au.accounts?.business_name,
      is_primary: false // Will be set below
    }));

    // Apply the same priority logic as getAccountIdForUser to mark primary account
    let primaryAccountId: string | null = null;
    
    // PRIORITY 1: Team accounts with plans
    const teamAccountWithPlan = accounts.find(acc => 
      acc.role === 'member' && 
      acc.plan && 
      acc.plan !== 'no_plan'
    );
    
    if (teamAccountWithPlan) {
      primaryAccountId = teamAccountWithPlan.account_id;
    } else {
      // PRIORITY 2: Owned accounts with plans
      const ownedAccountWithPlan = accounts.find(acc => 
        acc.role === 'owner' && 
        acc.plan && 
        acc.plan !== 'no_plan'
      );
      
      if (ownedAccountWithPlan) {
        primaryAccountId = ownedAccountWithPlan.account_id;
      } else {
        // PRIORITY 3: Any team account
        const anyTeamAccount = accounts.find(acc => acc.role === 'member');
        if (anyTeamAccount) {
          primaryAccountId = anyTeamAccount.account_id;
        } else {
          // PRIORITY 4: Fallback to first account
          primaryAccountId = accounts[0]?.account_id || null;
        }
      }
    }

    // Mark the primary account
    if (primaryAccountId) {
      const primaryAccount = accounts.find(acc => acc.account_id === primaryAccountId);
      if (primaryAccount) {
        primaryAccount.is_primary = true;
      }
    }

    return accounts;
  } catch (error) {
    console.error('Error in fetchUserAccounts:', error);
    throw error;
  }
}

/**
 * React hook for managing account selection state
 */
export function useAccountSelection() {
  const [state, setState] = useState<AccountSelectionState>({
    selectedAccountId: null,
    availableAccounts: [],
    loading: true,
    error: null
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load user and accounts
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const client = createClient();
        const { data: { user }, error: userError } = await client.auth.getUser();
        
        if (userError || !user) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: userError?.message || 'User not found'
          }));
          return;
        }

        setCurrentUserId(user.id);

        // Fetch available accounts
        const accounts = await fetchUserAccounts(user.id);
        
        // Get stored selection or use primary account
        let selectedAccountId = getStoredAccountSelection(user.id);
        
        // Validate stored selection exists in available accounts
        if (selectedAccountId && !accounts.find(acc => acc.account_id === selectedAccountId)) {
          selectedAccountId = null;
          clearStoredAccountSelection(user.id);
        }
        
        // If no valid stored selection, use primary account
        if (!selectedAccountId) {
          const primaryAccount = accounts.find(acc => acc.is_primary);
          selectedAccountId = primaryAccount?.account_id || null;
        }

        setState({
          selectedAccountId,
          availableAccounts: accounts,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error loading account data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load accounts'
        }));
      }
    };

    loadAccountData();
  }, []);

  // Switch to a different account
  const switchAccount = (accountId: string) => {
    if (!currentUserId) return;
    
    const account = state.availableAccounts.find(acc => acc.account_id === accountId);
    if (!account) {
      console.error('Account not found:', accountId);
      return;
    }

    setStoredAccountSelection(currentUserId, accountId);
    setState(prev => ({
      ...prev,
      selectedAccountId: accountId
    }));

    // Force page reload to refresh all data with new account context
    window.location.reload();
  };

  // Get current selected account details
  const selectedAccount = state.selectedAccountId 
    ? state.availableAccounts.find(acc => acc.account_id === state.selectedAccountId)
    : null;

  return {
    ...state,
    selectedAccount,
    switchAccount,
    hasMultipleAccounts: state.availableAccounts.length > 1
  };
}

/**
 * Get the user's selected account ID (used by modified getAccountIdForUser)
 * This version validates that the stored selection is still valid
 */
export async function getUserSelectedAccountId(userId: string, supabaseClient?: any): Promise<string | null> {
  // Get stored selection
  const storedAccountId = getStoredAccountSelection(userId);
  
  if (!storedAccountId) {
    return null;
  }

  // Validate that the stored account still exists and user has access
  try {
    const client = supabaseClient || createClient();
    
    const { data: accountUser, error } = await client
      .from("account_users")
      .select("account_id")
      .eq("user_id", userId)
      .eq("account_id", storedAccountId)
      .single();

    if (error || !accountUser) {
      // Stored selection is invalid, clear it
      clearStoredAccountSelection(userId);
      return null;
    }

    return storedAccountId;
  } catch (error) {
    console.error('Error validating stored account selection:', error);
    return null;
  }
} 