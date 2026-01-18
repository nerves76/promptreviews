'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';

interface CompetitorMention {
  name: string;
  frequency: number;
  lastSeen: string;
  categories: string[];
  domains: string[];
  sampleUrls: string[];
  concepts: string[];
  isOurs: boolean;
}

interface CompetitorsData {
  competitors: CompetitorMention[];
  totalChecks: number;
  uniqueCompetitors: number;
  yourBrandMentions: number;
}

interface DomainAnalysis {
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
}

type SortField = 'name' | 'frequency' | 'lastSeen' | 'concepts';
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
 * Difficulty badge component
 */
function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
  const config = {
    easy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Easy' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
    hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' },
  };
  const { bg, text, label } = config[difficulty];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

/**
 * Competitors Page
 *
 * Shows aggregated and ranked competitor/brand mentions from AI visibility checks.
 * Helps users understand which competitors are being mentioned by AI assistants.
 */
export default function CompetitorsPage() {
  const { selectedAccountId } = useAccountData();
  const [data, setData] = useState<CompetitorsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  // Domain analysis state
  const [analyses, setAnalyses] = useState<Record<string, DomainAnalysis>>({});
  const [analyzingDomains, setAnalyzingDomains] = useState<Set<string>>(new Set());
  const [strategyExpanded, setStrategyExpanded] = useState<Set<string>>(new Set());

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
        const response = await apiClient.get<CompetitorsData>(
          '/llm-visibility/competitors'
        );
        setData(response);
      } catch (err: any) {
        console.error('[CompetitorsPage] Error fetching data:', err);
        setError(err?.message || 'Failed to load competitors');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedAccountId]);

  // Analyze a domain
  const analyzeDomain = useCallback(async (domain: string) => {
    if (analyzingDomains.has(domain) || analyses[domain]) {
      // Already analyzing or already have analysis - just toggle expansion
      setStrategyExpanded(prev => {
        const next = new Set(prev);
        if (next.has(domain)) {
          next.delete(domain);
        } else {
          next.add(domain);
        }
        return next;
      });
      return;
    }

    // Start analyzing
    setAnalyzingDomains(prev => new Set(prev).add(domain));
    setStrategyExpanded(prev => new Set(prev).add(domain));

    try {
      const result = await apiClient.post<DomainAnalysis>('/llm-visibility/analyze-domain', {
        domain,
      });
      setAnalyses(prev => ({
        ...prev,
        [domain]: result,
      }));
    } catch (err) {
      console.error('[CompetitorsPage] Error analyzing domain:', err);
      // Set a fallback analysis
      setAnalyses(prev => ({
        ...prev,
        [domain]: {
          difficulty: 'medium',
          siteType: 'Unknown',
          strategy: 'Unable to analyze this domain. Please try again later.',
        },
      }));
    } finally {
      setAnalyzingDomains(prev => {
        const next = new Set(prev);
        next.delete(domain);
        return next;
      });
    }
  }, [analyzingDomains, analyses]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  // Sorted data
  const sortedCompetitors = useMemo(() => {
    if (!data?.competitors) return [];

    return [...data.competitors].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
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
  }, [data?.competitors, sortField, sortDirection]);

  // Get top competitor for summary
  const topCompetitor = sortedCompetitors.length > 0 ? sortedCompetitors[0] : null;

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
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">AI Search</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav
        items={[
          { label: 'AI Visibility', icon: 'FaSparkles', href: '/dashboard/ai-search', matchType: 'exact' },
          { label: 'Visibility Opportunities', icon: 'FaGlobe', href: '/dashboard/ai-search/research-sources', matchType: 'exact' },
          { label: 'Competitors', icon: 'FaUsers', href: '/dashboard/ai-search/competitors', matchType: 'exact' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaUsers" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <PageCardHeader
          title="Competitor mentions"
          description="Brands and competitors that AI assistants mention when answering questions related to your keywords. Understanding who AI recommends helps you identify your competitive landscape."
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Loading competitor mentions...</p>
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
        {!isLoading && !error && data && data.competitors.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Icon name="FaUsers" className="w-8 h-8 text-slate-blue" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No competitor mentions yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Run AI visibility checks with ChatGPT to see which brands are being mentioned.
              Brand mentions are extracted from ChatGPT responses.
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
        {!isLoading && !error && data && data.competitors.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {data.uniqueCompetitors}
                </div>
                <div className="text-sm text-gray-600">Unique brands</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {data.totalChecks}
                </div>
                <div className="text-sm text-gray-600">Checks with brands</div>
              </div>
              <div className={`p-4 rounded-xl border ${
                data.yourBrandMentions > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-2xl font-bold ${
                  data.yourBrandMentions > 0 ? 'text-green-700' : 'text-gray-800'
                }`}>
                  {data.yourBrandMentions}
                </div>
                <div className="text-sm text-gray-600">Your brand mentions</div>
              </div>
              {topCompetitor && (
                <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-lg font-bold text-slate-blue truncate" title={topCompetitor.name}>
                    {topCompetitor.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Most mentioned ({topCompetitor.frequency}x)
                  </div>
                </div>
              )}
            </div>

            {/* Info Banner */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="FaInfoCircle" className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  This data comes from ChatGPT checks only.
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
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Brand
                        <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleSort('frequency')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Mentions
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
                  {sortedCompetitors.map((competitor) => {
                    const isExpanded = expandedCompetitor === competitor.name;
                    const primaryDomain = competitor.domains[0] || null;
                    const analysis = primaryDomain ? analyses[primaryDomain] : null;
                    const isAnalyzing = primaryDomain ? analyzingDomains.has(primaryDomain) : false;
                    const isStrategyExpanded = primaryDomain ? strategyExpanded.has(primaryDomain) : false;

                    return (
                      <React.Fragment key={competitor.name}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            competitor.isOurs ? 'bg-green-50/50' : ''
                          }`}
                        >
                          {/* Brand Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedCompetitor(isExpanded ? null : competitor.name)}
                                className="p-1 hover:bg-gray-100 rounded"
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                <Icon
                                  name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                                  className="w-3 h-3 text-gray-500"
                                />
                              </button>
                              <span className={`text-sm font-medium ${
                                competitor.isOurs ? 'text-green-700' : 'text-gray-900'
                              }`}>
                                {competitor.name}
                              </span>
                              {competitor.isOurs && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  You
                                </span>
                              )}
                              {analysis && (
                                <DifficultyBadge difficulty={analysis.difficulty} />
                              )}
                            </div>
                          </td>

                          {/* Mentions */}
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              competitor.frequency >= 10
                                ? 'bg-slate-blue text-white'
                                : competitor.frequency >= 5
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {competitor.frequency}x
                            </span>
                          </td>

                          {/* Last Seen */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(competitor.lastSeen)}
                            </span>
                          </td>

                          {/* Concepts */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {competitor.concepts.slice(0, 2).map((concept, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded truncate max-w-[100px]"
                                  title={concept}
                                >
                                  {concept}
                                </span>
                              ))}
                              {competitor.concepts.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{competitor.concepts.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {primaryDomain && (
                                <>
                                  <button
                                    onClick={() => analyzeDomain(primaryDomain)}
                                    disabled={isAnalyzing}
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                                      isAnalyzing
                                        ? 'bg-gray-100 text-gray-400 cursor-wait'
                                        : analysis
                                        ? 'text-slate-blue hover:text-slate-blue/80 hover:bg-blue-50'
                                        : 'bg-slate-blue text-white hover:bg-slate-blue/90'
                                    }`}
                                  >
                                    {isAnalyzing ? (
                                      <>
                                        <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                                        Analyzing...
                                      </>
                                    ) : (
                                      <>
                                        <Icon name="FaLightbulb" className="w-3 h-3" />
                                        Strategy
                                      </>
                                    )}
                                  </button>
                                  <a
                                    href={`https://${primaryDomain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-slate-blue hover:bg-blue-50 rounded transition-colors"
                                    aria-label={`Visit ${primaryDomain}`}
                                  >
                                    <Icon name="FaGlobe" className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Strategy Accordion Row */}
                        {isStrategyExpanded && primaryDomain && (analysis || isAnalyzing) && (
                          <tr className="bg-blue-50/50">
                            <td colSpan={5} className="py-3 px-4 pl-12">
                              {isAnalyzing ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                  <span>Analyzing {primaryDomain}...</span>
                                </div>
                              ) : analysis ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <DifficultyBadge difficulty={analysis.difficulty} />
                                    <span className="text-sm text-gray-600">
                                      {analysis.siteType}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-start gap-2">
                                      <Icon name="FaLightbulb" className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                      <p>{analysis.strategy}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )}

                        {/* Expanded Row - Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={5} className="py-3 px-4 pl-12">
                              <div className="space-y-3">
                                {/* Categories */}
                                {competitor.categories.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                      Categories
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {competitor.categories.map((category, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Domains */}
                                {competitor.domains.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                      Associated domains ({competitor.domains.length})
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {competitor.domains.map((domain, idx) => (
                                        <a
                                          key={idx}
                                          href={`https://${domain}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-slate-blue hover:underline"
                                        >
                                          {domain}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sample URLs */}
                                {competitor.sampleUrls.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                      Sample URLs
                                    </div>
                                    <ul className="space-y-1">
                                      {competitor.sampleUrls.slice(0, 3).map((url, idx) => (
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
                                  </div>
                                )}

                                {/* All Concepts */}
                                {competitor.concepts.length > 2 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                                      All concepts ({competitor.concepts.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {competitor.concepts.map((concept, idx) => (
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
