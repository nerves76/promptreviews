'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageCard from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import { Modal } from '@/app/(app)/components/ui/modal';
import Icon from '@/components/Icon';
import { useSurvey } from '@/features/surveys/hooks/useSurvey';
import { SurveyBuilder } from '@/features/surveys/components/SurveyBuilder';
import { SurveyStatusBadge } from '@/features/surveys/components/SurveyStatusBadge';
import { SurveyDistribution } from '@/features/surveys/components/SurveyDistribution';
import { useResponseQuota } from '@/features/surveys/hooks/useResponseQuota';
import { apiClient } from '@/utils/apiClient';
import { SurveyStatus } from '@/features/surveys/types';
import QRCodeModal from '@/app/(app)/components/QRCodeModal';

export default function SurveyBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const { survey, loading, error, refetch, updateSurvey } = useSurvey(surveyId);
  const { quota } = useResponseQuota(surveyId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Survey settings
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [collectRespondentInfo, setCollectRespondentInfo] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your response!');

  // Sync state from fetched survey
  useEffect(() => {
    if (survey) {
      setTitle(survey.title);
      setDescription(survey.description || '');
      setQuestions((survey as any).survey_questions || []);
      setShowProgressBar(survey.show_progress_bar);
      setCollectRespondentInfo(survey.collect_respondent_info);
      setRequireEmail(survey.require_respondent_email);
      setThankYouMessage(survey.thank_you_message || 'Thank you for your response!');
    }
  }, [survey]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateSurvey({
        title,
        description: description || undefined,
        questions,
        show_progress_bar: showProgressBar,
        collect_respondent_info: collectRespondentInfo,
        require_respondent_email: requireEmail,
        thank_you_message: thankYouMessage,
      } as any);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [title, description, questions, showProgressBar, collectRespondentInfo, requireEmail, thankYouMessage, updateSurvey]);

  const handleStatusChange = async (status: SurveyStatus) => {
    try {
      await apiClient.patch(`/surveys/${surveyId}/status`, { status });
      await refetch();
      if (status === 'active') {
        setShowPublishModal(true);
      }
    } catch {
      // Error handled silently
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const surveyUrl = survey?.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${survey.slug}`
    : '';

  if (loading) {
    return (
      <PageCard>
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading survey...</p>
        </div>
      </PageCard>
    );
  }

  if (error || !survey) {
    return (
      <PageCard>
        <div className="text-center py-12 text-red-600">
          <p>Survey not found</p>
          <Button variant="secondary" onClick={() => router.push('/dashboard/surveys')} className="mt-4">
            Back to surveys
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard icon={<Icon name="FaFileAlt" size={24} className="text-slate-blue" />}>
      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-wrap justify-end mt-4 mb-4">
        <SurveyStatusBadge status={survey.status} />

        {quota && (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {quota.total_remaining} responses remaining
          </span>
        )}

        {survey.status === 'draft' && (
          <Button size="sm" onClick={() => handleStatusChange('active')}>
            Publish
          </Button>
        )}
        {survey.status === 'active' && (
          <Button size="sm" variant="secondary" onClick={() => handleStatusChange('paused')}>
            Pause
          </Button>
        )}
        {survey.status === 'paused' && (
          <Button size="sm" onClick={() => handleStatusChange('active')}>
            Resume
          </Button>
        )}

        {survey.slug && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
            aria-label="Preview survey"
          >
            <Icon name="FaEye" size={14} className="mr-1" />
            Preview
          </Button>
        )}

        <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/surveys/${surveyId}/responses`)}>
          <Icon name="FaChartLine" size={14} className="mr-1" />
          Responses
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saveMessage || 'Save'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main builder area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & description */}
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-0 border-b-2 border-transparent focus:border-slate-blue focus:ring-0 px-0 py-1 bg-transparent"
              placeholder="Survey title"
              aria-label="Survey title"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-gray-600 text-sm border-0 border-b border-transparent focus:border-gray-300 focus:ring-0 px-0 py-1 bg-transparent truncate"
              placeholder="Add a description (optional)"
              aria-label="Survey description"
            />
          </div>

          {/* Questions */}
          <div className="pl-10">
            <SurveyBuilder questions={questions} onChange={setQuestions} />
          </div>
        </div>

        {/* Settings sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Settings</h3>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showProgressBar}
                onChange={(e) => setShowProgressBar(e.target.checked)}
                className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              />
              <span className="text-gray-700">Show progress bar</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={collectRespondentInfo}
                onChange={(e) => setCollectRespondentInfo(e.target.checked)}
                className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
              />
              <span className="text-gray-700">Collect respondent info</span>
            </label>

            {collectRespondentInfo && (
              <label className="flex items-center gap-2 text-sm ml-6">
                <input
                  type="checkbox"
                  checked={requireEmail}
                  onChange={(e) => setRequireEmail(e.target.checked)}
                  className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                />
                <span className="text-gray-700">Require email</span>
              </label>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thank you message</label>
              <input
                type="text"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Distribution */}
          {survey.slug && (
            <div className="border border-gray-200 rounded-lg p-4">
              <SurveyDistribution
                slug={survey.slug}
                title={survey.title}
                onOpenQR={() => setShowQR(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && survey.slug && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          url={surveyUrl}
          clientName={survey.title}
        />
      )}

      {/* Publish success modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Survey published!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Your survey is now live. Share it with your audience using the options below.
          </p>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
              {surveyUrl}
            </div>
            <Button size="sm" variant="secondary" onClick={handleCopyLink} className="whitespace-nowrap">
              <Icon name="FaCopy" size={14} className="mr-1" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowPublishModal(false);
                setShowQR(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-blue/10 flex items-center justify-center flex-shrink-0">
                <Icon name="FaImage" size={14} className="text-slate-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Generate QR code</p>
                <p className="text-xs text-gray-500">Download a QR code for print materials</p>
              </div>
            </button>

            <button
              onClick={() => {
                window.open(`/s/${survey.slug}`, '_blank');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-blue/10 flex items-center justify-center flex-shrink-0">
                <Icon name="FaEye" size={14} className="text-slate-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Preview survey</p>
                <p className="text-xs text-gray-500">Open the live survey in a new tab</p>
              </div>
            </button>

            <button
              onClick={() => {
                setShowPublishModal(false);
                router.push(`/dashboard/surveys/${surveyId}/responses`);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-blue/10 flex items-center justify-center flex-shrink-0">
                <Icon name="FaChartLine" size={14} className="text-slate-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View responses</p>
                <p className="text-xs text-gray-500">Monitor incoming survey responses</p>
              </div>
            </button>
          </div>
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPublishModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>
    </PageCard>
  );
}
