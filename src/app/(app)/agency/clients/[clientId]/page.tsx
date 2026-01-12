"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";

interface ClientDetails {
  client: {
    id: string;
    business_name: string | null;
    contact_name: string | null;
    email: string | null;
    plan: string | null;
    status: string;
    billing_owner: 'client' | 'agency';
    created_at: string;
  };
  access: {
    role: string;
    status: string;
    connected_at: string | null;
  } | null;
  metrics: {
    total_reviews: number;
    recent_submissions: number;
  };
}

function getStatusBadge(status: string): { label: string; color: string; description: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'bg-green-100 text-green-800', description: 'Subscription is active' };
    case 'trial':
      return { label: 'Trial', color: 'bg-blue-100 text-blue-800', description: 'In trial period' };
    case 'needs_billing':
      return { label: 'Needs billing', color: 'bg-amber-100 text-amber-800', description: 'No active payment method' };
    case 'canceled':
      return { label: 'Canceled', color: 'bg-red-100 text-red-800', description: 'Subscription canceled' };
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-600', description: '' };
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [clientData, setClientData] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Takeover form state
  const [selectedPlan, setSelectedPlan] = useState('grower');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Release form state
  const [releaseImmediate, setReleaseImmediate] = useState(false);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<ClientDetails>(`/agency/clients/${clientId}`);
      setClientData(data);
    } catch (err: any) {
      console.error('Error fetching client details:', err);
      setError(err.message || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

  const handleTakeover = async () => {
    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/billing/take-over', {
        client_account_id: clientId,
        plan: selectedPlan,
        billing_period: billingPeriod,
      });

      setShowTakeoverModal(false);
      await fetchClientDetails();
    } catch (err: any) {
      console.error('Error taking over billing:', err);
      setActionError(err.message || 'Failed to take over billing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.post('/agency/billing/release', {
        client_account_id: clientId,
        immediate: releaseImmediate,
      });

      setShowReleaseModal(false);
      await fetchClientDetails();
    } catch (err: any) {
      console.error('Error releasing billing:', err);
      setActionError(err.message || 'Failed to release billing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setActionLoading(true);
      setActionError(null);

      await apiClient.delete(`/agency/clients/${clientId}`);

      // Redirect to clients list after disconnect
      router.push('/agency/clients');
    } catch (err: any) {
      console.error('Error disconnecting from client:', err);
      setActionError(err.message || 'Failed to disconnect from client');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Icon name="FaSpinner" className="animate-spin text-white w-8 h-8" size={32} />
        </div>
      </div>
    );
  }

  if (error || !clientData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <Icon name="FaExclamationTriangle" className="text-red-400 w-8 h-8 mx-auto mb-2" size={32} />
          <p className="text-red-400">{error || 'Client not found'}</p>
          <Link
            href="/agency/clients"
            className="mt-4 inline-block px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const { client, access, metrics } = clientData;
  const status = getStatusBadge(client.status);
  const plan = getPlanBadge(client.plan);
  const isAgencyBilling = client.billing_owner === 'agency';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/agency/clients"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
        >
          <Icon name="FaArrowLeft" size={14} />
          Back to clients
        </Link>
      </div>

      {/* Client header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Icon name="FaBuilding" className="text-white/60" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {client.business_name || 'Unnamed client'}
              </h1>
              {client.contact_name && (
                <p className="text-white/70">{client.contact_name}</p>
              )}
              {client.email && (
                <p className="text-white/60 text-sm">{client.email}</p>
              )}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${status.color}`}>
              {status.label}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${plan.color}`}>
              {plan.label}
            </span>
            {isAgencyBilling && (
              <span className="px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
                Agency billing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics and details grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Metrics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Icon name="FaStar" className="text-blue-400" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.total_reviews}</p>
              <p className="text-xs text-white/60">Total reviews</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Icon name="FaEnvelope" className="text-green-400" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{metrics.recent_submissions}</p>
              <p className="text-xs text-white/60">Submissions (30 days)</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Icon name="FaCalendarAlt" className="text-purple-400" size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {new Date(client.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-white/60">Client since</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing management section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Billing management</h2>

        {isAgencyBilling ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <Icon name="FaCreditCard" className="text-purple-400" size={20} />
              <div>
                <p className="text-white font-medium">Your agency is paying for this client</p>
                <p className="text-white/60 text-sm">
                  The client's subscription is billed to your agency's payment method
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReleaseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <Icon name="FaUnlock" size={14} />
              Release billing to client
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
              <Icon name="FaWallet" className="text-gray-400" size={20} />
              <div>
                <p className="text-white font-medium">Client manages their own billing</p>
                <p className="text-white/60 text-sm">
                  The client pays for their own subscription
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTakeoverModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <Icon name="FaCreditCard" size={14} />
              Take over billing
            </button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Danger zone</h2>
        <p className="text-white/70 text-sm mb-4">
          Disconnecting from this client will remove all agency access.
          {isAgencyBilling && ' Since you are the billing owner, the client will be downgraded to the free tier.'}
        </p>
        <button
          onClick={() => setShowDisconnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          <Icon name="FaTimes" size={14} />
          Disconnect from client
        </button>
      </div>

      {/* Takeover billing modal */}
      <Modal
        isOpen={showTakeoverModal}
        onClose={() => {
          setShowTakeoverModal(false);
          setActionError(null);
        }}
        title="Take over billing"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            You will become the billing owner for this client. Their subscription will be charged to your agency's payment method.
          </p>

          <div>
            <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select plan
            </label>
            <select
              id="plan-select"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            >
              <option value="grower">Grower</option>
              <option value="builder">Builder</option>
              <option value="maven">Maven</option>
            </select>
          </div>

          <div>
            <label htmlFor="billing-period" className="block text-sm font-medium text-gray-700 mb-1">
              Billing period
            </label>
            <select
              id="billing-period"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value as 'monthly' | 'annual')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual (save 20%)</option>
            </select>
          </div>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTakeoverModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleTakeover} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                Processing...
              </>
            ) : (
              'Take over billing'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Release billing modal */}
      <Modal
        isOpen={showReleaseModal}
        onClose={() => {
          setShowReleaseModal(false);
          setActionError(null);
        }}
        title="Release billing"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            The client will become responsible for their own billing. They will need to add a payment method to continue their subscription.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="release-timing"
                checked={!releaseImmediate}
                onChange={() => setReleaseImmediate(false)}
                className="w-4 h-4 text-slate-blue"
              />
              <div>
                <p className="text-gray-900 font-medium">At period end</p>
                <p className="text-gray-500 text-sm">Client keeps access until current billing period ends</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="release-timing"
                checked={releaseImmediate}
                onChange={() => setReleaseImmediate(true)}
                className="w-4 h-4 text-slate-blue"
              />
              <div>
                <p className="text-gray-900 font-medium">Immediately</p>
                <p className="text-gray-500 text-sm">Client is downgraded to free tier right away</p>
              </div>
            </label>
          </div>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReleaseModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleRelease} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                Processing...
              </>
            ) : (
              'Release billing'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Disconnect modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => {
          setShowDisconnectModal(false);
          setActionError(null);
        }}
        title="Disconnect from client"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="FaExclamationTriangle" className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-800 font-medium">This action cannot be undone</p>
                <p className="text-red-600 text-sm mt-1">
                  All agency team members will lose access to this client's workspace.
                  {isAgencyBilling && ' The client will be downgraded to the free tier.'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Are you sure you want to disconnect from <strong>{client.business_name || 'this client'}</strong>?
          </p>

          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDisconnectModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {actionLoading ? (
              <>
                <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
