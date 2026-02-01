'use client';

import React, { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import Icon from '@/components/Icon';

export interface ScheduledRunInfo {
  runId: string;
  groupId: string | null;
  groupName: string | null;
  scheduledFor: string;
  estimatedCredits: number;
  /** For rank tracking group-specific runs: keyword IDs affected by this run */
  keywordIds?: string[] | null;
}

interface ScheduledRunIndicatorProps {
  run: ScheduledRunInfo;
  onCancel: (runId: string) => Promise<void>;
  type: 'llm' | 'rank';
}

function formatScheduledDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatFullDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ScheduledRunIndicator({ run, onCancel, type }: ScheduledRunIndicatorProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async (close: () => void) => {
    setCancelling(true);
    try {
      await onCancel(run.runId);
      close();
    } catch {
      // Error handling is done by the parent
    } finally {
      setCancelling(false);
    }
  };

  const scopeLabel = !run.groupId
    ? 'All groups'
    : (run.groupName || 'Unknown group');

  return (
    <Popover className="relative inline-block">
      <PopoverButton className="flex items-center gap-1 text-[10px] text-slate-blue hover:text-slate-blue/80 transition-colors cursor-pointer focus:outline-none">
        <Icon name="FaClock" className="w-2.5 h-2.5" />
        <span>{formatScheduledDate(run.scheduledFor)}</span>
      </PopoverButton>

      <PopoverPanel
        anchor="bottom"
        className="z-50 w-64 rounded-lg bg-white shadow-lg ring-1 ring-black/10 p-3 text-left [--anchor-gap:4px]"
      >
        {({ close }) => (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
              <Icon name="FaClock" className="w-3.5 h-3.5 text-slate-blue" />
              Scheduled {type === 'llm' ? 'LLM check' : 'rank check'}
            </div>

            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <span className="text-gray-500">When:</span>{' '}
                {formatFullDate(run.scheduledFor)}
              </div>
              <div>
                <span className="text-gray-500">Scope:</span>{' '}
                {scopeLabel}
              </div>
              <div>
                <span className="text-gray-500">Credits reserved:</span>{' '}
                {run.estimatedCredits}
              </div>
            </div>

            <button
              onClick={() => handleCancel(close)}
              disabled={cancelling}
              className="w-full mt-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {cancelling ? 'Cancelling...' : 'Cancel scheduled run'}
            </button>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
