"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import Link from "next/link";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";

interface ClientAccount {
  id: string;
  business_name: string | null;
  plan: string | null;
  subscription_status: string | null;
  agncy_billing_owner: 'client' | 'agency';
  created_at: string;
}

interface AgencyClientsResponse {
  clients: ClientAccount[];
  total: number;
}

interface AgencyMetrics {
  total_clients: number;
  active_clients: number;
  pending_invitations: number;
  clients_agency_billing: number;
  clients_own_billing: number;
}

function getStatusBadge(status: string | null): { label: string; color: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'bg-green-100 text-green-800' };
    case 'trialing':
      return { label: 'Trial', color: 'bg-blue-100 text-blue-800' };
    case 'past_due':
      return { label: 'Past due', color: 'bg-amber-100 text-amber-800' };
    case 'canceled':
      return { label: 'Canceled', color: 'bg-red-100 text-red-800' };
    case 'canceling':
      return { label: 'Canceling', color: 'bg-orange-100 text-orange-800' };
    default:
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

export default function AgencyDashboardPage() {
  const { account } = useAuth();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!account?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch clients
        const clientsData = await apiClient.get<AgencyClientsResponse>('/agency/clients?limit=6');
        setClients(clientsData.clients || []);

        // Calculate metrics from clients data
        const allClients = clientsData.clients || [];
        const activeClients = allClients.filter(c => c.subscription_status === 'active');
        const agencyBillingClients = allClients.filter(c => c.agncy_billing_owner === 'agency');

        setMetrics({
          total_clients: clientsData.total || 0,
          active_clients: activeClients.length,
          pending_invitations: 0, // Would need separate query
          clients_agency_billing: agencyBillingClients.length,
          clients_own_billing: allClients.length - agencyBillingClients.length,
        });
      } catch (err) {
        console.error('Error fetching agency data:', err);
        setError('Failed to load agency data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [account?.id]);

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
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agency dashboard</h1>
        <p className="text-white/70 mt-1">
          Manage your client workspaces and track performance
        </p>
      </div>

      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Icon name="FaUsers" className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.total_clients}</p>
                <p className="text-xs text-white/60">Total clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Icon name="FaCheckCircle" className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.active_clients}</p>
                <p className="text-xs text-white/60">Active subscriptions</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Icon name="FaCreditCard" className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.clients_agency_billing}</p>
                <p className="text-xs text-white/60">Agency billing</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Icon name="FaWallet" className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.clients_own_billing}</p>
                <p className="text-xs text-white/60">Client billing</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent clients section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Recent clients</h2>
          <Link
            href="/agency/clients"
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <Icon name="FaChevronRight" size={12} />
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FaUsers" className="text-white/40" size={32} />
            </div>
            <h3 className="text-white font-medium mb-2">No clients yet</h3>
            <p className="text-white/60 text-sm mb-4">
              Start managing client workspaces by inviting them to your agency
            </p>
            <Link
              href="/agency/clients"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              <Icon name="FaPlus" size={14} />
              Add client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {clients.map((client) => {
              const status = getStatusBadge(client.subscription_status);
              const plan = getPlanBadge(client.plan);

              return (
                <Link
                  key={client.id}
                  href={`/agency/clients/${client.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <Icon name="FaBuilding" className="text-white/60" size={18} />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {client.business_name || 'Unnamed client'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${status.color}`}>
                          {status.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${plan.color}`}>
                          {plan.label}
                        </span>
                        {client.agncy_billing_owner === 'agency' && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
                            Agency billing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Icon name="FaChevronRight" className="text-white/40" size={14} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/agency/clients"
          className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-colors group"
        >
          <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
            <Icon name="FaUserPlus" className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-white font-medium">Add new client</h3>
            <p className="text-white/60 text-sm">Invite a new workspace to your agency</p>
          </div>
        </Link>

        <Link
          href="/dashboard/plan"
          className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-colors group"
        >
          <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
            <Icon name="FaRocket" className="text-green-400" size={24} />
          </div>
          <div>
            <h3 className="text-white font-medium">Manage agency plan</h3>
            <p className="text-white/60 text-sm">View or upgrade your subscription</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
