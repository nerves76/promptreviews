'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { useSurveys } from '@/features/surveys/hooks/useSurveys';
import { SurveyStatus, SURVEY_STATUS_LABELS, SURVEY_STATUS_COLORS } from '@/features/surveys/types';
import { apiClient } from '@/utils/apiClient';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import QRCodeModal from '@/app/(app)/components/QRCodeModal';

const STATUS_TABS: { value: SurveyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Enabled' },
  { value: 'paused', label: 'Disabled' },
];

interface SurveyListPageContentProps {
  basePath: string;
}

export function SurveyListPageContent({ basePath }: SurveyListPageContentProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<SurveyStatus | 'all'>('all');
  const { surveys, loading, error, refetch } = useSurveys(statusFilter);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalData, setSaveModalData] = useState<{ title: string; url: string; slug: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copyLinkId, setCopyLinkId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ open: boolean; url: string; clientName: string } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const { toasts, closeToast, success, error: showError } = useToast();

  // Check for post-save modal flag
  useEffect(() => {
    const flag = localStorage.getItem('showSurveySaveModal');
    if (flag) {
      try {
        const data = JSON.parse(flag);
        setSaveModalData(data);
        setShowSaveModal(true);
      } catch {
        // Invalid JSON, ignore
      }
      localStorage.removeItem('showSurveySaveModal');
    }
  }, []);

  const handleCopySaveLink = () => {
    if (saveModalData?.url) {
      navigator.clipboard.writeText(saveModalData.url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this survey? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiClient.delete(`/surveys/${id}`);
      refetch();
    } catch {
      // Error handled silently
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (surveyId: string, newStatus: SurveyStatus) => {
    setUpdatingStatusId(surveyId);
    try {
      await apiClient.patch(`/surveys/${surveyId}/status`, { status: newStatus });
      await refetch();
      success(`Survey ${SURVEY_STATUS_LABELS[newStatus].toLowerCase()}`);
    } catch {
      showError('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const data = await apiClient.post<any>(`/surveys/${id}/duplicate`);
      router.push(`${basePath}/${data.id}`);
    } catch {
      // Error handled silently
    }
  };

  return (
    <PageCard icon={<Icon name="FaFileAlt" size={24} className="text-slate-blue" />}>
      <PageCardHeader
        title="Surveys"
        description="Create and manage surveys to collect feedback from customers"
        actions={
          <Button onClick={() => router.push(`${basePath}/create`)} className="whitespace-nowrap">
            <Icon name="FaPlus" size={14} className="mr-2" />
            Create survey
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-blue text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Survey list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaSpinner" size={20} className="animate-spin mx-auto mb-2" />
          <p>Loading surveys...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaFileAlt" size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="mb-4">No surveys yet</p>
          <Button onClick={() => router.push(`${basePath}/create`)}>
            Create your first survey
          </Button>
        </div>
      ) : (
        <>
        <p className="text-xs text-gray-500 mb-2 sm:hidden">← Scroll horizontally to see more →</p>
        <div className="overflow-x-auto shadow sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Responses</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Edit</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-sm font-semibold text-gray-900">Share</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.map((survey, index) => (
                <tr key={survey.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    <button
                      onClick={() => router.push(`${basePath}/${survey.id}`)}
                      className="font-medium text-gray-900 hover:text-slate-blue transition-colors text-left"
                    >
                      {survey.title}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <select
                      value={survey.status}
                      onChange={(e) => handleStatusChange(survey.id, e.target.value as SurveyStatus)}
                      disabled={updatingStatusId === survey.id}
                      aria-label={`Change status for ${survey.title}`}
                      className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 cursor-pointer focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 ${SURVEY_STATUS_COLORS[survey.status]} ${updatingStatusId === survey.id ? 'opacity-50' : ''}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Enabled</option>
                      <option value="paused">Disabled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                    {survey.response_count ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="flex gap-2 items-center">
                      {survey.slug && (
                        <a
                          href={`/s/${survey.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-blue underline hover:text-slate-blue/80"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`${basePath}/${survey.id}`)}
                        className="text-slate-blue underline hover:text-slate-blue/80"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-end">
                      {survey.slug && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-3 py-2 min-h-[44px] min-w-[44px] bg-purple-500/20 backdrop-blur-sm text-purple-800 rounded hover:bg-purple-500/30 text-sm font-medium shadow border border-white/30 whitespace-nowrap"
                          title={copyLinkId === survey.id ? 'Copied!' : 'Copy link'}
                          aria-label="Copy link"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(`${window.location.origin}/s/${survey.slug}`);
                              setCopyLinkId(survey.id);
                              setTimeout(() => setCopyLinkId(null), 2000);
                            } catch {
                              // Fallback silently
                            }
                          }}
                        >
                          <Icon name={copyLinkId === survey.id ? 'FaCheck' : 'FaLink'} className="w-4 h-4" size={16} />
                        </button>
                      )}
                      {survey.slug && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrModal({
                              open: true,
                              url: `${window.location.origin}/s/${survey.slug}`,
                              clientName: survey.title,
                            });
                          }}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 min-h-[44px] bg-amber-500/20 backdrop-blur-sm text-amber-800 rounded hover:bg-amber-500/30 text-sm font-medium shadow border border-white/30 whitespace-nowrap"
                        >
                          <Icon name="FaImage" size={16} style={{ color: '#b45309' }} />
                          QR code
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      {/* Post-save success modal — matches Prompt Page style */}
      {showSaveModal && saveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl max-w-md w-full mx-4 relative z-50 border border-white/30">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowSaveModal(false)}
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
                  Survey saved! 🎉
                </h3>
                <p className="text-sm text-white/90">
                  Share it with your audience using the options below.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopySaveLink}
                  className="w-full flex items-center justify-between p-3 bg-emerald-500/30 hover:bg-emerald-500/50 backdrop-blur-sm rounded-lg border border-emerald-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Get link</span>
                  <span className="text-white text-sm font-medium">
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setShowQR(true);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-blue-500/30 hover:bg-blue-500/50 backdrop-blur-sm rounded-lg border border-blue-300/30 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">Generate QR code</span>
                  <span className="text-white text-sm font-medium">Create</span>
                </button>

                {saveModalData.url && (
                  <a
                    href={`/s/${saveModalData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 bg-amber-500/30 hover:bg-amber-500/50 backdrop-blur-sm rounded-lg border border-amber-300/30 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-white">View survey</span>
                    <span className="text-white text-sm font-medium">Open</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal from save */}
      {showQR && saveModalData?.url && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          url={saveModalData.url}
          clientName={saveModalData.title}
        />
      )}

      {/* QR Code Modal from table row */}
      <QRCodeModal
        isOpen={qrModal?.open || false}
        onClose={() => setQrModal(null)}
        url={qrModal?.url || ''}
        clientName={qrModal?.clientName || ''}
      />

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </PageCard>
  );
}
