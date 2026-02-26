'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { useProposals } from '@/features/proposals/hooks/useProposals';
import { ProposalStatus, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/features/proposals/types';
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge';
import { apiClient } from '@/utils/apiClient';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

const STATUS_TABS: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

export default function ContractsPage() {
  const router = useRouter();
  const basePath = '/agency/contracts';
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const { proposals, loading, error, refetch } = useProposals(statusFilter);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const { toasts, closeToast, success, error: showError } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/proposals/${id}`);
      refetch();
      success('Contract deleted');
    } catch {
      showError('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const data = await apiClient.post<any>(`/proposals/${id}/duplicate`);
      router.push(`${basePath}/${data.id}`);
    } catch {
      showError('Failed to duplicate');
    }
  };

  const handleCopyLink = async (token: string, id: string) => {
    try {
      const url = `${window.location.origin}/sow/${token}`;
      await navigator.clipboard.writeText(url);
      setCopyLinkId(id);
      setTimeout(() => setCopyLinkId(null), 2000);
    } catch {
      // fallback silently
    }
  };

  const calculateTotal = (lineItems: any[]) => {
    if (!Array.isArray(lineItems)) return 0;
    return lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
  };

  return (
    <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="Contracts"
        description="Create and manage proposals for your clients"
        actions={
          <Button onClick={() => router.push(`${basePath}/create`)} className="whitespace-nowrap">
            <Icon name="FaPlus" size={14} className="mr-2" />
            New contract
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-blue text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contracts list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading contracts...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaBriefcase" size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="mb-4">No contracts yet</p>
          <Button onClick={() => router.push(`${basePath}/create`)}>
            Create your first contract
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2 sm:hidden">← Scroll horizontally to see more →</p>
          <div className="overflow-x-auto shadow sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proposals.map((proposal, index) => (
                  <tr key={proposal.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <button
                        onClick={() => router.push(`${basePath}/${proposal.id}`)}
                        className="font-medium text-gray-900 hover:text-slate-blue transition-colors text-left"
                      >
                        {proposal.title}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                      {proposal.client_name || proposal.client_email || '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <ProposalStatusBadge status={proposal.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                      {proposal.show_pricing && Array.isArray(proposal.line_items) && proposal.line_items.length > 0
                        ? `$${calculateTotal(proposal.line_items).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex gap-2 items-center justify-end">
                        <button
                          onClick={() => router.push(`${basePath}/${proposal.id}`)}
                          className="text-slate-blue hover:text-slate-blue/80 underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => router.push(`${basePath}/${proposal.id}/preview`)}
                          className="text-slate-blue hover:text-slate-blue/80 underline text-sm"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(proposal.token, proposal.id)}
                          className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-purple-500/20 text-purple-800 rounded hover:bg-purple-500/30 text-sm shadow border border-white/30"
                          title={copyLinkId === proposal.id ? 'Copied!' : 'Copy link'}
                          aria-label="Copy link"
                        >
                          <Icon name={copyLinkId === proposal.id ? 'FaCheck' : 'FaLink'} size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(proposal.id)}
                          className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-blue-500/20 text-blue-800 rounded hover:bg-blue-500/30 text-sm shadow border border-white/30"
                          title="Duplicate"
                          aria-label="Duplicate contract"
                        >
                          <Icon name="FaCopy" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(proposal.id)}
                          disabled={deleting === proposal.id}
                          className="inline-flex items-center justify-center p-2 min-h-[36px] min-w-[36px] bg-red-500/20 text-red-800 rounded hover:bg-red-500/30 text-sm shadow border border-white/30 disabled:opacity-50"
                          title="Delete"
                          aria-label="Delete contract"
                        >
                          <Icon name="FaTrash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </PageCard>
  );
}
