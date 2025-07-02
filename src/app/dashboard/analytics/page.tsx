"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuthGuard } from "@/utils/authGuard";
import {
  FaChartLine,
  FaList,
  FaSmile,
  FaMeh,
  FaFrown,
  FaAngry,
  FaGrinStars,
} from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabaseClient";
import { getAccountIdForUser } from "@/utils/accountUtils";
import { isAdmin } from "@/utils/admin";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { trackEvent, GA_EVENTS } from "../../../utils/analytics";
import { useRouter } from "next/navigation";

interface PromptPage {
  id: string;
  slug?: string;
  first_name?: string;
  is_universal?: boolean;
}

interface AnalyticsData {
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
  clicksByDate: Record<string, number>;
  aiGenerations: number;
  copySubmits: number;
  views: number;
  emojiSentiments: Record<string, number>;
  feedbacks: { sentiment: string; feedback: string; date: string }[];
  websiteClicks: number;
  socialClicks: Record<string, number>;
  aiEvents: { date: string; promptPageId: string; platform: string }[];
  copySubmitEvents: { date: string; promptPageId: string; platform: string }[];
  reviewSubmitsAll: number;
  reviewSubmitsWeek: number;
  reviewSubmitsMonth: number;
  reviewSubmitsYear: number;
  verifiedReviewsAll: number;
  verifiedReviewsWeek: number;
  verifiedReviewsMonth: number;
  verifiedReviewsYear: number;
}

// Map sentiment keys to FontAwesome icons and labels
const emojiSentimentMap = [
  {
    key: "excellent",
    icon: <FaGrinStars className="w-8 h-8 text-yellow-400" />,
    label: "Excellent",
  },
  {
    key: "satisfied",
    icon: <FaSmile className="w-8 h-8 text-green-400" />,
    label: "Satisfied",
  },
  {
    key: "neutral",
    icon: <FaMeh className="w-8 h-8 text-gray-400" />,
    label: "Neutral",
  },
  {
    key: "dissatisfied",
    icon: <FaFrown className="w-8 h-8 text-orange-400" />,
    label: "Dissatisfied",
  },
  {
    key: "angry",
    icon: <FaAngry className="w-8 h-8 text-red-400" />,
    label: "Angry",
  },
];

export default function AnalyticsPage() {
  useAuthGuard();
  const [promptPages, setPromptPages] = useState<PromptPage[]>([]);
  const [timeRange, setTimeRange] = useState<
    | "all"
    | "lastYear"
    | "thisYear"
    | "last6Months"
    | "last3Months"
    | "lastMonth"
    | "thisMonth"
    | "thisWeek"
    | "lastWeek"
  >("all");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPromptPages = async () => {
      try {
        const {
          data: { user },
        } = await getUserOrMock(supabase);
        if (!user) return;
        const { data, error } = await supabase
          .from("prompt_pages")
          .select("id, slug, first_name, is_universal")
          .eq("account_id", user.id);
        if (error) throw error;
        setPromptPages(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load prompt pages",
        );
      }
    };
    fetchPromptPages();
  }, [supabase]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data: { user }, error: userError } = await getUserOrMock(supabase);
        
        if (userError || !user) {
          router.push("/auth/sign-in");
          return;
        }

        // Get all prompt page IDs for this account
        const { data: pages } = await supabase
          .from("prompt_pages")
          .select("id, slug, first_name, is_universal")
          .eq("account_id", user.id);
        const pageIds = (pages || []).map((p: any) => p.id);
        if (!pageIds.length) {
          setAnalytics(null);
          setIsLoading(false);
          return;
        }
        // Fetch all analytics events for these prompt pages
        const { data: events, error: eventsError } = await supabase
          .from("analytics_events")
          .select("*")
          .in("prompt_page_id", pageIds);
        if (eventsError) throw eventsError;

        // Fetch all review submissions for these prompt pages
        const { data: reviewSubmissions, error: reviewError } = await supabase
          .from("review_submissions")
          .select("id, prompt_page_id, created_at, verified")
          .in("prompt_page_id", pageIds);
        if (reviewError) throw reviewError;

        // Filter by time range
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();
        const thisDay = now.getDate();
        const thisDayOfWeek = now.getDay();
        switch (timeRange) {
          case "lastYear":
            startDate = new Date(thisYear - 1, 0, 1);
            endDate = new Date(thisYear - 1, 11, 31, 23, 59, 59, 999);
            break;
          case "thisYear":
            startDate = new Date(thisYear, 0, 1);
            endDate = now;
            break;
          case "last6Months":
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            endDate = now;
            break;
          case "last3Months":
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = now;
            break;
          case "lastMonth":
            startDate = new Date(thisYear, thisMonth - 1, 1);
            endDate = new Date(thisYear, thisMonth, 0, 23, 59, 59, 999);
            break;
          case "thisMonth":
            startDate = new Date(thisYear, thisMonth, 1);
            endDate = now;
            break;
          case "thisWeek": {
            // Sunday as first day of week
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setDate(thisDay - thisDayOfWeek);
            firstDayOfWeek.setHours(0, 0, 0, 0);
            startDate = firstDayOfWeek;
            endDate = now;
            break;
          }
          case "lastWeek": {
            // Sunday as first day of week
            const firstDayOfThisWeek = new Date(now);
            firstDayOfThisWeek.setDate(thisDay - thisDayOfWeek);
            firstDayOfThisWeek.setHours(0, 0, 0, 0);
            const firstDayOfLastWeek = new Date(firstDayOfThisWeek);
            firstDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 7);
            const lastDayOfLastWeek = new Date(firstDayOfThisWeek);
            lastDayOfLastWeek.setDate(firstDayOfThisWeek.getDate() - 1);
            lastDayOfLastWeek.setHours(23, 59, 59, 999);
            startDate = firstDayOfLastWeek;
            endDate = lastDayOfLastWeek;
            break;
          }
          default:
            startDate = null;
            endDate = null;
        }
        const filteredEvents = events.filter((e: any) => {
          const eventDate = new Date(e.created_at);
          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
          return true;
        });

        const analyticsData: AnalyticsData = {
          totalClicks: filteredEvents.length,
          clicksByPlatform: {},
          clicksByDate: {},
          aiGenerations: 0,
          copySubmits: 0,
          views: 0,
          emojiSentiments: {},
          feedbacks: [],
          websiteClicks: 0,
          socialClicks: {},
          aiEvents: [],
          copySubmitEvents: [],
          reviewSubmitsAll: 0,
          reviewSubmitsWeek: 0,
          reviewSubmitsMonth: 0,
          reviewSubmitsYear: 0,
          verifiedReviewsAll: 0,
          verifiedReviewsWeek: 0,
          verifiedReviewsMonth: 0,
          verifiedReviewsYear: 0,
        };

        // Timeline data for chart
        const timelineMap: Record<string, number> = {};

        filteredEvents.forEach((event: any) => {
          // Count by platform
          if (event.platform) {
            analyticsData.clicksByPlatform[event.platform] =
              (analyticsData.clicksByPlatform[event.platform] || 0) + 1;
          }

          // Count by date (for table)
          const date = new Date(event.created_at).toLocaleDateString();
          analyticsData.clicksByDate[date] =
            (analyticsData.clicksByDate[date] || 0) + 1;

          // Timeline for review_submitted
          if (event.event_type === "review_submitted") {
            const d = new Date(event.created_at);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
            timelineMap[key] = (timelineMap[key] || 0) + 1;
          }

          // Count event types
          switch (event.event_type) {
            case "generate_with_ai":
              analyticsData.aiGenerations++;
              analyticsData.aiEvents.push({
                date: event.created_at,
                promptPageId: event.prompt_page_id,
                platform: event.platform || "",
              });
              break;
            case "copy_submit":
              analyticsData.copySubmits++;
              analyticsData.copySubmitEvents.push({
                date: event.created_at,
                promptPageId: event.prompt_page_id,
                platform: event.platform || "",
              });
              break;
            case "emoji_sentiment":
              if (event.emoji_sentiment) {
                analyticsData.emojiSentiments[event.emoji_sentiment] =
                  (analyticsData.emojiSentiments[event.emoji_sentiment] || 0) +
                  1;
              }
              break;
            case "constructive_feedback":
              analyticsData.feedbacks.push({
                sentiment: event.emoji_sentiment || event.sentiment || "",
                feedback: event.feedback || (event.metadata?.feedback ?? ""),
                date: event.created_at,
              });
              break;
            default:
              break;
          }
        });

        // Attach review submission stats to analyticsData
        analyticsData.reviewSubmitsAll = filteredEvents.filter(
          (e: any) => e.event_type === "review_submitted",
        ).length;
        analyticsData.reviewSubmitsWeek = filteredEvents.filter(
          (e: any) =>
            e.event_type === "review_submitted" &&
            (now.getTime() - new Date(e.created_at).getTime()) /
              (1000 * 60 * 60 * 24) <=
              7,
        ).length;
        analyticsData.reviewSubmitsMonth = filteredEvents.filter(
          (e: any) =>
            e.event_type === "review_submitted" &&
            (now.getTime() - new Date(e.created_at).getTime()) /
              (1000 * 60 * 60 * 24) <=
              30,
        ).length;
        analyticsData.reviewSubmitsYear = filteredEvents.filter(
          (e: any) =>
            e.event_type === "review_submitted" &&
            (now.getTime() - new Date(e.created_at).getTime()) /
              (1000 * 60 * 60 * 24) <=
              365,
        ).length;

        // Filter review submissions by date range for verified stats
        const filteredReviews = reviewSubmissions.filter((r: any) => {
          const reviewDate = new Date(r.created_at);
          if (startDate && reviewDate < startDate) return false;
          if (endDate && reviewDate > endDate) return false;
          return true;
        });
        analyticsData.verifiedReviewsAll = filteredReviews.filter((r: any) => r.verified).length;
        analyticsData.verifiedReviewsWeek = filteredReviews.filter(
          (r: any) =>
            r.verified &&
            (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7,
        ).length;
        analyticsData.verifiedReviewsMonth = filteredReviews.filter(
          (r: any) =>
            r.verified &&
            (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 30,
        ).length;
        analyticsData.verifiedReviewsYear = filteredReviews.filter(
          (r: any) =>
            r.verified &&
            (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 365,
        ).length;

        // Prepare timeline data for chart (sorted by month)
        const timelineData = Object.entries(timelineMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }));

        (analyticsData as any).timelineData = timelineData;

        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Supabase analytics error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [promptPages, timeRange, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageCard icon={<FaChartLine className="w-9 h-9 text-slate-blue" />}>
      <div className="flex items-center justify-between mt-2 mb-8">
        <div className="flex flex-col mt-0 md:mt-[-2px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Analytics
          </h1>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <label className="text-base font-semibold text-gray-700">
          Time Range:
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="all">All Time</option>
          <option value="lastYear">Last Year</option>
          <option value="thisYear">This Year</option>
          <option value="last6Months">Last 6 Months</option>
          <option value="last3Months">Last 3 Months</option>
          <option value="lastMonth">Last Month</option>
          <option value="thisMonth">This Month</option>
          <option value="thisWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
        </select>
      </div>

      {analytics && (analytics as any).timelineData && (
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Reviews Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={(analytics as any).timelineData}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => {
                  const [year, m] = month.split("-");
                  return format(
                    new Date(Number(year), Number(m) - 1, 1),
                    "MMM yyyy",
                  );
                }}
                label={{ value: "Month", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                allowDecimals={false}
                label={{
                  value: "Reviews",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Emoji Sentiment Row */}
      {analytics && (
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Emoji Sentiment</h3>
          <div className="flex flex-row items-end justify-center gap-8">
            {emojiSentimentMap.map(({ key, icon, label }) => (
              <div key={key} className="flex flex-col items-center">
                <div title={label}>{icon}</div>
                <span className="mt-2 text-xl font-bold text-slate-blue">
                  {analytics.emojiSentiments[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">
              Total Reviews
            </p>
            <p className="mt-2 text-3xl font-semibold text-indigo-900">
              {analytics.reviewSubmitsAll}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700">
              Verified Reviews
            </p>
            <p className="mt-2 text-3xl font-semibold text-green-900">
              {analytics.verifiedReviewsAll}
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">
              AI Generations
            </p>
            <p className="mt-2 text-3xl font-semibold text-indigo-900">
              {analytics.aiGenerations}
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-600">
              Copy & Submits
            </p>
            <p className="mt-2 text-3xl font-semibold text-indigo-900">
              {analytics.copySubmits}
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-indigo-600 mb-4">
              Platform Distribution
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.clicksByPlatform).map(
                ([platform, count]) => (
                  <div
                    key={platform}
                    className="bg-white rounded p-3 shadow-sm"
                  >
                    <p className="text-sm text-gray-500">{platform}</p>
                    <p className="text-lg font-semibold text-indigo-900">
                      {count}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium text-indigo-600 mb-4">
              Recent Activity
            </p>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics.clicksByDate)
                    .sort(
                      (a, b) =>
                        new Date(b[0]).getTime() - new Date(a[0]).getTime(),
                    )
                    .slice(0, 7)
                    .map(([date, count]) => (
                      <tr key={date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {analytics && analytics.aiEvents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Generate with AI Events</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th>Date</th>
                <th>Prompt Page</th>
                <th>Page Type</th>
                <th>Review Platform</th>
              </tr>
            </thead>
            <tbody>
              {analytics.aiEvents.map((ev) => {
                const page = promptPages.find((p) => p.id === ev.promptPageId);
                return (
                  <tr key={ev.date + ev.promptPageId + ev.platform}>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{page?.slug || page?.first_name || ev.promptPageId}</td>
                    <td>{page?.is_universal ? "Universal" : "Custom"}</td>
                    <td>{ev.platform}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {analytics && analytics.copySubmitEvents.length > 0 && (
        <div className="mb-16">
          <h3 className="text-lg font-bold mb-2">Copy & Submit Events</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prompt Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review Platform
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.copySubmitEvents.map((ev) => {
                const page = promptPages.find((p) => p.id === ev.promptPageId);
                return (
                  <tr key={ev.date + ev.promptPageId + ev.platform}>
                    <td>{new Date(ev.date).toLocaleString()}</td>
                    <td>{page?.slug || page?.first_name || ev.promptPageId}</td>
                    <td>{page?.is_universal ? "Universal" : "Custom"}</td>
                    <td>{ev.platform}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageCard>
  );
}
