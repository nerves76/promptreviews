'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { useSurvey } from '@/features/surveys/hooks/useSurvey';
import { useSurveyResponses, useSurveyResponseSummary } from '@/features/surveys/hooks/useSurveyResponses';
import { useResponseQuota } from '@/features/surveys/hooks/useResponseQuota';
import { ResponsesTable } from '@/features/surveys/components/ResponsesTable';
import { ResponsesSummary } from '@/features/surveys/components/ResponsesSummary';
import { ResponsePackSelector } from '@/features/surveys/components/ResponsePackSelector';
import { apiClient } from '@/utils/apiClient';

export default function SurveyResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const { survey, loading: surveyLoading } = useSurvey(surveyId);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { responses, total, loading: responsesLoading } = useSurveyResponses(surveyId, page, pageSize);
  const { summary, loading: summaryLoading } = useSurveyResponseSummary(surveyId);
  const { quota, refetch: refetchQuota } = useResponseQuota(surveyId);
  const [showPackSelector, setShowPackSelector] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.download(`/surveys/${surveyId}/responses/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_responses.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled silently
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const questions = survey ? ((survey as any).survey_questions || []).sort((a: any, b: any) => a.position - b.position) : [];

  if (surveyLoading) {
    return (
      <PageCard>
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard icon={<Icon name="FaChartLine" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title={`Responses: ${survey?.title || 'Survey'}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {quota && (
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {quota.total_remaining} remaining ({quota.total_used} used)
              </span>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowPackSelector(true)} className="whitespace-nowrap">
              Buy more responses
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleExport}
              disabled={exporting || total === 0}
              className="whitespace-nowrap"
            >
              <Icon name="FaSave" size={14} className="mr-1" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/surveys/${surveyId}`)}>
              <Icon name="FaArrowLeft" size={14} className="mr-1" />
              Back to builder
            </Button>
          </div>
        }
      />

      {/* Summary */}
      {!summaryLoading && summary && (
        <div className="mb-6">
          <ResponsesSummary summary={summary} />
        </div>
      )}

      {/* Responses table */}
      {responsesLoading ? (
        <div className="text-center py-8 text-gray-500">
          <Icon name="FaSpinner" size={16} className="animate-spin mx-auto mb-2" />
          <p>Loading responses...</p>
        </div>
      ) : (
        <>
          <ResponsesTable responses={responses} questions={questions} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pack selector modal */}
      <ResponsePackSelector
        isOpen={showPackSelector}
        onClose={() => setShowPackSelector(false)}
        surveyId={surveyId}
        onPurchased={refetchQuota}
      />
    </PageCard>
  );
}
