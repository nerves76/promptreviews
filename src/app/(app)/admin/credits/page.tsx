/**
 * Credit Management Admin Page
 *
 * Allows admins to search accounts by business name and add credits.
 */

"use client";

import { useState } from 'react';
import { createClient } from "@/auth/providers/supabase";
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';

interface AccountResult {
  id: string;
  email: string;
  business_name: string | null;
  plan: string;
  is_client_account: boolean;
  monthly_credit_allocation: number | null;
  plan_default_credits: number;
  effective_monthly_credits: number;
  credit_balance?: {
    included_credits: number;
    purchased_credits: number;
  };
}

export default function CreditsAdminPage() {
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AccountResult[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountResult | null>(null);
  const [creditAmount, setCreditAmount] = useState('100');
  const [monthlyAddAmount, setMonthlyAddAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingMonthly, setIsUpdatingMonthly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tierDefaults, setTierDefaults] = useState<Record<string, number>>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      const result = await apiClient.get<{ accounts?: AccountResult[]; tierDefaults?: Record<string, number>; error?: string }>(
        `/admin/credits?search=${encodeURIComponent(searchQuery)}`
      );

      setResults(result.accounts || []);
      if (result.tierDefaults) {
        setTierDefaults(result.tierDefaults);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search accounts');
    } finally {
      setSearching(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedAccount || !creditAmount) return;

    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid credit amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.post<{ error?: string }>('/admin/credits', {
        accountId: selectedAccount.id,
        amount,
      });

      setSuccess(`Successfully added ${amount} credits to ${selectedAccount.business_name || selectedAccount.email}`);

      // Update the selected account's balance in the UI
      setSelectedAccount({
        ...selectedAccount,
        credit_balance: {
          included_credits: (selectedAccount.credit_balance?.included_credits || 0) + amount,
          purchased_credits: selectedAccount.credit_balance?.purchased_credits || 0,
        },
      });

      // Also update in results list
      setResults(prev => prev.map(r =>
        r.id === selectedAccount.id
          ? {
              ...r,
              credit_balance: {
                included_credits: (r.credit_balance?.included_credits || 0) + amount,
                purchased_credits: r.credit_balance?.purchased_credits || 0,
              },
            }
          : r
      ));

      setCreditAmount('100');
    } catch (err: any) {
      console.error('Add credits error:', err);
      setError(err.message || 'Failed to add credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleClientAccount = async (account: AccountResult) => {
    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ is_client_account: !account.is_client_account })
        .eq('id', account.id);

      if (updateError) throw updateError;

      // Update in results
      setResults(prev => prev.map(r =>
        r.id === account.id
          ? { ...r, is_client_account: !r.is_client_account }
          : r
      ));

      if (selectedAccount?.id === account.id) {
        setSelectedAccount({ ...selectedAccount, is_client_account: !selectedAccount.is_client_account });
      }

      setSuccess(`${account.business_name || account.email} is ${!account.is_client_account ? 'now' : 'no longer'} a client account`);
    } catch (err: any) {
      setError('Failed to update client status');
    }
  };

  const handleUpdateMonthlyAllocation = async (account: AccountResult, allocation: number | null) => {
    setIsUpdatingMonthly(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ monthly_credit_allocation: allocation })
        .eq('id', account.id);

      if (updateError) throw updateError;

      const newEffective = allocation ?? account.plan_default_credits;

      // Update in results
      setResults(prev => prev.map(r =>
        r.id === account.id
          ? { ...r, monthly_credit_allocation: allocation, effective_monthly_credits: newEffective }
          : r
      ));

      if (selectedAccount?.id === account.id) {
        setSelectedAccount({ ...selectedAccount, monthly_credit_allocation: allocation, effective_monthly_credits: newEffective });
      }

      setMonthlyAddAmount('');
      setSuccess(`Monthly allocation updated to ${newEffective} credits for ${account.business_name || account.email}`);
    } catch (err: any) {
      setError('Failed to update monthly allocation');
    } finally {
      setIsUpdatingMonthly(false);
    }
  };

  const handleAddToMonthly = async () => {
    if (!selectedAccount || !monthlyAddAmount) return;

    const addAmount = parseInt(monthlyAddAmount, 10);
    if (isNaN(addAmount) || addAmount <= 0) {
      setError('Please enter a valid amount to add');
      return;
    }

    const currentMonthly = selectedAccount.effective_monthly_credits;
    const newTotal = currentMonthly + addAmount;

    await handleUpdateMonthlyAllocation(selectedAccount, newTotal);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Credit management</h2>
        <p className="text-white/80 mt-1">Search accounts and manage credits</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Accounts</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by business name or email..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                Searching...
              </>
            ) : (
              <>
                <Icon name="FaSearch" className="w-4 h-4" size={16} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
          <div className="space-y-3">
            {results.map((account) => (
              <div
                key={account.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedAccount?.id === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedAccount(account)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {account.business_name || 'No business name'}
                    </p>
                    <p className="text-sm text-gray-600">{account.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        account.plan === 'maven' ? 'bg-purple-100 text-purple-800' :
                        account.plan === 'builder' ? 'bg-blue-100 text-blue-800' :
                        account.plan === 'grower' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {account.plan || 'free'}
                      </span>
                      {account.is_client_account && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Client
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Current balance</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(account.credit_balance?.included_credits || 0) + (account.credit_balance?.purchased_credits || 0)} credits
                    </p>
                    <p className="text-xs text-gray-500">
                      {account.credit_balance?.included_credits || 0} included, {account.credit_balance?.purchased_credits || 0} purchased
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {account.effective_monthly_credits}/mo
                      {account.monthly_credit_allocation !== null && (
                        <span className="text-gray-500"> (custom)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Account Actions */}
      {selectedAccount && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Manage: {selectedAccount.business_name || selectedAccount.email}
          </h3>

          <div className="space-y-6">
            {/* Add Credits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Credits (one-time)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                  placeholder="100"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddCredits}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding...' : 'Add Credits'}
                </button>
              </div>
            </div>

            {/* Client Account Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Client Account</p>
                <p className="text-sm text-gray-600">
                  Client accounts receive monthly credits without a paid subscription
                </p>
              </div>
              <button
                onClick={() => handleToggleClientAccount(selectedAccount)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  selectedAccount.is_client_account ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    selectedAccount.is_client_account ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Monthly Allocation */}
            <div className="py-3 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly credit allocation
              </label>

              {/* Current Status Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Plan default:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedAccount.plan_default_credits} credits
                      <span className="text-gray-500 ml-1">({selectedAccount.plan || 'free'})</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Custom override:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedAccount.monthly_credit_allocation !== null
                        ? `${selectedAccount.monthly_credit_allocation} credits`
                        : 'None'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Current monthly credits:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">
                    {selectedAccount.effective_monthly_credits} credits/month
                  </span>
                </div>
              </div>

              {/* Add to Monthly */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add to monthly allocation
                </label>
                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{selectedAccount.effective_monthly_credits}</span>
                    <span className="text-gray-500">+</span>
                    <input
                      type="number"
                      value={monthlyAddAmount}
                      onChange={(e) => setMonthlyAddAmount(e.target.value)}
                      min="1"
                      placeholder="0"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                    />
                    <span className="text-gray-500">=</span>
                    <span className="font-semibold text-gray-900">
                      {selectedAccount.effective_monthly_credits + (parseInt(monthlyAddAmount, 10) || 0)}
                    </span>
                  </div>
                  <button
                    onClick={handleAddToMonthly}
                    disabled={isUpdatingMonthly || !monthlyAddAmount || parseInt(monthlyAddAmount, 10) <= 0}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isUpdatingMonthly ? 'Updating...' : 'Add to monthly'}
                  </button>
                </div>
              </div>

              {/* Set Absolute Value */}
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or set absolute monthly value
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Set a specific value or clear to use plan default
                </p>
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    value={selectedAccount.monthly_credit_allocation ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      setSelectedAccount({ ...selectedAccount, monthly_credit_allocation: val });
                    }}
                    min="0"
                    placeholder="Use plan default"
                    className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleUpdateMonthlyAllocation(selectedAccount, selectedAccount.monthly_credit_allocation)}
                    disabled={isUpdatingMonthly}
                    className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isUpdatingMonthly ? 'Saving...' : 'Save'}
                  </button>
                  {selectedAccount.monthly_credit_allocation !== null && (
                    <button
                      onClick={() => handleUpdateMonthlyAllocation(selectedAccount, null)}
                      disabled={isUpdatingMonthly}
                      className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 disabled:opacity-50"
                    >
                      Reset to plan default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
