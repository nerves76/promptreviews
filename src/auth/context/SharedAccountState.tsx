/**
 * Shared Account State Provider
 * 
 * This provider manages the shared account ID state between AccountContext and BusinessContext
 * to ensure proper state propagation and avoid race conditions.
 * 
 * ⚠️ CRITICAL FOR MULTI-ACCOUNT SUPPORT ⚠️
 * =========================================
 * 
 * This component was created to fix a major issue where:
 * 1. AccountContext would set accountId
 * 2. BusinessContext wouldn't receive the update
 * 3. Users would be redirected to create-business despite having businesses
 * 
 * The root cause was that each context had its own state, and React Context
 * doesn't propagate state changes between sibling contexts.
 * 
 * HOW IT WORKS:
 * - SharedAccountProvider wraps both AccountContext and BusinessContext
 * - Both contexts use this shared state for accountId
 * - This ensures they always have the same value
 * 
 * IMPORTANT RULES:
 * 1. This MUST be placed BEFORE AccountProvider in the hierarchy
 * 2. AccountContext MUST use this for its accountId state
 * 3. BusinessContext MUST use this for reading accountId
 * 4. The setAccountId function prevents overwriting valid IDs with null
 *    (unless force=true for logout scenarios)
 * 
 * Breaking any of these rules will cause the 8-hour debugging nightmare.
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
    // ⚠️ CRITICAL: Don't overwrite a valid account ID with null unless forced
    // This prevents race conditions where:
    // 1. AccountContext gets account ID and sets it
    // 2. Some other code tries to set null (e.g., during initial load)
    // 3. BusinessContext reads null and thinks there's no account
    // 4. User gets redirected to create-business
    // The force flag is only used during logout to truly clear the ID.
    if (accountId && !id && !force) {
      return;
    }
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