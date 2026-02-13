'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@headlessui/react';
import PageCard from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import { Button } from '@/app/(app)/components/ui/button';
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
  const [collectName, setCollectName] = useState(false);
  const [requireName, setRequireName] = useState(false);
  const [collectEmail, setCollectEmail] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [collectPhone, setCollectPhone] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [collectBusinessName, setCollectBusinessName] = useState(false);
  const [requireBusinessName, setRequireBusinessName] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState('Thank you for your response!');

  // Sync state from fetched survey
  useEffect(() => {
    if (survey) {
      setTitle(survey.title);
      setDescription(survey.description || '');
      setQuestions((survey as any).survey_questions || []);
      setShowProgressBar(survey.show_progress_bar);
      setCollectName(survey.collect_name);
      setRequireName(survey.require_name);
      setCollectEmail(survey.collect_email);
      setRequireEmail(survey.require_email);
      setCollectPhone(survey.collect_phone);
      setRequirePhone(survey.require_phone);
      setCollectBusinessName(survey.collect_business_name);
      setRequireBusinessName(survey.require_business_name);
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
        collect_name: collectName,
        require_name: requireName,
        collect_email: collectEmail,
        require_email: requireEmail,
        collect_phone: collectPhone,
        require_phone: requirePhone,
        collect_business_name: collectBusinessName,
        require_business_name: requireBusinessName,
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
  }, [title, description, questions, showProgressBar, collectName, requireName, collectEmail, requireEmail, collectPhone, requirePhone, collectBusinessName, requireBusinessName, thankYouMessage, updateSurvey, survey, router, basePath]);

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
      {/* Page title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Surveys</h1>
        </div>
      </div>

      <SubNav
        items={[
          { label: 'Builder', icon: 'FaFileAlt', href: `${basePath}/${surveyId}`, matchType: 'exact' },
          { label: 'Responses', icon: 'FaChartLine', href: `${basePath}/${surveyId}/responses`, matchType: 'startsWith' },
        ]}
      />

      <PageCard icon={<Icon name="FaFileAlt" size={24} className="text-slate-blue" />} topMargin="mt-16">
      {/* Header: title + actions — matches PageCardHeader convention */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-4">
        <div className="flex flex-col flex-1 min-w-0 sm:min-w-[200px] md:min-w-[280px]">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (saveMessage === 'Please add a survey title') setSaveMessage(null); }}
            className={`w-full text-2xl font-bold text-slate-blue rounded-lg px-3 py-2 mt-4 mb-2 border bg-white hover:border-gray-300 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 transition-colors ${
              saveMessage === 'Please add a survey title' ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="Survey title"
            aria-label="Survey title"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-gray-600 text-base rounded-lg px-3 py-2 border border-gray-200 bg-white hover:border-gray-300 focus:border-slate-blue focus:ring-2 focus:ring-slate-blue/20 transition-colors"
            placeholder="Add a description (optional)"
            aria-label="Survey description"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          <SurveyStatusBadge status={survey.status} />

          {quota && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {quota.account_remaining.toLocaleString()} responses remaining
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

            {/* Respondent fields */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Respondent fields</h4>

              {/* Name */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collectName}
                  onChange={(e) => {
                    setCollectName(e.target.checked);
                    if (!e.target.checked) setRequireName(false);
                  }}
                  className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                />
                <span className="text-gray-700">Name</span>
              </label>
              {collectName && (
                <label className="flex items-center gap-2 text-sm ml-6">
                  <input
                    type="checkbox"
                    checked={requireName}
                    onChange={(e) => setRequireName(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-gray-500">Required</span>
                </label>
              )}

              {/* Email */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collectEmail}
                  onChange={(e) => {
                    setCollectEmail(e.target.checked);
                    if (!e.target.checked) setRequireEmail(false);
                  }}
                  className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                />
                <span className="text-gray-700">Email</span>
              </label>
              {collectEmail && (
                <label className="flex items-center gap-2 text-sm ml-6">
                  <input
                    type="checkbox"
                    checked={requireEmail}
                    onChange={(e) => setRequireEmail(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-gray-500">Required</span>
                </label>
              )}

              {/* Phone */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collectPhone}
                  onChange={(e) => {
                    setCollectPhone(e.target.checked);
                    if (!e.target.checked) setRequirePhone(false);
                  }}
                  className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                />
                <span className="text-gray-700">Phone</span>
              </label>
              {collectPhone && (
                <label className="flex items-center gap-2 text-sm ml-6">
                  <input
                    type="checkbox"
                    checked={requirePhone}
                    onChange={(e) => setRequirePhone(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-gray-500">Required</span>
                </label>
              )}

              {/* Business name */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={collectBusinessName}
                  onChange={(e) => {
                    setCollectBusinessName(e.target.checked);
                    if (!e.target.checked) setRequireBusinessName(false);
                  }}
                  className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                />
                <span className="text-gray-700">Business name</span>
              </label>
              {collectBusinessName && (
                <label className="flex items-center gap-2 text-sm ml-6">
                  <input
                    type="checkbox"
                    checked={requireBusinessName}
                    onChange={(e) => setRequireBusinessName(e.target.checked)}
                    className="rounded border-gray-300 text-slate-blue focus:ring-slate-blue"
                  />
                  <span className="text-gray-500">Required</span>
                </label>
              )}
            </div>

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

      {/* Publish success modal — matches Prompt Page style */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-50 border border-white/30">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-white/80 hover:text-white focus:outline-none"
                aria-label="Close modal"
              >
                <Icon name="FaTimes" size={18} />
              </button>
            </div>

            <div className="px-6 pb-6">
              <div className="text-center mb-6">
                <div className="mb-3 flex justify-center">
                  <img
                    src="/images/prompty-success.png"
                    alt="Prompty celebrating"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Survey published! 🎉
                </h3>
                <p className="text-sm text-white/90">
                  Your survey is now live. Share it with your audience.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-between p-3 bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-sm rounded-lg border border-emerald-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Get link</span>
                  <span className="text-white text-sm font-medium">
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowPublishModal(false);
                    setShowQR(true);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-blue-500/30 hover:bg-blue-500/50 backdrop-blur-sm rounded-lg border border-blue-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Generate QR code</span>
                  <span className="text-white text-sm font-medium">Create</span>
                </button>

                <a
                  href={`/s/${survey.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3 bg-amber-500/30 hover:bg-amber-500/50 backdrop-blur-sm rounded-lg border border-amber-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">View survey</span>
                  <span className="text-white text-sm font-medium">Open</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageCard>
    </>
  );
}
