/**
 * Account Utility Bar Component
 * A thin utility bar above the main navigation for account switching.
 * Only renders when the user has multiple accounts.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAccountSelection } from '@/utils/accountSelectionHooks';
import { type UserAccount } from '@/auth/utils/accountSelection';
import Icon from '@/components/Icon';

export function AccountUtilityBar() {
  const {
    selectedAccount,
    availableAccounts,
    loading,
    error,
    switchAccount,
    hasMultipleAccounts
  } = useAccountSelection();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      setIsOpen(false);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Don't render if loading, error, or single account
  if (loading || error || !selectedAccount || !hasMultipleAccounts) {
    return null;
  }

  const getAccountDisplayName = (account: UserAccount): string => {
    if (account.business_name?.trim()) {
      return account.business_name;
    }
    if (account.account_name?.trim()) {
      return account.account_name;
    }
    const fullName = `${account.first_name || ''} ${account.last_name || ''}`.trim();
    if (fullName) {
      return fullName;
    }
    const roleLabel = account.role.charAt(0).toUpperCase() + account.role.slice(1);
    const idHint = account.account_id ? `(${account.account_id.slice(-4)})` : '';
    return `${roleLabel} Account ${idHint}`;
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-8">
          {/* Left side - Account info */}
          <div className="flex items-center gap-2 text-xs text-white/70">
            <Icon name="FaBuilding" className="w-3 h-3" size={12} />
            <span>Viewing:</span>
            <button
              ref={buttonRef}
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
            >
              <span className="max-w-[200px] truncate">
                {getAccountDisplayName(selectedAccount)}
              </span>
              <Icon
                name="FaChevronDown"
                className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                size={10}
              />
            </button>
          </div>

          {/* Right side - Work Manager link and Account count */}
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/work-manager"
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
            >
              <Icon name="FaTasks" className="w-3 h-3" size={12} />
              <span>Work Manager</span>
            </Link>
            <span className="text-white/50">
              {availableAccounts.length} accounts
            </span>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && mounted && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 2147483646 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div
            ref={dropdownRef}
            className="fixed w-72 backdrop-blur-xl rounded-lg shadow-2xl border border-white/20 py-1 overflow-hidden"
            style={{
              zIndex: 2147483648,
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
              backgroundColor: 'rgba(46, 74, 125, 0.7)', // slate-blue brand color at 70% opacity
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Icon name="FaExchangeAlt" className="w-3 h-3" size={12} />
                <span>Switch account</span>
              </div>
            </div>

            {/* Account List */}
            <div className="max-h-64 overflow-y-auto">
              {availableAccounts.map((account) => {
                const isCurrent = account.account_id === selectedAccount.account_id;
                return (
                  <button
                    key={account.account_id}
                    onClick={() => {
                      if (!isCurrent) {
                        switchAccount(account.account_id);
                      }
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left transition-colors ${
                      isCurrent
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {getAccountDisplayName(account)}
                          </span>
                          {isCurrent && (
                            <Icon name="FaCheck" className="w-3 h-3 text-green-400 flex-shrink-0" size={12} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/50 capitalize">{account.role}</span>
                          {account.is_primary && (
                            <span className="text-xs text-white/40">Default</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export default AccountUtilityBar;
