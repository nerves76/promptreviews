/**
 * RankHistoryChart Component
 *
 * Displays a line chart showing rank position over time.
 * Shows desktop and mobile trends with weekly/monthly granularity.
 * Y-axis is inverted (position 1 at top, 100 at bottom) since lower = better.
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
  ReferenceLine,
} from 'recharts';
import Icon from '@/components/Icon';

interface RankHistoryDataPoint {
  date: string;
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string | null;
}

interface RankHistoryChartProps {
  history: RankHistoryDataPoint[];
  isLoading?: boolean;
  keywordName?: string;
  /** Number of days for the date range */
  days?: number;
  /** Callback when days changes */
  onDaysChange?: (days: number) => void;
}

type TimeGranularity = 'daily' | 'weekly';

interface ChartDataPoint {
  label: string;
  date: string;
  desktop: number | null;
  mobile: number | null;
  desktopCheckedAt?: string;
  mobileCheckedAt?: string;
}

// Device colors
const DEVICE_COLORS = {
  desktop: '#3b82f6', // blue-500
  mobile: '#10b981', // emerald-500
};

function formatDateLabel(dateStr: string, granularity: TimeGranularity): string {
  const date = new Date(dateStr);
  if (granularity === 'daily') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Weekly: show week start date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${weekNum}`;
}

function processHistoryData(
  history: RankHistoryDataPoint[],
  granularity: TimeGranularity
): ChartDataPoint[] {
  if (history.length === 0) return [];

  if (granularity === 'daily') {
    // Return raw daily data
    return history.map(point => ({
      label: formatDateLabel(point.date, 'daily'),
      date: point.date,
      desktop: point.desktop?.position ?? null,
      mobile: point.mobile?.position ?? null,
      desktopCheckedAt: point.desktop?.checkedAt,
      mobileCheckedAt: point.mobile?.checkedAt,
    }));
  }

  // Weekly aggregation: average positions per week
  const weeklyMap = new Map<string, {
    date: string;
    desktopPositions: number[];
    mobilePositions: number[];
    desktopCheckedAt?: string;
    mobileCheckedAt?: string;
  }>();

  for (const point of history) {
    const weekKey = getWeekKey(point.date);

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        date: point.date, // Use first date in week
        desktopPositions: [],
        mobilePositions: [],
      });
    }

    const week = weeklyMap.get(weekKey)!;
    if (point.desktop && point.desktop.position !== null) {
      week.desktopPositions.push(point.desktop.position);
      week.desktopCheckedAt = point.desktop.checkedAt;
    }
    if (point.mobile && point.mobile.position !== null) {
      week.mobilePositions.push(point.mobile.position);
      week.mobileCheckedAt = point.mobile.checkedAt;
    }
  }

  // Calculate averages
  return Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, week]) => ({
      label: formatDateLabel(week.date, 'weekly'),
      date: week.date,
      desktop: week.desktopPositions.length > 0
        ? Math.round(week.desktopPositions.reduce((a, b) => a + b, 0) / week.desktopPositions.length)
        : null,
      mobile: week.mobilePositions.length > 0
        ? Math.round(week.mobilePositions.reduce((a, b) => a + b, 0) / week.mobilePositions.length)
        : null,
      desktopCheckedAt: week.desktopCheckedAt,
      mobileCheckedAt: week.mobileCheckedAt,
    }));
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as ChartDataPoint;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold text-gray-900 mb-2">{label}</div>
      <div className="space-y-2">
        {data.desktop !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DEVICE_COLORS.desktop }}
              />
              <span className="text-gray-600">Desktop</span>
            </span>
            <span className="font-medium text-gray-900">
              {data.desktop === null ? 'Not found' : `#${data.desktop}`}
            </span>
          </div>
        )}
        {data.mobile !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DEVICE_COLORS.mobile }}
              />
              <span className="text-gray-600">Mobile</span>
            </span>
            <span className="font-medium text-gray-900">
              {data.mobile === null ? 'Not found' : `#${data.mobile}`}
            </span>
          </div>
        )}
        {data.desktop === null && data.mobile === null && (
          <div className="text-gray-500 text-xs">No ranking data</div>
        )}
      </div>
    </div>
  );
}

// Position formatter for Y-axis
function formatPosition(value: number): string {
  return `#${value}`;
}

export default function RankHistoryChart({
  history,
  isLoading = false,
  keywordName,
  days = 90,
  onDaysChange,
}: RankHistoryChartProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [showDevices, setShowDevices] = useState<'both' | 'desktop' | 'mobile'>('both');

  const chartData = useMemo(() => {
    return processHistoryData(history, granularity);
  }, [history, granularity]);

  const hasAnyData = useMemo(() => {
    return chartData.some(d => d.desktop !== null || d.mobile !== null);
  }, [chartData]);

  // Calculate Y-axis domain based on actual positions
  const yDomain = useMemo(() => {
    const positions: number[] = [];
    for (const point of chartData) {
      if (point.desktop !== null) positions.push(point.desktop);
      if (point.mobile !== null) positions.push(point.mobile);
    }
    if (positions.length === 0) return [1, 100];
    const min = Math.min(...positions);
    const max = Math.max(...positions);
    // Add some padding
    return [
      Math.max(1, min - 2),
      Math.min(100, max + 5),
    ];
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-100 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-3">
          {/* Device toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setShowDevices('both')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                showDevices === 'both'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setShowDevices('desktop')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                showDevices === 'desktop'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 16 14" fill="currentColor">
                <rect x="0" y="0" width="16" height="10" rx="1" />
                <rect x="5" y="11" width="6" height="1" />
                <rect x="4" y="12" width="8" height="1" />
              </svg>
            </button>
            <button
              onClick={() => setShowDevices('mobile')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                showDevices === 'mobile'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name="FaMobile" className="w-3 h-3" />
            </button>
          </div>

          {/* Granularity Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                granularity === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setGranularity('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                granularity === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Date Range Picker */}
          {onDaysChange && (
            <select
              value={days}
              onChange={(e) => onDaysChange(parseInt(e.target.value, 10))}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          )}
        </div>
      </div>

      {!hasAnyData ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Icon name="FaChartLine" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No rank history yet</p>
            <p className="text-xs text-gray-400 mt-1">Check rankings to see trends over time</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain}
                reversed // Lower position (1) at top
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={formatPosition}
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

              {/* Reference lines for key positions */}
              <ReferenceLine y={3} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />

              {/* Desktop line */}
              {(showDevices === 'both' || showDevices === 'desktop') && (
                <Line
                  type="monotone"
                  dataKey="desktop"
                  name="Desktop"
                  stroke={DEVICE_COLORS.desktop}
                  strokeWidth={2}
                  dot={{ r: 3, fill: DEVICE_COLORS.desktop }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )}

              {/* Mobile line */}
              {(showDevices === 'both' || showDevices === 'mobile') && (
                <Line
                  type="monotone"
                  dataKey="mobile"
                  name="Mobile"
                  stroke={DEVICE_COLORS.mobile}
                  strokeWidth={2}
                  dot={{ r: 3, fill: DEVICE_COLORS.mobile }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Position guide */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-green-500 rounded"></span>
          Top 3
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-amber-500 rounded"></span>
          Top 10
        </span>
      </div>
    </div>
  );
}
