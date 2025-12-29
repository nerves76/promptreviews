/**
 * PostingFrequencyChart Component
 *
 * Displays a bar chart showing posting frequency over time with weekly/monthly toggle.
 * Shows average posting frequency and helps users track their posting consistency.
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '@/components/Icon';
import { GBPHelpBubble } from '@/components/ui/HelpBubble';

interface PostData {
  createTime: string;
  topicType: string;
  summary?: string;
}

interface PostingFrequencyChartProps {
  postsData: PostData[];
  isLoading?: boolean;
}

type TimeGranularity = 'weekly' | 'monthly';

interface ChartDataPoint {
  label: string;
  count: number;
  posts: PostData[];
  startDate: Date;
  endDate: Date;
}

// Custom hook for intersection observer (same as OverviewStats)
function useIntersectionObserver() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return { ref, isVisible };
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getWeekLabel(date: Date): string {
  const weekNum = getWeekNumber(date);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `W${weekNum} ${month}`;
}

function processPostsData(posts: PostData[], granularity: TimeGranularity): ChartDataPoint[] {
  if (posts.length === 0) {
    // Return empty data for the time range
    return generateEmptyData(granularity);
  }

  const now = new Date();
  const dataPoints: Map<string, ChartDataPoint> = new Map();

  if (granularity === 'monthly') {
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      dataPoints.set(key, {
        label,
        count: 0,
        posts: [],
        startDate: date,
        endDate,
      });
    }

    // Count posts per month
    posts.forEach(post => {
      const postDate = new Date(post.createTime);
      const key = `${postDate.getFullYear()}-${postDate.getMonth()}`;
      const existing = dataPoints.get(key);
      if (existing) {
        existing.count++;
        existing.posts.push(post);
      }
    });
  } else {
    // Weekly - generate last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const key = `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
      const label = getWeekLabel(weekStart);

      dataPoints.set(key, {
        label,
        count: 0,
        posts: [],
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    // Count posts per week
    posts.forEach(post => {
      const postDate = new Date(post.createTime);
      const key = `${postDate.getFullYear()}-W${getWeekNumber(postDate)}`;
      const existing = dataPoints.get(key);
      if (existing) {
        existing.count++;
        existing.posts.push(post);
      }
    });
  }

  return Array.from(dataPoints.values());
}

function generateEmptyData(granularity: TimeGranularity): ChartDataPoint[] {
  const now = new Date();
  const dataPoints: ChartDataPoint[] = [];

  if (granularity === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      dataPoints.push({
        label,
        count: 0,
        posts: [],
        startDate: date,
        endDate,
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      dataPoints.push({
        label: getWeekLabel(weekStart),
        count: 0,
        posts: [],
        startDate: weekStart,
        endDate: weekEnd,
      });
    }
  }

  return dataPoints;
}

function formatTopicType(type: string): string {
  const typeMap: Record<string, string> = {
    'STANDARD': 'Update',
    'EVENT': 'Event',
    'OFFER': 'Offer',
    'PRODUCT': 'Product',
    'ALERT': 'Alert',
  };
  return typeMap[type] || type;
}

export default function PostingFrequencyChart({
  postsData,
  isLoading = false,
}: PostingFrequencyChartProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly');
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: ChartDataPoint;
  } | null>(null);

  const { ref: animationRef, isVisible } = useIntersectionObserver();

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip && !(event.target as Element).closest('.chart-bar-posting')) {
        setTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tooltip]);

  const chartData = useMemo(() => {
    return processPostsData(postsData, granularity);
  }, [postsData, granularity]);

  const maxPosts = useMemo(() => {
    const actualMax = Math.max(...chartData.map(d => d.count), 1);
    // Use a minimum scale of 5 for better proportions
    return Math.max(actualMax, 5);
  }, [chartData]);

  const totalPosts = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.count, 0);
  }, [chartData]);

  const averagePostsPerPeriod = useMemo(() => {
    const periodsWithData = chartData.filter(d => d.count > 0).length;
    if (periodsWithData === 0) return 0;
    return totalPosts / chartData.length;
  }, [chartData, totalPosts]);

  const postTypeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    postsData.forEach(post => {
      const type = post.topicType || 'STANDARD';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  }, [postsData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={animationRef} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-start gap-1">
            <h2 className="text-xl font-bold text-slate-blue">Posting activity</h2>
            <div className="flex-shrink-0 mt-0.5">
              <GBPHelpBubble
                metric="metrics/posting-frequency"
                tooltip="Track your posting consistency"
                size="sm"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Last {granularity === 'monthly' ? '12 months' : '12 weeks'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Granularity Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGranularity('weekly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                granularity === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                granularity === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Stats Summary */}
          <div className="hidden sm:flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Icon name="FaChartLine" className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{totalPosts}</span> total posts
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="FaCalendarAlt" className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{averagePostsPerPeriod.toFixed(1)}</span> avg/{granularity === 'monthly' ? 'mo' : 'wk'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-40">
        <div className="flex items-end justify-between h-full space-x-2">
          {chartData.map((data, index) => {
            const chartHeight = maxPosts > 0 ? (data.count / maxPosts) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                {/* Bar */}
                <div
                  className="chart-bar-posting w-full max-w-12 relative bg-gray-100 rounded-t cursor-pointer hover:bg-gray-200 transition-colors"
                  style={{ height: '120px' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      show: true,
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                      data,
                    });
                  }}
                >
                  {data.count > 0 && (
                    <div
                      className={`absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-1000 ease-out ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        height: isVisible ? `${chartHeight}%` : '0%',
                        transitionDelay: `${index * 80}ms`
                      }}
                    >
                      {/* Post count label on bar */}
                      {chartHeight > 20 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">
                            {data.count}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Show count above bar if bar is too small */}
                  {data.count > 0 && chartHeight <= 20 && (
                    <div
                      className={`absolute w-full text-center transition-all duration-1000 ease-out ${
                        isVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        bottom: `${chartHeight}%`,
                        transitionDelay: `${index * 80 + 200}ms`
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-600">
                        {data.count}
                      </span>
                    </div>
                  )}
                </div>

                {/* Period Label */}
                <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
                  {data.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stats (shown below chart on small screens) */}
      <div className="sm:hidden flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm">
          <Icon name="FaChartLine" className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">{totalPosts}</span> posts
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Icon name="FaCalendarAlt" className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">{averagePostsPerPeriod.toFixed(1)}</span>/{granularity === 'monthly' ? 'mo' : 'wk'}
          </span>
        </div>
      </div>

      {/* Post Type Legend (if there are posts) */}
      {totalPosts > 0 && Object.keys(postTypeBreakdown).length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-500 font-medium">Post types:</span>
            {Object.entries(postTypeBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center space-x-1">
                <span className="text-gray-600">{formatTopicType(type)}:</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State Message */}
      {totalPosts === 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            No posts found in the selected time period. Start posting to see your activity here!
          </p>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="font-semibold text-gray-900 mb-2">
            {tooltip.data.label} - {tooltip.data.count} post{tooltip.data.count !== 1 ? 's' : ''}
          </div>
          {tooltip.data.count > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tooltip.data.posts.slice(0, 5).map((post, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[150px]">
                    {post.summary?.substring(0, 30) || formatTopicType(post.topicType)}
                    {post.summary && post.summary.length > 30 ? '...' : ''}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {formatTopicType(post.topicType)}
                  </span>
                </div>
              ))}
              {tooltip.data.posts.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{tooltip.data.posts.length - 5} more
                </div>
              )}
            </div>
          )}
          {tooltip.data.count === 0 && (
            <p className="text-xs text-gray-500">No posts this {granularity === 'monthly' ? 'month' : 'week'}</p>
          )}
          {/* Close button */}
          <button
            onClick={() => setTooltip(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <Icon name="FaTimes" className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
