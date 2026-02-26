'use client';

import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { ProposalEditor } from '@/features/proposals/components/ProposalEditor';

export default function CreateContractPage() {
  return (
    <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="New contract"
        description="Create a new proposal to send to your client"
      />
      <ProposalEditor mode="create" basePath="/agency/contracts" />
    </PageCard>
  );
}
