/**
 * Rank Group Detail Page
 *
 * Shows keywords and ranking positions for a specific rank tracking group.
 * Allows running checks, adding/removing keywords, and managing schedules.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeftIcon, PlusIcon, PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

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
      <PageCard>
        {/* Back Button + Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/rank-tracking')}
            className="flex items-center gap-2 text-gray-600 hover:text-slate-blue mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Groups
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
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
        />
      </PageCard>

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
