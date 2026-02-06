'use client';

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import PromptyIcon from '@/app/(app)/components/prompt-modules/PromptyIcon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import RunAllAnalysisModal from '../components/RunAllAnalysisModal';
import { Pagination } from '@/components/Pagination';

// --- Domain view types ---

interface ResearchSourceUrl {
  url: string;
  count: number;
}

interface ResearchSource {
  domain: string;
  frequency: number;
  lastSeen: string;
  sampleUrls: ResearchSourceUrl[];
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

// --- URL view types ---

interface URLResearchSource {
  url: string;
  domain: string;
  frequency: number;
  lastSeen: string;
  concepts: string[];
  isOurs: boolean;
}

interface URLResearchSourcesData {
  sources: URLResearchSource[];
  totalChecks: number;
  uniqueUrls: number;
  yourUrlAppearances: number;
}

interface DomainAnalysis {
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
}

type ViewMode = 'domain' | 'url';
type SortField = 'domain' | 'frequency' | 'lastSeen' | 'concepts' | 'difficulty';
type URLSortField = 'url' | 'domain' | 'frequency' | 'lastSeen' | 'concepts' | 'difficulty';
type SortDirection = 'asc' | 'desc';

// Pagination
const PAGE_SIZE = 50;

/**
 * Strip UTM and other tracking parameters from a URL for cleaner display
 */
function stripTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
    // Return clean URL, removing trailing ? if no params left
    let cleanUrl = urlObj.toString();
    if (cleanUrl.endsWith('?')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  } catch {
    return url; // Return original if parsing fails
  }
}

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
 * AI Research Sources Page
 *
 * Shows aggregated and ranked websites that AI assistants use when researching answers.
 * Helps users identify high-value link building targets.
 */
export default function ResearchSourcesPage() {
  const { selectedAccountId } = useAccountData();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('domain');

  // Domain view state
  const [data, setData] = useState<ResearchSourcesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // URL view state
  const [urlData, setUrlData] = useState<URLResearchSourcesData | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

  // Domain analysis state
  const [analyses, setAnalyses] = useState<Record<string, DomainAnalysis>>({});
  const [analyzingDomains, setAnalyzingDomains] = useState<Set<string>>(new Set());
  const [strategyExpanded, setStrategyExpanded] = useState<Set<string>>(new Set());

  // URL analysis state (separate from domain analyses)
  const [urlAnalyses, setUrlAnalyses] = useState<Record<string, DomainAnalysis>>({});
  const [analyzingUrls, setAnalyzingUrls] = useState<Set<string>>(new Set());

  // Run all modal state
  const [showRunAllModal, setShowRunAllModal] = useState(false);
  const [unanalyzedCount, setUnanalyzedCount] = useState<number | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Sorting - domain view
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Sorting - URL view
  const [urlSortField, setUrlSortField] = useState<URLSortField>('frequency');
  const [urlSortDirection, setUrlSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [urlCurrentPage, setUrlCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Fetch domain data
  const fetchData = useCallback(async () => {
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
  }, [selectedAccountId]);

  // Fetch URL data (lazy - only when switching to URL view)
  const fetchUrlData = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsUrlLoading(true);
    setUrlError(null);

    try {
      const response = await apiClient.get<URLResearchSourcesData>(
        '/llm-visibility/research-sources?view=url'
      );
      setUrlData(response);
    } catch (err: any) {
      console.error('[ResearchSourcesPage] Error fetching URL data:', err);
      setUrlError(err?.message || 'Failed to load URL data');
    } finally {
      setIsUrlLoading(false);
    }
  }, [selectedAccountId]);

  // Fetch unanalyzed count
  const fetchUnanalyzedCount = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const response = await apiClient.get<{ totalItems: number; hasActiveRun: boolean }>(
        '/llm-visibility/batch-analyze?type=domain'
      );
      if (!response.hasActiveRun) {
        setUnanalyzedCount(response.totalItems);
      }
    } catch (err) {
      console.error('[ResearchSourcesPage] Error fetching unanalyzed count:', err);
    }
  }, [selectedAccountId]);

  // Fetch all cached analyses on load
  const fetchCachedAnalyses = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const response = await apiClient.get<{ analyses: Record<string, DomainAnalysis> }>(
        '/llm-visibility/domain-analyses'
      );
      if (response.analyses) {
        setAnalyses(response.analyses);
      }
    } catch (err) {
      console.error('[ResearchSourcesPage] Error fetching cached analyses:', err);
    }
  }, [selectedAccountId]);

  // Fetch all cached URL analyses
  const fetchCachedUrlAnalyses = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const response = await apiClient.get<{ analyses: Record<string, DomainAnalysis> }>(
        '/llm-visibility/url-analyses'
      );
      if (response.analyses) {
        setUrlAnalyses(response.analyses);
      }
    } catch (err) {
      console.error('[ResearchSourcesPage] Error fetching cached URL analyses:', err);
    }
  }, [selectedAccountId]);

  // Fetch domain data on mount
  useEffect(() => {
    fetchData();
    fetchUnanalyzedCount();
    fetchCachedAnalyses();
  }, [fetchData, fetchUnanalyzedCount, fetchCachedAnalyses]);

  // Fetch URL data and cached URL analyses when switching to URL view
  useEffect(() => {
    if (viewMode === 'url' && !urlData && !isUrlLoading) {
      fetchUrlData();
      fetchCachedUrlAnalyses();
    }
  }, [viewMode, urlData, isUrlLoading, fetchUrlData, fetchCachedUrlAnalyses]);

  // Handle view mode switch
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setCurrentPage(1);
    setUrlCurrentPage(1);
  }, []);

  // Handle batch analysis complete - refresh data and count
  const handleAnalysisComplete = useCallback(() => {
    fetchCachedAnalyses();
    fetchUnanalyzedCount();
  }, [fetchUnanalyzedCount, fetchCachedAnalyses]);

  // Export to CSV
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/llm-visibility/export-research-sources', {
        headers: {
          'X-Selected-Account': selectedAccountId || '',
        },
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visibility-opportunities-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ResearchSourcesPage] Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [selectedAccountId]);

  // Fetch analysis for a domain (from cache or generate new)
  const fetchAnalysis = useCallback(async (domain: string) => {
    if (analyzingDomains.has(domain) || analyses[domain]) {
      return;
    }

    setAnalyzingDomains(prev => new Set(prev).add(domain));

    try {
      const result = await apiClient.post<DomainAnalysis>('/llm-visibility/analyze-domain', {
        domain,
      });
      setAnalyses(prev => ({
        ...prev,
        [domain]: result,
      }));
    } catch (err) {
      console.error('[ResearchSourcesPage] Error fetching domain analysis:', err);
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

  // Toggle row expand (domain view) and fetch analysis if needed
  const toggleRowExpand = useCallback((domain: string) => {
    const isCurrentlyExpanded = expandedDomain === domain;
    setExpandedDomain(isCurrentlyExpanded ? null : domain);

    if (!isCurrentlyExpanded) {
      fetchAnalysis(domain);
    }
  }, [expandedDomain, fetchAnalysis]);

  // Fetch URL-specific analysis
  const fetchUrlAnalysis = useCallback(async (url: string) => {
    if (analyzingUrls.has(url) || urlAnalyses[url]) {
      return;
    }

    setAnalyzingUrls(prev => new Set(prev).add(url));

    try {
      const result = await apiClient.post<DomainAnalysis>('/llm-visibility/analyze-url', {
        url,
      });
      setUrlAnalyses(prev => ({
        ...prev,
        [url]: result,
      }));
    } catch (err) {
      console.error('[ResearchSourcesPage] Error fetching URL analysis:', err);
      setUrlAnalyses(prev => ({
        ...prev,
        [url]: {
          difficulty: 'medium',
          siteType: 'Unknown',
          strategy: 'Unable to analyze this URL. Please try again later.',
        },
      }));
    } finally {
      setAnalyzingUrls(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  }, [analyzingUrls, urlAnalyses]);

  // Toggle row expand (URL view) - fetches URL-specific analysis
  const toggleUrlRowExpand = useCallback((url: string) => {
    const isCurrentlyExpanded = expandedUrl === url;
    setExpandedUrl(isCurrentlyExpanded ? null : url);

    if (!isCurrentlyExpanded) {
      fetchUrlAnalysis(url);
    }
  }, [expandedUrl, fetchUrlAnalysis]);

  // Analyze button click - expands strategy and fetches if needed
  const analyzeDomain = useCallback((domain: string) => {
    setStrategyExpanded(prev => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
    fetchAnalysis(domain);
  }, [fetchAnalysis]);

  // Analyze URL button click
  const analyzeUrl = useCallback((url: string) => {
    setStrategyExpanded(prev => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
    fetchUrlAnalysis(url);
  }, [fetchUrlAnalysis]);

  // Handle sort (domain view)
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'domain' ? 'asc' : 'desc');
    }
  };

  // Handle sort (URL view)
  const handleUrlSort = (field: URLSortField) => {
    if (urlSortField === field) {
      setUrlSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setUrlSortField(field);
      setUrlSortDirection(field === 'url' || field === 'domain' ? 'asc' : 'desc');
    }
  };

  // Helper to get difficulty sort value (domain view)
  const getDifficultySortValue = useCallback((domain: string) => {
    const analysis = analyses[domain];
    if (!analysis) return 4;
    switch (analysis.difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 4;
    }
  }, [analyses]);

  // Helper to get difficulty sort value (URL view)
  const getUrlDifficultySortValue = useCallback((url: string) => {
    const analysis = urlAnalyses[url];
    if (!analysis) return 4;
    switch (analysis.difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 4;
    }
  }, [urlAnalyses]);

  // Sorted domain data
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
        case 'difficulty':
          comparison = getDifficultySortValue(a.domain) - getDifficultySortValue(b.domain);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.sources, sortField, sortDirection, getDifficultySortValue]);

  // Sorted URL data
  const sortedUrlSources = useMemo(() => {
    if (!urlData?.sources) return [];

    return [...urlData.sources].sort((a, b) => {
      let comparison = 0;

      switch (urlSortField) {
        case 'url':
          comparison = a.url.localeCompare(b.url);
          break;
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
        case 'difficulty':
          comparison = getUrlDifficultySortValue(a.url) - getUrlDifficultySortValue(b.url);
          break;
      }

      return urlSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [urlData?.sources, urlSortField, urlSortDirection, getUrlDifficultySortValue]);

  // Pagination - domain view
  const totalPages = Math.ceil(sortedSources.length / PAGE_SIZE);
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSources.slice(start, start + PAGE_SIZE);
  }, [sortedSources, currentPage]);

  // Pagination - URL view
  const urlTotalPages = Math.ceil(sortedUrlSources.length / PAGE_SIZE);
  const paginatedUrlSources = useMemo(() => {
    const start = (urlCurrentPage - 1) * PAGE_SIZE;
    return sortedUrlSources.slice(start, start + PAGE_SIZE);
  }, [sortedUrlSources, urlCurrentPage]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  useEffect(() => {
    setUrlCurrentPage(1);
  }, [urlSortField, urlSortDirection]);

  // Get top domain for summary
  const topDomain = sortedSources.length > 0 ? sortedSources[0] : null;

  // Sort icon helper (domain view)
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

  // Sort icon helper (URL view)
  const URLSortIcon = ({ field }: { field: URLSortField }) => {
    if (urlSortField !== field) {
      return <Icon name="FaChevronDown" className="w-2.5 h-2.5 text-gray-400" />;
    }
    return urlSortDirection === 'asc' ? (
      <Icon name="FaCaretUp" className="w-3 h-3 text-slate-blue" />
    ) : (
      <Icon name="FaCaretDown" className="w-3 h-3 text-slate-blue" />
    );
  };

  // Determine if we have data to show (either view)
  const hasData = viewMode === 'domain'
    ? (!isLoading && !error && data && data.sources.length > 0)
    : (!isUrlLoading && !urlError && urlData && urlData.sources.length > 0);

  const isCurrentLoading = viewMode === 'domain' ? isLoading : isUrlLoading;
  const currentError = viewMode === 'domain' ? error : urlError;
  const isEmpty = viewMode === 'domain'
    ? (!isLoading && !error && data && data.sources.length === 0)
    : (!isUrlLoading && !urlError && urlData && urlData.sources.length === 0);

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
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaGlobe" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <PageCardHeader
          title="AI research sources"
          description="When you run queries through ChatGPT we save the websites used to determine what brands should be mentioned. Getting your brand on these websites will increase your chances of being mentioned in AI results and improve your SEO."
        />

        {/* Loading State */}
        {isCurrentLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Loading research sources...</p>
          </div>
        )}

        {/* Error State */}
        {currentError && !isCurrentLoading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
              <span>{currentError}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
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
              href="/dashboard/ai-search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
            >
              <Icon name="FaArrowLeft" className="w-4 h-4" />
              Back to AI visibility
            </Link>
          </div>
        )}

        {/* Data Display - show when domain view has data OR we're in URL view and domain loaded */}
        {!isCurrentLoading && !currentError && (data && data.sources.length > 0 || (viewMode === 'url' && urlData)) && (
          <>
            {/* Summary Cards - always from domain data */}
            {data && data.sources.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">
                    {viewMode === 'url' && urlData ? urlData.uniqueUrls : data.uniqueDomains}
                  </div>
                  <div className="text-sm text-gray-600">
                    {viewMode === 'url' ? 'Unique URLs' : 'Unique domains'}
                  </div>
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
            )}

            {/* Action Bar with View Toggle */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('domain')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      viewMode === 'domain'
                        ? 'bg-slate-blue text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Icon name="FaGlobe" className="w-3.5 h-3.5" />
                    By domain
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('url')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      viewMode === 'url'
                        ? 'bg-slate-blue text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <Icon name="FaLink" className="w-3.5 h-3.5" />
                    By URL
                  </button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1">
                  <div className="flex items-start gap-2">
                    <Icon name="FaInfoCircle" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p>This data comes from ChatGPT checks only.</p>
                      <p className="text-blue-700 mt-1">AI analysis may contain errors. We recommend verifying with trusted sources.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {isExporting ? (
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon name="FaFileAlt" className="w-4 h-4" />
                  )}
                  Export CSV
                </button>
                <button
                  onClick={() => setShowRunAllModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium text-sm transition-colors whitespace-nowrap"
                >
                  <PromptyIcon className="w-4 h-4" />
                  {unanalyzedCount === null
                    ? 'Analyze opportunities'
                    : unanalyzedCount === 0
                    ? 'Analyze again'
                    : `Analyze opportunities (${unanalyzedCount})`}
                </button>
              </div>
            </div>

            {/* === DOMAIN VIEW TABLE === */}
            {viewMode === 'domain' && (
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
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Frequency
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleSort('difficulty')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                        >
                          Difficulty
                          <SortIcon field="difficulty" />
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
                    {paginatedSources.map((source) => {
                      const isExpanded = expandedDomain === source.domain;
                      const analysis = analyses[source.domain];
                      const isAnalyzing = analyzingDomains.has(source.domain);

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
                                  onClick={() => toggleRowExpand(source.domain)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
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

                            {/* Difficulty */}
                            <td className="py-3 px-3 text-center">
                              {isAnalyzing ? (
                                <Icon name="FaSpinner" className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
                              ) : analysis ? (
                                <DifficultyBadge difficulty={analysis.difficulty} />
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
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
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => analyzeDomain(source.domain)}
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
                                      <PromptyIcon className="w-3 h-3" />
                                      Opportunities
                                    </>
                                  )}
                                </button>
                                <a
                                  href={`https://${source.domain}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-slate-blue hover:bg-blue-50 rounded transition-colors"
                                  aria-label={`Visit ${source.domain}`}
                                >
                                  <Icon name="FaLink" className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row - Analysis & Sample URLs */}
                          {isExpanded && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="py-3 px-4 pl-12">
                                <div className="space-y-4">
                                  {/* Analysis Section */}
                                  {(analysis || isAnalyzing) && (
                                    <div className="space-y-2">
                                      {isAnalyzing ? (
                                        <div className="flex items-center gap-2 text-gray-500">
                                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                          <span>Analyzing {source.domain}...</span>
                                        </div>
                                      ) : analysis ? (
                                        <>
                                          <div className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Site type:</span> {analysis.siteType}
                                          </div>
                                          <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-start gap-2">
                                              <Icon name="FaLightbulb" className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                              <p>{analysis.strategy}</p>
                                            </div>
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  )}

                                  {/* Sample URLs Section */}
                                  <div className="text-xs font-medium text-gray-500 uppercase">
                                    Sample pages used ({source.sampleUrls.length})
                                  </div>
                                  {source.sampleUrls.length > 0 ? (
                                    <ul className="space-y-1">
                                      {source.sampleUrls.map((urlData, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Icon name="FaLink" className="w-3 h-3 text-gray-400 mt-1 flex-shrink-0" />
                                          <a
                                            href={urlData.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-slate-blue hover:underline break-all"
                                          >
                                            {stripTrackingParams(urlData.url)}
                                          </a>
                                          {urlData.count > 1 && (
                                            <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded font-medium">
                                              {urlData.count}x
                                            </span>
                                          )}
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

                {/* Pagination */}
                {sortedSources.length > PAGE_SIZE && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={sortedSources.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={(page) => startTransition(() => setCurrentPage(page))}
                  />
                )}
              </div>
            )}

            {/* === URL VIEW TABLE === */}
            {viewMode === 'url' && urlData && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left">
                        <button
                          onClick={() => handleUrlSort('url')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          URL
                          <URLSortIcon field="url" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleUrlSort('frequency')}
                          className="text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Frequency
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleUrlSort('difficulty')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                        >
                          Difficulty
                          <URLSortIcon field="difficulty" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-left">
                        <button
                          onClick={() => handleUrlSort('domain')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Domain
                          <URLSortIcon field="domain" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleUrlSort('lastSeen')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                        >
                          Last seen
                          <URLSortIcon field="lastSeen" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-left">
                        <button
                          onClick={() => handleUrlSort('concepts')}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                        >
                          Concepts
                          <URLSortIcon field="concepts" />
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
                    {paginatedUrlSources.map((source) => {
                      const isExpanded = expandedUrl === source.url;
                      const urlAnalysis = urlAnalyses[source.url];
                      const isAnalyzingUrl = analyzingUrls.has(source.url);

                      return (
                        <React.Fragment key={source.url}>
                          <tr
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              source.isOurs ? 'bg-green-50/50' : ''
                            }`}
                          >
                            {/* URL */}
                            <td className="py-3 px-4 max-w-md">
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => toggleUrlRowExpand(source.url)}
                                  className="p-1 hover:bg-gray-100 rounded mt-0.5 flex-shrink-0"
                                  aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                >
                                  <Icon
                                    name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                                    className="w-3 h-3 text-gray-500"
                                  />
                                </button>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm font-medium hover:underline break-all ${
                                    source.isOurs ? 'text-green-700' : 'text-slate-blue'
                                  }`}
                                >
                                  {stripTrackingParams(source.url)}
                                </a>
                                {source.isOurs && (
                                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded whitespace-nowrap">
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

                            {/* Difficulty */}
                            <td className="py-3 px-3 text-center">
                              {isAnalyzingUrl ? (
                                <Icon name="FaSpinner" className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
                              ) : urlAnalysis ? (
                                <DifficultyBadge difficulty={urlAnalysis.difficulty} />
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>

                            {/* Domain */}
                            <td className="py-3 px-3">
                              <a
                                href={`https://${source.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-slate-blue hover:underline"
                              >
                                {source.domain}
                              </a>
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
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => analyzeUrl(source.url)}
                                  disabled={isAnalyzingUrl}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                                    isAnalyzingUrl
                                      ? 'bg-gray-100 text-gray-400 cursor-wait'
                                      : urlAnalysis
                                      ? 'text-slate-blue hover:text-slate-blue/80 hover:bg-blue-50'
                                      : 'bg-slate-blue text-white hover:bg-slate-blue/90'
                                  }`}
                                >
                                  {isAnalyzingUrl ? (
                                    <>
                                      <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                                      Analyzing...
                                    </>
                                  ) : (
                                    <>
                                      <PromptyIcon className="w-3 h-3" />
                                      Opportunities
                                    </>
                                  )}
                                </button>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-slate-blue hover:bg-blue-50 rounded transition-colors"
                                  aria-label={`Visit ${stripTrackingParams(source.url)}`}
                                >
                                  <Icon name="FaLink" className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row - URL Analysis & Concepts */}
                          {isExpanded && (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="py-3 px-4 pl-12">
                                <div className="space-y-4">
                                  {/* URL Analysis Section */}
                                  {(urlAnalysis || isAnalyzingUrl) && (
                                    <div className="space-y-2">
                                      {isAnalyzingUrl ? (
                                        <div className="flex items-center gap-2 text-gray-500">
                                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                                          <span>Analyzing URL...</span>
                                        </div>
                                      ) : urlAnalysis ? (
                                        <>
                                          <div className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">Page type:</span> {urlAnalysis.siteType}
                                          </div>
                                          <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                            <div className="flex items-start gap-2">
                                              <Icon name="FaLightbulb" className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                              <p>{urlAnalysis.strategy}</p>
                                            </div>
                                          </div>
                                        </>
                                      ) : null}
                                    </div>
                                  )}

                                  {/* All Concepts */}
                                  {source.concepts.length > 2 && (
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase mb-2">
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

                {/* Pagination */}
                {sortedUrlSources.length > PAGE_SIZE && (
                  <Pagination
                    currentPage={urlCurrentPage}
                    totalPages={urlTotalPages}
                    totalItems={sortedUrlSources.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={(page) => startTransition(() => setUrlCurrentPage(page))}
                  />
                )}
              </div>
            )}
          </>
        )}
      </PageCard>

      {/* Run All Analysis Modal */}
      <RunAllAnalysisModal
        isOpen={showRunAllModal}
        onClose={() => setShowRunAllModal(false)}
        analysisType="domain"
        onComplete={handleAnalysisComplete}
      />
    </div>
  );
}
