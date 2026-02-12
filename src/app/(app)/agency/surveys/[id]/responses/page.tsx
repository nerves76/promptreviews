'use client';

import { useParams } from 'next/navigation';
import { SurveyResponsesPageContent } from '@/features/surveys/components/pages/SurveyResponsesPageContent';

export default function AgencySurveyResponsesPage() {
  const params = useParams();
  const surveyId = params.id as string;

  return <SurveyResponsesPageContent basePath="/agency/surveys" surveyId={surveyId} />;
}
