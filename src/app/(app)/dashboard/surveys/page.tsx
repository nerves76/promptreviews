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
import { Modal } from '@/app/(app)/components/ui/modal';
import QRCodeModal from '@/app/(app)/components/QRCodeModal';

const STATUS_TABS: { value: SurveyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

export default function SurveysPage() {
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
      router.push(`/dashboard/surveys/${data.id}`);
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
          <Button onClick={() => router.push('/dashboard/surveys/create')} className="whitespace-nowrap">
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
          <Button onClick={() => router.push('/dashboard/surveys/create')}>
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
                      onClick={() => router.push(`/dashboard/surveys/${survey.id}`)}
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
                        onClick={() => router.push(`/dashboard/surveys/${survey.id}`)}
                        className="p-2 text-gray-400 hover:text-slate-blue transition-colors"
                        aria-label="Edit survey"
                        title="Edit"
                      >
                        <Icon name="FaEdit" size={14} />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/surveys/${survey.id}/responses`)}
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
      {/* Post-save success modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Survey saved!"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Your survey has been saved. Share it with your audience using the options below.
          </p>

          {saveModalData?.url && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 truncate">
                  {saveModalData.url}
                </div>
                <Button size="sm" variant="secondary" onClick={handleCopySaveLink} className="whitespace-nowrap">
                  <Icon name="FaCopy" size={14} className="mr-1" />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
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
                  onClick={() => window.open(`/s/${saveModalData.slug}`, '_blank')}
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
              </div>
            </>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

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
