"use client";

import React from "react";
import Link from "next/link";
import { EligibilityResponse } from "../types";
import { getPricingTiersDisplay } from "@/features/sentiment-analyzer/services/credits";

interface AnalysisQuotaCardProps {
  eligibility: EligibilityResponse;
}

export default function AnalysisQuotaCard({ eligibility }: AnalysisQuotaCardProps) {
  const {
    reviewCount,
    minReviewsRequired,
    creditCost,
    creditBalance,
    tierLabel,
    eligible,
  } = eligibility;

  const hasEnoughCredits = creditBalance >= creditCost;
  const hasEnoughReviews = reviewCount >= minReviewsRequired;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Analysis overview
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Total Reviews */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Your reviews
              </div>
              <div className="text-2xl font-bold mb-2 text-blue-600">
                {reviewCount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                Available to analyze
              </div>
            </div>

            {/* Credit Cost */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Analysis cost
              </div>
              <div className="text-2xl font-bold mb-2 text-indigo-600">
                {creditCost} credits
              </div>
              <div className="text-xs text-gray-500">
                {tierLabel}
              </div>
            </div>

            {/* Credit Balance */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Your balance
              </div>
              <div className={`text-2xl font-bold mb-2 ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}>
                {creditBalance} credits
              </div>
              <div className="text-xs text-gray-500">
                {hasEnoughCredits
                  ? `${creditBalance - creditCost} remaining after analysis`
                  : `Need ${creditCost - creditBalance} more`
                }
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {!hasEnoughReviews ? (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xl flex-shrink-0">ℹ️</span>
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
          ) : !hasEnoughCredits ? (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  You need {creditCost} credits to run this analysis, but you only have {creditBalance}.
                </p>
                <Link
                  href="/dashboard/plan"
                  className="inline-block mt-2 text-sm font-medium text-yellow-900 hover:underline"
                >
                  Get more credits →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-xl flex-shrink-0">✅</span>
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  Ready to analyze! This will use {creditCost} credits to analyze {reviewCount.toLocaleString()} reviews.
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
          <div className="absolute right-0 top-8 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="font-semibold mb-2">Credit pricing tiers</div>
            <ul className="space-y-1">
              {getPricingTiersDisplay().map((tier) => (
                <li key={tier.label} className="flex justify-between">
                  <span>{tier.label}</span>
                  <span className="font-medium">{tier.credits} credits</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-700 text-gray-500">
              Includes AI phrase discovery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
