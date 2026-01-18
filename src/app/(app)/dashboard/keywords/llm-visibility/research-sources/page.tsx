'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';

interface ResearchSource {
  domain: string;
  frequency: number;
  lastSeen: string;
  sampleUrls: string[];
  sampleTitles: string[];
  concepts: string[];
  isOurs: boolean;
}

interface ResearchSourcesData {
  sources: ResearchSource[];
  totalChecks: number;
  uniqueDomains: number;
  yourDomainAppearances: number;
}

type SortField = 'domain' | 'frequency' | 'lastSeen' | 'concepts';
type SortDirection = 'asc' | 'desc';

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
 * AI Research Sources Page
 *
 * Shows aggregated and ranked websites that AI assistants use when researching answers.
 * Helps users identify high-value link building targets.
 */
export default function ResearchSourcesPage() {
  const { selectedAccountId } = useAccountData();
  const [data, setData] = useState<ResearchSourcesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!selectedAccountId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<ResearchSourcesData>(
          '/llm-visibility/research-sources'
        );
        setData(response);
      } catch (err: any) {
        console.error('[ResearchSourcesPage] Error fetching data:', err);
        setError(err?.message || 'Failed to load research sources');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedAccountId]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'domain' ? 'asc' : 'desc');
    }
  };

  // Sorted data
  const sortedSources = useMemo(() => {
    if (!data?.sources) return [];

    return [...data.sources].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'domain':
          comparison = a.domain.localeCompare(b.domain);
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
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.sources, sortField, sortDirection]);

  // Get top domain for summary
  const topDomain = sortedSources.length > 0 ? sortedSources[0] : null;

  // Main SubNav items (same as LLM visibility page)
  const subNavItems = [
    { label: 'Library', icon: 'FaKey' as const, href: '/dashboard/keywords', matchType: 'exact' as const },
    { label: 'Rank Tracking', icon: 'FaChartLine' as const, href: '/dashboard/keywords/rank-tracking', matchType: 'startsWith' as const },
    { label: 'AI Search', icon: 'FaSparkles' as const, href: '/dashboard/keywords/llm-visibility', matchType: 'exact' as const },
    { label: 'Research Sources', icon: 'FaGlobe' as const, href: '/dashboard/keywords/llm-visibility/research-sources' },
  ];

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaChevronDown" className="w-2.5 h-2.5 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <Icon name="FaCaretUp" className="w-3 h-3 text-slate-blue" />
    ) : (
      <Icon name="FaCaretDown" className="w-3 h-3 text-slate-blue" />
    );
  };

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Keyword Concepts</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav items={subNavItems} />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <PageCardHeader
          title="Research sources"
          description="Websites that AI assistants use when researching answers. High-frequency sources are valuable link building targets."
        />

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
          <p className="mt-4 text-gray-500">Loading research sources...</p>
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
      {!isLoading && !error && data && data.sources.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No research sources yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Run AI visibility checks with ChatGPT to see which websites are used for research.
            Other AI providers don&apos;t expose this data.
          </p>
          <Link
            href="/dashboard/keywords/llm-visibility"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
          >
            <Icon name="FaArrowLeft" className="w-4 h-4" />
            Back to AI search
          </Link>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && data && data.sources.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">
                {data.uniqueDomains}
              </div>
              <div className="text-sm text-gray-600">Unique domains</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-800">
                {data.totalChecks}
              </div>
              <div className="text-sm text-gray-600">Checks analyzed</div>
            </div>
            <div className={`p-4 rounded-xl border ${
              data.yourDomainAppearances > 0
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-2xl font-bold ${
                data.yourDomainAppearances > 0 ? 'text-green-700' : 'text-gray-800'
              }`}>
                {data.yourDomainAppearances}
              </div>
              <div className="text-sm text-gray-600">Your domain appearances</div>
            </div>
            {topDomain && (
              <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-4 rounded-xl border border-blue-100">
                <div className="text-lg font-bold text-slate-blue truncate" title={topDomain.domain}>
                  {topDomain.domain}
                </div>
                <div className="text-sm text-gray-600">
                  Most frequent ({topDomain.frequency}x)
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="FaInfoCircle" className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                This data comes from ChatGPT checks only. Other AI providers (Claude, Gemini, Perplexity)
                don&apos;t expose which websites they use for research.
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <button
                      onClick={() => handleSort('domain')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Domain
                      <SortIcon field="domain" />
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
                  <th className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleSort('lastSeen')}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                    >
                      Last seen
                      <SortIcon field="lastSeen" />
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
                  <th className="py-3 px-3 text-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSources.map((source) => {
                  const isExpanded = expandedDomain === source.domain;
                  return (
                    <React.Fragment key={source.domain}>
                      <tr
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          source.isOurs ? 'bg-green-50/50' : ''
                        }`}
                      >
                        {/* Domain */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedDomain(isExpanded ? null : source.domain)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Icon
                                name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                                className="w-3 h-3 text-gray-500"
                              />
                            </button>
                            <a
                              href={`https://${source.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm font-medium hover:underline ${
                                source.isOurs ? 'text-green-700' : 'text-gray-900 hover:text-slate-blue'
                              }`}
                            >
                              {source.domain}
                            </a>
                            {source.isOurs && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Frequency */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            source.frequency >= 10
                              ? 'bg-slate-blue text-white'
                              : source.frequency >= 5
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {source.frequency}x
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(source.lastSeen)}
                          </span>
                        </td>

                        {/* Concepts */}
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {source.concepts.slice(0, 2).map((concept, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded truncate max-w-[100px]"
                                title={concept}
                              >
                                {concept}
                              </span>
                            ))}
                            {source.concepts.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{source.concepts.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <a
                            href={`https://${source.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-blue hover:text-slate-blue/80 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Icon name="FaGlobe" className="w-3 h-3" />
                            Visit
                          </a>
                        </td>
                      </tr>

                      {/* Expanded Row - Sample URLs */}
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={5} className="py-3 px-4 pl-12">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-500 uppercase">
                                Sample pages used ({source.sampleUrls.length})
                              </div>
                              {source.sampleUrls.length > 0 ? (
                                <ul className="space-y-1">
                                  {source.sampleUrls.map((url, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <Icon name="FaLink" className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-slate-blue hover:underline break-all"
                                      >
                                        {url}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500">No URLs available</p>
                              )}

                              {source.concepts.length > 2 && (
                                <div className="mt-3">
                                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                    All concepts ({source.concepts.length})
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {source.concepts.map((concept, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                      >
                                        {concept}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      </PageCard>
    </div>
  );
}
