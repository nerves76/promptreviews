/**
 * Free Account Management Admin Page
 * 
 * This page provides comprehensive free account management capabilities for administrators,
 * including creating free accounts with specific plan levels and viewing existing free accounts.
 */

"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabaseClient";
import { FaUser, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

interface FreeAccount {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  plan?: string;
  free_plan_level: string;
  created_at: string;
  is_free_account: boolean;
}

const PLAN_LEVELS = [
  { value: 'grower', label: 'Grower', description: 'Up to 4 prompt pages' },
  { value: 'builder', label: 'Builder', description: 'Up to 100 prompt pages, 100 contacts' },
  { value: 'maven', label: 'Maven', description: 'Up to 500 prompt pages, 500 contacts' },
];

export default function FreeAccountsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [freeAccounts, setFreeAccounts] = useState<FreeAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [planLevel, setPlanLevel] = useState('grower');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFreeAccounts();
  }, []);

  const loadFreeAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, email, first_name, last_name, plan, free_plan_level, created_at, is_free_account')
        .eq('is_free_account', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFreeAccounts(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading free accounts:", error);
      setError("Failed to load free accounts");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/admin/free-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          planLevel: planLevel,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create free account');
      }

      setSuccess(`Successfully created free ${planLevel} account for ${email}`);
      setEmail('');
      setPlanLevel('grower');
      loadFreeAccounts(); // Refresh the list
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create free account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanLevelInfo = (level: string) => {
    return PLAN_LEVELS.find(p => p.value === level) || { label: level, description: 'Unknown plan' };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Free Account Management</h1>
          <p className="text-gray-600 mt-2">Create and manage free accounts with specific plan levels</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Create Free Account Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Free Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              placeholder="user@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="planLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Plan Level
            </label>
            <select
              id="planLevel"
              value={planLevel}
              onChange={(e) => setPlanLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              disabled={isSubmitting}
            >
              {PLAN_LEVELS.map(plan => (
                <option key={plan.value} value={plan.value}>
                  {plan.label} - {plan.description}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full bg-slate-blue text-white py-2 px-4 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Free Account...
              </>
            ) : (
              <>
                <FaUser className="mr-2" />
                Create Free Account
              </>
            )}
          </button>
        </form>
      </div>

      {/* Free Accounts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Existing Free Accounts</h2>
          <p className="text-sm text-gray-600 mt-1">
            {freeAccounts.length} free account{freeAccounts.length !== 1 ? 's' : ''} currently active
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FaSpinner className="animate-spin mx-auto mb-4 text-slate-blue" size={24} />
            <p className="text-gray-600">Loading free accounts...</p>
          </div>
        ) : freeAccounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaUser className="mx-auto mb-4 text-gray-400" size={48} />
            <p>No free accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {freeAccounts.map((account) => {
                  const planInfo = getPlanLevelInfo(account.free_plan_level);
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.first_name && account.last_name 
                              ? `${account.first_name} ${account.last_name}`
                              : account.email
                            }
                          </div>
                          <div className="text-sm text-gray-500">{account.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{planInfo.label}</div>
                        <div className="text-sm text-gray-500">{planInfo.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {account.plan || 'No plan'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheck className="mr-1" size={10} />
                          Free Account
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(account.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 