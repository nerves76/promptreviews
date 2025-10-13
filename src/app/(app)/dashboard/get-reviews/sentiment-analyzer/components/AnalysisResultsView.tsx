"use client";

import React from "react";
import { SentimentAnalysisResult } from "../types";
import SentimentSummaryCard from "./SentimentSummaryCard";
import ThemesSpotlight from "./ThemesSpotlight";
import ImprovementIdeas from "./ImprovementIdeas";

interface AnalysisResultsViewProps {
  results: SentimentAnalysisResult;
}

export default function AnalysisResultsView({ results }: AnalysisResultsViewProps) {
  const { metadata, sentimentSummary, themes, improvementIdeas, limitations } = results;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Analysis Metadata */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Analysis Generated
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(metadata.runDate)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Reviews Analyzed:</span>{' '}
              <span className="font-semibold text-gray-900">{metadata.reviewCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Version:</span>{' '}
              <span className="font-semibold text-gray-900">{metadata.analysisVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations Alert (if present) */}
      {limitations && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                Analysis Limitations
              </h3>
              <p className="text-sm text-yellow-800">
                {limitations}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Summary */}
      <SentimentSummaryCard
        sentimentSummary={sentimentSummary}
        metadata={metadata}
      />

      {/* Themes Spotlight */}
      {themes && themes.length > 0 && (
        <ThemesSpotlight themes={themes} />
      )}

      {/* Improvement Ideas */}
      {improvementIdeas && improvementIdeas.length > 0 && (
        <ImprovementIdeas ideas={improvementIdeas} />
      )}

      {/* Export/Share Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => {
            // Export as JSON
            const dataStr = JSON.stringify(results, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sentiment-analysis-${metadata.analysisId}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export JSON
          </span>
        </button>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => {
            // Export as CSV
            const csvRows = [];

            // Header
            csvRows.push(['Sentiment Analysis Report'].join(','));
            csvRows.push(['Analysis ID', metadata.analysisId].join(','));
            csvRows.push(['Run Date', formatDate(metadata.runDate)].join(','));
            csvRows.push(['Reviews Analyzed', metadata.reviewCount].join(','));
            csvRows.push(['']);

            // Sentiment Summary
            csvRows.push(['Sentiment Summary'].join(','));
            csvRows.push(['Overall Label', sentimentSummary.overallLabel].join(','));
            csvRows.push(['Sentiment Score', sentimentSummary.sentimentScore].join(','));
            csvRows.push(['Summary', `"${sentimentSummary.shortSummary}"`].join(','));
            csvRows.push(['']);

            // Breakdown
            csvRows.push(['Sentiment Breakdown'].join(','));
            csvRows.push(['Category', 'Count', 'Percentage'].join(','));
            csvRows.push(['Positive', sentimentSummary.breakdown.positive.count, `${sentimentSummary.breakdown.positive.percentage}%`].join(','));
            csvRows.push(['Mixed', sentimentSummary.breakdown.mixed.count, `${sentimentSummary.breakdown.mixed.percentage}%`].join(','));
            csvRows.push(['Negative', sentimentSummary.breakdown.negative.count, `${sentimentSummary.breakdown.negative.percentage}%`].join(','));
            csvRows.push(['']);

            // Themes
            if (themes && themes.length > 0) {
              csvRows.push(['Key Themes'].join(','));
              csvRows.push(['Theme', 'Sentiment', 'Mentions', 'Supporting Quote'].join(','));
              themes.forEach(theme => {
                const quote = theme.supportingQuotes[0]?.excerpt || '';
                csvRows.push([
                  `"${theme.name}"`,
                  theme.sentiment,
                  theme.mentionCount,
                  `"${quote}"`
                ].join(','));
              });
              csvRows.push(['']);
            }

            // Improvement Ideas
            if (improvementIdeas && improvementIdeas.length > 0) {
              csvRows.push(['Improvement Ideas'].join(','));
              csvRows.push(['Title', 'Description', 'Related Themes'].join(','));
              improvementIdeas.forEach(idea => {
                csvRows.push([
                  `"${idea.title}"`,
                  `"${idea.description}"`,
                  `"${idea.sourceThemes.join(', ')}"`
                ].join(','));
              });
            }

            const csvContent = csvRows.join('\n');
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(csvBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sentiment-analysis-${metadata.analysisId}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </span>
        </button>
      </div>
    </div>
  );
}
