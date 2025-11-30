"use client";

import React, { useState } from 'react';
import ButtonSpinner from '@/components/ButtonSpinner';

// Inline SVG icons to avoid sprite loading issues with fixed overlays
const CopyIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill={color}>
    <path d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"/>
  </svg>
);

const CheckIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
  </svg>
);

const CheckCircleIcon = ({ size = 32, color = "#22c55e" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"/>
  </svg>
);

const ArrowLeftIcon = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" fill={color}>
    <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"/>
  </svg>
);

interface ReturnStateCardProps {
  submissionId: string;
  platformName: string;
  reviewText: string;
  platformUrl: string;
  businessName?: string;
  backgroundSettings?: {
    type?: string;
    color?: string;
    gradientStart?: string;
    gradientMiddle?: string;
    gradientEnd?: string;
  };
  onConfirmed: () => void;
  onNeedsHelp: () => void;
  onBack: () => void;
  onTriggerStarRain?: () => void;
}

type ReturnState = 'asking' | 'confirmed' | 'needs_help';

// Helper to determine if a color is light (for text contrast)
const isLightColor = (hex: string): boolean => {
  // Remove # if present
  const color = hex.replace('#', '');
  // Parse RGB values
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export default function ReturnStateCard({
  submissionId,
  platformName,
  reviewText,
  platformUrl,
  businessName,
  backgroundSettings,
  onConfirmed,
  onNeedsHelp,
  onBack,
  onTriggerStarRain,
}: ReturnStateCardProps) {
  const [state, setState] = useState<ReturnState>('asking');
  const [isLoading, setIsLoading] = useState<'confirmed' | 'needs_help' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Determine if we need dark text based on background
  const useDarkText = (): boolean => {
    if (!backgroundSettings) return false; // Default gradient is dark
    if (backgroundSettings.type === 'gradient') {
      // Check the middle color of gradient (most visible behind card)
      const middleColor = backgroundSettings.gradientMiddle || '#7864C8';
      return isLightColor(middleColor);
    }
    // Solid color
    return isLightColor(backgroundSettings.color || '#2563EB');
  };

  const isDark = !useDarkText();
  const textColorClass = isDark ? 'text-white/90 hover:text-white' : 'text-gray-800/90 hover:text-gray-900';
  const footerColorClass = isDark ? 'text-white/70 hover:text-white' : 'text-gray-600/70 hover:text-gray-900';

  // Build background style from settings
  const getBackgroundStyle = () => {
    if (!backgroundSettings) {
      return { background: 'linear-gradient(180deg, #2563EB 0%, #7864C8 50%, #914AAE 100%)' };
    }
    if (backgroundSettings.type === 'gradient') {
      const start = backgroundSettings.gradientStart || '#2563EB';
      const middle = backgroundSettings.gradientMiddle || '#7864C8';
      const end = backgroundSettings.gradientEnd || '#914AAE';
      return { background: `linear-gradient(180deg, ${start} 0%, ${middle} 50%, ${end} 100%)` };
    }
    return { backgroundColor: backgroundSettings.color || '#2563EB' };
  };

  const trackConfirmation = async (customerConfirmed: 'confirmed' | 'needs_help') => {
    try {
      await fetch('/api/track-review/confirm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, customer_confirmed: customerConfirmed }),
      });
    } catch (error) {
      console.error('Failed to track confirmation:', error);
    }
  };

  const handleConfirmed = async () => {
    setIsLoading('confirmed');
    await trackConfirmation('confirmed');
    setIsLoading(null);
    setState('confirmed');
    onConfirmed();
    // Trigger star rain celebration if enabled
    onTriggerStarRain?.();
  };

  const handleNeedsHelp = async () => {
    setIsLoading('needs_help');
    await trackConfirmation('needs_help');
    setIsLoading(null);
    setState('needs_help');
    onNeedsHelp();
  };

  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(reviewText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = reviewText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy:', fallbackError);
      }
      document.body.removeChild(textarea);
    }
  };

  // Full-page overlay with gradient and centered white card
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col p-4"
      style={getBackgroundStyle()}
    >
      {/* Back button - top left */}
      {state !== 'confirmed' && (
        <button
          onClick={onBack}
          className={`absolute top-4 left-4 flex items-center gap-2 ${textColorClass} transition-colors text-sm font-medium`}
        >
          <ArrowLeftIcon size={14} color="currentColor" />
          Back to Create Review
        </button>
      )}

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          {state === 'confirmed' && (
            <div className="text-center">
              <img
                src="/images/prompty-success.png"
                alt="Success"
                className="w-24 h-24 mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Success!</h2>
              <p className="text-gray-600 mb-4">
                Thank you for supporting {businessName || 'us'}. Reviews help small businesses grow.
              </p>
              <p className="text-gray-400 text-sm">You can close this tab now.</p>
            </div>
          )}

        {state === 'needs_help' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">No problem — here's the quick fix.</h2>
            <ol className="space-y-3 mb-4 text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Tap below to copy your review again.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Open {platformName}, login or create an account if needed, then paste your review and submit.</span>
              </li>
            </ol>

            {/* Review text box - read only, allows manual selection */}
            <div className="mb-4">
              <textarea
                readOnly
                value={reviewText}
                className="w-full p-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg resize-none"
                rows={3}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={handleCopyReview}
                className={`w-full py-3 px-4 rounded-lg font-medium border-2 border-gray-900 transition-colors ${
                  copySuccess ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                }`}
              >
                {copySuccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckIcon size={16} />
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CopyIcon size={16} />
                    Copy review
                  </span>
                )}
              </button>
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg font-medium text-center bg-gray-900 text-white"
              >
                Open {platformName}
              </a>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Still stuck? Email support@promptreviews.app
            </p>
          </div>
        )}

        {state === 'asking' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Did you get your review posted on {platformName}?
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmed}
                disabled={isLoading !== null}
                className="w-full py-4 px-6 rounded-lg font-medium text-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
              >
                {isLoading === 'confirmed' ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonSpinner size={20} color="#ffffff" />
                    Loading...
                  </span>
                ) : (
                  "Yes, it's posted"
                )}
              </button>
              <button
                onClick={handleNeedsHelp}
                disabled={isLoading !== null}
                className="w-full py-4 px-6 rounded-lg font-medium text-lg border-2 border-gray-900 text-gray-900 bg-white transition-opacity disabled:opacity-50"
              >
                {isLoading === 'needs_help' ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonSpinner size={20} color="#111827" />
                    Loading...
                  </span>
                ) : (
                  "Not yet / I ran into an issue"
                )}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <a
          href="https://promptreviews.app"
          target="_blank"
          rel="noopener noreferrer"
          className={`${footerColorClass} text-sm transition-colors`}
        >
          Powered by Prompt Reviews
        </a>
      </div>
    </div>
  );
}
