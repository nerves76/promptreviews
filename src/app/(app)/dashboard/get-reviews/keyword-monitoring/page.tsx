"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";
import StandardLoader from "@/app/(app)/components/StandardLoader";
import { useAuthGuard } from "@/utils/authGuard";
import { useAccountData, useAuthLoading } from "@/auth/hooks/granularAuthHooks";
import { apiClient } from "@/utils/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface KeywordResult {
  keyword: string;
  mentionCount: number;
  reviewIds: string[];
  excerpts: Array<{
    reviewId: string;
    excerpt: string;
  }>;
}

interface AnalysisResult {
  id: string;
  runDate: string;
  reviewCountAnalyzed: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  keywordsAnalyzed: string[];
  results: KeywordResult[];
  totalMentions: number;
  keywordsWithMentions: number;
}

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

interface KeywordSuggestion {
  keyword: string;
  count: number;
  sampleExcerpts: string[];
}

// Colors for chart lines
const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

export default function KeywordTrackerPage() {
  const { loading: authLoading, shouldRedirect } = useAuthGuard();
  const { selectedAccountId } = useAccountData();
  const { isLoading: authInitializing } = useAuthLoading();
  const hasAccount = Boolean(selectedAccountId);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);

  // Chart state - which keywords are visible
  const [visibleKeywords, setVisibleKeywords] = useState<Set<string>>(new Set());

  // Suggestions state
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState<string | null>(null);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);

  // Usage tracking state
  const [usageThisMonth, setUsageThisMonth] = useState<number>(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(3);

  // Load keywords from business data via API
  const [keywordsLoading, setKeywordsLoading] = useState(true);

  useEffect(() => {
    const loadKeywords = async () => {
      if (!hasAccount || !selectedAccountId) {
        setKeywords([]);
        setKeywordsLoading(false);
        return;
      }

      try {
        // API returns business object directly (not wrapped)
        const business = await apiClient.get(`/businesses/${selectedAccountId}`) as {
          keywords?: string | string[];
        };

        if (business?.keywords) {
          const kws = Array.isArray(business.keywords)
            ? business.keywords
            : typeof business.keywords === 'string' && business.keywords
              ? business.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
              : [];
          setKeywords(kws);
        } else {
          setKeywords([]);
        }
      } catch (error) {
        console.error("Failed to load keywords:", error);
        setKeywords([]);
      } finally {
        setKeywordsLoading(false);
      }
    };

    loadKeywords();
  }, [hasAccount, selectedAccountId]);

  // Auto-expand the add panel when there are no keywords
  useEffect(() => {
    if (!keywordsLoading && keywords.length === 0) {
      setKeywordsExpanded(true);
    }
  }, [keywordsLoading, keywords.length]);

  // Load usage data
  useEffect(() => {
    const loadUsage = async () => {
      if (!hasAccount) return;

      try {
        const data = await apiClient.get('/keyword-tracker/usage') as {
          success: boolean;
          usageThisMonth: number;
          monthlyLimit: number;
        };

        if (data.success) {
          setUsageThisMonth(data.usageThisMonth);
          setMonthlyLimit(data.monthlyLimit);
        }
      } catch (error) {
        console.error("Failed to load usage data:", error);
      }
    };

    loadUsage();
  }, [hasAccount, selectedAccountId]);

  // Load analysis history
  useEffect(() => {
    const loadHistory = async () => {
      if (!hasAccount) {
        setAnalysisHistory([]);
        setLatestAnalysis(null);
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      try {
        const data = await apiClient.get('/keyword-tracker/history?limit=20') as {
          success: boolean;
          analyses: AnalysisResult[];
        };

        if (data.success && data.analyses) {
          setAnalysisHistory(data.analyses);
          if (data.analyses.length > 0) {
            setLatestAnalysis(data.analyses[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load analysis history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [hasAccount, selectedAccountId]);

  // Auto-select top 10 keywords by total mentions when history loads
  useEffect(() => {
    if (analysisHistory.length === 0 || !latestAnalysis) return;

    // Get all unique keywords and their total mentions across all analyses
    const keywordTotals = new Map<string, number>();
    analysisHistory.forEach(analysis => {
      analysis.results.forEach(result => {
        const current = keywordTotals.get(result.keyword) || 0;
        keywordTotals.set(result.keyword, current + result.mentionCount);
      });
    });

    // Sort by total mentions and take top 10
    const sortedKeywords = [...keywordTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);

    setVisibleKeywords(new Set(sortedKeywords));
  }, [analysisHistory, latestAnalysis]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (analysisHistory.length === 0) return [];

    // Reverse to show oldest first (left to right)
    return [...analysisHistory].reverse().map(analysis => {
      const dataPoint: Record<string, string | number> = {
        date: new Date(analysis.runDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: analysis.runDate,
      };

      analysis.results.forEach(result => {
        dataPoint[result.keyword] = result.mentionCount;
      });

      return dataPoint;
    });
  }, [analysisHistory]);

  // Get all unique keywords from history
  const allKeywordsInHistory = useMemo(() => {
    const keywordSet = new Set<string>();
    analysisHistory.forEach(analysis => {
      analysis.results.forEach(result => {
        keywordSet.add(result.keyword);
      });
    });
    return [...keywordSet];
  }, [analysisHistory]);

  // Handle adding new keywords
  const MAX_KEYWORDS = 20;

  const handleKeywordsChange = async (newKeywords: string[]) => {
    if (!hasAccount || !selectedAccountId) return;

    // Only allow adding, not removing (removal done in Prompt Page Settings)
    const addedKeywords = newKeywords.filter(k => !keywords.includes(k));
    if (addedKeywords.length === 0 && newKeywords.length < keywords.length) {
      setStatusMessage({
        type: "error",
        text: "To remove keywords, go to Prompt page settings.",
      });
      return;
    }

    // Enforce cap
    if (newKeywords.length > MAX_KEYWORDS) {
      setStatusMessage({
        type: "error",
        text: `You can track up to ${MAX_KEYWORDS} keywords. Remove some to add more.`,
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      await apiClient.put(`/businesses/${selectedAccountId}`, {
        keywords: newKeywords,
      });

      setKeywords(newKeywords);

      if (addedKeywords.length > 0) {
        setStatusMessage({
          type: "success",
          text: `Added ${addedKeywords.length} keyword${addedKeywords.length > 1 ? 's' : ''}.`,
        });
      }
    } catch (error) {
      console.error("Failed to save keywords:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save keywords",
      });
    } finally {
      setSaving(false);
    }
  };

  // Run keyword analysis
  const handleRunAnalysis = async () => {
    if (!hasAccount || keywords.length === 0) return;

    // Check if at limit before making the request
    if (usageThisMonth >= monthlyLimit) {
      setStatusMessage({
        type: "error",
        text: `You've used all ${monthlyLimit} analyses this month. Your limit resets on the 1st of next month.`,
      });
      return;
    }

    setAnalyzing(true);
    setStatusMessage(null);

    try {
      const data = await apiClient.post('/keyword-tracker/analyze', {}) as {
        success: boolean;
        analysis: AnalysisResult;
        usageThisMonth?: number;
        monthlyLimit?: number;
        error?: string;
      };

      if (data.success && data.analysis) {
        setLatestAnalysis(data.analysis);
        setAnalysisHistory(prev => [data.analysis, ...prev]);
        // Update usage from response
        if (data.usageThisMonth !== undefined) {
          setUsageThisMonth(data.usageThisMonth);
        }
        if (data.monthlyLimit !== undefined) {
          setMonthlyLimit(data.monthlyLimit);
        }
        setStatusMessage({
          type: "success",
          text: `Analysis complete! Scanned ${data.analysis.reviewCountAnalyzed} reviews.`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Analysis failed",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Toggle keyword visibility in chart
  const toggleKeywordVisibility = (keyword: string) => {
    setVisibleKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  // Fetch AI keyword suggestions
  const handleGetSuggestions = async () => {
    if (!hasAccount) return;

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const data = await apiClient.post('/keyword-tracker/suggest', {}) as {
        success: boolean;
        suggestions: KeywordSuggestion[];
        message?: string;
        error?: string;
      };

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        if (data.suggestions.length === 0) {
          setStatusMessage({
            type: "success",
            text: data.message || "No new keyword suggestions found.",
          });
        }
      } else {
        throw new Error(data.error || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to get suggestions",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Add a suggested keyword
  const handleAddSuggestion = async (keyword: string) => {
    if (!hasAccount || !selectedAccountId) return;

    // Check cap before adding
    if (keywords.length >= MAX_KEYWORDS) {
      setStatusMessage({
        type: "error",
        text: `You can track up to ${MAX_KEYWORDS} keywords. Remove some to add more.`,
      });
      return;
    }

    setAddingKeyword(keyword);

    try {
      const newKeywords = [...keywords, keyword];
      await apiClient.put(`/businesses/${selectedAccountId}`, {
        keywords: newKeywords,
      });

      setKeywords(newKeywords);

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.keyword !== keyword));

      setStatusMessage({
        type: "success",
        text: `Added "${keyword}" to your keywords.`,
      });
    } catch (error) {
      console.error("Failed to add keyword:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to add keyword",
      });
    } finally {
      setAddingKeyword(null);
    }
  };

  // Remove a keyword
  const [removingKeyword, setRemovingKeyword] = useState<string | null>(null);

  const handleRemoveKeyword = async (keyword: string) => {
    if (!hasAccount || !selectedAccountId) return;

    setRemovingKeyword(keyword);

    try {
      const newKeywords = keywords.filter(k => k !== keyword);
      await apiClient.put(`/businesses/${selectedAccountId}`, {
        keywords: newKeywords,
      });

      setKeywords(newKeywords);

      setStatusMessage({
        type: "success",
        text: `Removed "${keyword}" from your keywords.`,
      });
    } catch (error) {
      console.error("Failed to remove keyword:", error);
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to remove keyword",
      });
    } finally {
      setRemovingKeyword(null);
    }
  };

  if (authLoading || authInitializing || keywordsLoading) {
    return (
      <PageCard>
        <StandardLoader isLoading mode="inline" />
      </PageCard>
    );
  }

  if (shouldRedirect) {
    return null;
  }

  return (
    <PageCard icon={<Icon name="FaKey" className="w-8 h-8 text-slate-blue" size={32} />}>
      {/* Header with Run Analysis button */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-blue mb-3">Review Keyword Tracker</h1>
          <p className="text-gray-600 max-w-2xl">
            Track when customers mention your keywords in reviews and see trends over time.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleRunAnalysis}
            disabled={!hasAccount || analyzing || keywords.length === 0 || usageThisMonth >= monthlyLimit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-blue/20 hover:bg-slate-blue/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {analyzing ? (
              <>
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                Analyzing...
              </>
            ) : (
              'Run analysis'
            )}
          </button>
          <span className={`text-xs ${usageThisMonth >= monthlyLimit ? 'text-red-500' : 'text-gray-500'}`}>
            {usageThisMonth} of {monthlyLimit} used this month
          </span>
        </div>
      </div>

      {!hasAccount && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-amber-900 text-sm mb-6">
          Add a business profile to unlock keyword tracking.
        </div>
      )}

      {statusMessage && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main content area */}
      {historyLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-8">
          <StandardLoader isLoading mode="inline" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Keywords two-column list */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-blue">Keywords</h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {keywords.length} tracked
                </span>
              </div>
              <div className="flex items-center gap-3">
                {latestAnalysis && (
                  <span className="text-xs text-gray-400">
                    Last analyzed: {formatDate(latestAnalysis.runDate)}
                  </span>
                )}
                <button
                  onClick={() => setKeywordsExpanded(!keywordsExpanded)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-blue bg-slate-blue/10 rounded-full hover:bg-slate-blue/20 transition-all"
                >
                  <Icon name={keywordsExpanded ? "FaTimes" : "FaPlus"} className="w-3 h-3" size={12} />
                  {keywordsExpanded ? "Close" : "Add Keywords"}
                </button>
              </div>
            </div>

            {keywords.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">
                Add keywords below to start tracking mentions in your reviews.
              </p>
            ) : !latestAnalysis ? (
              <p className="text-sm text-gray-500 mb-4">
                Click "Run analysis" to see mention counts for each keyword.
              </p>
            ) : null}

            {keywords.length > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {keywords.map((keyword) => {
                  const result = latestAnalysis?.results.find(r => r.keyword === keyword);
                  const count = result?.mentionCount;
                  return (
                    <div
                      key={keyword}
                      className="flex items-center justify-between py-2 border-b border-slate-50 group"
                    >
                      <span className="text-sm text-gray-700 truncate mr-2">{keyword}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${
                          count === undefined ? 'text-gray-300' :
                          count > 0 ? 'text-emerald-600' : 'text-gray-300'
                        }`}>
                          {count === undefined ? '—' : count}
                        </span>
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          disabled={removingKeyword === keyword}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all disabled:opacity-50"
                          title="Remove keyword"
                        >
                          {removingKeyword === keyword ? (
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" size={12} />
                          ) : (
                            <Icon name="FaTimes" className="w-3 h-3" size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {latestAnalysis && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <span className="text-gray-500">Reviews scanned: </span>
                  <span className="font-semibold text-slate-blue">{latestAnalysis.reviewCountAnalyzed}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total mentions: </span>
                  <span className="font-semibold text-emerald-600">{latestAnalysis.totalMentions}</span>
                </div>
                <div>
                  <span className="text-gray-500">Keywords found: </span>
                  <span className="font-semibold text-amber-600">{latestAnalysis.keywordsWithMentions}</span>
                </div>
              </div>
            )}

            {/* Add Keywords Panel */}
            {keywordsExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Add a keyword</span>
                  <Link
                    href="/prompt-pages"
                    className="text-xs text-gray-500 hover:text-slate-blue"
                  >
                    Manage all in Prompt page settings →
                  </Link>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const input = form.elements.namedItem('newKeyword') as HTMLInputElement;
                    const value = input.value.trim();
                    if (value && !keywords.includes(value)) {
                      handleKeywordsChange([...keywords, value]);
                      input.value = '';
                    }
                  }}
                  className="flex gap-2 max-w-md"
                >
                  <input
                    type="text"
                    name="newKeyword"
                    placeholder="Type a keyword and press Enter..."
                    disabled={!hasAccount || saving}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-blue/20 focus:border-slate-blue disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!hasAccount || saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                    ) : (
                      'Add'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {analysisHistory.length >= 2 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-blue">Keyword trends over time</h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  Exact text matching
                </span>
              </div>

              {/* Keyword toggles with counts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {allKeywordsInHistory.map((keyword, idx) => {
                  const isVisible = visibleKeywords.has(keyword);
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  const latestCount = latestAnalysis?.results.find(r => r.keyword === keyword)?.mentionCount || 0;
                  return (
                    <button
                      key={keyword}
                      onClick={() => toggleKeywordVisibility(keyword)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        isVisible
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      style={isVisible ? { backgroundColor: color } : undefined}
                    >
                      {keyword}
                      <span className={`${isVisible ? 'bg-white/20' : 'bg-gray-200'} px-1.5 py-0.5 rounded-full text-[10px]`}>
                        {latestCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    {allKeywordsInHistory.map((keyword, idx) => {
                      if (!visibleKeywords.has(keyword)) return null;
                      return (
                        <Line
                          key={keyword}
                          type="monotone"
                          dataKey={keyword}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Click keywords to show/hide. Counts are from your latest analysis. Matches are case-insensitive exact text matches in review content.
              </p>
            </div>
          )}

          {/* Analysis History Table */}
          {analysisHistory.length > 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-blue mb-4">Analysis history</h2>
              <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Reviews</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">Mentions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analysisHistory.slice(0, 10).map((analysis, idx) => (
                      <tr
                        key={analysis.id}
                        className={`hover:bg-slate-50 cursor-pointer ${idx === 0 ? 'bg-emerald-50/50' : ''}`}
                        onClick={() => setLatestAnalysis(analysis)}
                      >
                        <td className="px-4 py-2.5 text-gray-900">
                          {formatDate(analysis.runDate)}
                          {idx === 0 && <span className="ml-2 text-xs text-emerald-600">Latest</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{analysis.reviewCountAnalyzed}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-blue text-center">{analysis.totalMentions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Keyword Suggestions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-blue">Discovered keywords</h2>
                <p className="text-sm text-gray-500 mt-1">
                  AI finds keywords in your reviews, verified with fuzzy matching
                </p>
              </div>
              <button
                onClick={handleGetSuggestions}
                disabled={loadingSuggestions}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-blue bg-slate-blue/10 rounded-full hover:bg-slate-blue/20 disabled:opacity-60 transition-all"
              >
                {loadingSuggestions ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Icon name="FaSparkles" className="w-4 h-4" size={16} />
                    Discover keywords
                  </>
                )}
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => {
                  const isExpanded = suggestionsExpanded === suggestion.keyword;
                  const isAdding = addingKeyword === suggestion.keyword;

                  return (
                    <div
                      key={suggestion.keyword}
                      className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSuggestionsExpanded(isExpanded ? null : suggestion.keyword)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{suggestion.keyword}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {suggestion.count} matches
                            </span>
                          </div>
                          {!isExpanded && (
                            <p className="text-xs text-gray-400 mt-1">Click to see where it appears</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddSuggestion(suggestion.keyword)}
                          disabled={isAdding}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 disabled:opacity-60 transition-all"
                        >
                          {isAdding ? (
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" size={12} />
                          ) : (
                            <Icon name="FaPlus" className="w-3 h-3" size={12} />
                          )}
                          Add
                        </button>
                      </div>

                      {isExpanded && suggestion.sampleExcerpts.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-gray-500 mb-2">Found in reviews:</p>
                          <div className="space-y-2">
                            {suggestion.sampleExcerpts.map((excerpt, idx) => (
                              <div key={idx} className="text-xs text-gray-600 bg-slate-50 rounded p-2">
                                "{excerpt}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Icon name="FaLightbulb" className="w-8 h-8 mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm">
                  Click "Discover keywords" to find keywords your customers are using
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageCard>
  );
}
