/**
 * Shared Account State Provider
 * 
 * This provider manages the shared account ID state between AccountContext and BusinessContext
 * to ensure proper state propagation and avoid race conditions.
 */

"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SharedAccountState {
  accountId: string | null;
  setAccountId: (id: string | null, force?: boolean) => void;
  forceUpdate: () => void;
}

const SharedAccountContext = createContext<SharedAccountState | undefined>(undefined);

export function SharedAccountProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [updateCounter, setUpdateCounter] = useState(0);

  const setAccountId = useCallback((id: string | null, force: boolean = false) => {
    // Don't overwrite a valid account ID with null unless forced (e.g., logout)
    if (accountId && !id && !force) {
      console.log('⚠️ SharedAccountState: Attempted to set null over existing account ID:', accountId, '- ignoring');
      return;
    }
    console.log('🔄 SharedAccountState: Setting account ID to:', id, '(was:', accountId, ')', force ? '[FORCED]' : '');
    setAccountIdState(id);
    // Force re-render of all consumers
    setUpdateCounter(prev => prev + 1);
  }, [accountId]);

  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  return (
    <SharedAccountContext.Provider value={{ accountId, setAccountId, forceUpdate }}>
      {children}
    </SharedAccountContext.Provider>
  );
}

export function useSharedAccount() {
  const context = useContext(SharedAccountContext);
  if (context === undefined) {
    throw new Error('useSharedAccount must be used within a SharedAccountProvider');
  }
  return context;
}