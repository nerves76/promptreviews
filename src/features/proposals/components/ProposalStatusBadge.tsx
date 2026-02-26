'use client';

import { ProposalStatus, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '../types';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
}

export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${PROPOSAL_STATUS_COLORS[status]}`}
    >
      {PROPOSAL_STATUS_LABELS[status]}
    </span>
  );
}
