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
import { createClient } from '@/auth/providers/supabase';

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
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const reviewerName = `${review.first_name} ${review.last_name}`;

  // Use the generated image URL (from Supabase Storage) for sharing
  const shareableImageUrl = generatedImageUrl;

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

  // Fetch share image when modal opens
  useEffect(() => {
    if (!isOpen || review.id.startsWith('sample-')) return;
    let cancelled = false;

    const fetchShareImage = async () => {
      console.log('[ShareModal] Starting image fetch for review:', review.id);
      setImageLoading(true);
      setImageError(false);
      setGeneratedImageUrl(null);

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[ShareModal] Session exists:', !!session);
        if (!session) {
          console.error('[ShareModal] No session available');
          setImageError(true);
          setImageLoading(false);
          return;
        }

        console.log('[ShareModal] Calling generate-image API...');
        const response = await fetch('/api/review-shares/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            review_id: review.id,
            regenerate: true, // Always regenerate to get latest design
          }),
        });

        console.log('[ShareModal] API response status:', response.status);
        const responseText = await response.text();
        console.log('[ShareModal] API response text:', responseText);

        let payload;
        try {
          payload = JSON.parse(responseText);
        } catch (e) {
          console.error('[ShareModal] Failed to parse response as JSON:', responseText);
          payload = null;
        }
        console.log('[ShareModal] API response payload:', payload);

        if (!cancelled) {
          if (payload?.success && payload.image_url) {
            console.log('[ShareModal] Setting generated image URL:', payload.image_url);
            setGeneratedImageUrl(payload.image_url);
          } else {
            console.error('[ShareModal] Failed to generate share image:', payload);
            if (payload?.details) {
              console.error('[ShareModal] Error details:', payload.details);
            }
            setImageError(true);
          }
          setImageLoading(false);
        }
      } catch (error) {
        console.error('[ShareModal] Error preparing share image:', error);
        if (!cancelled) {
          setImageError(true);
          setImageLoading(false);
        }
      }
    };

    fetchShareImage();
    return () => {
      cancelled = true;
    };
  }, [isOpen, review.id]);

  const handlePlatformClick = async (platform: SharePlatform) => {
    setSelectedPlatform(platform);
  };

  const handleConfirmShare = async () => {
    if (!selectedPlatform) return;

    try {
      const shareData: ShareData = {
        url: shareUrl,
        text: shareText,
        title: productName,
        imageUrl: shareableImageUrl,
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
          <Dialog.Panel className="mx-auto w-full rounded-2xl border border-white/30 bg-white/10 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-hidden relative pb-4">
            {/* Glass effect overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent rounded-2xl" />
            <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-purple-300/20 blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20 relative z-10">
              <Dialog.Title className="text-xl font-semibold text-white drop-shadow-md">
                {selectedPlatform ? 'Share review' : 'Share on social media'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white focus:outline-none"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
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
                          Share history ({shareHistory.length})
                        </span>
                      </div>
                      <Icon
                        name={historyExpanded ? "FaChevronUp" : "FaChevronDown"}
                        className="w-4 h-4 text-gray-500"
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
                                  className="text-gray-500 hover:text-red-600 transition-colors ml-2"
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
                      disabled={platform.requiresImage && !shareableImageUrl}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-lg border-2
                        transition-all hover:scale-105
                        ${
                          platform.requiresImage && !shareableImageUrl
                            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-white'
                            : 'border-gray-200 hover:border-[#452F9F] hover:bg-gray-50 bg-white'
                        }
                      `}
                      title={
                        platform.requiresImage && !shareableImageUrl
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

                {/* Image Preview */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Share image preview
                  </h3>
                  {!generatedImageUrl && !imageError && (
                    <div className="w-full h-48 bg-white/5 rounded-lg border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm text-white/70">Generating image...</p>
                      </div>
                    </div>
                  )}
                  {imageError && (
                    <div className="w-full p-4 bg-amber-500/20 border border-amber-400/40 rounded-lg backdrop-blur-sm">
                      <p className="text-sm text-amber-100">
                        Could not load preview image. Share will still work.
                      </p>
                    </div>
                  )}
                  {generatedImageUrl && (
                    <img
                      src={generatedImageUrl}
                      alt="Share preview"
                      className="w-full rounded-lg border border-white/30 shadow-sm"
                    />
                  )}
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
                    Share text (editable)
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
                {imageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Share image preview
                    </label>
                    {!generatedImageUrl && !imageError && (
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
                    {generatedImageUrl && (
                      <>
                        <img
                          key={generatedImageUrl}
                          src={generatedImageUrl}
                          alt="Share preview"
                          className="w-full max-w-md rounded-lg border border-white/30 shadow-sm"
                          onLoad={() => setImageLoading(false)}
                          onError={() => {
                            setImageLoading(false);
                            setImageError(true);
                          }}
                        />
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(generatedImageUrl);
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
                          Download image
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
                      ? 'bg-white/20 text-white/60 cursor-not-allowed'
                      : 'bg-white text-slate-900 hover:bg-white/90'
                  }
                `}
              >
                Share now
              </button>
            </div>
          )}
        </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
