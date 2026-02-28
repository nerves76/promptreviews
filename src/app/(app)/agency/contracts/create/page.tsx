'use client';

import { useSearchParams } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { ProposalEditor } from '@/features/proposals/components/ProposalEditor';

export default function CreateContractPage() {
  const searchParams = useSearchParams();
  const isTemplate = searchParams.get('template') === 'true';

  return (
    <PageCard icon={<Icon name="FaBriefcase" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title={isTemplate ? 'New template' : 'New contract'}
        description={isTemplate ? 'Create a reusable contract template' : 'Create a new proposal to send to your client'}
      />
      <ProposalEditor mode="create" basePath="/agency/contracts" defaultIsTemplate={isTemplate} />
    </PageCard>
  );
}
