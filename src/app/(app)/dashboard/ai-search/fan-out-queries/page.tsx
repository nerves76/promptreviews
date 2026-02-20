'use client';

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { TIME_WINDOW_OPTIONS, type TimeWindow } from '@/features/llm-visibility/utils/timeWindow';
import {
  LLM_PROVIDERS,
  LLM_PROVIDER_LABELS,
  LLM_PROVIDER_COLORS,
  type LLMProvider,
} from '@/features/llm-visibility/utils/types';
import { Pagination } from '@/components/Pagination';

// --- Types ---

interface FanOutQuery {
  query: string;
  frequency: number;
  lastSeen: string;
  concepts: string[];
  providers: string[];
}

interface FanOutQueriesData {
  queries: FanOutQuery[];
  totalChecks: number;
  uniqueQueries: number;
}

type SortField = 'query' | 'frequency' | 'lastSeen' | 'concepts' | 'providers';
type SortDirection = 'asc' | 'desc';

// Pagination
const PAGE_SIZE = 50;

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Fan-out queries page
 *
 * Shows aggregated background searches that LLMs perform when researching answers.
 * Helps users understand what subtopics AI explores for their keywords.
 */
export default function FanOutQueriesPage() {
  const { selectedAccountId } = useAccountData();

  // Data state
  const [data, setData] = useState<FanOutQueriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');
  const [selectedProviders, setSelectedProviders] = useState<Set<LLMProvider>>(new Set(LLM_PROVIDERS));
  const [searchFilter, setSearchFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Build provider query param string
  const providerParam = useMemo(() => {
    if (selectedProviders.size === LLM_PROVIDERS.length) return '';
    return `&provider=${Array.from(selectedProviders).join(',')}`;
  }, [selectedProviders]);

  // Build time window query param string
  const timeWindowParam = useMemo(() => {
    if (timeWindow === 'all') return '';
    return `&timeWindow=${timeWindow}`;
  }, [timeWindow]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = `?_=1${providerParam}${timeWindowParam}`;
      const response = await apiClient.get<FanOutQueriesData>(
        `/llm-visibility/fan-out-queries${params}`
      );
      setData(response);
    } catch (err: any) {
      console.error('[FanOutQueriesPage] Error fetching data:', err);
      setError(err?.message || 'Failed to load fan-out queries');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, providerParam, timeWindowParam]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle provider filter
  const toggleProvider = useCallback((provider: LLMProvider) => {
    setSelectedProviders(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        if (next.size === 1) return prev; // keep at least 1
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  }, []);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'query' ? 'asc' : 'desc');
    }
  };

  // Filter + sort data
  const filteredAndSorted = useMemo(() => {
    if (!data?.queries) return [];

    let filtered = data.queries;

    // Apply text search filter
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase().trim();
      filtered = filtered.filter(q =>
        q.query.toLowerCase().includes(term) ||
        q.concepts.some(c => c.toLowerCase().includes(term))
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'query':
          comparison = a.query.localeCompare(b.query);
          break;
        case 'frequency':
          comparison = a.frequency - b.frequency;
          break;
        case 'lastSeen':
          comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
          break;
        case 'concepts':
          comparison = a.concepts.length - b.concepts.length;
          break;
        case 'providers':
          comparison = a.providers.length - b.providers.length;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.queries, searchFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE);
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSorted.slice(start, start + PAGE_SIZE);
  }, [filteredAndSorted, currentPage]);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection, providerParam, timeWindowParam, searchFilter]);

  // Whether a provider filter is actively narrowing results
  const isProviderFiltered = selectedProviders.size < LLM_PROVIDERS.length;

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaChevronDown" className="w-2.5 h-2.5 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <Icon name="FaCaretUp" className="w-3 h-3 text-slate-blue" />
    ) : (
      <Icon name="FaCaretDown" className="w-3 h-3 text-slate-blue" />
    );
  };

  // Top query for summary card
  const topQuery = filteredAndSorted.length > 0 ? filteredAndSorted[0] : null;

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">LLM Visibility</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav
        items={[
          { label: 'LLM tracking', icon: 'FaSparkles', href: '/dashboard/ai-search', matchType: 'exact' },
          { label: 'Visibility opportunities', icon: 'FaGlobe', href: '/dashboard/ai-search/research-sources', matchType: 'exact' },
          { label: 'Competitors', icon: 'FaUsers', href: '/dashboard/ai-search/competitors', matchType: 'exact' },
          { label: 'Fan-out queries', icon: 'FaSearch', href: '/dashboard/ai-search/fan-out-queries', matchType: 'exact' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaSearch" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <PageCardHeader
          title="Fan-out queries"
          description="Background searches that LLMs perform when researching answers to your keywords. Understanding these queries reveals what subtopics AI explores, helping you create content that covers related areas."
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Loading fan-out queries...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.queries.length === 0 && !isProviderFiltered && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Icon name="FaSearch" className="w-8 h-8 text-slate-blue" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No fan-out queries yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Run AI visibility checks with ChatGPT to see what background searches are performed.
              Currently only ChatGPT exposes fan-out query data.
            </p>
            <Link
              href="/dashboard/ai-search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
            >
              <Icon name="FaArrowLeft" className="w-4 h-4" />
              Back to AI visibility
            </Link>
          </div>
        )}

        {/* Data Display */}
        {!isLoading && !error && data && (data.queries.length > 0 || isProviderFiltered) && (
          <>
            {/* Summary Cards */}
            {data.queries.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {data.uniqueQueries}
                  </div>
                  <div className="text-sm text-gray-600">Unique queries</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {data.totalChecks}
                  </div>
                  <div className="text-sm text-gray-600">Checks with queries</div>
                </div>
                {topQuery && (
                  <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-sm font-bold text-slate-blue truncate" title={topQuery.query}>
                      {topQuery.query}
                    </div>
                    <div className="text-sm text-gray-600">
                      Most frequent ({topQuery.frequency}x)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="mb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                {/* Search + Time Window */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search queries..."
                      className="pl-9 pr-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2 w-48 sm:w-64"
                      aria-label="Search fan-out queries"
                    />
                  </div>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2"
                    aria-label="Time range filter"
                  >
                    {TIME_WINDOW_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'query' : 'queries'}
                  {searchFilter && ` matching "${searchFilter}"`}
                </div>
              </div>

              {/* Provider Filter Toggles */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-500 mr-1">Filter providers:</span>
                {LLM_PROVIDERS.map((provider) => {
                  const isSelected = selectedProviders.has(provider);
                  const colors = LLM_PROVIDER_COLORS[provider];
                  return (
                    <button
                      key={provider}
                      onClick={() => toggleProvider(provider)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        isSelected
                          ? `${colors.bg} ${colors.text} ${colors.border} border`
                          : 'bg-gray-100 text-gray-500 border border-gray-200 line-through'
                      }`}
                      title={isSelected ? `Click to hide ${LLM_PROVIDER_LABELS[provider]}` : `Click to show ${LLM_PROVIDER_LABELS[provider]}`}
                    >
                      <span className={`w-3 h-3 rounded border flex items-center justify-center ${
                        isSelected ? `${colors.border} ${colors.text}` : 'border-gray-300'
                      }`}>
                        {isSelected && <Icon name="FaCheck" className="w-2 h-2" />}
                      </span>
                      {LLM_PROVIDER_LABELS[provider]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtered empty state */}
            {filteredAndSorted.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Icon name="FaFilter" className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                <p>No queries match the current filters.</p>
              </div>
            )}

            {/* Table */}
            {filteredAndSorted.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => handleSort('query')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Query
                          <SortIcon field="query" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSort('frequency')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                        >
                          Frequency
                          <SortIcon field="frequency" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-left">
                        <button
                          onClick={() => handleSort('concepts')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Concepts
                          <SortIcon field="concepts" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-left">
                        <button
                          onClick={() => handleSort('providers')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Providers
                          <SortIcon field="providers" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSort('lastSeen')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                        >
                          Last seen
                          <SortIcon field="lastSeen" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedQueries.map((item) => (
                      <tr
                        key={item.query}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Query */}
                        <td className="py-3 px-4 max-w-md">
                          <span className="text-sm text-gray-900">
                            {item.query}
                          </span>
                        </td>

                        {/* Frequency */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            item.frequency >= 10
                              ? 'bg-slate-blue text-white'
                              : item.frequency >= 5
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.frequency}x
                          </span>
                        </td>

                        {/* Concepts */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {item.concepts.slice(0, 2).map((concept, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded truncate max-w-[100px]"
                                title={concept}
                              >
                                {concept}
                              </span>
                            ))}
                            {item.concepts.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{item.concepts.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Providers */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {item.providers.map((provider) => {
                              const colors = LLM_PROVIDER_COLORS[provider as LLMProvider];
                              const label = LLM_PROVIDER_LABELS[provider as LLMProvider] || provider;
                              if (!colors) {
                                return (
                                  <span key={provider} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded whitespace-nowrap">
                                    {provider}
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={provider}
                                  className={`px-1.5 py-0.5 ${colors.bg} ${colors.text} text-xs rounded whitespace-nowrap`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(item.lastSeen)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {filteredAndSorted.length > PAGE_SIZE && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredAndSorted.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={(page) => startTransition(() => setCurrentPage(page))}
                  />
                )}
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
}
