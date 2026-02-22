"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { LoadingSpinner } from "@/app/(app)/components/ui/loading-spinner";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";
import { useAccountSelection } from "@/utils/accountSelectionHooks";

interface ClientAccount {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  plan: string | null;
  subscription_status: string | null;
  is_free_account: boolean;
  trial_end: string | null;
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

export default function AgencyDashboardPage() {
  const { account } = useAuth();
  const router = useRouter();
  const { switchAccount } = useAccountSelection();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [metrics, setMetrics] = useState<AgencyMetrics | null>(null);
  const [agencyCredits, setAgencyCredits] = useState<CreditBalance | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [agencyReviews, setAgencyReviews] = useState<{ total: number; this_month: number }>({ total: 0, this_month: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  // Add client modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'create' | 'link'>('create');
  const [newClientName, setNewClientName] = useState('');
  const [selectedTier, setSelectedTier] = useState<'grower' | 'builder' | 'maven'>('grower');
  const [linkEmail, setLinkEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!account?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch clients, stats, agency credits, logo, and agency's own reviews in parallel
        // All calls have catch handlers to prevent one failure from breaking the whole page
        const [clientsData, statsData, creditsData, businessData, reviewsData] = await Promise.all([
          apiClient.get<AgencyClientsResponse>('/agency/clients?limit=6').catch(() => ({ clients: [], total: 0 })),
          apiClient.get<{ total_reviews: number; verified_reviews: number }>('/agency/stats').catch(() => ({ total_reviews: 0, verified_reviews: 0 })),
          apiClient.get<{ total: number; included: number; purchased: number; monthly_allocation?: number }>('/credits/balance').catch(() => ({ total: 0, included: 0, purchased: 0 })),
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

  const refetchClients = async () => {
    const clientsData = await apiClient.get<AgencyClientsResponse>('/agency/clients?limit=6').catch(() => ({ clients: [], total: 0 }));
    setClients(clientsData.clients || []);

    // Recalculate metrics
    const allClients = clientsData.clients || [];
    const activeClients = allClients.filter(c => c.subscription_status === 'active');
    setMetrics(prev => prev ? {
      ...prev,
      total_clients: clientsData.total || 0,
      active_clients: activeClients.length,
    } : null);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/clients/create', {
        business_name: newClientName.trim(),
        plan: selectedTier,
      });

      setActionSuccess('Client workspace created with 14-day trial!');
      setNewClientName('');
      setSelectedTier('grower');

      await refetchClients();

      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating client:', err);
      setActionError(err.message || 'Failed to create client workspace');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/clients/invite', {
        client_email: linkEmail.trim(),
      });

      setActionSuccess('Invitation sent! The client will need to accept it from their account settings.');
      setLinkEmail('');

      await refetchClients();

      setTimeout(() => {
        setShowAddModal(false);
        setActionSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error inviting client:', err);
      setActionError(err.message || 'Failed to send invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setAddMode('create');
    setNewClientName('');
    setSelectedTier('grower');
    setLinkEmail('');
    setActionError(null);
    setActionSuccess(null);
  };

  const handleGoToClientAccount = async (clientId: string) => {
    try {
      setSwitchingAccountId(clientId);
      await switchAccount(clientId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error switching to client account:', err);
      setSwitchingAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" className="text-white" />
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome, {account?.business_name || 'Agency'}
          </h1>
          <p className="text-white/70 mt-1">
            Manage your client accounts and track performance
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition-colors whitespace-nowrap"
        >
          <Icon name="FaPlus" size={14} />
          Add client
        </button>
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
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Icon name="FaStar" className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.total_reviews}</p>
                <p className="text-xs text-white/60">Reviews captured</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Icon name="FaStar" className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.verified_reviews}</p>
                <p className="text-xs text-white/60">Reviews verified</p>
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
          <p className="text-white font-semibold text-base">Earn more monthly credits with paid clients</p>
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
            href="/agency/work-manager"
            className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1"
          >
            View all
            <Icon name="FaChevronRight" size={12} />
          </Link>
        </div>

        <div className="divide-y divide-white/10">
          {/* Agency's own account - always shown first with prominent design */}
          {account && (
            <div className="p-5 bg-gradient-to-r from-slate-blue/30 to-slate-blue/10 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                    {agencyLogo ? (
                      <img src={agencyLogo} alt={`${account.business_name || 'Agency'} logo`} className="w-full h-full object-cover" />
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
                      Your agency account
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
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm rounded-lg font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                  >
                    <Icon name="FaArrowRight" size={12} />
                    Go to account
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Client accounts */}
          {clients.map((client) => {
            const status = getStatusBadge(client.subscription_status, client.trial_end, client.is_free_account, client.plan);
            const planBadge = getPlanBadge(client.plan);
            const isSwitching = switchingAccountId === client.id;

            return (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                    {client.logo_url ? (
                      <img src={client.logo_url} alt={`${client.business_name || 'Client'} logo`} className="w-full h-full object-cover" />
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
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${planBadge.color}`}>
                        {planBadge.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                        client.billing_owner === 'agency' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {client.billing_owner === 'agency' ? 'Agency billing' : 'Client billing'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGoToClientAccount(client.id)}
                      disabled={isSwitching}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs rounded-lg font-medium hover:bg-white/20 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isSwitching ? (
                        <LoadingSpinner size="xs" />
                      ) : (
                        <Icon name="FaArrowRight" size={12} />
                      )}
                      Go to account
                    </button>
                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-white/60 text-xs rounded-lg hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                    >
                      <Icon name="FaCog" size={12} />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state for clients - only shown if no clients yet */}
          {clients.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-white/60 text-sm mb-3">
                No client accounts yet
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg font-medium hover:bg-slate-blue/90 transition-colors whitespace-nowrap text-sm"
              >
                <Icon name="FaPlus" size={14} />
                Add your first client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add client modal */}
      <Modal
        isOpen={showAddModal}
        onClose={resetModal}
        title="Add client"
        size="md"
      >
        {actionSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 text-sm">{actionSuccess}</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => { setAddMode('create'); setActionError(null); }}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  addMode === 'create'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Create new workspace
              </button>
              <button
                type="button"
                onClick={() => { setAddMode('link'); setActionError(null); }}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  addMode === 'link'
                    ? 'border-slate-blue text-slate-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Link existing account
              </button>
            </div>

            {addMode === 'create' ? (
              <form onSubmit={handleCreateClient}>
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Create a new client workspace with a 14-day free trial. Select a plan to get started.
                  </p>

                  <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Business name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Client's business name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Plan selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select plan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'grower', name: 'Grower', price: '$29', credits: '200' },
                        { id: 'builder', name: 'Builder', price: '$59', credits: '300' },
                        { id: 'maven', name: 'Maven', price: '$99', credits: '500' },
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedTier(plan.id as 'grower' | 'builder' | 'maven')}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedTier === plan.id
                              ? 'border-slate-blue bg-slate-blue/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.price}/mo</p>
                          <p className="text-xs text-gray-500 mt-1">{plan.credits} credits/mo</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <Icon name="FaInfoCircle" className="inline mr-1" size={12} />
                      All plans include a 14-day free trial. Billing starts after trial ends.
                    </p>
                  </div>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{actionError}</p>
                    </div>
                  )}
                </div>

                <Modal.Footer>
                  <Button type="button" variant="secondary" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading || !newClientName.trim()}>
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="xs" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Start 14-day trial'
                    )}
                  </Button>
                </Modal.Footer>
              </form>
            ) : (
              <form onSubmit={handleLinkClient}>
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Send an invitation to an existing Prompt Reviews account. They'll need to accept from their account settings.
                  </p>

                  <div>
                    <label htmlFor="link-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Client's account email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="link-email"
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      required
                    />
                  </div>

                  {actionError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{actionError}</p>
                    </div>
                  )}
                </div>

                <Modal.Footer>
                  <Button type="button" variant="secondary" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading || !linkEmail.trim()}>
                    {actionLoading ? (
                      <>
                        <LoadingSpinner size="xs" className="mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send invitation'
                    )}
                  </Button>
                </Modal.Footer>
              </form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
