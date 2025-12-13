/**
 * Rank Group Detail Page
 *
 * Shows keywords and ranking positions for a specific rank tracking group.
 * Allows running checks, adding/removing keywords, and managing schedules.
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageCard from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import {
  useRankGroups,
  useGroupKeywords,
  useRankHistory,
  RankKeywordsTable,
  AddKeywordsModal,
  ScheduleSettings,
} from '@/features/rank-tracking';
import { useKeywordDetails } from '@/features/keywords/hooks/useKeywords';
import { ArrowLeftIcon, PlusIcon, PlayIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

export default function RankGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const { groups } = useRankGroups();
  const {
    keywords,
    isLoading: keywordsLoading,
    refresh: refreshKeywords,
    addKeywords,
    removeKeywords,
  } = useGroupKeywords(groupId);
  const { results, isLoading: resultsLoading, runCheck, isRunning } = useRankHistory(groupId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  // Toast notifications
  const { toasts, closeToast, error: showError, success: showSuccess } = useToast();

  // Fetch keyword details when one is selected
  const { keyword: keywordDetails, isLoading: detailsLoading } = useKeywordDetails(selectedKeywordId);

  const group = groups.find((g) => g.id === groupId);

  // Calculate summary stats from keywords
  const stats = useMemo(() => {
    const total = keywords.length;
    const positions = keywords
      .map((k) => k.latestPosition)
      .filter((p): p is number => p !== null && p !== undefined);

    const avgPosition =
      positions.length > 0
        ? Math.round((positions.reduce((sum, p) => sum + p, 0) / positions.length) * 10) / 10
        : null;

    const inTop10 = keywords.filter(
      (k) => k.latestPosition !== null && k.latestPosition !== undefined && k.latestPosition <= 10
    ).length;

    return {
      total,
      avgPosition,
      inTop10,
    };
  }, [keywords]);

  const handleRunCheck = async () => {
    const result = await runCheck();
    if (result.success) {
      refreshKeywords();
      showSuccess(`Rank check complete! ${keywords.length} keyword${keywords.length !== 1 ? 's' : ''} checked.`);
    } else if (result.error) {
      // Show user-friendly error message
      if (result.error.includes('No target website found')) {
        showError('Please add your website URL in Business Profile settings before running rank checks.', 8000);
      } else if (result.error.includes('Insufficient credits')) {
        showError('Not enough credits for this rank check. Please add more credits.', 6000);
      } else {
        showError(result.error, 5000);
      }
    }
  };

  const handleAddKeywords = async (keywordIds: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await addKeywords(keywordIds);
      if (result.success) {
        setShowAddModal(false);
      }
      return result;
    } catch (err) {
      console.error('Failed to add keywords:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add keywords' };
    }
  };

  if (!group) {
    return (
      <PageCard>
        <div className="text-center py-12">
          <p className="text-gray-500">Group not found</p>
          <button
            onClick={() => router.push('/dashboard/rank-tracking')}
            className="mt-4 text-slate-blue hover:underline"
          >
            Back to Rank Tracking
          </button>
        </div>
      </PageCard>
    );
  }

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <PageCard>
        {/* Back Button + Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/rank-tracking')}
            className="flex items-center gap-2 text-gray-600 hover:text-slate-blue mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Rank Tracking
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rank Tracking Group</p>
              <h1 className="text-3xl font-bold text-slate-blue mb-1">{group.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{group.device === 'desktop' ? '💻 Desktop' : '📱 Mobile'}</span>
                <span>📍 {group.locationName}</span>
                {group.scheduleFrequency && (
                  <span className="capitalize">🔄 {group.scheduleFrequency}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowScheduleSettings(true)}>
                <Cog6ToothIcon className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)}>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Keywords
              </Button>
              <Button
                size="sm"
                onClick={handleRunCheck}
                disabled={isRunning || keywords.length === 0}
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                {isRunning ? 'Checking...' : `Run Check (${keywords.length} credits)`}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Keywords" value={stats.total} />
          <StatCard label="Avg Position" value={stats.avgPosition} />
          <StatCard label="In Top 10" value={stats.inTop10} />
          <StatCard
            label="Last Checked"
            value={group.lastCheckedAt ? formatDate(group.lastCheckedAt) : 'Never'}
          />
        </div>

        {/* Keywords Table */}
        <RankKeywordsTable
          keywords={keywords}
          isLoading={keywordsLoading}
          onRemove={removeKeywords}
          onKeywordClick={(keywordId) => setSelectedKeywordId(keywordId)}
        />
      </PageCard>

      {/* Keyword Details Slide-over */}
      <Transition.Root show={!!selectedKeywordId} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedKeywordId(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-white/80 backdrop-blur-xl shadow-2xl">
                      {/* Header */}
                      <div className="px-6 py-6 border-b border-gray-100/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Keyword Concept</span>
                            {keywordDetails && (
                              <Dialog.Title className="text-xl font-bold text-gray-900 mt-1">
                                {keywordDetails.phrase}
                              </Dialog.Title>
                            )}
                          </div>
                          <button
                            type="button"
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
                            onClick={() => setSelectedKeywordId(null)}
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 px-6 py-6">
                        {detailsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-blue" />
                          </div>
                        ) : keywordDetails ? (
                          <div className="space-y-4">
                            {/* Suggested Phrase */}
                            {keywordDetails.reviewPhrase && (
                              <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-sm border border-indigo-100/50 rounded-xl">
                                <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">Suggested Phrase</span>
                                <p className="text-sm text-gray-700 mt-2 italic leading-relaxed">
                                  "{keywordDetails.reviewPhrase}"
                                </p>
                                <p className="mt-2 text-xs text-gray-500">Shown to customers on prompt pages</p>
                              </div>
                            )}

                            {/* Search Query */}
                            {keywordDetails.searchQuery && (
                              <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Search Query</span>
                                <p className="mt-2 text-sm text-gray-900">{keywordDetails.searchQuery}</p>
                                <p className="mt-1 text-xs text-gray-500">Used for rank tracking</p>
                              </div>
                            )}

                            {/* Aliases */}
                            {keywordDetails.aliases && keywordDetails.aliases.length > 0 && (
                              <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Aliases</span>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {keywordDetails.aliases.map((alias, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 bg-indigo-50/80 border border-indigo-100/50 text-indigo-700 text-sm rounded"
                                    >
                                      {alias}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Location Scope */}
                            {keywordDetails.locationScope && (
                              <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Location Scope</span>
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50/80 border border-blue-100/50 text-blue-700 text-sm rounded capitalize">
                                    {keywordDetails.locationScope}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Related Questions */}
                            {keywordDetails.relatedQuestions && keywordDetails.relatedQuestions.length > 0 && (
                              <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Related Questions</span>
                                <ul className="mt-2 space-y-2">
                                  {keywordDetails.relatedQuestions.map((q, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-gray-700 bg-purple-50/80 rounded-lg px-3 py-2"
                                    >
                                      {q}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-2 text-xs text-gray-500">For PAA/LLM tracking</p>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
                              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Usage Stats</span>
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-white/80 rounded-lg p-3">
                                  <div className="text-xs text-gray-500">Review Matches</div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {keywordDetails.reviewUsageCount || 0}
                                  </div>
                                </div>
                                <div className="bg-white/80 rounded-lg p-3">
                                  <div className="text-xs text-gray-500">Status</div>
                                  <div className={`text-lg font-semibold capitalize ${keywordDetails.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                                    {keywordDetails.status || 'active'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            Keyword not found
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modals */}
      <AddKeywordsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        groupId={groupId}
        locationCode={group.locationCode}
        onAdd={handleAddKeywords}
        onSuccess={() => {
          refreshKeywords();
          setShowAddModal(false);
        }}
      />

      <ScheduleSettings
        isOpen={showScheduleSettings}
        onClose={() => setShowScheduleSettings(false)}
        groupId={groupId}
        currentSchedule={{
          frequency: group.scheduleFrequency,
          hour: group.scheduleHour,
          dayOfWeek: group.scheduleDayOfWeek,
          dayOfMonth: group.scheduleDayOfMonth,
        }}
      />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-slate-blue">{value ?? '—'}</div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
