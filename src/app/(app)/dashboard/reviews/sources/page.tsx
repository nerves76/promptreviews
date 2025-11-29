"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";

interface SourceStats {
  source_channel: string;
  label: string;
  count: number;
  percentage: number;
}

interface StatsData {
  stats: {
    week: SourceStats[];
    month: SourceStats[];
    year: SourceStats[];
    all_time: SourceStats[];
  };
  totals: {
    week: number;
    month: number;
    year: number;
    all_time: number;
  };
  labels: Record<string, string>;
}

type TimeRange = "week" | "month" | "year" | "all_time";

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: "This week",
  month: "This month",
  year: "This year",
  all_time: "All time",
};

const SOURCE_ICONS: Record<string, string> = {
  prompt_page_direct: "FaLink",
  prompt_page_qr: "FaQrcode",
  email_campaign: "FaEnvelope",
  sms_campaign: "FaSms",
  widget_cta: "FaCode",
  gbp_import: "FaGoogle",
  social_share: "FaShareAlt",
  referral: "FaUserFriends",
  unknown: "FaQuestion",
};

const SOURCE_COLORS: Record<string, string> = {
  prompt_page_direct: "bg-blue-500",
  prompt_page_qr: "bg-purple-500",
  email_campaign: "bg-green-500",
  sms_campaign: "bg-teal-500",
  widget_cta: "bg-indigo-500",
  gbp_import: "bg-red-500",
  social_share: "bg-pink-500",
  referral: "bg-orange-500",
  unknown: "bg-gray-400",
};

export default function ReviewSourcesPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get("/reviews/sources");
        setData(response);
      } catch (err: any) {
        console.error("Error fetching review sources:", err);
        setError(err.message || "Failed to load review sources");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <StandardLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const stats = data?.stats[selectedRange] || [];
  const total = data?.totals[selectedRange] || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
        >
          <Icon name="FaArrowLeft" size={12} />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Review Sources</h1>
        <p className="text-gray-600 mt-1">
          See where your reviews are coming from
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRange === range
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {TIME_RANGE_LABELS[range]}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <PageCard className="mb-6">
        <div className="text-center py-4">
          <p className="text-gray-600 mb-1">{TIME_RANGE_LABELS[selectedRange]}</p>
          <p className="text-5xl font-bold text-indigo-600">{total}</p>
          <p className="text-gray-500 mt-1">total reviews</p>
        </div>
      </PageCard>

      {/* Source Breakdown */}
      {stats.length === 0 ? (
        <PageCard>
          <div className="text-center py-12 text-gray-500">
            <Icon name="FaChartPie" size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No reviews yet</p>
            <p className="text-sm mt-1">
              Reviews will appear here once they start coming in with source tracking.
            </p>
          </div>
        </PageCard>
      ) : (
        <PageCard>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Breakdown by source
          </h2>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 mb-6">
            {stats.map((stat) => (
              <div key={stat.source_channel}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${SOURCE_COLORS[stat.source_channel] || "bg-gray-400"} flex items-center justify-center`}>
                      <Icon
                        name={SOURCE_ICONS[stat.source_channel] || "FaQuestion"}
                        size={14}
                        className="text-white"
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{stat.count}</span>
                    <span className="text-gray-500 ml-2">({stat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${SOURCE_COLORS[stat.source_channel] || "bg-gray-400"}`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              What these sources mean
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div><strong>Direct link:</strong> Typed URL or bookmark</div>
              <div><strong>QR code:</strong> Scanned a QR code</div>
              <div><strong>Email campaign:</strong> Clicked from an email</div>
              <div><strong>SMS campaign:</strong> Clicked from a text message</div>
              <div><strong>Widget:</strong> Clicked from an embedded widget</div>
              <div><strong>Google import:</strong> Imported from Google Business</div>
              <div><strong>Social share:</strong> Shared link on social media</div>
              <div><strong>Referral:</strong> Referred by another person</div>
              <div><strong>Unknown:</strong> Source not tracked (older reviews)</div>
            </div>
          </div>
        </PageCard>
      )}

      {/* Info Card */}
      <PageCard className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Icon name="FaInfoCircle" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About source tracking</p>
            <p>
              Source tracking was recently added. Reviews collected before this feature
              will show as "Unknown". New reviews will automatically track where they
              came from based on how customers accessed your prompt pages.
            </p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
