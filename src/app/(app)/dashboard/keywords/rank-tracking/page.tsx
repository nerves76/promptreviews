/**
 * Rank Tracking Page (under Keywords)
 *
 * Shows keywords in a flat table view with rank and volume checking.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { CheckRankModal, CheckVolumeModal, ConceptsTable } from '@/features/rank-tracking/components';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';

/** Volume data for a search term */
interface VolumeData {
  searchVolume: number | null;
  cpc: number | null;
  competitionLevel: string | null;
  locationName: string | null;
}

/** Research result from API */
interface ResearchResult {
  id: string;
  term: string;
  normalizedTerm: string;
  searchVolume: number | null;
  cpc: number | null;
  competitionLevel: string | null;
  locationName: string;
}

/** Rank check result from API */
interface RankCheck {
  id: string;
  keyword_id: string;
  search_query_used: string;
  location_code: number;
  location_name: string;
  device: 'desktop' | 'mobile';
  position: number | null;
  found_url: string | null;
  checked_at: string;
}

/** Rank data for display */
interface RankData {
  desktop: { position: number | null; checkedAt: string } | null;
  mobile: { position: number | null; checkedAt: string } | null;
  locationName: string;
}

export default function RankTrackingPage() {
  const pathname = usePathname();
  // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string } | null>(null);
  const [checkingVolumeTerm, setCheckingVolumeTerm] = useState<string | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [rankChecks, setRankChecks] = useState<RankCheck[]>([]);

  // Fetch keyword concepts (useKeywords already handles account changes)
  const {
    keywords: concepts,
    isLoading: conceptsLoading,
  } = useKeywords({ autoFetch: true });

  // Fetch saved research results for volume data
  const fetchResearchResults = useCallback(async () => {
    try {
      const response = await apiClient.get<{ results: ResearchResult[] }>('/keyword-research/results?limit=500');
      setResearchResults(response.results || []);
    } catch (err) {
      console.error('Failed to fetch research results:', err);
    }
  }, []);

  // Fetch rank checks
  const fetchRankChecks = useCallback(async () => {
    try {
      const response = await apiClient.get<{ checks: RankCheck[] }>('/rank-tracking/checks?limit=500');
      setRankChecks(response.checks || []);
    } catch (err) {
      console.error('Failed to fetch rank checks:', err);
    }
  }, []);

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setResearchResults([]);
    setRankChecks([]);

    if (selectedAccountId) {
      fetchResearchResults();
      fetchRankChecks();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Also fetch on mount
  useEffect(() => {
    if (selectedAccountId) {
      fetchResearchResults();
      fetchRankChecks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build term volume data map
  const volumeData = useMemo(() => {
    const map = new Map<string, VolumeData>();
    researchResults.forEach((result) => {
      map.set(result.normalizedTerm, {
        searchVolume: result.searchVolume,
        cpc: result.cpc,
        competitionLevel: result.competitionLevel,
        locationName: result.locationName,
      });
    });
    return map;
  }, [researchResults]);

  // Build term rank data map (most recent check per term, combining desktop & mobile)
  const rankData = useMemo(() => {
    const map = new Map<string, RankData>();
    // Sort by checked_at descending to get most recent first
    const sortedChecks = [...rankChecks].sort(
      (a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
    );
    sortedChecks.forEach((check) => {
      const normalizedTerm = check.search_query_used.toLowerCase().trim();

      if (!map.has(normalizedTerm)) {
        map.set(normalizedTerm, {
          desktop: null,
          mobile: null,
          locationName: check.location_name,
        });
      }

      const existing = map.get(normalizedTerm)!;
      // Only set if not already set (keep most recent)
      if (check.device === 'desktop' && !existing.desktop) {
        existing.desktop = { position: check.position, checkedAt: check.checked_at };
      } else if (check.device === 'mobile' && !existing.mobile) {
        existing.mobile = { position: check.position, checkedAt: check.checked_at };
      }
    });
    return map;
  }, [rankChecks]);

  // Filter concepts by search query
  const filteredConcepts = searchQuery.trim()
    ? concepts.filter(c =>
        c.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.searchTerms.some(t => t.term.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : concepts;

  // Open the check rank modal for a keyword
  const handleCheckRank = useCallback((keyword: string, conceptId: string) => {
    setCheckingKeyword({ keyword, conceptId });
  }, []);

  // Open the check volume modal for a keyword
  const handleCheckVolume = useCallback((keyword: string) => {
    setCheckingVolumeTerm(keyword);
  }, []);

  // Perform the volume check (called from modal)
  const performVolumeCheck = useCallback(async (
    locationCode: number,
    locationName: string
  ): Promise<{
    searchVolume: number | null;
    cpc: number | null;
    competitionLevel: string | null;
  }> => {
    if (!checkingVolumeTerm) throw new Error('No keyword selected');

    // Use the discovery API to get volume
    const response = await apiClient.post<{
      keyword: string;
      volume: number | null;
      cpc: number | null;
      competitionLevel: string | null;
      error?: string;
    }>('/rank-tracking/discovery', {
      keyword: checkingVolumeTerm,
      locationCode,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Save the research result
    await apiClient.post('/keyword-research/save', {
      term: checkingVolumeTerm,
      searchVolume: response.volume,
      cpc: response.cpc,
      competition: null,
      competitionLevel: response.competitionLevel,
      locationCode,
      locationName,
    });

    // Refresh the research results to update the UI
    await fetchResearchResults();

    return {
      searchVolume: response.volume,
      cpc: response.cpc,
      competitionLevel: response.competitionLevel,
    };
  }, [checkingVolumeTerm, fetchResearchResults]);

  // Perform the rank check (called from modal) - checks both desktop and mobile
  const performRankCheck = useCallback(async (
    locationCode: number,
    locationName: string
  ): Promise<{
    desktop: { position: number | null; found: boolean };
    mobile: { position: number | null; found: boolean };
  }> => {
    if (!checkingKeyword) throw new Error('No keyword selected');

    // Check both desktop and mobile in parallel
    const [desktopResponse, mobileResponse] = await Promise.all([
      apiClient.post<{
        success: boolean;
        position: number | null;
        found: boolean;
        foundUrl: string | null;
        creditsUsed: number;
        creditsRemaining: number;
        error?: string;
      }>('/rank-tracking/check-keyword', {
        keyword: checkingKeyword.keyword,
        keywordId: checkingKeyword.conceptId,
        locationCode,
        device: 'desktop',
      }),
      apiClient.post<{
        success: boolean;
        position: number | null;
        found: boolean;
        foundUrl: string | null;
        creditsUsed: number;
        creditsRemaining: number;
        error?: string;
      }>('/rank-tracking/check-keyword', {
        keyword: checkingKeyword.keyword,
        keywordId: checkingKeyword.conceptId,
        locationCode,
        device: 'mobile',
      }),
    ]);

    if (!desktopResponse.success) {
      throw new Error(desktopResponse.error || 'Failed to check desktop rank');
    }
    if (!mobileResponse.success) {
      throw new Error(mobileResponse.error || 'Failed to check mobile rank');
    }

    // Refresh rank checks to update the table
    await fetchRankChecks();

    return {
      desktop: { position: desktopResponse.position, found: desktopResponse.found },
      mobile: { position: mobileResponse.position, found: mobileResponse.found },
    };
  }, [checkingKeyword, fetchRankChecks]);

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Keyword Concepts
          </h1>
        </div>
      </div>

      {/* Main Tab Navigation (Library | Research | Rank Tracking | LLM Visibility) */}
      <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg gap-0">
          <Link
            href="/dashboard/keywords"
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaKey" className="w-[18px] h-[18px]" size={18} />
            Library
          </Link>
          <Link
            href="/dashboard/keywords/research"
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords/research'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaSearch" className="w-[18px] h-[18px]" size={18} />
            Research
          </Link>
          <Link
            href="/dashboard/keywords/rank-tracking"
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname.startsWith('/dashboard/keywords/rank-tracking')
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaChartLine" className="w-[18px] h-[18px]" size={18} />
            Rank Tracking
          </Link>
          <Link
            href="/dashboard/keywords/llm-visibility"
            className={`px-6 py-1.5 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname.startsWith('/dashboard/keywords/llm-visibility')
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaSparkles" className="w-[18px] h-[18px]" size={18} />
            LLM Visibility
          </Link>
        </div>
      </div>

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaChartLine" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        {/* Search header */}
        <div className="flex items-center justify-end mb-6">
          <div className="relative w-64">
            <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30 transition-all"
            />
          </div>
        </div>

        {/* Keywords Table */}
        <ConceptsTable
          concepts={filteredConcepts}
          volumeData={volumeData}
          rankData={rankData}
          onCheckRank={handleCheckRank}
          onCheckVolume={handleCheckVolume}
          isLoading={conceptsLoading}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
      />

      {/* Check Volume Modal */}
      <CheckVolumeModal
        keyword={checkingVolumeTerm || ''}
        isOpen={!!checkingVolumeTerm}
        onClose={() => setCheckingVolumeTerm(null)}
        onCheck={performVolumeCheck}
      />
    </div>
  );
}
