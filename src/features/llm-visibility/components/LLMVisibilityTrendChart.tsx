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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Icon from '@/components/Icon';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLMVisibilityCheck,
} from '../utils/types';

interface LLMVisibilityTrendChartProps {
  results: LLMVisibilityCheck[];
  isLoading?: boolean;
}

type TimeGranularity = 'weekly' | 'monthly';

interface TrendDataPoint {
  label: string;
  date: Date;
  // Per-provider citation rates (0-100)
  chatgpt?: number;
  claude?: number;
  gemini?: number;
  perplexity?: number;
  // Overall citation rate
  overall: number;
  // Counts for tooltip
  totalChecks: number;
  citedChecks: number;
}

// Provider colors matching the LLM_PROVIDER_COLORS theme
const PROVIDER_CHART_COLORS: Record<LLMProvider, string> = {
  chatgpt: '#10b981', // emerald-500
  claude: '#f97316', // orange-500
  gemini: '#3b82f6', // blue-500
  perplexity: '#8b5cf6', // purple-500
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
    checks: Map<LLMProvider, { total: number; cited: number }>;
  }>();

  // Generate time periods
  for (let i = periods - 1; i >= 0; i--) {
    let periodStart: Date;
    let label: string;
    let key: string;

    if (granularity === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      label = formatMonthLabel(periodStart);
      key = `${periodStart.getFullYear()}-${periodStart.getMonth()}`;
    } else {
      periodStart = getWeekStart(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
      label = formatWeekLabel(periodStart);
      key = `${periodStart.getFullYear()}-W${Math.ceil((periodStart.getTime() - new Date(periodStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    }

    dataMap.set(key, {
      date: periodStart,
      label,
      checks: new Map(LLM_PROVIDERS.map(p => [p, { total: 0, cited: 0 }])),
    });
  }

  // Group results by period and provider
  for (const result of results) {
    const checkDate = new Date(result.checkedAt);
    let key: string;

    if (granularity === 'monthly') {
      key = `${checkDate.getFullYear()}-${checkDate.getMonth()}`;
    } else {
      const weekStart = getWeekStart(checkDate);
      key = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    }

    const period = dataMap.get(key);
    if (period) {
      const providerStats = period.checks.get(result.llmProvider);
      if (providerStats) {
        providerStats.total++;
        if (result.domainCited) {
          providerStats.cited++;
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
      totalChecks: 0,
      citedChecks: 0,
    };

    let totalAll = 0;
    let citedAll = 0;

    for (const provider of LLM_PROVIDERS) {
      const stats = period.checks.get(provider);
      if (stats && stats.total > 0) {
        const rate = Math.round((stats.cited / stats.total) * 100);
        point[provider] = rate;
        totalAll += stats.total;
        citedAll += stats.cited;
      }
    }

    point.totalChecks = totalAll;
    point.citedChecks = citedAll;
    point.overall = totalAll > 0 ? Math.round((citedAll / totalAll) * 100) : 0;

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
      totalChecks: 0,
      citedChecks: 0,
    });
  }

  return data;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as TrendDataPoint;

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
        {data.citedChecks} cited / {data.totalChecks} checks
      </div>
    </div>
  );
}

export default function LLMVisibilityTrendChart({
  results,
  isLoading = false,
}: LLMVisibilityTrendChartProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('weekly');
  const [showProviders, setShowProviders] = useState(true);

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
            Citation rate over {granularity === 'monthly' ? 'the last 6 months' : 'the last 8 weeks'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Provider toggle */}
          <button
            onClick={() => setShowProviders(!showProviders)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showProviders
                ? 'bg-purple-100 text-purple-700'
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
            <p className="text-xs text-gray-400 mt-1">Run LLM checks to see trends over time</p>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />

              {/* Overall line (always shown) */}
              <Line
                type="monotone"
                dataKey="overall"
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
                    dataKey={provider}
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
    </div>
  );
}
