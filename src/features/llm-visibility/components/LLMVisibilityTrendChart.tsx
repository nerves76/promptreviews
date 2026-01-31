/**
 * LLMVisibilityTrendChart Component
 *
 * Displays a line chart showing LLM visibility (citation rate) over time.
 * Shows trends per provider with weekly/monthly granularity toggle.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Icon from '@/components/Icon';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_MODELS,
  LLM_PROVIDER_COLORS,
  LLMVisibilityCheck,
} from '../utils/types';

interface LLMVisibilityTrendChartProps {
  results: LLMVisibilityCheck[];
  isLoading?: boolean;
  selectedProviders?: Set<LLMProvider>;
  onToggleProvider?: (provider: LLMProvider) => void;
}

type TimeGranularity = 'weekly' | 'monthly';
type MetricType = 'citations' | 'mentions';

interface TrendDataPoint {
  label: string;
  date: Date;
  // Per-provider rates (0-100) - for citations
  chatgpt?: number;
  claude?: number;
  gemini?: number;
  perplexity?: number;
  // Per-provider rates (0-100) - for mentions
  chatgpt_mentions?: number;
  claude_mentions?: number;
  gemini_mentions?: number;
  perplexity_mentions?: number;
  // Overall rates
  overall: number;
  overallMentions: number;
  // Counts for tooltip
  totalChecks: number;
  citedChecks: number;
  mentionedChecks: number;
}

// Provider colors matching brand colors
const PROVIDER_CHART_COLORS: Record<LLMProvider, string> = {
  chatgpt: '#374151', // ChatGPT charcoal (gray-700)
  claude: '#d97757', // Claude coral
  gemini: '#5885f3', // Gemini blue
  perplexity: '#22808d', // Perplexity teal
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatWeekLabel(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function processResultsData(
  results: LLMVisibilityCheck[],
  granularity: TimeGranularity
): TrendDataPoint[] {
  if (results.length === 0) {
    return generateEmptyData(granularity);
  }

  const now = new Date();
  const periods = granularity === 'monthly' ? 6 : 8; // 6 months or 8 weeks
  const dataMap = new Map<string, {
    date: Date;
    label: string;
    checks: Map<LLMProvider, { total: number; cited: number; mentioned: number }>;
  }>();

  // Generate time periods
  // Use ISO date strings as keys for consistency (avoids week number calculation issues)
  for (let i = periods - 1; i >= 0; i--) {
    let periodStart: Date;
    let label: string;
    let key: string;

    if (granularity === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      label = formatMonthLabel(periodStart);
      key = periodStart.toISOString().split('T')[0]; // e.g., "2026-01-01"
    } else {
      periodStart = getWeekStart(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      label = formatWeekLabel(periodStart);
      key = periodStart.toISOString().split('T')[0]; // e.g., "2026-01-19"
    }

    dataMap.set(key, {
      date: periodStart,
      label,
      checks: new Map(LLM_PROVIDERS.map(p => [p, { total: 0, cited: 0, mentioned: 0 }])),
    });
  }

  // Group results by period and provider
  for (const result of results) {
    const checkDate = new Date(result.checkedAt);
    let key: string;

    if (granularity === 'monthly') {
      const monthStart = getMonthStart(checkDate);
      key = monthStart.toISOString().split('T')[0];
    } else {
      const weekStart = getWeekStart(checkDate);
      key = weekStart.toISOString().split('T')[0];
    }

    const period = dataMap.get(key);
    if (period) {
      const providerStats = period.checks.get(result.llmProvider);
      if (providerStats) {
        providerStats.total++;
        if (result.domainCited) {
          providerStats.cited++;
        }
        if (result.brandMentioned) {
          providerStats.mentioned++;
        }
      }
    }
  }

  // Convert to chart data format
  const chartData: TrendDataPoint[] = [];

  for (const [, period] of dataMap) {
    const point: TrendDataPoint = {
      label: period.label,
      date: period.date,
      overall: 0,
      overallMentions: 0,
      totalChecks: 0,
      citedChecks: 0,
      mentionedChecks: 0,
    };

    let totalAll = 0;
    let citedAll = 0;
    let mentionedAll = 0;

    for (const provider of LLM_PROVIDERS) {
      const stats = period.checks.get(provider);
      if (stats && stats.total > 0) {
        // Citation rate
        const citedRate = Math.round((stats.cited / stats.total) * 100);
        point[provider] = citedRate;
        // Mention rate
        const mentionRate = Math.round((stats.mentioned / stats.total) * 100);
        // Use type assertion for dynamic key
        (point as any)[`${provider}_mentions`] = mentionRate;

        totalAll += stats.total;
        citedAll += stats.cited;
        mentionedAll += stats.mentioned;
      }
    }

    point.totalChecks = totalAll;
    point.citedChecks = citedAll;
    point.mentionedChecks = mentionedAll;
    point.overall = totalAll > 0 ? Math.round((citedAll / totalAll) * 100) : 0;
    point.overallMentions = totalAll > 0 ? Math.round((mentionedAll / totalAll) * 100) : 0;

    chartData.push(point);
  }

  return chartData;
}

function generateEmptyData(granularity: TimeGranularity): TrendDataPoint[] {
  const now = new Date();
  const periods = granularity === 'monthly' ? 6 : 8;
  const data: TrendDataPoint[] = [];

  for (let i = periods - 1; i >= 0; i--) {
    let periodStart: Date;
    let label: string;

    if (granularity === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      label = formatMonthLabel(periodStart);
    } else {
      periodStart = getWeekStart(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      label = formatWeekLabel(periodStart);
    }

    data.push({
      label,
      date: periodStart,
      overall: 0,
      overallMentions: 0,
      totalChecks: 0,
      citedChecks: 0,
      mentionedChecks: 0,
    });
  }

  return data;
}

// Custom tooltip component factory
function createCustomTooltip(metricType: MetricType) {
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload as TrendDataPoint;
    const isMentions = metricType === 'mentions';

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <div className="font-semibold text-gray-900 mb-2">{label}</div>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            if (entry.value === undefined || entry.value === null) return null;
            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600">{entry.name}</span>
                </span>
                <span className="font-medium text-gray-900">{entry.value}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          {isMentions
            ? `${data.mentionedChecks} mentioned / ${data.totalChecks} checks`
            : `${data.citedChecks} cited / ${data.totalChecks} checks`
          }
        </div>
      </div>
    );
  };
}

export default function LLMVisibilityTrendChart({
  results,
  isLoading = false,
  selectedProviders,
  onToggleProvider,
}: LLMVisibilityTrendChartProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('weekly');
  const [showProviders, setShowProviders] = useState(true);
  const [metricType, setMetricType] = useState<MetricType>('mentions');

  const chartData = useMemo(() => {
    return processResultsData(results, granularity);
  }, [results, granularity]);

  // Check which providers have data
  const providersWithData = useMemo(() => {
    const providers = new Set<LLMProvider>();
    for (const point of chartData) {
      for (const provider of LLM_PROVIDERS) {
        if (point[provider] !== undefined) {
          providers.add(provider);
        }
      }
    }
    return providers;
  }, [chartData]);

  const hasAnyData = useMemo(() => {
    return chartData.some(d => d.totalChecks > 0);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Visibility trend</h3>
          <p className="text-sm text-gray-500">
            {metricType === 'citations' ? 'Citation' : 'Mention'} rate over {granularity === 'monthly' ? 'the last 6 months' : 'the last 8 weeks'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric type toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMetricType('citations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                metricType === 'citations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Citations
            </button>
            <button
              onClick={() => setMetricType('mentions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                metricType === 'mentions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mentions
            </button>
          </div>

          {/* Provider toggle */}
          <button
            onClick={() => setShowProviders(!showProviders)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showProviders
                ? 'bg-blue-100 text-slate-blue'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showProviders ? 'By provider' : 'Overall only'}
          </button>

          {/* Granularity Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setGranularity('weekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                granularity === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                granularity === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Icon name="FaChartLine" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No visibility data yet</p>
            <p className="text-xs text-gray-500 mt-1">Run LLM checks to see trends over time</p>
          </div>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}%`}
                width={40}
              />
              <Tooltip content={createCustomTooltip(metricType)} />

              {/* Overall line (always shown) */}
              <Line
                type="monotone"
                dataKey={metricType === 'mentions' ? 'overallMentions' : 'overall'}
                name="Overall"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3, fill: '#6366f1' }}
                activeDot={{ r: 5 }}
                connectNulls
              />

              {/* Per-provider lines (when toggled on) */}
              {showProviders &&
                LLM_PROVIDERS.filter(p => providersWithData.has(p)).map(provider => (
                  <Line
                    key={provider}
                    type="monotone"
                    dataKey={metricType === 'mentions' ? `${provider}_mentions` : provider}
                    name={LLM_PROVIDER_LABELS[provider]}
                    stroke={PROVIDER_CHART_COLORS[provider]}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={{ r: 2, fill: PROVIDER_CHART_COLORS[provider] }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Provider toggle legend */}
      {hasAnyData && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 justify-center">
          {/* Overall indicator (non-interactive) */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366f1' }} />
            Overall
          </span>
          {LLM_PROVIDERS.map((provider) => {
            const isSelected = selectedProviders ? selectedProviders.has(provider) : true;
            const colors = LLM_PROVIDER_COLORS[provider];
            return (
              <button
                key={provider}
                onClick={() => onToggleProvider?.(provider)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? `${colors.bg} ${colors.text} ${colors.border} border`
                    : 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                }`}
                title={isSelected ? `Click to exclude ${LLM_PROVIDER_LABELS[provider]}` : `Click to include ${LLM_PROVIDER_LABELS[provider]}`}
              >
                <span className={`w-2.5 h-2.5 rounded border flex items-center justify-center ${
                  isSelected ? `${colors.border} ${colors.text}` : 'border-gray-300'
                }`}>
                  {isSelected && <Icon name="FaCheck" className="w-1.5 h-1.5" />}
                </span>
                {LLM_PROVIDER_LABELS[provider]}
                <span className="opacity-70">({LLM_PROVIDER_MODELS[provider]})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
