'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import Icon from '@/components/Icon';
import { useSurveys } from '@/features/surveys/hooks/useSurveys';
import { SurveyStatusBadge } from '@/features/surveys/components/SurveyStatusBadge';
import { SurveyStatus } from '@/features/surveys/types';
import { apiClient } from '@/utils/apiClient';
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {surveys.map((survey) => (
                <tr key={survey.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`${basePath}/${survey.id}`)}
                      className="text-sm font-medium text-gray-900 hover:text-slate-blue transition-colors text-left"
                    >
                      {survey.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <SurveyStatusBadge status={survey.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {survey.response_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`${basePath}/${survey.id}`)}
                        className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                        aria-label="Edit survey"
                        title="Edit"
                      >
                        <Icon name="FaEdit" size={14} />
                      </button>
                      <button
                        onClick={() => router.push(`${basePath}/${survey.id}/responses`)}
                        className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                        aria-label="View responses"
                        title="Responses"
                      >
                        <Icon name="FaChartLine" size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(survey.id)}
                        className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                        aria-label="Duplicate survey"
                        title="Duplicate"
                      >
                        <Icon name="FaCopy" size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(survey.id)}
                        disabled={deleting === survey.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        aria-label="Delete survey"
                        title="Delete"
                      >
                        <Icon name="FaTrash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </PageCard>
  );
}
