"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import Link from "next/link";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface ClientAccount {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  plan: string | null;
  subscription_status: string | null;
  is_free_account: boolean;
  trial_end: string | null;
  agncy_billing_owner: 'client' | 'agency';
  created_at: string;
  credits: {
    balance: number;
    monthly: number;
  };
  reviews: {
    total: number;
    this_month: number;
  };
}

interface AgencyClientsResponse {
  clients: ClientAccount[];
  total: number;
}

function getStatusBadge(status: string | null, trialEnd?: string | null, isFreeAccount?: boolean, plan?: string | null): { label: string; color: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    case 'trialing':
      if (trialEnd) {
        const endDate = new Date(trialEnd);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        return { label: `Trial: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`, color: 'bg-blue-100 text-blue-800' };
      }
      return { label: 'Trial', color: 'bg-blue-100 text-blue-800' };
    case 'past_due':
      return { label: 'Past due', color: 'bg-amber-100 text-amber-800' };
    case 'canceled':
      return { label: 'Canceled', color: 'bg-red-100 text-red-800' };
    case 'canceling':
      return { label: 'Canceling', color: 'bg-orange-100 text-orange-800' };
    default:
      if (isFreeAccount && plan && plan !== 'no_plan') {
        return { label: 'Free', color: 'bg-emerald-100 text-emerald-800' };
      }
      return { label: 'No plan', color: 'bg-gray-100 text-gray-600' };
  }
}

function getPlanBadge(plan: string | null): { label: string; color: string } {
  switch (plan) {
    case 'maven':
      return { label: 'Maven', color: 'bg-yellow-100 text-yellow-800' };
    case 'builder':
      return { label: 'Builder', color: 'bg-blue-100 text-blue-800' };
    case 'grower':
      return { label: 'Grower', color: 'bg-green-100 text-green-800' };
    default:
      return { label: 'Free', color: 'bg-gray-100 text-gray-600' };
  }
}

export default function AgencyClientsPage() {
  const { account } = useAuth();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');

  const fetchClients = async () => {
    if (!account?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get<AgencyClientsResponse>('/agency/clients');
      setClients(data.clients || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [account?.id]);

  // Filter clients
  const filteredClients = clients.filter(client => {
    if (statusFilter !== 'all' && client.subscription_status !== statusFilter) {
      return false;
    }
    if (billingFilter !== 'all' && client.agncy_billing_owner !== billingFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <Icon name="FaExclamationTriangle" className="text-red-400 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchClients}
            className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Client workspaces</h1>
        <p className="text-white/70 mt-1">
          {total} client{total !== 1 ? 's' : ''} managed by your agency
        </p>
      </div>

      {/* Filters - only show when there are clients */}
      {clients.length > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="trialing">Trial</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Billing:</label>
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
              className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all">All</option>
              <option value="agency">Agency billing</option>
              <option value="client">Client billing</option>
            </select>
          </div>
        </div>
      )}

      {/* Clients list */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FaUsers" className="text-white/40" size={32} />
            </div>
            {clients.length === 0 ? (
              <>
                <h3 className="text-white font-medium mb-2">No client workspaces yet</h3>
                <p className="text-white/60 text-sm mb-4">
                  Create a new workspace for a client, or link an existing account
                </p>
                <Link
                  href="/agency"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
                >
                  <Icon name="FaPlus" size={14} />
                  Add client
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-white font-medium mb-2">No matching clients</h3>
                <p className="text-white/60 text-sm">
                  Try adjusting your filters
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-white/60 uppercase tracking-wider">
              <div className="col-span-4">Client</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-2">Billing</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table rows */}
            {filteredClients.map((client) => {
              const status = getStatusBadge(client.subscription_status, client.trial_end, client.is_free_account, client.plan);
              const plan = getPlanBadge(client.plan);

              return (
                <div
                  key={client.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="FaBuilding" className="text-white/60" size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {client.business_name || 'Unnamed client'}
                      </p>
                      <p className="text-white/50 text-xs truncate">
                        Added {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${plan.color}`}>
                      {plan.label}
                    </span>
                  </div>

                  <div className="col-span-2">
                    {client.agncy_billing_owner === 'agency' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-blue-100 text-blue-800">
                        Agency
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-gray-100 text-gray-600">
                        Client
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Icon name="FaEye" size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
