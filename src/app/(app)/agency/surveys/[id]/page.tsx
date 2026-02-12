'use client';

import { useParams } from 'next/navigation';
import { SurveyBuilderPageContent } from '@/features/surveys/components/pages/SurveyBuilderPageContent';

export default function AgencySurveyBuilderPage() {
  const params = useParams();
  const surveyId = params.id as string;

  return <SurveyBuilderPageContent basePath="/agency/surveys" surveyId={surveyId} />;
}
