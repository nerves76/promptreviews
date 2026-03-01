'use client';

import { use, useState } from 'react';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useProposal } from '@/features/proposals/hooks/useProposal';
import { ProposalEditor } from '@/features/proposals/components/ProposalEditor';

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { proposal, loading, error } = useProposal(id);
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);

  if (loading) {
    return (
      <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading contract...</p>
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
        title={proposal.is_template ? `Edit template: ${proposal.title}` : `Edit: ${proposal.title}`}
        description={proposal.is_template ? 'Update your template details' : 'Update your contract details'}
        actions={headerActions}
      />
      <ProposalEditor proposal={proposal} mode="edit" basePath="/agency/contracts" renderActions={setHeaderActions} />
    </PageCard>
  );
}
