/**
 * Rank Tracking Main Page
 *
 * Lists all rank tracking groups (keyword groups).
 * Allows creating new groups and navigating to group details.
 */

'use client';

import { useState } from 'react';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useRankGroups } from '@/features/rank-tracking/hooks';
import { RankGroupCard, CreateGroupModal } from '@/features/rank-tracking/components';
import { PlusIcon } from '@heroicons/react/24/outline';

// ============================================
// Component
// ============================================

export default function RankTrackingPage() {
  const { groups, isLoading, refresh, createGroup } = useRankGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <PageCard>
        {/* Header with floating icon */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2 relative">
          <div className="absolute z-10" style={{ left: "-69px", top: "-37px" }}>
            <div className="rounded-full bg-white w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg">
              <Icon name="FaChartLine" className="w-6 h-6 sm:w-7 sm:h-7 text-slate-blue" size={28} />
            </div>
          </div>

          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Rank Tracking
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-4">
              Track your Google organic rankings by keyword, location, and device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90"
            >
              <PlusIcon className="w-5 h-5" />
              New Group
            </button>
          </div>
        </div>

        {/* Groups Grid or Empty State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <RankGroupCard key={group.id} group={group} onRefresh={refresh} />
            ))}
          </div>
        )}
      </PageCard>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createGroup}
        onSuccess={() => {
          refresh();
          setShowCreateModal(false);
        }}
      />
    </>
  );
}

// ============================================
// Empty State
// ============================================

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-blue/10 rounded-full mb-4">
        <Icon name="FaChartLine" className="w-8 h-8 text-slate-blue" size={32} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Rank Tracking Groups Yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Create your first keyword group to start tracking your Google search rankings across different locations and devices.
      </p>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
      >
        <PlusIcon className="w-5 h-5" />
        Create Your First Group
      </button>

      {/* Feature highlights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Track Rankings</h4>
          <p className="text-sm text-gray-600">
            Monitor your position in Google search results for important keywords.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Location-Specific</h4>
          <p className="text-sm text-gray-600">
            Track rankings for different cities, states, or countries.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">Automated Checks</h4>
          <p className="text-sm text-gray-600">
            Schedule automatic ranking checks daily, weekly, or monthly.
          </p>
        </div>
      </div>
    </div>
  );
}
