"use client";

import React from "react";
import { SentimentSummary, SentimentAnalysisMetadata } from "../types";

interface SentimentSummaryCardProps {
  sentimentSummary: SentimentSummary;
  metadata: SentimentAnalysisMetadata;
}

export default function SentimentSummaryCard({
  sentimentSummary,
  metadata,
}: SentimentSummaryCardProps) {
  const { overallLabel, sentimentScore, breakdown, shortSummary } = sentimentSummary;

  // Get color based on sentiment
  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'mixed':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get gauge color
  const getGaugeColor = (score: number) => {
    if (score >= 67) return 'text-green-500';
    if (score >= 34) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Calculate rotation for gauge needle (0-100 maps to -90 to 90 degrees)
  const rotation = (sentimentScore / 100) * 180 - 90;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Sentiment Summary
      </h2>

      {/* Info Banner if partial analysis */}
      {metadata.totalReviewsInAccount > metadata.reviewLimit && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">ℹ️ Note:</span> Analyzed your {metadata.reviewCount} most recent reviews (out of {metadata.totalReviewsInAccount} total)
          </p>
        </div>
      )}

      {/* Sentiment Score Gauge */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-64 h-40 overflow-visible">
          {/* Semi-circle gauge background */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
            {/* Background arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Red section (0-33%) - left third */}
            <path
              d="M 20 90 A 80 80 0 0 1 62 24"
              fill="none"
              stroke="#EF4444"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Yellow section (33-67%) - middle third */}
            <path
              d="M 62 24 A 80 80 0 0 1 138 24"
              fill="none"
              stroke="#EAB308"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Green section (67-100%) - right third */}
            <path
              d="M 138 24 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="#22C55E"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Needle */}
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className={getGaugeColor(sentimentScore)}
              style={{
                transformOrigin: '100px 90px',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 1s ease-out',
              }}
            />
            {/* Center dot */}
            <circle
              cx="100"
              cy="90"
              r="6"
              className={getGaugeColor(sentimentScore)}
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="text-center mt-2">
          <div className={`text-5xl font-bold ${getSentimentColor(overallLabel)}`}>
            {sentimentScore}
          </div>
          <div className={`text-lg font-semibold uppercase tracking-wide ${getSentimentColor(overallLabel)} mt-1`}>
            {overallLabel}
          </div>
        </div>
      </div>

      {/* Summary Text */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700 text-center italic">
          "{shortSummary}"
        </p>
      </div>

      {/* Distribution Bar */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase">
          Sentiment Distribution
        </h3>

        {/* Visual bar */}
        <div className="flex w-full h-8 rounded-lg overflow-hidden shadow-inner">
          <div
            className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${breakdown.positive.percentage}%` }}
          >
            {breakdown.positive.percentage > 10 && `${Math.round(breakdown.positive.percentage)}%`}
          </div>
          <div
            className="bg-yellow-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${breakdown.mixed.percentage}%` }}
          >
            {breakdown.mixed.percentage > 10 && `${Math.round(breakdown.mixed.percentage)}%`}
          </div>
          <div
            className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
            style={{ width: `${breakdown.negative.percentage}%` }}
          >
            {breakdown.negative.percentage > 10 && `${Math.round(breakdown.negative.percentage)}%`}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-gray-700">
              Positive: {breakdown.positive.count} ({Math.round(breakdown.positive.percentage)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-gray-700">
              Mixed: {breakdown.mixed.count} ({Math.round(breakdown.mixed.percentage)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-gray-700">
              Negative: {breakdown.negative.count} ({Math.round(breakdown.negative.percentage)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
