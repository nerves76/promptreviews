"use client";

import React, { useEffect, useState } from "react";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import AnalysisQuotaCard from "./components/AnalysisQuotaCard";
import RunAnalysisButton from "./components/RunAnalysisButton";
import AnalysisResultsView from "./components/AnalysisResultsView";
import {
  EligibilityResponse,
  SentimentAnalysisResult,
  AnalysisResponse,
} from "./types";

export default function SentimentAnalyzerPage() {
  const { loading: authLoading, shouldRedirect } = useAuthGuard();
  const { selectedAccountId } = useAccountData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResponse | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<SentimentAnalysisResult | null>(null);

  // Fetch eligibility data and latest analysis
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedAccountId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch eligibility
        const eligibilityResponse = await fetch(
          `/api/sentiment-analyzer/eligibility?accountId=${selectedAccountId}`
        );

        if (!eligibilityResponse.ok) {
          throw new Error('Failed to fetch eligibility');
        }

        const eligibilityData: EligibilityResponse = await eligibilityResponse.json();
        console.log('[Sentiment Analyzer Page] Eligibility data:', eligibilityData);
        setEligibility(eligibilityData);

        // Fetch latest analysis from history
        const historyResponse = await fetch(
          `/api/sentiment-analyzer/history?accountId=${selectedAccountId}&limit=1`
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.analyses && historyData.analyses.length > 0) {
            const latestAnalysisId = historyData.analyses[0].id;

            // Fetch full analysis details
            const analysisResponse = await fetch(
              `/api/sentiment-analyzer/analysis/${latestAnalysisId}`
            );

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              setLatestAnalysis(analysisData.results);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAccountId]);

  // Handle analysis completion
  const handleAnalysisComplete = (response: AnalysisResponse) => {
    if (response.success) {
      setLatestAnalysis(response.results);
      // Update eligibility with new credit balance from response
      if (response.credits && eligibility) {
        setEligibility({
          ...eligibility,
          creditBalance: response.credits.remaining,
          // Re-check eligibility based on new balance
          eligible: eligibility.reviewCount >= eligibility.minReviewsRequired &&
                    response.credits.remaining >= eligibility.creditCost,
          reason: response.credits.remaining < eligibility.creditCost
            ? 'insufficient_credits'
            : undefined,
        });
      }
    }
  };

  // Handle analysis error
  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (authLoading || loading) {
    return (
      <PageCard>
        <StandardLoader isLoading={true} mode="inline" />
      </PageCard>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  if (error && !eligibility) {
    return (
      <PageCard>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </PageCard>
    );
  }

  return (
    <PageCard
      icon={<Icon name="FaSentimentAnalyzer" className="w-9 h-9 text-slate-blue" size={36} />}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 w-full gap-2">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-blue mb-2">
            Sentiment Analyzer
          </h1>
          <p className="text-gray-600 text-base max-w-2xl">
            Get AI-powered insights from your customer reviews. Discover what customers love,
            areas to improve, actionable ideas to enhance your business, and keywords to add to your library.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quota Card - Always visible */}
      {eligibility && (
        <AnalysisQuotaCard eligibility={eligibility} />
      )}

      {/* Run Analysis Button */}
      {eligibility && !latestAnalysis && selectedAccountId && (
        <div className="my-8 flex justify-center">
          <RunAnalysisButton
            eligibility={eligibility}
            accountId={selectedAccountId}
            onAnalysisComplete={handleAnalysisComplete}
            onAnalysisError={handleAnalysisError}
          />
        </div>
      )}

      {/* Empty State */}
      {!latestAnalysis && eligibility && (
        <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-200">
          <div className="mb-4">
            <svg
              className="w-20 h-20 mx-auto text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No analysis yet
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-4">
            {eligibility.eligible
              ? "Click the button above to run your first sentiment analysis and discover valuable insights from your customer reviews."
              : eligibility.reviewCount < eligibility.minReviewsRequired
              ? `Collect at least ${eligibility.minReviewsRequired} reviews to unlock sentiment analysis.`
              : "You don't have enough credits. Get more credits to run your analysis."}
          </p>
          {eligibility.reviewCount < eligibility.minReviewsRequired && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <a
                href="/dashboard/get-reviews"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
              >
                Collect more reviews
              </a>
              <a
                href="/dashboard/google-business"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors duration-200 font-medium"
              >
                Import from Google →
              </a>
            </div>
          )}
          {eligibility.creditBalance < eligibility.creditCost && eligibility.reviewCount >= eligibility.minReviewsRequired && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <a
                href="/dashboard/plan"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
              >
                Get more credits →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Latest Analysis Results */}
      {latestAnalysis && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Latest Analysis
            </h2>
            {eligibility && selectedAccountId && (
              <RunAnalysisButton
                eligibility={eligibility}
                accountId={selectedAccountId}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisError={handleAnalysisError}
              />
            )}
          </div>
          <AnalysisResultsView results={latestAnalysis} />
        </div>
      )}

      {/* Add responsive bottom padding */}
      <div className="pb-8 md:pb-12 lg:pb-16" />
    </PageCard>
  );
}
