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

  const currentPlatformConfig = SHARE_PLATFORMS.find(
    (p) => p.key === selectedPlatform
  );

  const charInfo = selectedPlatform
    ? getCharacterInfo(
        selectedPlatform as keyof typeof PLATFORM_LIMITS,
        shareText
      )
    : null;

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
      <div className="fixed inset-0 bg-slate-900/25" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative mx-auto max-w-2xl w-full rounded-3xl border border-white/30 bg-white/10 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-2xl max-h-[90vh] overflow-hidden">
          {/* Glassmorphic gradient overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent" />
          <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-6 border-b border-white/20">
            <Dialog.Title className="text-xl font-semibold text-white drop-shadow-[0_2px_6px_rgba(15,23,42,0.35)]">
              {selectedPlatform ? 'Share Review' : 'Share on Social Media'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="relative overflow-y-auto max-h-[calc(90vh-140px)]">
            {!selectedPlatform ? (
              /* Platform Selection */
              <div className="p-6">
                <p className="text-sm text-white/80 mb-6">
                  Choose a platform to share this review:
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {SHARE_PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      onClick={() => handlePlatformClick(platform.key)}
                      disabled={platform.requiresImage && !imageUrl}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2
                        transition-all hover:scale-105
                        ${
                          platform.requiresImage && !imageUrl
                            ? 'opacity-50 cursor-not-allowed border-white/20 bg-white/5'
                            : 'border-white/30 hover:border-white/50 hover:bg-white/20 bg-white/10'
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
                      <span className="text-sm font-medium text-white">
                        {platform.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Review Preview */}
                <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Review Preview
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-white/80">
                      <span className="font-medium">From:</span> {reviewerName}
                    </p>
                    <p className="text-sm text-white italic">
                      "{review.review_content}"
                    </p>
                    {review.platform && (
                      <p className="text-xs text-white/60">
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
                  <div className="flex items-center gap-3 p-4 bg-white/10 rounded-xl border border-white/20">
                    <Icon
                      name={currentPlatformConfig.icon as any}
                      className={`w-8 h-8 ${currentPlatformConfig.color}`}
                      size={32}
                    />
                    <div>
                      <h3 className="font-semibold text-white">
                        {currentPlatformConfig.name}
                      </h3>
                      <p className="text-sm text-white/70">
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
                    className="w-full px-3 py-2 border border-white/30 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent resize-none text-sm font-mono placeholder-white/50"
                    placeholder="Edit your share text..."
                  />

                  {/* Character Count */}
                  {charInfo && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={
                          charInfo.isOverLimit ? 'text-red-300' : 'text-white/60'
                        }
                      >
                        {charInfo.current} / {charInfo.max} characters
                      </span>
                      {charInfo.isOverLimit && (
                        <span className="text-red-300 font-medium">
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
                      <div className="w-full max-w-md h-48 bg-white/5 rounded-xl border border-white/20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50 mx-auto mb-2"></div>
                          <p className="text-sm text-white/70">Generating image...</p>
                        </div>
                      </div>
                    )}
                    {imageError && (
                      <div className="w-full max-w-md p-4 bg-amber-500/20 border border-amber-400/30 rounded-xl">
                        <p className="text-sm text-amber-100">
                          Could not load preview image. Share will still work.
                        </p>
                      </div>
                    )}
                    <img
                      key={dynamicImageUrl}
                      src={dynamicImageUrl}
                      alt="Share preview"
                      className={`w-full max-w-md rounded-xl border border-white/30 shadow-sm ${imageLoading || imageError ? 'hidden' : ''}`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageLoading(false);
                        setImageError(true);
                      }}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReviewerName}
                      onChange={(e) => setIncludeReviewerName(e.target.checked)}
                      className="w-4 h-4 text-white border-white/30 bg-white/10 rounded focus:ring-white/50"
                    />
                    <span className="text-sm text-white">
                      Include reviewer name ({reviewerName})
                    </span>
                  </label>
                </div>

                {/* Warning for character limit */}
                {charInfo?.isOverLimit && (
                  <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl flex items-start gap-2">
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
            <div className="relative p-6 border-t border-white/20 flex items-center justify-between">
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
                  px-6 py-2 rounded-xl text-sm font-semibold
                  transition-all
                  ${
                    charInfo?.isOverLimit
                      ? 'bg-white/20 text-white/50 cursor-not-allowed'
                      : 'bg-white text-slate-900 hover:scale-[1.02] hover:bg-slate-100'
                  }
                `}
              >
                Share Now
              </button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
