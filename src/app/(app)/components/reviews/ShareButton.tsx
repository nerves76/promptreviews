/**
 * ShareButton.tsx
 *
 * Button component for sharing reviews with history tracking
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/Icon';
import ShareModal, { Review } from './ShareModal';
import ShareHistoryPopover from './ShareHistoryPopover';
import { SharePlatform } from './utils/shareHandlers';
import { createClient } from '@/auth/providers/supabase';

interface ShareButtonProps {
  review: Review;
  shareUrl: string;
  productName?: string;
  imageUrl?: string;
  onShareSuccess?: (platform: SharePlatform) => void;
  onShareError?: (error: string) => void;
}

export default function ShareButton({
  review,
  shareUrl,
  productName,
  imageUrl,
  onShareSuccess,
  onShareError,
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [shareCount, setShareCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch share count on mount
  useEffect(() => {
    const fetchShareCount = async () => {
      try {
        setIsLoadingCount(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setShareCount(0);
          setIsLoadingCount(false);
          return;
        }

        const response = await fetch(
          `/api/review-shares?reviewId=${review.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setShareCount(data.total_shares || 0);
        }
      } catch (error) {
        console.error('Error fetching share count:', error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchShareCount();
  }, [review.id]);

  const handleShareComplete = async (platform: SharePlatform) => {
    // Track the share via API
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn('No session available for tracking share');
        // Still call success callback even if tracking fails
        if (onShareSuccess) {
          onShareSuccess(platform);
        }
        return;
      }

      const response = await fetch('/api/review-shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          review_id: review.id,
          platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Share tracking error:', errorData);
        throw new Error(errorData.error || 'Failed to track share');
      }

      // Update share count
      setShareCount((prev) => (prev !== null ? prev + 1 : 1));

      // Call parent callback
      if (onShareSuccess) {
        onShareSuccess(platform);
      }
    } catch (error) {
      console.error('Error tracking share:', error);
      // Still call success callback even if tracking fails
      if (onShareSuccess) {
        onShareSuccess(platform);
      }
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/review-shares?shareId=${shareId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete share');
    }

    // Update share count
    setShareCount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
  };

  const handleButtonClick = () => {
    if (shareCount === null || shareCount === 0) {
      // No shares yet, open share modal directly
      setIsModalOpen(true);
    } else {
      // Has shares, show history
      setIsHistoryOpen(!isHistoryOpen);
    }
  };

  const handleShareFromHistory = () => {
    setIsHistoryOpen(false);
    setIsModalOpen(true);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={isLoadingCount}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={shareCount === 0 ? 'Share review' : 'View share history'}
      >
        <Icon name="FaShare" className="w-4 h-4 text-gray-600" size={16} />
        {isLoadingCount ? (
          <span>Loading...</span>
        ) : shareCount === null || shareCount === 0 ? (
          <span>Share</span>
        ) : (
          <span>
            {shareCount} {shareCount === 1 ? 'share' : 'shares'}
          </span>
        )}
      </button>

      {/* Share History Popover */}
      {shareCount !== null && shareCount > 0 && (
        <ShareHistoryPopover
          reviewId={review.id}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onDelete={handleDeleteShare}
          anchorRef={buttonRef}
        />
      )}

      {/* Add a "Share again" button in the popover */}
      {isHistoryOpen && shareCount !== null && shareCount > 0 && (
        <div className="absolute right-0 mt-1 z-50">
          <button
            onClick={handleShareFromHistory}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#452F9F] rounded-lg hover:bg-[#452F9F]/90 transition-colors shadow-lg"
          >
            Share again
          </button>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        review={review}
        shareUrl={shareUrl}
        productName={productName}
        imageUrl={imageUrl}
        onShareComplete={handleShareComplete}
        onShareError={(error) => {
          if (onShareError) {
            onShareError(error);
          }
        }}
      />
    </div>
  );
}
