/**
 * Account Selection React Hooks (Client-Side Only)
 * React hooks for managing account selection state in UI components
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { 
  UserAccount, 
  fetchUserAccounts, 
  getStoredAccountSelection, 
  setStoredAccountSelection, 
  clearStoredAccountSelection 
} from '@/auth/utils/accountSelection';

export interface AccountSelectionState {
  selectedAccountId: string | null;
  availableAccounts: UserAccount[];
  loading: boolean;
  error: string | null;
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
        
        // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
          const devBypass = localStorage.getItem('dev_auth_bypass');
          if (devBypass === 'true') {
            console.log('🔧 DEV MODE: useAccountSelection using authentication bypass');
            const mockUser = { id: '12345678-1234-5678-9abc-123456789012' };
            setCurrentUserId(mockUser.id);
            
            // Create mock account data
            const mockAccounts = [{
              account_id: '12345678-1234-5678-9abc-123456789012',
              role: 'owner',
              plan: 'free',
              is_primary: true
            }];
            
            setState({
              selectedAccountId: '12345678-1234-5678-9abc-123456789012',
              availableAccounts: mockAccounts,
              loading: false,
              error: null
            });
            return;
          }
        }
        
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
        const accountsWithPrimary = accounts.map(acc => ({
          ...acc,
          is_primary: acc.account_id === primaryAccountId
        }));
        
        // Get stored selection or use primary account
        let selectedAccountId = getStoredAccountSelection(user.id);
        
        // Validate stored selection exists in available accounts
        if (selectedAccountId && !accounts.find(acc => acc.account_id === selectedAccountId)) {
          selectedAccountId = null;
          clearStoredAccountSelection(user.id);
        }
        
        // If no valid stored selection, use primary account
        if (!selectedAccountId) {
          selectedAccountId = primaryAccountId;
        }

        setState({
          selectedAccountId,
          availableAccounts: accountsWithPrimary,
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