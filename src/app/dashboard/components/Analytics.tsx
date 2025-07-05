"use client";

import { useEffect, useState } from "react";
import { supabase, type ReviewSubmission } from "@/utils/supabaseClient"; // 🔧 CONSOLIDATED: Combined imports

interface AnalyticsData {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByDate: Record<string, number>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data: submissions, error: fetchError } = await supabase
          .from("review_submissions")
          .select("*")
          .order("submitted_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Process the data
        const analyticsData: AnalyticsData = {
          totalClicks: submissions.length,
          clicksByPlatform: {},
          clicksByDate: {},
        };

        submissions.forEach((submission: ReviewSubmission) => {
          // Count by platform
          analyticsData.clicksByPlatform[submission.platform] =
            (analyticsData.clicksByPlatform[submission.platform] || 0) + 1;

          // Count by date
          const date = new Date(submission.submitted_at).toLocaleDateString();
          analyticsData.clicksByDate[date] =
            (analyticsData.clicksByDate[date] || 0) + 1;
        });

        setAnalytics(analyticsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || "Failed to load analytics"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Review Analytics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">Total Clicks</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-900">
              {analytics.totalClicks}
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">Platforms</p>
            <div className="mt-2 space-y-2">
              {Object.entries(analytics.clicksByPlatform).map(
                ([platform, count]) => (
                  <div key={platform} className="flex justify-between">
                    <span className="text-indigo-900">{platform}</span>
                    <span className="font-semibold text-indigo-900">
                      {count}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">
              Recent Activity
            </p>
            <div className="mt-2 space-y-2">
              {Object.entries(analytics.clicksByDate)
                .slice(0, 5)
                .map(([date, count]) => (
                  <div key={date} className="flex justify-between">
                    <span className="text-indigo-900">{date}</span>
                    <span className="font-semibold text-indigo-900">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
