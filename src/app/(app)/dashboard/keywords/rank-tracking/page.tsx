/**
 * Rank Tracking Page (under Keywords)
 *
 * Shows keywords in a flat table view with rank and volume checking.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { CheckRankModal, CheckVolumeModal, ConceptsTable, AddKeywordConceptModal } from '@/features/rank-tracking/components';
import { useKeywords, useKeywordDetails } from '@/features/keywords/hooks/useKeywords';
import { KeywordDetailsSidebar } from '@/features/keywords/components/KeywordDetailsSidebar';
import { useAccountData, useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData, normalizePhrase } from '@/features/keywords/keywordUtils';

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

/** Geo grid summary stats */
interface GeoGridSummary {
  pointsInTop3: number;
  pointsInTop10: number;
  pointsInTop20: number;
  pointsNotFound: number;
  totalPoints: number;
  averagePosition: number | null;
}

/** Geo grid data for a concept */
interface GeoGridData {
  isTracked: boolean;
  locationName: string | null;
  summary: GeoGridSummary | null;
}

/** Enrichment data from batch-enrich API */
interface EnrichmentResponse {
  enrichment: Record<string, {
    geoGridStatus: {
      isTracked: boolean;
      locationName: string | null;
      summary: GeoGridSummary | null;
    } | null;
  }>;
}

export default function RankTrackingPage() {
    // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();
  const { business } = useBusinessData();
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string; locationCode?: number; locationName?: string } | null>(null);
  const [checkingVolumeTerm, setCheckingVolumeTerm] = useState<{ term: string; conceptId: string } | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [rankChecks, setRankChecks] = useState<RankCheck[]>([]);
  const [gridDataMap, setGridDataMap] = useState<Map<string, GeoGridData>>(new Map());

  // Track which keyword is currently being checked (for button loading state)
  const [checkingRankKeyword, setCheckingRankKeyword] = useState<string | null>(null);
  const [checkingVolumeKeyword, setCheckingVolumeKeyword] = useState<string | null>(null);

  // Looked-up location from business address (if location_code not set)
  const [lookedUpLocation, setLookedUpLocation] = useState<{
    locationCode: number;
    locationName: string;
  } | null>(null);
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);

  // Look up location from business address if no location_code is set
  useEffect(() => {
    if (business?.location_code) {
      setLookedUpLocation(null);
      return;
    }
    if (!business?.address_city) {
      setLookedUpLocation(null);
      return;
    }

    const lookupLocation = async () => {
      setIsLookingUpLocation(true);
      try {
        // Re-check inside async to satisfy TypeScript
        if (!business?.address_city) return;

        const searchQuery = business.address_state
          ? `${business.address_city}, ${business.address_state}`
          : business.address_city;

        const response = await apiClient.get<{
          locations: Array<{
            locationCode: number;
            locationName: string;
            locationType: string;
          }>;
        }>(`/rank-locations/search?q=${encodeURIComponent(searchQuery)}`);

        if (response.locations && response.locations.length > 0) {
          const cityMatch = response.locations.find(l => l.locationType === 'City');
          const bestMatch = cityMatch || response.locations[0];
          setLookedUpLocation({
            locationCode: bestMatch.locationCode,
            locationName: bestMatch.locationName,
          });
        }
      } catch (error) {
        console.error('Failed to lookup location from business address:', error);
      } finally {
        setIsLookingUpLocation(false);
      }
    };

    lookupLocation();
  }, [business?.location_code, business?.address_city, business?.address_state]);

  // Fetch keyword concepts (useKeywords already handles account changes)
  const {
    keywords: concepts,
    isLoading: conceptsLoading,
    createKeyword,
    refresh: refreshKeywords,
  } = useKeywords({ autoFetch: true });

  // Modal state for adding new keyword concept
  const [showAddModal, setShowAddModal] = useState(false);

  // State for concept sidebar
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const { keyword: selectedKeyword, promptPages, recentReviews, refresh: refreshKeywordDetails } = useKeywordDetails(selectedKeywordId);

  // Handle clicking on a concept to open the sidebar
  const handleConceptClick = useCallback((concept: KeywordData) => {
    setSelectedKeywordId(concept.id);
  }, []);

  // Handle updating a keyword from the sidebar
  const handleUpdateKeyword = useCallback(async (id: string, updates: Partial<KeywordData>): Promise<KeywordData | null> => {
    try {
      await apiClient.put(`/keywords/${id}`, updates);
      await refreshKeywords();
      await refreshKeywordDetails();
      return null; // The hook will refetch
    } catch (err) {
      console.error('Failed to update keyword:', err);
      return null;
    }
  }, [refreshKeywords, refreshKeywordDetails]);

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

  // Fetch grid data for concepts using batch-enrich API
  const fetchGridData = useCallback(async (keywordIds: string[]) => {
    if (keywordIds.length === 0) return;

    try {
      const response = await apiClient.post<EnrichmentResponse>('/keywords/batch-enrich', {
        keywordIds,
      });

      const newGridData = new Map<string, GeoGridData>();
      const enrichment = response.enrichment as Record<string, {
        geoGridStatus: {
          isTracked: boolean;
          locationName: string | null;
          summary: GeoGridSummary | null;
        } | null;
      }>;
      for (const [keywordId, data] of Object.entries(enrichment)) {
        if (data.geoGridStatus) {
          newGridData.set(keywordId, {
            isTracked: data.geoGridStatus.isTracked,
            locationName: data.geoGridStatus.locationName,
            summary: data.geoGridStatus.summary,
          });
        }
      }
      setGridDataMap(newGridData);
    } catch (err) {
      console.error('Failed to fetch grid data:', err);
    }
  }, []);

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setResearchResults([]);
    setRankChecks([]);
    setGridDataMap(new Map());

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

  // Refetch data when page becomes visible (user navigates back)
  // This ensures data is fresh after running checks on other pages
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedAccountId) {
        fetchResearchResults();
        fetchRankChecks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedAccountId, fetchResearchResults, fetchRankChecks]);

  // Fetch grid data when concepts are loaded
  useEffect(() => {
    if (concepts.length > 0) {
      // Only fetch grid data for concepts that are used in geo grid
      const gridKeywordIds = concepts
        .filter(c => c.isUsedInGeoGrid)
        .map(c => c.id);
      if (gridKeywordIds.length > 0) {
        fetchGridData(gridKeywordIds);
      }
    }
  }, [concepts, fetchGridData]);

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
      const normalizedTerm = normalizePhrase(check.search_query_used);

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

  // Handle clicking "Check ranking" - auto-run if location available, otherwise show modal
  const handleCheckRank = useCallback(async (keyword: string, conceptId: string) => {
    // If still looking up location, wait a bit
    if (isLookingUpLocation) {
      setCheckingRankKeyword(keyword);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find the concept to get its location
    const concept = concepts.find(k => k.id === conceptId);
    const conceptLocationCode = concept?.searchVolumeLocationCode;
    const conceptLocationName = concept?.searchVolumeLocationName;

    // Use concept location, or fallback to business location, or looked-up location from address
    const locationCode = conceptLocationCode || business?.location_code || lookedUpLocation?.locationCode;
    const locationName = conceptLocationName || business?.location_name || lookedUpLocation?.locationName;

    if (locationCode && locationName) {
      // Auto-run the check without modal - show loading on button
      setCheckingRankKeyword(keyword);
      try {
        const [desktopResponse, mobileResponse] = await Promise.all([
          apiClient.post<{
            success: boolean;
            position: number | null;
            found: boolean;
            error?: string;
          }>('/rank-tracking/check-keyword', {
            keyword,
            keywordId: conceptId,
            locationCode,
            device: 'desktop',
          }),
          apiClient.post<{
            success: boolean;
            position: number | null;
            found: boolean;
            error?: string;
          }>('/rank-tracking/check-keyword', {
            keyword,
            keywordId: conceptId,
            locationCode,
            device: 'mobile',
          }),
        ]);

        if (desktopResponse.success && mobileResponse.success) {
          // Refresh rank checks to update the table
          await fetchRankChecks();
        }
      } catch (error) {
        console.error('Auto rank check failed:', error);
        // Fall back to showing modal on error
        setCheckingKeyword({ keyword, conceptId, locationCode, locationName });
      } finally {
        setCheckingRankKeyword(null);
      }
    } else {
      // No location available, show modal
      setCheckingKeyword({ keyword, conceptId });
    }
  }, [concepts, business, lookedUpLocation, isLookingUpLocation, fetchRankChecks]);

  // Handle clicking "Check volume" - auto-run if location available, otherwise show modal
  const handleCheckVolume = useCallback(async (keyword: string, conceptId: string) => {
    // If still looking up location, wait a bit
    if (isLookingUpLocation) {
      setCheckingVolumeKeyword(keyword);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Use business location or looked-up location from address
    const locationCode = business?.location_code || lookedUpLocation?.locationCode;
    const locationName = business?.location_name || lookedUpLocation?.locationName;

    if (locationCode && locationName) {
      // Auto-run the check without modal - show loading on button
      setCheckingVolumeKeyword(keyword);
      try {
        const response = await apiClient.post<{
          keyword: string;
          volume: number | null;
          cpc: number | null;
          competitionLevel: string | null;
          error?: string;
        }>('/rank-tracking/discovery', {
          keyword,
          locationCode,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        // Save the research result with keywordId to link to concept
        await apiClient.post('/keyword-research/save', {
          term: keyword,
          searchVolume: response.volume,
          cpc: response.cpc,
          competition: null,
          competitionLevel: response.competitionLevel,
          locationCode,
          locationName,
          keywordId: conceptId,
        });

        // Refresh the research results to update the UI
        await fetchResearchResults();
      } catch (error) {
        console.error('Auto volume check failed:', error);
        // Fall back to showing modal on error
        setCheckingVolumeTerm({ term: keyword, conceptId });
      } finally {
        setCheckingVolumeKeyword(null);
      }
    } else {
      // No location available, show modal
      setCheckingVolumeTerm({ term: keyword, conceptId });
    }
  }, [business, lookedUpLocation, isLookingUpLocation, fetchResearchResults]);

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
      keyword: checkingVolumeTerm.term,
      locationCode,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Save the research result with keywordId to link to concept
    await apiClient.post('/keyword-research/save', {
      term: checkingVolumeTerm.term,
      searchVolume: response.volume,
      cpc: response.cpc,
      competition: null,
      competitionLevel: response.competitionLevel,
      locationCode,
      locationName,
      keywordId: checkingVolumeTerm.conceptId,
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

  // Handle adding a new keyword concept
  const handleAddKeywordConcept = useCallback(async (data: { name: string; keyword: string }) => {
    // Create keyword with the name as the phrase and the keyword as a search term
    const newKeyword = await createKeyword(data.name);
    if (!newKeyword) {
      throw new Error('Failed to create keyword concept');
    }

    // Update the keyword to add the search term and enable rank tracking
    const now = new Date().toISOString();
    await apiClient.put(`/keywords/${newKeyword.id}`, {
      searchTerms: [{ term: data.keyword, isCanonical: true, addedAt: now }],
      isUsedInRankTracking: true,
    });

    // Refresh the list
    await refreshKeywords();
  }, [createKeyword, refreshKeywords]);

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

      {/* Main Tab Navigation (Library | Rank Tracking | LLM Visibility) */}
      <SubNav
        items={[
          { label: 'Library', icon: 'FaKey', href: '/dashboard/keywords', matchType: 'exact' },
          { label: 'Rank Tracking', icon: 'FaChartLine', href: '/dashboard/keywords/rank-tracking', matchType: 'startsWith' },
          { label: 'LLM Visibility', icon: 'FaSparkles', href: '/dashboard/keywords/llm-visibility', matchType: 'startsWith' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaChartLine" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
        className="!px-4 md:!px-4 lg:!px-6"
      >
        {/* Header */}
        <PageCardHeader
          title="Rank tracking"
          description="Monitor your Google search rankings across desktop and mobile devices."
          actions={
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 flex items-center gap-2 transition-colors"
              >
                <Icon name="FaPlus" className="w-4 h-4" />
                Keyword
              </button>
              <div className="relative w-48 md:w-64">
                <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keywords..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30 transition-all"
                />
              </div>
            </>
          }
        />

        {/* Keywords Table */}
        <ConceptsTable
          concepts={filteredConcepts}
          volumeData={volumeData}
          rankData={rankData}
          gridData={gridDataMap}
          onConceptClick={handleConceptClick}
          onCheckRank={handleCheckRank}
          onCheckVolume={handleCheckVolume}
          isLoading={conceptsLoading}
          checkingRankKeyword={checkingRankKeyword}
          checkingVolumeKeyword={checkingVolumeKeyword}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
        defaultLocationCode={checkingKeyword?.locationCode}
        defaultLocationName={checkingKeyword?.locationName}
        locationLocked={!!checkingKeyword?.locationCode}
      />

      {/* Check Volume Modal */}
      <CheckVolumeModal
        keyword={checkingVolumeTerm?.term || ''}
        isOpen={!!checkingVolumeTerm}
        onClose={() => setCheckingVolumeTerm(null)}
        onCheck={performVolumeCheck}
      />

      {/* Add Keyword Concept Modal */}
      <AddKeywordConceptModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddKeywordConcept}
      />

      {/* Keyword Details Sidebar */}
      <KeywordDetailsSidebar
        isOpen={!!selectedKeyword}
        keyword={selectedKeyword}
        promptPages={promptPages}
        recentReviews={recentReviews}
        onClose={() => setSelectedKeywordId(null)}
        onUpdate={handleUpdateKeyword}
        onRefresh={refreshKeywords}
        onCheckRank={handleCheckRank}
      />

    </div>
  );
}
