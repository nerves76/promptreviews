/**
 * Account Selection React Hooks (Client-Side Only)
 * React hooks for managing account selection state in UI components
 */

"use client";

import { useState, useEffect, useMemo } from 'react';
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
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Listen for business creation/update events to refresh account data
  useEffect(() => {
    const handleBusinessUpdate = () => {
      console.log('[AccountSelection] Business updated, refreshing accounts...');
      setRefreshCounter(prev => prev + 1);
    };

    window.addEventListener('businessCreated', handleBusinessUpdate);
    window.addEventListener('businessUpdated', handleBusinessUpdate);

    return () => {
      window.removeEventListener('businessCreated', handleBusinessUpdate);
      window.removeEventListener('businessUpdated', handleBusinessUpdate);
    };
  }, []);

  // Load user and accounts
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const client = createClient();
        
        // DEVELOPMENT MODE BYPASS - Check for dev bypass flag
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
          const devBypass = localStorage.getItem('dev_auth_bypass');
          if (devBypass === 'true') {
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
        
        // ALWAYS prefer stored selection if it exists and is valid
        let selectedAccountId = getStoredAccountSelection(user.id);

        // Validate stored selection exists in available accounts
        const pendingSelectionId = typeof window !== 'undefined'
          ? sessionStorage.getItem('pendingAccountId')
          : null;

        if (selectedAccountId && accounts.length > 0 && !accounts.find(acc => acc.account_id === selectedAccountId)) {
          if (pendingSelectionId === selectedAccountId) {
            console.log('[AccountSelection] Pending account selection not yet available, keeping selection:', selectedAccountId);
          } else {
            console.log('[AccountSelection] Stored account not found in available accounts, clearing:', selectedAccountId);
            selectedAccountId = null;
            clearStoredAccountSelection(user.id);
          }
        }

        // If we have a stored selection but no accounts loaded yet, keep it
        // This prevents clearing during initial load
        if (selectedAccountId && accounts.length === 0) {
          console.log('[AccountSelection] Keeping stored selection (accounts still loading):', selectedAccountId);
        }

        // Only use primary account if no stored selection
        if (!selectedAccountId && accounts.length > 0) {
          selectedAccountId = primaryAccountId;
          // Store the primary selection so it persists
          if (primaryAccountId) {
            console.log('[AccountSelection] No stored selection, using primary account:', primaryAccountId);
            setStoredAccountSelection(user.id, primaryAccountId);
          }
        } else if (selectedAccountId) {
          console.log('[AccountSelection] Using stored account selection:', selectedAccountId);
        }

        setState({
          selectedAccountId,
          availableAccounts: accountsWithPrimary,
          loading: false,
          error: null
        });

        if (selectedAccountId && pendingSelectionId === selectedAccountId && accounts.find(acc => acc.account_id === selectedAccountId)) {
          sessionStorage.removeItem('pendingAccountId');
        }

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
  }, [refreshCounter]); // Re-run when refreshCounter changes

  // Switch to a different account
  const switchAccount = async (accountId: string) => {
    if (!currentUserId) {
      console.warn('[AccountSelection] No currentUserId, cannot switch');
      return;
    }
    
    const account = state.availableAccounts.find(acc => acc.account_id === accountId);
    if (!account) {
      console.warn('[AccountSelection] Account not found:', accountId);
      return;
    }

    console.log('[AccountSelection] Switching from', state.selectedAccountId, 'to', accountId);
    
    // Store the selection in localStorage
    setStoredAccountSelection(currentUserId, accountId);
    
    // Clear any cached data that might be account-specific, but DO NOT remove user draft form data
    // We intentionally avoid removing keys like:
    // - promptPageForm_* (prompt page drafts)
    // - widgetEditorForm_* (widget editor drafts)
    // - businessInfoEditorForm* (business info drafts)
    // Draft keys are already account-scoped and safe to keep across reloads.
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Only remove volatile cache entries that are safe to regenerate
      if (
        key.startsWith('widgetDesign_') ||
        key.startsWith('business-info-selected-locations') ||
        key.startsWith('cached_') ||
        key.endsWith('_cache') ||
        key.includes(':cache:')
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Simple reload to apply the new account selection
    window.location.reload();
  };

  // Refresh account data (useful after business creation/updates)
  const refreshAccounts = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Get current selected account details (memoized to prevent unnecessary re-renders)
  const selectedAccount = useMemo(() => {
    return state.selectedAccountId 
      ? state.availableAccounts.find(acc => acc.account_id === state.selectedAccountId)
      : null;
  }, [state.selectedAccountId, state.availableAccounts]);

  return {
    ...state,
    selectedAccount,
    switchAccount,
    refreshAccounts,
    hasMultipleAccounts: state.availableAccounts.length > 1
  };
} 
