'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { useProposal } from '@/features/proposals/hooks/useProposal';
import { ProposalPreview } from '@/features/proposals/components/ProposalPreview';
import { exportProposalToPdf } from '@/features/proposals/utils/pdfExport';
import { apiClient } from '@/utils/apiClient';

export default function PreviewContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { proposal, loading, error, refetch } = useProposal(id);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    if (!proposal) return;
    if (!proposal.client_email) {
      setSendError('Add a client email address before sending');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await apiClient.post(`/proposals/${proposal.id}/send`);
      setSendSuccess(true);
      refetch();
    } catch (err: any) {
      setSendError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!proposal) return;
    exportProposalToPdf('proposal-preview-content', proposal.title.replace(/\s+/g, '_'));
  };

  if (loading) {
    return (
      <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading preview...</p>
        </div>
      </PageCard>
    );
  }

  if (error || !proposal) {
    return (
      <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
        <div className="text-center py-12 text-red-600">
          <p>{error || 'Contract not found'}</p>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="Contract preview"
        description={`Status: ${proposal.status}${proposal.client_name ? ` — for ${proposal.client_name}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push(`/agency/contracts/${proposal.id}`)} className="whitespace-nowrap">
              <Icon name="FaEdit" size={14} className="mr-2" />
              Edit
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} className="whitespace-nowrap">
              <Icon name="FaFileAlt" size={14} className="mr-2" />
              Download PDF
            </Button>
            {['draft', 'sent'].includes(proposal.status) && (
              <Button onClick={handleSend} disabled={sending} className="whitespace-nowrap">
                {sending ? (
                  <>
                    <Icon name="FaSpinner" size={14} className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Icon name="FaEnvelope" size={14} className="mr-2" />
                    Send to client
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      {sendError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {sendError}
        </div>
      )}

      {sendSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          Contract sent to {proposal.client_email}!
        </div>
      )}

      {/* Preview area with white background for PDF rendering */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <ProposalPreview proposal={proposal} id="proposal-preview-content" />
      </div>

      {/* Signature info if signed */}
      {proposal.signature && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FaCheckCircle" size={16} className="text-green-600" />
            <span className="font-medium text-green-800">Signed</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p>Signed by: {proposal.signature.signer_name} ({proposal.signature.signer_email})</p>
            <p>Date: {new Date(proposal.signature.signed_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </PageCard>
  );
}
