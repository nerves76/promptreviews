"use client";

import React, { useState } from "react";
import { EligibilityResponse, AnalysisResponse } from "../types";

interface RunAnalysisButtonProps {
  eligibility: EligibilityResponse;
  accountId: string;
  onAnalysisComplete: (response: AnalysisResponse) => void;
  onAnalysisError: (error: string) => void;
}

const PROGRESS_MESSAGES = [
  "Collecting your reviews...",
  "Analyzing sentiment patterns...",
  "Identifying key themes...",
  "Summarizing what customers said...",
  "Preparing improvement ideas...",
];

export default function RunAnalysisButton({
  eligibility,
  accountId,
  onAnalysisComplete,
  onAnalysisError,
}: RunAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentMessageIndex(0);

    // Cycle through progress messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 3000);

    try {
      const response = await fetch('/api/sentiment-analyzer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      clearInterval(messageInterval);
      onAnalysisComplete(data);
    } catch (error) {
      clearInterval(messageInterval);
      onAnalysisError(error instanceof Error ? error.message : 'Failed to run analysis');
    } finally {
      setIsAnalyzing(false);
      setCurrentMessageIndex(0);
    }
  };

  const { eligible, reviewCount, reviewLimit, usageThisMonth, usageLimit } = eligibility;

  // Determine disabled state and message
  let disabledReason = '';
  if (!eligible) {
    if (usageThisMonth >= usageLimit) {
      disabledReason = 'Monthly limit reached';
    } else if (reviewCount < 10) {
      disabledReason = 'Not enough reviews';
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {isAnalyzing && (
        <div className="w-full mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">
                Analyzing your {reviewCount > reviewLimit ? reviewLimit : reviewCount} most recent reviews...
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                {PROGRESS_MESSAGES[currentMessageIndex]}
              </p>
            </div>
          </div>
          <div className="mt-3 w-full bg-indigo-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-indigo-600 animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      <button
        onClick={handleRunAnalysis}
        disabled={!eligible || isAnalyzing}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white transition-all
          ${
            !eligible || isAnalyzing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-slate-600 hover:bg-slate-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isAnalyzing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Run Sentiment Analysis
          </span>
        )}
      </button>

      {disabledReason && !isAnalyzing && (
        <p className="text-sm text-gray-500">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
