"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import Link from "next/link";
import Icon from "@/components/Icon";
import { apiClient } from "@/utils/apiClient";
import { Modal } from "@/app/(app)/components/ui/modal";
import { Button } from "@/app/(app)/components/ui/button";

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

export default function AgencyClientsPage() {
  const { account } = useAuth();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add client modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

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

  const handleInviteClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail.trim()) return;

    try {
      setInviteLoading(true);
      setInviteError(null);

      await apiClient.post('/agency/clients', {
        client_email: clientEmail.trim(),
      });

      setInviteSuccess(true);
      setClientEmail('');

      // Refresh clients list
      await fetchClients();

      // Close modal after delay
      setTimeout(() => {
        setShowAddModal(false);
        setInviteSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error inviting client:', err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Client workspaces</h1>
          <p className="text-white/70 mt-1">
            {total} client{total !== 1 ? 's' : ''} managed by your agency
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          <Icon name="FaPlus" size={14} />
          Add client
        </button>
      </div>

      {/* Filters */}
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

      {/* Clients list */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FaUsers" className="text-white/40" size={32} />
            </div>
            {clients.length === 0 ? (
              <>
                <h3 className="text-white font-medium mb-2">No clients yet</h3>
                <p className="text-white/60 text-sm mb-4">
                  Start by inviting client workspaces to your agency
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
                >
                  <Icon name="FaPlus" size={14} />
                  Add your first client
                </button>
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
              const status = getStatusBadge(client.subscription_status);
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
                      <span className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-purple-100 text-purple-800">
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

      {/* Add client modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setClientEmail('');
          setInviteError(null);
          setInviteSuccess(false);
        }}
        title="Add client workspace"
        size="md"
      >
        {inviteSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="FaCheckCircle" className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation sent!</h3>
            <p className="text-gray-600 text-sm">
              The client will receive an email to accept your agency invitation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleInviteClient}>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter the email address of an existing Prompt Reviews account owner to invite them as a client.
              </p>

              <div>
                <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Client email address
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  required
                />
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{inviteError}</p>
                </div>
              )}
            </div>

            <Modal.Footer>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteLoading || !clientEmail.trim()}
              >
                {inviteLoading ? (
                  <>
                    <Icon name="FaSpinner" className="animate-spin mr-2" size={14} />
                    Sending...
                  </>
                ) : (
                  'Send invitation'
                )}
              </Button>
            </Modal.Footer>
          </form>
        )}
      </Modal>
    </div>
  );
}
