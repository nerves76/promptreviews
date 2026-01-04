"use client";

import React from "react";
import { SENTIMENT_ANALYSIS_TIERS } from "@/features/sentiment-analyzer/services/credits";

interface ReviewLimitSelectorProps {
  /** Total reviews available to analyze */
  totalReviews: number;
  /** Currently selected limit */
  selectedLimit: number;
  /** Callback when limit changes */
  onChange: (limit: number) => void;
  /** Current credit balance */
  creditBalance: number;
  /** Whether selector is disabled (e.g., during analysis) */
  disabled?: boolean;
}

interface TierOption {
  limit: number;
  credits: number;
  label: string;
  canAfford: boolean;
}

/**
 * Generates tier options based on user's total review count
 * Only shows tiers up to their total reviews, plus an "all" option if needed
 */
function generateTierOptions(totalReviews: number, creditBalance: number): TierOption[] {
  const options: TierOption[] = [];

  for (const tier of SENTIMENT_ANALYSIS_TIERS) {
    if (tier.maxReviews === Infinity) continue;

    // Only show tiers that are less than total reviews
    if (tier.maxReviews < totalReviews) {
      options.push({
        limit: tier.maxReviews,
        credits: tier.credits,
        label: `${tier.maxReviews.toLocaleString()} most recent`,
        canAfford: creditBalance >= tier.credits,
      });
    }
  }

  // Always add an "all reviews" option for the user's actual count
  const allReviewsTier = SENTIMENT_ANALYSIS_TIERS.find(
    (t) => totalReviews <= t.maxReviews
  );

  if (allReviewsTier) {
    options.push({
      limit: totalReviews,
      credits: allReviewsTier.credits,
      label: `All ${totalReviews.toLocaleString()} reviews`,
      canAfford: creditBalance >= allReviewsTier.credits,
    });
  }

  return options;
}

export default function ReviewLimitSelector({
  totalReviews,
  selectedLimit,
  onChange,
  creditBalance,
  disabled = false,
}: ReviewLimitSelectorProps) {
  const options = generateTierOptions(totalReviews, creditBalance);

  // Don't show selector if there's only one option
  if (options.length <= 1) {
    return null;
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Reviews to analyze
      </label>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedLimit === option.limit;
          const isDisabled = disabled || !option.canAfford;

          return (
            <label
              key={option.limit}
              className={`
                flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected
                  ? "border-indigo-500 bg-indigo-50"
                  : isDisabled
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="reviewLimit"
                  value={option.limit}
                  checked={isSelected}
                  onChange={() => onChange(option.limit)}
                  disabled={isDisabled}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className={`text-sm ${isDisabled ? "text-gray-400" : "text-gray-900"}`}>
                  {option.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isSelected
                      ? "text-indigo-600"
                      : isDisabled
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {option.credits} credits
                </span>
                {!option.canAfford && (
                  <span className="text-xs text-red-500">(insufficient)</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
