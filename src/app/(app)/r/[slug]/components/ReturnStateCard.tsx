"use client";

import React, { useState } from 'react';
import Icon from '@/components/Icon';
import ButtonSpinner from '@/components/ButtonSpinner';
import { getContrastTextColor } from '@/utils/colorUtils';

interface ReturnStateCardProps {
  submissionId: string;
  platformName: string;
  reviewText: string;
  platformUrl: string;
  businessName?: string;
  businessProfile?: {
    secondary_color?: string;
    card_bg?: string;
    card_text?: string;
  };
  onConfirmed: () => void;
  onNeedsHelp: () => void;
}

type ReturnState = 'asking' | 'confirmed' | 'needs_help';

export default function ReturnStateCard({
  submissionId,
  platformName,
  reviewText,
  platformUrl,
  businessName,
  businessProfile,
  onConfirmed,
  onNeedsHelp,
}: ReturnStateCardProps) {
  const [state, setState] = useState<ReturnState>('asking');
  const [isLoading, setIsLoading] = useState<'confirmed' | 'needs_help' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const primaryColor = businessProfile?.secondary_color || '#2563eb';
  const buttonTextColor = getContrastTextColor(primaryColor);

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
    } catch (error) {
      // Fallback for older browsers
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

  if (state === 'confirmed') {
    return (
      <div className="text-center py-8 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Icon name="FaCheckCircle" size={32} color="#22c55e" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Amazing — thank you!</h2>
        <p className="text-gray-600 mb-1">
          Your review really helps {businessName || 'us'}.
        </p>
        <p className="text-gray-500 text-sm">You can close this tab now.</p>
      </div>
    );
  }

  if (state === 'needs_help') {
    return (
      <div className="py-6 px-4">
        <h2 className="text-xl font-bold mb-4">No problem — here's the quick fix.</h2>
        <ol className="space-y-3 mb-6 text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span>Tap below to copy your review again.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span>Open {platformName} and paste it in.</span>
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={handleCopyReview}
            className="flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-colors"
            style={{
              borderColor: primaryColor,
              color: primaryColor,
              backgroundColor: copySuccess ? primaryColor : 'transparent',
            }}
          >
            {copySuccess ? (
              <span className="flex items-center justify-center gap-2" style={{ color: buttonTextColor }}>
                <Icon name="FaCheck" size={16} />
                Copied!
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Icon name="FaCopy" size={16} />
                Copy review
              </span>
            )}
          </button>
          <a
            href={platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-lg font-medium text-center transition-colors"
            style={{
              backgroundColor: primaryColor,
              color: buttonTextColor,
            }}
          >
            Open {platformName}
          </a>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Still stuck? Email support@promptreviews.app
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <h2 className="text-xl font-bold mb-6 text-center">
        Did you get your review posted on {platformName}?
      </h2>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleConfirmed}
          disabled={isLoading !== null}
          className="w-full py-4 px-6 rounded-lg font-medium text-lg transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: primaryColor,
            color: buttonTextColor,
          }}
        >
          {isLoading === 'confirmed' ? (
            <span className="flex items-center justify-center gap-2">
              <ButtonSpinner size={20} color={buttonTextColor} />
              Loading...
            </span>
          ) : (
            "Yes, it's posted"
          )}
        </button>
        <button
          onClick={handleNeedsHelp}
          disabled={isLoading !== null}
          className="w-full py-4 px-6 rounded-lg font-medium text-lg border-2 transition-opacity disabled:opacity-50"
          style={{
            borderColor: primaryColor,
            color: primaryColor,
            backgroundColor: 'transparent',
          }}
        >
          {isLoading === 'needs_help' ? (
            <span className="flex items-center justify-center gap-2">
              <ButtonSpinner size={20} color={primaryColor} />
              Loading...
            </span>
          ) : (
            "Not yet / I ran into an issue"
          )}
        </button>
      </div>
    </div>
  );
}
