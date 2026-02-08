'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/utils/apiClient';
import { LLM_PROVIDER_LABELS, LLM_PROVIDER_COLORS, LLMProvider } from '../utils/types';

interface TimelineCheck {
  date: string;
  cited: boolean | null; // null = not checked that day
  mentioned: boolean | null;
}

interface ProviderTimeline {
  provider: string;
  citationRate: number;
  mentionRate: number;
  totalChecks: number;
  citedCount: number;
  mentionedCount: number;
  checks: TimelineCheck[];
}

type MetricType = 'citations' | 'mentions';

interface QuestionHistoryResponse {
  dates: string[];
  timeline: Record<string, ProviderTimeline>;
  totalChecks: number;
}

interface CitationTimelineProps {
  question: string;
  keywordId: string;
  className?: string;
}

const PROVIDERS_ORDER: LLMProvider[] = ['chatgpt', 'claude', 'gemini', 'perplexity', 'ai_overview'];

/**
 * CitationTimeline - Visual timeline showing check history across all LLM providers
 *
 * Displays 4 horizontal tracks (one per provider) with visual indicators:
 * - ● green = cited
 * - ✗ red = not cited
 * - ○ grey = not checked on that date
 *
 * Features:
 * - Provider name with citation rate percentage on the left
 * - Dates along the bottom axis
 * - Horizontal scroll on mobile
 * - "Not checked yet" message if no checks exist
 */
export function CitationTimeline({ question, keywordId, className = '' }: CitationTimelineProps) {
  const [data, setData] = useState<QuestionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricType, setMetricType] = useState<MetricType>('citations');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          question,
          keywordId,
          limit: '20',
        });
        const response = await apiClient.get<QuestionHistoryResponse>(
          `/llm-visibility/question-history?${params.toString()}`
        );
        setData(response);
      } catch (err) {
        console.error('[CitationTimeline] Failed to fetch history:', err);
        setError('Failed to load check history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [question, keywordId]);

  if (isLoading) {
    return (
      <div className={`py-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-4 text-sm text-red-600 ${className}`}>
        {error}
      </div>
    );
  }

  if (!data || data.totalChecks === 0) {
    return (
      <div className={`py-4 text-center text-sm text-gray-500 ${className}`}>
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          Not checked yet
        </span>
      </div>
    );
  }

  const { dates, timeline } = data;

  // Format date for display (short format)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isMentions = metricType === 'mentions';

  return (
    <div className={`${className}`}>
      {/* Timeline header with toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-600">Check history</div>
        <div className="flex items-center bg-gray-100 rounded p-0.5">
          <button
            onClick={() => setMetricType('mentions')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              metricType === 'mentions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mentions
          </button>
          <button
            onClick={() => setMetricType('citations')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
              metricType === 'citations'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Citations
          </button>
        </div>
      </div>

      {/* Scrollable timeline container */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[400px]">
          {/* Provider tracks */}
          <div className="space-y-1">
            {PROVIDERS_ORDER.map(provider => {
              const providerData = timeline[provider];
              const colors = LLM_PROVIDER_COLORS[provider];

              if (!providerData) {
                // Provider has no data, show empty row
                return (
                  <div key={provider} className="flex items-center gap-2">
                    {/* Provider label */}
                    <div className="flex-shrink-0 w-28">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                        {LLM_PROVIDER_LABELS[provider]}
                        <span className="text-gray-400">--</span>
                      </span>
                    </div>
                    {/* Empty track */}
                    <div className="flex items-center gap-1">
                      {dates.map(date => (
                        <div
                          key={date}
                          className="w-5 h-5 flex items-center justify-center"
                          title={`${formatDate(date)}: Not checked`}
                        >
                          <span className="w-2 h-2 rounded-full border border-gray-300 bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              const rate = isMentions ? providerData.mentionRate : providerData.citationRate;
              const positiveLabel = isMentions ? 'Mentioned' : 'Cited';
              const negativeLabel = isMentions ? 'Not mentioned' : 'Not cited';

              return (
                <div key={provider} className="flex items-center gap-2">
                  {/* Provider label with rate */}
                  <div className="flex-shrink-0 w-28">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                      {LLM_PROVIDER_LABELS[provider]}
                      <span className={rate > 0 ? 'text-green-700' : 'text-gray-500'}>
                        {rate}%
                      </span>
                    </span>
                  </div>

                  {/* Check indicators */}
                  <div className="flex items-center gap-1">
                    {providerData.checks.map((check, idx) => {
                      const dateStr = dates[idx];
                      const value = isMentions ? check.mentioned : check.cited;

                      if (value === null) {
                        // Not checked on this date
                        return (
                          <div
                            key={dateStr}
                            className="w-5 h-5 flex items-center justify-center"
                            title={`${formatDate(dateStr)}: Not checked`}
                          >
                            <span className="w-2 h-2 rounded-full border border-gray-300 bg-white" />
                          </div>
                        );
                      }

                      if (value) {
                        // Positive - green filled circle
                        return (
                          <div
                            key={dateStr}
                            className="w-5 h-5 flex items-center justify-center"
                            title={`${formatDate(dateStr)}: ${positiveLabel}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          </div>
                        );
                      }

                      // Negative - red X
                      return (
                        <div
                          key={dateStr}
                          className="w-5 h-5 flex items-center justify-center"
                          title={`${formatDate(dateStr)}: ${negativeLabel}`}
                        >
                          <span className="text-red-500 text-xs font-bold">✗</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date axis - show only first and last dates to avoid overlap */}
          <div className="flex items-center gap-2 mt-2 border-t border-gray-200 pt-2">
            {/* Spacer for provider label column */}
            <div className="flex-shrink-0 w-28" />

            {/* Date range display */}
            <div className="flex items-center justify-between flex-1 text-[9px] text-gray-400">
              <span>{formatDate(dates[0])}</span>
              {dates.length > 1 && (
                <span>{formatDate(dates[dates.length - 1])}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>{isMentions ? 'Mentioned' : 'Cited'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500 font-bold">✗</span>
          <span>{isMentions ? 'Not mentioned' : 'Not cited'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full border border-gray-300 bg-white" />
          <span>Not checked</span>
        </div>
      </div>
    </div>
  );
}

export default CitationTimeline;
