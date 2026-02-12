'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import PageCard from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import { Button } from '@/app/(app)/components/ui/button';
import GlassSuccessModal from '@/app/(app)/components/GlassSuccessModal';
import Icon from '@/components/Icon';
import { useSurvey } from '@/features/surveys/hooks/useSurvey';
import { SurveyBuilder } from '@/features/surveys/components/SurveyBuilder';
import { SurveyStatusBadge } from '@/features/surveys/components/SurveyStatusBadge';
import { SurveyDistribution } from '@/features/surveys/components/SurveyDistribution';
import { useResponseQuota } from '@/features/surveys/hooks/useResponseQuota';
import { apiClient } from '@/utils/apiClient';
import { SurveyStatus } from '@/features/surveys/types';
import QRCodeModal from '@/app/(app)/components/QRCodeModal';

interface SurveyBuilderPageContentProps {
  basePath: string;
  surveyId: string;
}

export function SurveyBuilderPageContent({ basePath, surveyId }: SurveyBuilderPageContentProps) {
  const router = useRouter();

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
    if (!title.trim()) {
      setSaveMessage('Please add a survey title');
      return;
    }
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
      // Set localStorage flag so the surveys list page shows a success modal
      localStorage.setItem('showSurveySaveModal', JSON.stringify({
        title,
        url: survey?.slug ? `${window.location.origin}/s/${survey.slug}` : '',
        slug: survey?.slug || '',
      }));
      router.push(basePath);
    } catch {
      setSaveMessage('Failed to save');
      setSaving(false);
    }
  }, [title, description, questions, showProgressBar, collectRespondentInfo, requireEmail, thankYouMessage, updateSurvey, survey, router, basePath]);

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
          <Button variant="secondary" onClick={() => router.push(basePath)} className="mt-4">
            Back to surveys
          </Button>
        </div>
      </PageCard>
    );
  }

  return (
    <>
      <SubNav
        items={[
          { label: 'Builder', icon: 'FaFileAlt', href: `${basePath}/${surveyId}`, matchType: 'exact' },
          { label: 'Responses', icon: 'FaChartLine', href: `${basePath}/${surveyId}/responses`, matchType: 'startsWith' },
        ]}
      />

      <PageCard icon={<Icon name="FaFileAlt" size={24} className="text-slate-blue" />} topMargin="mt-16">
      {/* Header: title + actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mt-4 mb-6 w-full gap-4">
        <div className="flex flex-col flex-1 min-w-0 sm:min-w-[200px] md:min-w-[280px] space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (saveMessage === 'Please add a survey title') setSaveMessage(null); }}
            className={`w-full text-2xl font-bold text-slate-blue border-0 border-b-2 focus:border-slate-blue focus:ring-0 px-0 py-1 bg-transparent ${
              saveMessage === 'Please add a survey title' ? 'border-red-400' : 'border-transparent'
            }`}
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

        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
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
          {survey.status !== 'draft' && (
            <div className="flex items-center gap-2">
              <Switch
                checked={survey.status === 'active'}
                onChange={(checked) => handleStatusChange(checked ? 'active' : 'paused')}
                className={`${
                  survey.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2`}
              >
                <span className="sr-only">Enable survey</span>
                <span
                  className={`${
                    survey.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
              <span className="text-sm text-gray-600 whitespace-nowrap">Enabled</span>
            </div>
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

          {saveMessage && (
            <span className="text-xs text-red-500 whitespace-nowrap">{saveMessage}</span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main builder area */}
        <div className="lg:col-span-2 space-y-6">

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
      <GlassSuccessModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Survey published!"
        message="Your survey is now live. Share it with your audience."
        iconName="FaRocket"
        dismissOnBackdrop
        primaryAction={{
          label: copySuccess ? 'Copied!' : 'Copy link',
          onClick: handleCopyLink,
          iconName: 'FaCopy',
        }}
        secondaryAction={{
          label: 'Generate QR code',
          onClick: () => {
            setShowPublishModal(false);
            setShowQR(true);
          },
          iconName: 'FaImage',
        }}
      >
        <div className="mt-2 flex flex-col gap-2">
          <button
            onClick={() => window.open(`/s/${survey.slug}`, '_blank')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/20 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/30"
          >
            <Icon name="FaEye" className="h-4 w-4" size={16} />
            Preview survey
          </button>
          <button
            onClick={() => {
              setShowPublishModal(false);
              router.push(`${basePath}/${surveyId}/responses`);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/20 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/30"
          >
            <Icon name="FaChartLine" className="h-4 w-4" size={16} />
            View responses
          </button>
        </div>
      </GlassSuccessModal>
    </PageCard>
    </>
  );
}
