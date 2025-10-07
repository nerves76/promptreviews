/**
 * CommunityHeader Component
 *
 * Page header with guidelines link and account context
 */

'use client';

import { Button } from '@/app/(app)/components/ui/button';

interface CommunityHeaderProps {
  accountName: string;
  displayName?: string;
  onGuidelinesClick: () => void;
  onEditDisplayName?: () => void;
}

export function CommunityHeader({ accountName, displayName, onGuidelinesClick, onEditDisplayName }: CommunityHeaderProps) {
  return (
    <div className="bg-white/8 backdrop-blur-[10px] px-6 py-4 mt-[25px]">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <span className="text-white/50">·</span>
        <div className="flex items-center gap-2">
          <span className="text-white/70">{displayName || accountName}</span>
          {onEditDisplayName && (
            <button
              onClick={onEditDisplayName}
              className="text-white/50 hover:text-white/90 transition-colors"
              aria-label="Edit display name"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
