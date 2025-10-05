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

  const reviewerName = `${review.first_name} ${review.last_name}`;

  // Generate dynamic image URL based on includeReviewerName option
  const dynamicImageUrl = imageUrl
    ? `${imageUrl.split('?')[0]}?reviewId=${review.id}${includeReviewerName ? '&includeReviewerName=true' : ''}`
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

  // Reset image loading when includeReviewerName changes
  useEffect(() => {
    if (imageUrl) {
      setImageLoading(true);
      setImageError(false);
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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {selectedPlatform ? 'Share Review' : 'Share on Social Media'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {!selectedPlatform ? (
              /* Platform Selection */
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">
                  Choose a platform to share this review:
                </p>

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
                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                            : 'border-gray-200 hover:border-[#452F9F] hover:bg-[#452F9F]/5'
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
                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Icon name="FaArrowLeft" className="w-4 h-4" size={16} />
                  Back to platforms
                </button>

                {/* Platform Info */}
                {currentPlatformConfig && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share Text (editable)
                  </label>
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#452F9F] focus:border-transparent resize-none text-sm font-mono"
                    placeholder="Edit your share text..."
                  />

                  {/* Character Count */}
                  {charInfo && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={
                          charInfo.isOverLimit ? 'text-red-600' : 'text-gray-500'
                        }
                      >
                        {charInfo.current} / {charInfo.max} characters
                      </span>
                      {charInfo.isOverLimit && (
                        <span className="text-red-600 font-medium">
                          Over limit by {Math.abs(charInfo.remaining)}!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Image Preview */}
                {dynamicImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share Image Preview
                    </label>
                    {imageLoading && !imageError && (
                      <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#452F9F] mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Generating image...</p>
                        </div>
                      </div>
                    )}
                    {imageError && (
                      <div className="w-full max-w-md p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          Could not load preview image. Share will still work.
                        </p>
                      </div>
                    )}
                    <img
                      key={dynamicImageUrl}
                      src={dynamicImageUrl}
                      alt="Share preview"
                      className={`w-full max-w-md rounded-lg border border-gray-200 shadow-sm ${imageLoading || imageError ? 'hidden' : ''}`}
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
                      className="w-4 h-4 text-[#452F9F] border-gray-300 rounded focus:ring-[#452F9F]"
                    />
                    <span className="text-sm text-gray-700">
                      Include reviewer name ({reviewerName})
                    </span>
                  </label>
                </div>

                {/* Warning for character limit */}
                {charInfo?.isOverLimit && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <Icon
                      name="FaExclamationTriangle"
                      className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="text-sm text-amber-800">
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
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                disabled={charInfo?.isOverLimit}
                className={`
                  px-6 py-2 rounded-lg text-sm font-semibold text-white
                  transition-colors
                  ${
                    charInfo?.isOverLimit
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#452F9F] hover:bg-[#452F9F]/90'
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
