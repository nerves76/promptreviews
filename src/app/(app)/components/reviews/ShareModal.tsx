/**
 * ShareModal.tsx
 *
 * Modal for sharing reviews on social media platforms
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Icon from '@/components/Icon';
import {
  SHARE_PLATFORMS,
  SharePlatform,
  handleShare,
  ShareData,
} from './utils/shareHandlers';
import {
  buildShareText,
  buildEmailSubject,
  getCharacterInfo,
  PLATFORM_LIMITS,
} from './utils/shareTextBuilder';

export interface Review {
  id: string;
  first_name: string;
  last_name: string;
  review_content: string;
  platform?: string;
  emoji_sentiment_selection?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  shareUrl: string;
  productName?: string;
  imageUrl?: string;
  onShareComplete: (platform: SharePlatform) => void;
  onShareError: (error: string) => void;
}

interface ShareHistoryItem {
  id: string;
  platform: string;
  shared_at: string;
  shared_url?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  review,
  shareUrl,
  productName,
  imageUrl,
  onShareComplete,
  onShareError,
}: ShareModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform | null>(null);
  const [shareText, setShareText] = useState('');
  const [includeReviewerName, setIncludeReviewerName] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const reviewerName = `${review.first_name} ${review.last_name}`;

  // Generate dynamic image URL based on includeReviewerName option with cache busting
  const dynamicImageUrl = imageUrl
    ? `${imageUrl.split('?')[0]}?reviewId=${review.id}${includeReviewerName ? '&includeReviewerName=true' : ''}&t=${imageTimestamp}`
    : undefined;

  // Generate share text when platform or settings change
  useEffect(() => {
    if (!selectedPlatform) return;

    const generatedText = buildShareText(
      selectedPlatform as keyof typeof PLATFORM_LIMITS,
      {
        reviewerName,
        reviewContent: review.review_content,
        productName,
        shareUrl,
        includeReviewerName,
        rating: 5, // Default to 5 stars
      }
    );

    setShareText(generatedText);
  }, [selectedPlatform, includeReviewerName, review, shareUrl, productName, reviewerName]);

  // Reset image loading and cache-bust when includeReviewerName changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
      setImageTimestamp(Date.now()); // Force new image URL to bypass cache
    }
  }, [includeReviewerName, imageUrl]);

  const handlePlatformClick = async (platform: SharePlatform) => {
    try {
      setSelectedPlatform(platform);
      // Reset image loading state when platform changes
      setImageLoading(true);
      setImageError(false);
    } catch (error) {
      console.error('Error selecting platform:', error);
      onShareError('Failed to prepare share');
    }
  };

  const handleConfirmShare = async () => {
    if (!selectedPlatform) return;

    try {
      const shareData: ShareData = {
        url: shareUrl,
        text: shareText,
        title: productName,
        imageUrl: dynamicImageUrl,
        emailSubject: buildEmailSubject(productName),
      };

      await handleShare(selectedPlatform, shareData);
      onShareComplete(selectedPlatform);
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      onShareError(
        error instanceof Error ? error.message : 'Failed to share review'
      );
    }
  };

  const handleBackToPlatforms = () => {
    setSelectedPlatform(null);
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('Delete this share record?')) return;

    try {
      const response = await fetch(`/api/review-shares?shareId=${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete share');
      }

      // Remove from local state
      setShareHistory((prev) => prev.filter((item) => item.id !== shareId));
    } catch (error) {
      console.error('Error deleting share:', error);
      onShareError('Failed to delete share record');
    }
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

  const getPlatformIcon = (platform: string): { icon: string; color: string } => {
    const config = SHARE_PLATFORMS.find(
      (p) => p.key.toLowerCase() === platform.toLowerCase()
    );
    return config
      ? { icon: config.icon, color: config.color }
      : { icon: 'FaShare', color: 'text-gray-600' };
  };

  const currentPlatformConfig = SHARE_PLATFORMS.find(
    (p) => p.key === selectedPlatform
  );

  const charInfo = selectedPlatform
    ? getCharacterInfo(
        selectedPlatform as keyof typeof PLATFORM_LIMITS,
        shareText
      )
    : null;

  // Fetch share history when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const response = await fetch(`/api/review-shares?reviewId=${review.id}`);

        if (response.ok) {
          const data = await response.json();
          setShareHistory(data.shares || []);
          // Auto-expand if there's history
          if (data.shares && data.shares.length > 0) {
            setHistoryExpanded(true);
          }
        }
      } catch (error) {
        console.error('Error fetching share history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, review.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full">
          {/* Glassmorphic close button - breaching top-right corner */}
          <button
            className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
            style={{ width: 36, height: 36 }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <Dialog.Panel className="mx-auto w-full rounded-2xl border border-white/30 bg-white/10 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-hidden relative pb-4">
            {/* Glass effect overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent rounded-2xl" />
            <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <Dialog.Title className="text-xl font-semibold text-white drop-shadow-md">
                {selectedPlatform ? 'Share Review' : 'Share on Social Media'}
              </Dialog.Title>
            </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] relative z-10">
            {!selectedPlatform ? (
              /* Platform Selection */
              <div className="p-6">
                <p className="text-sm text-white/80 mb-6">
                  Choose a platform to share this review:
                </p>

                {/* Share History Dropdown */}
                {shareHistory.length > 0 && (
                  <div className="mb-6">
                    <button
                      onClick={() => setHistoryExpanded(!historyExpanded)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon name="FaHistory" className="w-4 h-4 text-gray-600" size={16} />
                        <span className="text-sm font-medium text-gray-700">
                          Share History ({shareHistory.length})
                        </span>
                      </div>
                      <Icon
                        name={historyExpanded ? "FaChevronUp" : "FaChevronDown"}
                        className="w-4 h-4 text-gray-400"
                        size={16}
                      />
                    </button>

                    {historyExpanded && (
                      <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <div className="max-h-48 overflow-y-auto">
                          {shareHistory.map((share) => {
                            const { icon, color } = getPlatformIcon(share.platform);
                            return (
                              <div
                                key={share.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Icon
                                    name={icon as any}
                                    className={`w-5 h-5 ${color} flex-shrink-0`}
                                    size={20}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 capitalize">
                                      {share.platform}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(share.shared_at)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteShare(share.id)}
                                  className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                                  aria-label="Delete share record"
                                  title="Delete"
                                >
                                  <Icon name="FaTrash" className="w-4 h-4" size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  {SHARE_PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      onClick={() => handlePlatformClick(platform.key)}
                      disabled={platform.requiresImage && !imageUrl}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-lg border-2
                        transition-all hover:scale-105
                        ${
                          platform.requiresImage && !imageUrl
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-white'
                            : 'border-gray-200 hover:border-[#452F9F] hover:bg-gray-50 bg-white'
                        }
                      `}
                      title={
                        platform.requiresImage && !imageUrl
                          ? 'Image required for Pinterest'
                          : `Share on ${platform.name}`
                      }
                    >
                      <Icon
                        name={platform.icon as any}
                        className={`w-8 h-8 mb-2 ${platform.color}`}
                        size={32}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Review Preview */}
                <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Review Preview
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">From:</span> {reviewerName}
                    </p>
                    <p className="text-sm text-gray-800 italic">
                      "{review.review_content}"
                    </p>
                    {review.platform && (
                      <p className="text-xs text-gray-500">
                        Original platform: {review.platform}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Share Preview & Customization */
              <div className="p-6 space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBackToPlatforms}
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <Icon name="FaArrowLeft" className="w-4 h-4" size={16} />
                  Back to platforms
                </button>

                {/* Platform Info */}
                {currentPlatformConfig && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                    <Icon
                      name={currentPlatformConfig.icon as any}
                      className={`w-8 h-8 ${currentPlatformConfig.color}`}
                      size={32}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {currentPlatformConfig.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ready to share your review
                      </p>
                    </div>
                  </div>
                )}

                {/* Share Text - Editable */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Share Text (editable)
                  </label>
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#452F9F] focus:border-transparent resize-none text-sm font-mono"
                    placeholder="Edit your share text..."
                  />

                  {/* Character Count */}
                  {charInfo && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={
                          charInfo.isOverLimit ? 'text-red-400' : 'text-white'
                        }
                      >
                        {charInfo.current} / {charInfo.max} characters
                      </span>
                      {charInfo.isOverLimit && (
                        <span className="text-red-400 font-medium">
                          Over limit by {Math.abs(charInfo.remaining)}!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Image Preview */}
                {dynamicImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Share Image Preview
                    </label>
                    {imageLoading && !imageError && (
                      <div className="w-full max-w-md h-48 bg-white/5 rounded-lg border border-white/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm text-white/70">Generating image...</p>
                        </div>
                      </div>
                    )}
                    {imageError && (
                      <div className="w-full max-w-md p-4 bg-amber-500/20 border border-amber-400/40 rounded-lg backdrop-blur-sm">
                        <p className="text-sm text-amber-100">
                          Could not load preview image. Share will still work.
                        </p>
                      </div>
                    )}
                    <img
                      key={dynamicImageUrl}
                      src={dynamicImageUrl}
                      alt="Share preview"
                      className={`w-full max-w-md rounded-lg border border-white/30 shadow-sm ${imageLoading || imageError ? 'hidden' : ''}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                    {!imageLoading && !imageError && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(dynamicImageUrl);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `review-${review.id}.png`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (err) {
                              console.error('Failed to download image:', err);
                            }
                          }}
                          className="mt-3 w-full max-w-md px-4 py-2 border-2 border-white/40 text-white hover:bg-white/10 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <Icon name="FaDownload" className="w-4 h-4" size={16} />
                          Download Image
                        </button>
                        {selectedPlatform === 'linkedin' && (
                          <p className="text-xs text-white/70 mt-2">
                            💡 For LinkedIn: Download the image, then manually upload it when sharing
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReviewerName}
                      onChange={(e) => setIncludeReviewerName(e.target.checked)}
                      className="w-4 h-4 text-white border-white/30 rounded focus:ring-white/50"
                    />
                    <span className="text-sm text-white">
                      Include reviewer name ({reviewerName})
                    </span>
                  </label>
                </div>

                {/* Warning for character limit */}
                {charInfo?.isOverLimit && (
                  <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-lg flex items-start gap-2 backdrop-blur-sm">
                    <Icon
                      name="FaExclamationTriangle"
                      className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="text-sm text-amber-100">
                      <p className="font-medium mb-1">Text too long</p>
                      <p>
                        Your text exceeds the {charInfo.platformName} character limit.
                        Please shorten it or use customize mode to edit.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedPlatform && (
            <div className="px-6 pt-4 pb-6 border-t border-white/20 flex items-center justify-between relative z-10">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                disabled={charInfo?.isOverLimit}
                className={`
                  px-6 py-2 rounded-lg text-sm font-semibold
                  transition-colors
                  ${
                    charInfo?.isOverLimit
                      ? 'bg-white/20 text-white/40 cursor-not-allowed'
                      : 'bg-white text-slate-900 hover:bg-white/90'
                  }
                `}
              >
                Share Now
              </button>
            </div>
          )}
        </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
