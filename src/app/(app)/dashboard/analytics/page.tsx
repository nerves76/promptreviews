"use client";

import { useState, useEffect } from "react";
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { useAuth } from "@/auth";
import Icon from "@/components/Icon";
import { getAccountIdForUser } from "@/auth/utils/accounts";
import { isAdmin } from "@/utils/admin";
import { EMOJI_SENTIMENT_LABELS, EMOJI_SENTIMENT_ICONS } from "@/app/(app)/components/prompt-modules/emojiSentimentConfig";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
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
import { trackEvent, GA_EVENTS } from "@/utils/analytics";
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
  grammarFixes: number;
  totalAIUsage: number;
  copySubmits: number;
  views: number;
  emojiSentiments: Record<string, number>;
  emojiSentimentChoices: Record<string, { public: number; private: number }>;
  feedbacks: { sentiment: string; feedback: string; date: string }[];
  websiteClicks: number;
  socialClicks: Record<string, number>;
  aiEvents: { date: string; promptPageId: string; platform: string }[];
  grammarFixEvents: { date: string; promptPageId: string; platform: string }[];
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

// Map sentiment keys to FontAwesome icons and labels - uses actual config from emojiSentimentConfig.ts
const emojiSentimentMap = EMOJI_SENTIMENT_LABELS.map((label, index) => {
  const iconConfig = EMOJI_SENTIMENT_ICONS[index];
  const IconComponent = iconConfig.icon;
  
  return {
    key: label.toLowerCase(),
    icon: <IconComponent className={`w-8 h-8 ${iconConfig.color}`} size={32} />,
    label: label,
  };
});

export default function AnalyticsPage() {
  const supabase = createClient();

  useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const { accountLoading } = useAuth();
  
  // Debug logging for account selection
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
  const [locationNames, setLocationNames] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'universal' | string>('all');

  useEffect(() => {
    const fetchPromptPages = async () => {
      
      // Wait for account selection to complete
      if (accountLoading || !selectedAccountId) {
        return;
      }
      
      try {
        
        const { data, error } = await supabase
          .from("prompt_pages")
          .select("id, slug, first_name, is_universal")
          .eq("account_id", selectedAccountId);
        if (error) throw error;
        
        setPromptPages(data || []);
      } catch (err) {
        console.error('❌ Analytics Page - Error loading prompt pages:', err);
        setError(
          err instanceof Error ? err.message : "Failed to load prompt pages",
        );
      }
    };
    fetchPromptPages();
  }, [supabase, accountLoading, selectedAccountId]);

  useEffect(() => {
    const fetchLocationNames = async () => {
      try {
        const { data: locations, error } = await supabase
          .from('business_locations')
          .select('name');
        if (error) throw error;
        setLocationNames(locations.map((loc: any) => loc.name));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load location names',
        );
      }
    };
    fetchLocationNames();
  }, [supabase]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  useEffect(() => {
    const loadAnalytics = async () => {

      // Wait for account selection to complete
      if (accountLoading || !selectedAccountId) {
        return;
      }

      try {

        // Get all prompt page IDs for this account
        const { data: pages } = await supabase
          .from("prompt_pages")
          .select("id, slug, first_name, is_universal")
          .eq("account_id", selectedAccountId);
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
        // Exclude imported reviews - only count reviews gained through the app
        const { data: reviewSubmissions, error: reviewError } = await supabase
          .from("review_submissions")
          .select("id, prompt_page_id, created_at, verified")
          .in("prompt_page_id", pageIds)
          .or("imported_from_google.is.null,imported_from_google.eq.false");
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
          if (filter === 'universal' && !e.is_universal) return false;
          if (filter !== 'all' && filter !== 'universal' && e.location_name !== filter) return false;
          return true;
        });

        const analyticsData: AnalyticsData = {
          totalClicks: filteredEvents.length,
          clicksByPlatform: {},
          clicksByDate: {},
          aiGenerations: 0,
          grammarFixes: 0,
          totalAIUsage: 0,
          copySubmits: 0,
          views: 0,
          emojiSentiments: {},
          emojiSentimentChoices: {},
          feedbacks: [],
          websiteClicks: 0,
          socialClicks: {},
          aiEvents: [],
          grammarFixEvents: [],
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
          // Count by platform - only count non-view events for platform distribution
          if (event.platform && event.event_type !== "view") {
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
            case "view":
              // Count page views
              analyticsData.views++;
              // Also count web platform views for the "Prompt Page Visits" metric
              if (event.platform === "web") {
                analyticsData.clicksByPlatform["web"] = 
                  (analyticsData.clicksByPlatform["web"] || 0) + 1;
              }
              break;
            case "generate_with_ai":
            case "ai_generate":
              analyticsData.aiGenerations++;
              analyticsData.totalAIUsage++;
              analyticsData.aiEvents.push({
                date: event.created_at,
                promptPageId: event.prompt_page_id,
                platform: event.platform || "",
              });
              break;
            case "grammar_fix":
              analyticsData.grammarFixes++;
              analyticsData.totalAIUsage++;
              analyticsData.grammarFixEvents.push({
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
              // Handle both direct event fields and metadata
              const sentiment = event.emoji_sentiment || event.metadata?.emoji_sentiment;
              if (sentiment) {
                analyticsData.emojiSentiments[sentiment] =
                  (analyticsData.emojiSentiments[sentiment] || 0) + 1;
              }
              break;
            case "emoji_sentiment_choice":
              if (event.emoji_sentiment && event.choice) {
                // Initialize sentiment choice tracking if not exists
                if (!analyticsData.emojiSentimentChoices[event.emoji_sentiment]) {
                  analyticsData.emojiSentimentChoices[event.emoji_sentiment] = { public: 0, private: 0 };
                }
                // Increment the appropriate choice counter
                if (event.choice === 'public') {
                  analyticsData.emojiSentimentChoices[event.emoji_sentiment].public += 1;
                } else if (event.choice === 'private') {
                  analyticsData.emojiSentimentChoices[event.emoji_sentiment].private += 1;
                }
              }
              break;
            case "feature_used":
              // Handle emoji sentiment events stored as feature_used
              if (event.metadata?.feature === 'emoji_sentiment' && event.metadata?.emoji_sentiment) {
                const sentiment = event.metadata.emoji_sentiment;
                analyticsData.emojiSentiments[sentiment] =
                  (analyticsData.emojiSentiments[sentiment] || 0) + 1;
              }
              // Handle emoji sentiment choices stored as feature_used events
              else if (event.metadata?.feature === 'emoji_sentiment_choice' && 
                  event.metadata?.emoji_sentiment && 
                  event.metadata?.choice) {
                const sentiment = event.metadata.emoji_sentiment;
                const choice = event.metadata.choice;
                
                // Initialize sentiment choice tracking if not exists
                if (!analyticsData.emojiSentimentChoices[sentiment]) {
                  analyticsData.emojiSentimentChoices[sentiment] = { public: 0, private: 0 };
                }
                // Increment the appropriate choice counter
                if (choice === 'public') {
                  analyticsData.emojiSentimentChoices[sentiment].public += 1;
                } else if (choice === 'private') {
                  analyticsData.emojiSentimentChoices[sentiment].private += 1;
                }
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
        console.error("❌ Analytics Page - Supabase analytics error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, [promptPages, timeRange, router, filter, accountLoading, selectedAccountId, supabase]);

  if (isLoading) {
    return (
      <PageCard icon={<Icon name="FaChartLine" className="w-9 h-9 text-slate-blue" size={36} />}>
        <StandardLoader isLoading={true} mode="inline" />
      </PageCard>
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
          <PageCard icon={<Icon name="FaChartLine" className="w-9 h-9 text-slate-blue" size={36} />}>
      <div className="flex items-center justify-between mt-2 mb-8">
        <div className="flex flex-col mt-0 md:mt-[-2px]">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Analytics
          </h1>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
        <label className="text-base font-semibold text-gray-700">
          Time range:
        </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="all">All time</option>
          <option value="lastYear">Last year</option>
          <option value="thisYear">This year</option>
          <option value="last6Months">Last 6 months</option>
          <option value="last3Months">Last 3 months</option>
          <option value="lastMonth">Last month</option>
          <option value="thisMonth">This month</option>
          <option value="thisWeek">This week</option>
          <option value="lastWeek">Last week</option>
        </select>
      </div>

      <div className="filter-container mb-8" style={{ maxWidth: '300px' }}>
        <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
          Filter by:
        </label>
        <select
          id="filter"
          name="filter"
          value={filter}
          onChange={handleFilterChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-slate-blue focus:border-slate-blue sm:text-sm rounded-md"
        >
          <option value="all">All</option>
          <option value="universal">Universal prompt page</option>
          {locationNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
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

      {/* Negative Emoji Sentiment Choices */}
      {analytics && Object.keys(analytics.emojiSentimentChoices).length > 0 && (
        <div className="mb-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Negative Sentiment: Public vs Private Choice</h3>
          <p className="text-sm text-gray-600 mb-6">
            When users select negative emojis (neutral, unsatisfied, frustrated), they choose to either post publicly or send private feedback.
          </p>
          <div className="space-y-6">
            {Object.entries(analytics.emojiSentimentChoices).map(([sentiment, choices]) => {
              const sentimentData = emojiSentimentMap.find(s => s.key === sentiment);
              const total = choices.public + choices.private;
              const publicPercentage = total > 0 ? Math.round((choices.public / total) * 100) : 0;
              const privatePercentage = total > 0 ? Math.round((choices.private / total) * 100) : 0;
              
              return (
                <div key={sentiment} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {sentimentData && sentimentData.icon}
                    <span className="font-medium capitalize">{sentiment}</span>
                    <span className="text-sm text-gray-500">({total} total choices)</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Public Reviews</span>
                        <span className="text-lg font-bold text-slate-blue">{choices.public}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">{publicPercentage}% chose to post publicly</div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Private Feedback</span>
                        <span className="text-lg font-bold text-blue-600">{choices.private}</span>
                      </div>
                      <div className="mt-1 text-xs text-blue-600">{privatePercentage}% chose private feedback</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
              Copy & Submits
            </p>
            <p className="mt-2 text-3xl font-semibold text-indigo-900">
              {analytics.copySubmits}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">
              Prompt Page Visits
            </p>
            <p className="mt-2 text-3xl font-semibold text-blue-900">
              {analytics.clicksByPlatform.web || 0}
            </p>
          </div>

          {Object.keys(analytics.clicksByPlatform).filter(platform => platform !== 'web').length > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-indigo-600 mb-4">
                Platform Distribution
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.clicksByPlatform)
                  .filter(([platform]) => platform !== 'web')
                  .map(([platform, count]) => (
                    <div
                      key={platform}
                      className="bg-white rounded p-3 shadow-sm"
                    >
                      <p className="text-sm text-gray-500">{platform}</p>
                      <p className="text-lg font-semibold text-indigo-900">
                        {count}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

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

      {/* AI Features Section */}
      {analytics && (
        <div className="mt-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">AI Features Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-2">
                <Icon name="FaRobot" className="w-5 h-5 text-purple-600 mr-2" size={20} />
                <p className="text-sm font-medium text-purple-600">AI Generate</p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {analytics.aiGenerations}
              </p>
              <p className="text-xs text-purple-600 mt-1">Review generations</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-2">
                <Icon name="FaSpellCheck" className="w-5 h-5 text-purple-600 mr-2" size={20} />
                <p className="text-sm font-medium text-purple-600">Grammar Fix</p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {analytics.grammarFixes}
              </p>
              <p className="text-xs text-purple-600 mt-1">Grammar corrections</p>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-6 border border-purple-300">
              <div className="flex items-center mb-2">
                <Icon name="FaMagic" className="w-5 h-5 text-purple-700 mr-2" size={20} />
                <p className="text-sm font-medium text-purple-700">Total AI Usage</p>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {analytics.totalAIUsage}
              </p>
              <p className="text-xs text-purple-700 mt-1">All AI features combined</p>
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
      
      {analytics && analytics.grammarFixEvents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-2">Grammar Fix Events</h3>
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
              {analytics.grammarFixEvents.map((ev) => {
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
