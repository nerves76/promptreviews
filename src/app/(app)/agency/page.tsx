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
  billing_owner: 'client' | 'agency';
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

interface AgencyMetrics {
  total_clients: number;
  active_clients: number;
  total_reviews: number;
  verified_reviews: number;
}

interface CreditBalance {
  balance: number;
  monthly: number;
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
  const [agencyCredits, setAgencyCredits] = useState<CreditBalance | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [agencyReviews, setAgencyReviews] = useState<{ total: number; this_month: number }>({ total: 0, this_month: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!account?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch clients, stats, agency credits, logo, and agency's own reviews in parallel
        const [clientsData, statsData, creditsData, businessData, reviewsData] = await Promise.all([
          apiClient.get<AgencyClientsResponse>('/agency/clients?limit=6'),
          apiClient.get<{ total_reviews: number; verified_reviews: number }>('/agency/stats'),
          apiClient.get<{ total: number; included: number; purchased: number; monthly_allocation?: number }>('/credits/balance'),
          apiClient.get<{ business: { logo_url?: string } | null }>('/businesses/current').catch(() => ({ business: null })),
          apiClient.get<{ total: number; this_month: number }>('/reviews/stats').catch(() => ({ total: 0, this_month: 0 })),
        ]);

        // Set agency logo and reviews
        setAgencyLogo(businessData?.business?.logo_url || null);
        setAgencyReviews({ total: reviewsData.total || 0, this_month: reviewsData.this_month || 0 });

        setClients(clientsData.clients || []);

        // Set agency credits
        // Monthly is 200 base + tiered credits per paying client
        const TIER_CREDITS: Record<string, number> = { grower: 200, builder: 300, maven: 500 };
        const payingClients = (clientsData.clients || []).filter(c => c.subscription_status === 'active');
        const clientCredits = payingClients.reduce((sum, client) => {
          return sum + (TIER_CREDITS[client.plan || 'grower'] || TIER_CREDITS.grower);
        }, 0);
        setAgencyCredits({
          balance: creditsData.total || 0,
          monthly: 200 + clientCredits,
        });

        // Calculate metrics from clients data and stats
        const allClients = clientsData.clients || [];
        const activeClients = allClients.filter(c => c.subscription_status === 'active');

        setMetrics({
          total_clients: clientsData.total || 0,
          active_clients: activeClients.length,
          total_reviews: statsData.total_reviews || 0,
          verified_reviews: statsData.verified_reviews || 0,
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
        <h1 className="text-2xl font-bold text-white">
          Welcome, {account?.business_name || 'Agency'}
        </h1>
        <p className="text-white/70 mt-1">
          Manage your client accounts and track performance
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
                <Icon name="FaStar" className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.total_reviews}</p>
                <p className="text-xs text-white/60">Total reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Icon name="FaCheckCircle" className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.verified_reviews}</p>
                <p className="text-xs text-white/60">Verified reviews</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit bonus message */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8 flex items-start gap-3">
        <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
          <Icon name="FaCoins" className="text-green-400" size={18} />
        </div>
        <div>
          <p className="text-white font-medium text-sm">Earn more monthly credits with paid clients</p>
          <p className="text-white/70 text-sm mt-1">
            Your agency receives 200 credits per month, plus bonus monthly credits for each client with an active paid subscription:
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-green-400">Grower: +200/mo</span>
            <span className="text-cyan-300">Builder: +300/mo</span>
            <span className="text-yellow-400">Maven: +500/mo</span>
          </div>
          <p className="text-white/60 text-xs mt-2">
            Bonus credits start after their first payment and refresh monthly.
          </p>
        </div>
      </div>

      {/* Accounts section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Accounts</h2>
          <Link
            href="/agency/clients"
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <Icon name="FaChevronRight" size={12} />
          </Link>
        </div>

        <div className="divide-y divide-white/10">
          {/* Agency's own account - always shown first with prominent design */}
          {account && (
            <Link
              href="/dashboard"
              className="block p-5 bg-gradient-to-r from-slate-blue/30 to-slate-blue/10 hover:from-slate-blue/40 hover:to-slate-blue/20 transition-all border-b border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    {agencyLogo ? (
                      <img src={agencyLogo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="FaBuilding" className="text-white" size={28} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-lg">
                        {account.business_name || 'Your agency'}
                      </p>
                      {!account.business_creation_complete && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Set up your account
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mt-0.5">
                      Manage your agency account
                    </p>
                  </div>
                </div>
                {/* Stats for agency */}
                <div className="flex items-center gap-6">
                  {/* Review stats */}
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-white/50">Reviews:</span>
                      <span className="text-white ml-1 font-medium">{agencyReviews.total}</span>
                    </div>
                    <div>
                      <span className="text-white/50">This month:</span>
                      <span className="text-white ml-1 font-medium">{agencyReviews.this_month}</span>
                    </div>
                  </div>
                  {/* Credit info */}
                  {agencyCredits && (
                    <div className="hidden md:flex items-center gap-4 text-sm border-l border-white/20 pl-4">
                      <div>
                        <span className="text-white/50">Monthly:</span>
                        <span className="text-white ml-1 font-medium">{agencyCredits.monthly}</span>
                      </div>
                      <div>
                        <span className="text-white/50">Balance:</span>
                        <span className="text-white ml-1 font-medium">{agencyCredits.balance}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-sm hidden lg:inline">Manage account</span>
                    <Icon name="FaChevronRight" size={16} />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Client accounts */}
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
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                    {client.logo_url ? (
                      <img src={client.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="FaBuilding" className="text-white/60" size={18} />
                    )}
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
                      {client.billing_owner === 'agency' && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-slate-blue/30 text-white">
                          Agency billing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {/* Review stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-white/50">Reviews:</span>
                      <span className="text-white ml-1">{client.reviews.total}</span>
                    </div>
                    <div>
                      <span className="text-white/50">This month:</span>
                      <span className="text-white ml-1">{client.reviews.this_month}</span>
                    </div>
                  </div>
                  {/* Credit info */}
                  <div className="hidden md:flex items-center gap-4 text-xs border-l border-white/10 pl-4">
                    <div>
                      <span className="text-white/50">Monthly:</span>
                      <span className="text-white ml-1">{client.credits.monthly}</span>
                    </div>
                    <div>
                      <span className="text-white/50">Balance:</span>
                      <span className="text-white ml-1">{client.credits.balance}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <span className="text-xs hidden lg:inline">Manage</span>
                    <Icon name="FaChevronRight" size={14} />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Empty state for clients - only shown if no clients yet */}
          {clients.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-white/60 text-sm mb-3">
                No client accounts yet
              </p>
              <Link
                href="/agency/clients"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap text-sm"
              >
                <Icon name="FaPlus" size={14} />
                Add your first client
              </Link>
            </div>
          )}
        </div>
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
