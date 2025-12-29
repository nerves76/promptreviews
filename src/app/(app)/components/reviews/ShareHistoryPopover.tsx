/**
 * ShareHistoryPopover.tsx
 *
 * Displays share history for a review with delete functionality
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { SHARE_PLATFORMS, SharePlatform } from './utils/shareHandlers';

export interface ShareHistoryItem {
  id: string;
  platform: string;
  shared_at: string;
  shared_url?: string;
}

interface ShareHistoryPopoverProps {
  reviewId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (shareId: string) => Promise<void>;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function ShareHistoryPopover({
  reviewId,
  isOpen,
  onClose,
  onDelete,
  anchorRef,
}: ShareHistoryPopoverProps) {
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch share history
  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/review-shares?reviewId=${reviewId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch share history');
        }

        const data = await response.json();
        setShareHistory(data.shares || []);
      } catch (err) {
        console.error('Error fetching share history:', err);
        setError('Failed to load share history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, reviewId]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('Delete this share record?')) return;

    try {
      setDeletingId(shareId);
      await onDelete(shareId);
      setShareHistory((prev) => prev.filter((item) => item.id !== shareId));
    } catch (err) {
      console.error('Error deleting share:', err);
      setError('Failed to delete share record');
    } finally {
      setDeletingId(null);
    }
  };

  const getPlatformIcon = (platform: string): { icon: string; color: string } => {
    const config = SHARE_PLATFORMS.find(
      (p) => p.key.toLowerCase() === platform.toLowerCase()
    );
    return config
      ? { icon: config.icon, color: config.color }
      : { icon: 'FaShare', color: 'text-gray-600' };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
      role="dialog"
      aria-label="Share history"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Share History</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <Icon name="FaTimes" className="w-4 h-4" size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <Icon
              name="FaSpinner"
              className="w-6 h-6 text-gray-500 animate-spin mx-auto"
              size={24}
            />
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <Icon
              name="FaExclamationTriangle"
              className="w-6 h-6 text-red-500 mx-auto"
              size={24}
            />
            <p className="text-sm text-red-600 mt-2">{error}</p>
          </div>
        ) : shareHistory.length === 0 ? (
          <div className="p-8 text-center">
            <Icon
              name="FaShare"
              className="w-8 h-8 text-gray-300 mx-auto"
              size={32}
            />
            <p className="text-sm text-gray-500 mt-2">No shares yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Share this review to track it here
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shareHistory.map((share) => {
              const { icon, color } = getPlatformIcon(share.platform);
              return (
                <li
                  key={share.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      name={icon as any}
                      className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`}
                      size={20}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {share.platform}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(share.shared_at)}
                      </p>
                      {share.shared_url && (
                        <a
                          href={share.shared_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate block mt-1"
                        >
                          View share
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      disabled={deletingId === share.id}
                      className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      aria-label="Delete share record"
                      title="Delete share record"
                    >
                      {deletingId === share.id ? (
                        <Icon
                          name="FaSpinner"
                          className="w-4 h-4 animate-spin"
                          size={16}
                        />
                      ) : (
                        <Icon name="FaTrash" className="w-4 h-4" size={16} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {shareHistory.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {shareHistory.length} {shareHistory.length === 1 ? 'share' : 'shares'}
          </p>
        </div>
      )}
    </div>
  );
}
