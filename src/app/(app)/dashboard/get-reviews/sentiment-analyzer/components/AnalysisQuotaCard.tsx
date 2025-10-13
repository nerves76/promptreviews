"use client";

import React from "react";
import Link from "next/link";
import { EligibilityResponse } from "../types";

interface AnalysisQuotaCardProps {
  eligibility: EligibilityResponse;
}

export default function AnalysisQuotaCard({ eligibility }: AnalysisQuotaCardProps) {
  const {
    plan,
    usageThisMonth,
    usageLimit,
    reviewCount,
    reviewLimit,
    nextResetDate,
    daysUntilReset,
    eligible,
    reason,
    minReviewsRequired,
  } = eligibility;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get plan display info
  const getPlanInfo = (planName: string) => {
    switch (planName) {
      case 'grower':
        return { emoji: '🌱', label: 'Grower Plan' };
      case 'builder':
        return { emoji: '🏗️', label: 'Builder Plan' };
      case 'maven':
        return { emoji: '🎯', label: 'Maven Plan' };
      default:
        return { emoji: '📊', label: 'Plan' };
    }
  };

  const planInfo = getPlanInfo(plan);
  const usagePercentage = (usageThisMonth / usageLimit) * 100;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your Analysis Limits
          </h3>

          {/* Plan Information */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {planInfo.emoji} {planInfo.label}
            </span>
            <Link
              href="/dashboard/plan"
              className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Upgrade for more analyses →
            </Link>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Monthly Analyses */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Monthly Analyses
              </div>
              <div className="text-2xl font-bold mb-2">
                <span className={usageThisMonth >= usageLimit ? 'text-red-600' : 'text-green-600'}>
                  {usageThisMonth}
                </span>
                <span className="text-gray-400"> / {usageLimit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${usageThisMonth >= usageLimit ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Review Limit */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Reviews Per Analysis
              </div>
              <div className="text-2xl font-bold mb-2 text-indigo-600">
                Up to {reviewLimit}
              </div>
              <div className="text-xs text-gray-500">
                Most recent reviews analyzed
              </div>
            </div>

            {/* Resets On */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Resets On
              </div>
              <div className="text-2xl font-bold mb-2 text-purple-600">
                {formatDate(nextResetDate)}
              </div>
              <div className="text-xs text-gray-500">
                {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''} remaining
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {usageThisMonth >= usageLimit ? (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  You've used all {usageLimit} analysis{usageLimit !== 1 ? 'es' : ''} this month.
                  Your limit resets on {formatDate(nextResetDate)}.
                </p>
                <Link
                  href="/dashboard/plan"
                  className="inline-block mt-2 text-sm font-medium text-yellow-900 hover:underline"
                >
                  Upgrade to get more analyses
                </Link>
              </div>
            </div>
          ) : reviewCount < minReviewsRequired ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xl">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  You need at least {minReviewsRequired} reviews to run sentiment analysis.
                  You currently have {reviewCount} review{reviewCount !== 1 ? 's' : ''}.
                </p>
                <Link
                  href="/dashboard/create-prompt-page"
                  className="inline-block mt-2 text-sm font-medium text-blue-900 hover:underline"
                >
                  Collect more reviews →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  Ready to analyze! You have {usageLimit - usageThisMonth} analysis
                  {usageLimit - usageThisMonth !== 1 ? 'es' : ''} remaining this month.
                  {reviewCount > reviewLimit && (
                    <span> We'll analyze your {reviewLimit} most recent reviews (out of {reviewCount} total).</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Icon with Tooltip */}
        <div className="ml-4 relative group">
          <svg
            className="w-5 h-5 text-indigo-500 cursor-help"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="absolute right-0 top-8 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="font-semibold mb-2">{planInfo.emoji} {planInfo.label}</div>
            <ul className="space-y-1">
              <li>• Run {usageLimit} analysis{usageLimit !== 1 ? 'es' : ''} per month</li>
              <li>• Analyze up to {reviewLimit} recent reviews</li>
              <li>• Resets on the 1st of each month</li>
              <li>• Upgrade anytime for more analyses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
