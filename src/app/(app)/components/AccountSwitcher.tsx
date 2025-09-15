/**
 * Account Switcher Component
 * Allows users to switch between multiple accounts they belong to
 * Shows current account and provides dropdown to select different accounts
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccountSelection } from '@/utils/accountSelectionHooks';
import { type UserAccount } from '@/auth/utils/accountSelection';

export function AccountSwitcher() {
  const {
    selectedAccount,
    availableAccounts,
    loading,
    error,
    switchAccount,
    hasMultipleAccounts
  } = useAccountSelection();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change to prevent stuck blur overlay
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Clean up on unmount - CRITICAL to prevent stuck blur
    return () => {
      setIsOpen(false); // Ensure dropdown is closed when component unmounts
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Don't render if loading or error
  if (loading || error || !selectedAccount) {
    return null;
  }

  // Only show if user has multiple accounts
  if (!hasMultipleAccounts) {
    return null;
  }

  const getAccountDisplayName = (account: UserAccount): string => {
    // First try business name
    if (account.business_name && account.business_name.trim()) {
      return account.business_name;
    }
    
    // Then try account_name (which might be pre-computed)
    if (account.account_name && account.account_name.trim()) {
      return account.account_name;
    }
    
    // Then try first/last name
    const fullName = `${account.first_name || ''} ${account.last_name || ''}`.trim();
    if (fullName) {
      return fullName;
    }
    
    // Finally fall back to role-based name with account ID hint
    const roleLabel = account.role.charAt(0).toUpperCase() + account.role.slice(1);
    // Add last 4 characters of account ID to distinguish between multiple accounts
    const idHint = account.account_id ? `(${account.account_id.slice(-4)})` : '';
    return `${roleLabel} Account ${idHint}`;
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner': return 'text-blue-600 bg-blue-50';
      case 'admin': return 'text-purple-600 bg-purple-50';
      case 'member': return 'text-green-600 bg-green-50';
      case 'support': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPlanColor = (plan?: string): string => {
    switch (plan) {
      case 'maven': return 'text-yellow-600 bg-yellow-50';
      case 'builder': return 'text-blue-600 bg-blue-50';
      case 'grower': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Account Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-gray-300 focus:outline-none transition-colors"
        aria-label="Switch account"
        aria-expanded={isOpen}
      >
        {/* Account Name */}
        <span className="font-medium max-w-32 truncate">
          {getAccountDisplayName(selectedAccount)}
        </span>
        
        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Rendered in Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            style={{ zIndex: 2147483647 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={dropdownRef}
            className="fixed w-80 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 py-2 overflow-hidden"
            style={{
              zIndex: 2147483648, // One higher than other header elements
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
              left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
            }}
          >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/20">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h3 className="text-sm font-medium text-white">Switch account</h3>
            </div>
            <p className="text-xs text-white/80 mt-1 ml-6">
              Select which account you want to work with
            </p>
          </div>

          {/* Account List */}
          <div className="max-h-64 overflow-y-auto">
            {availableAccounts.map((account) => (
              <button
                key={account.account_id}
                onClick={() => {
                  if (account.account_id !== selectedAccount.account_id) {
                    switchAccount(account.account_id);
                  }
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 focus:outline-none focus:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Account Name */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {getAccountDisplayName(account)}
                      </span>
                      {account.is_primary && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-white/20 rounded-full">
                          Default
                        </span>
                      )}
                      {account.account_id === selectedAccount.account_id && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-white/20 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {/* Account Details */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white border border-white/20">{account.role}</span>
                    </div>
                  </div>
                  
                </div>
              </button>
            ))}
          </div>

          </div>
        </>,
        document.body
      )}
    </div>
  );
} 
