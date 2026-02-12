'use client';

import { SurveyStatus, SURVEY_STATUS_LABELS, SURVEY_STATUS_COLORS } from '../types';

interface SurveyStatusBadgeProps {
  status: SurveyStatus;
  className?: string;
}

export function SurveyStatusBadge({ status, className = '' }: SurveyStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${SURVEY_STATUS_COLORS[status]} ${className}`}
    >
      {SURVEY_STATUS_LABELS[status]}
    </span>
  );
}
