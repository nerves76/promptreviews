/**
 * Rank Tracking Page (under Keywords)
 *
 * Shows keywords in a flat table view with rank and volume checking.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { CheckRankModal, CheckVolumeModal, ConceptsTable, AddKeywordConceptModal, RunAllRankModal } from '@/features/rank-tracking/components';
import { useKeywords, useKeywordDetails } from '@/features/keywords/hooks/useKeywords';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { KeywordDetailsSidebar } from '@/features/keywords/components/KeywordDetailsSidebar';
import { useAccountData, useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData, normalizePhrase } from '@/features/keywords/keywordUtils';
import { useRankTrackingTermGroups } from '@/features/rank-tracking/hooks/useRankTrackingTermGroups';
import { BulkMoveBar, GroupOption } from '@/components/BulkMoveBar';
import { ManageGroupsModal, GroupData } from '@/components/ManageGroupsModal';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';

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
  // SERP features
  paa_question_count: number | null;
  paa_ours_count: number | null;
  ai_overview_present: boolean | null;
  ai_overview_ours_cited: boolean | null;
  featured_snippet_present: boolean | null;
  featured_snippet_ours: boolean | null;
}

/** SERP features data */
interface SerpFeatures {
  paaQuestionCount: number | null;
  paaOursCount: number | null;
  aiOverviewPresent: boolean | null;
  aiOverviewOursCited: boolean | null;
  featuredSnippetPresent: boolean | null;
  featuredSnippetOurs: boolean | null;
}

/** Rank data for display */
interface RankData {
  desktop: { position: number | null; checkedAt: string; foundUrl: string | null } | null;
  mobile: { position: number | null; checkedAt: string; foundUrl: string | null } | null;
  previousDesktop: { position: number | null; checkedAt: string } | null;
  previousMobile: { position: number | null; checkedAt: string } | null;
  locationName: string;
  serpFeatures: SerpFeatures | null;
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

/** Per-search-term geo grid data */
interface GeoGridSearchTermData {
  searchQuery: string;
  summary: GeoGridSummary;
  lastCheckedAt: string | null;
}

/** Geo grid data for a concept */
interface GeoGridData {
  isTracked: boolean;
  locationName: string | null;
  summary: GeoGridSummary | null;
  searchTerms?: GeoGridSearchTermData[];
}

/** Schedule status data */
interface ScheduleStatusData {
  isScheduled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | null;
  isEnabled: boolean;
  nextScheduledAt: string | null;
}

/** Enrichment data from batch-enrich API */
interface EnrichmentResponse {
  enrichment: Record<string, {
    geoGridStatus: {
      isTracked: boolean;
      locationName: string | null;
      summary: GeoGridSummary | null;
      searchTerms?: GeoGridSearchTermData[];
    } | null;
    scheduleStatus?: ScheduleStatusData | null;
  }>;
}

export default function RankTrackingPage() {
  // Read query params for deep linking
  const searchParams = useSearchParams();
  const conceptFromUrl = searchParams.get('concept');

  // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();
  const { business } = useBusinessData();
  const [searchQuery, setSearchQuery] = useState(conceptFromUrl || '');

  // Update search when URL param changes
  useEffect(() => {
    if (conceptFromUrl) {
      setSearchQuery(conceptFromUrl);
    }
  }, [conceptFromUrl]);
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string; locationCode?: number; locationName?: string } | null>(null);
  const [checkingVolumeTerm, setCheckingVolumeTerm] = useState<{ term: string; conceptId: string } | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [rankChecks, setRankChecks] = useState<RankCheck[]>([]);
  const [gridDataMap, setGridDataMap] = useState<Map<string, GeoGridData>>(new Map());
  const [scheduleDataMap, setScheduleDataMap] = useState<Map<string, ScheduleStatusData>>(new Map());

  // Batch run status tracking
  const [activeBatchRun, setActiveBatchRun] = useState<{
    runId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalKeywords: number;
    processedKeywords: number;
    successfulChecks: number;
    failedChecks: number;
    progress: number;
    creditsRefunded?: number;
    errorMessage: string | null;
  } | null>(null);

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
    deleteKeyword,
    refresh: refreshKeywords,
  } = useKeywords({ autoFetch: true });

  // Delete concept state
  const [conceptToDelete, setConceptToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{
    searchTerms: number;
    aliases: number;
    aiQuestions: number;
    llmChecks: number;
    rankChecks: number;
    geoGridChecks: number;
    geoGridTracked: boolean;
    hasSchedule: boolean;
    scheduleFrequency: string | null;
    promptPages: number;
    reviewMatches: number;
  } | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // Modal state for adding new keyword concept
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunAllModal, setShowRunAllModal] = useState(false);

  // State for concept sidebar
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const { keyword: selectedKeyword, promptPages, recentReviews, refresh: refreshKeywordDetails } = useKeywordDetails(selectedKeywordId);

  // Group management state
  const {
    groups,
    ungroupedCount,
    isLoading: groupsLoading,
    refresh: refreshGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    bulkMoveTerms,
  } = useRankTrackingTermGroups();

  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  // Term selection state - using composite key "keywordId::term"
  const [selectedTermKeys, setSelectedTermKeys] = useState<Set<string>>(new Set());

  // Toast notifications
  const { toasts, success: showSuccess, error: showError, closeToast } = useToast();

  // Handle clicking on a concept to open the sidebar
  const handleConceptClick = useCallback((concept: KeywordData) => {
    setSelectedKeywordId(concept.id);
  }, []);

  // Handle selecting a concept for deletion (fetch counts first)
  const handleSelectConceptToDelete = useCallback(async (id: string, name: string) => {
    setConceptToDelete({ id, name });
    setDeleteCounts(null);
    setIsLoadingCounts(true);
    try {
      const response = await apiClient.get<{
        counts: {
          searchTerms: number;
          aliases: number;
          aiQuestions: number;
          llmChecks: number;
          rankChecks: number;
          geoGridChecks: number;
          geoGridTracked: boolean;
          hasSchedule: boolean;
          scheduleFrequency: string | null;
          promptPages: number;
          reviewMatches: number;
        };
      }>(`/keywords/${id}/delete-counts`);
      setDeleteCounts(response.counts);
    } catch (err) {
      console.error('[RankTracking] Error fetching delete counts:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  // Handle delete concept
  const handleDeleteConcept = useCallback(async () => {
    if (!conceptToDelete) return;
    setIsDeleting(true);
    try {
      await deleteKeyword(conceptToDelete.id);
      setConceptToDelete(null);
      setDeleteCounts(null);
      showSuccess(`Deleted "${conceptToDelete.name}"`);
      // Data will refresh automatically from useKeywords
    } catch (err) {
      console.error('[RankTracking] Error deleting concept:', err);
      showError('Failed to delete concept. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [conceptToDelete, deleteKeyword, showSuccess, showError]);

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

  // Fetch grid data and schedule status for concepts using batch-enrich API
  const fetchEnrichmentData = useCallback(async (keywordIds: string[]) => {
    if (keywordIds.length === 0) return;

    try {
      const response = await apiClient.post<EnrichmentResponse>('/keywords/batch-enrich', {
        keywordIds,
      });

      const newGridData = new Map<string, GeoGridData>();
      const newScheduleData = new Map<string, ScheduleStatusData>();

      for (const [keywordId, data] of Object.entries(response.enrichment)) {
        if (data.geoGridStatus) {
          newGridData.set(keywordId, {
            isTracked: data.geoGridStatus.isTracked,
            locationName: data.geoGridStatus.locationName,
            summary: data.geoGridStatus.summary,
            searchTerms: data.geoGridStatus.searchTerms,
          });
        }
        if (data.scheduleStatus) {
          newScheduleData.set(keywordId, data.scheduleStatus);
        }
      }
      setGridDataMap(newGridData);
      setScheduleDataMap(newScheduleData);
    } catch (err) {
      console.error('Failed to fetch enrichment data:', err);
    }
  }, []);

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setResearchResults([]);
    setRankChecks([]);
    setGridDataMap(new Map());
    setScheduleDataMap(new Map());
    setActiveBatchRun(null);

    if (selectedAccountId) {
      fetchResearchResults();
      fetchRankChecks();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Check for active batch run on page load
  useEffect(() => {
    const checkActiveBatchRun = async () => {
      try {
        const status = await apiClient.get<{
          runId: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          totalKeywords: number;
          processedKeywords: number;
          successfulChecks: number;
          failedChecks: number;
          progress: number;
          creditsRefunded?: number;
          errorMessage: string | null;
        }>('/rank-tracking/batch-status');

        // Only track if pending or processing
        if (status.status === 'pending' || status.status === 'processing') {
          setActiveBatchRun(status);
        }
      } catch {
        // No active batch run or error - that's fine
      }
    };

    if (selectedAccountId) {
      checkActiveBatchRun();
    }
  }, [selectedAccountId]);

  // Poll for batch status when a batch is running
  useEffect(() => {
    if (!activeBatchRun || !['pending', 'processing'].includes(activeBatchRun.status)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await apiClient.get<{
          runId: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          totalKeywords: number;
          processedKeywords: number;
          successfulChecks: number;
          failedChecks: number;
          progress: number;
          creditsRefunded?: number;
          errorMessage: string | null;
        }>(`/rank-tracking/batch-status?runId=${activeBatchRun.runId}`);

        setActiveBatchRun(status);

        // When complete, refresh rank checks data
        if (['completed', 'failed'].includes(status.status)) {
          clearInterval(pollInterval);
          fetchRankChecks();

          // Show success/error toast
          if (status.status === 'completed') {
            if (status.failedChecks > 0) {
              showSuccess(`Batch complete: ${status.successfulChecks} successful, ${status.failedChecks} failed${status.creditsRefunded ? ` (${status.creditsRefunded} credits refunded)` : ''}`);
            } else {
              showSuccess(`Batch complete: ${status.successfulChecks} keywords checked successfully`);
            }
          } else {
            showError(status.errorMessage || 'Batch run failed');
          }
        }
      } catch (err) {
        console.error('[RankTracking] Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [activeBatchRun?.runId, activeBatchRun?.status, fetchRankChecks, showSuccess, showError]);

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
  // Fetch enrichment data (grid status + schedule status) for all concepts
  useEffect(() => {
    if (concepts.length > 0) {
      const keywordIds = concepts.map(c => c.id);
      fetchEnrichmentData(keywordIds);
    }
  }, [concepts, fetchEnrichmentData]);

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

  // Build term rank data map (most recent + previous check per term, combining desktop & mobile)
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
          previousDesktop: null,
          previousMobile: null,
          locationName: check.location_name,
          serpFeatures: null,
        });
      }

      const existing = map.get(normalizedTerm)!;
      // Track current (most recent) and previous positions for each device
      if (check.device === 'desktop') {
        if (!existing.desktop) {
          existing.desktop = { position: check.position, checkedAt: check.checked_at, foundUrl: check.found_url };
          // Store SERP features from the most recent desktop check
          existing.serpFeatures = {
            paaQuestionCount: check.paa_question_count,
            paaOursCount: check.paa_ours_count,
            aiOverviewPresent: check.ai_overview_present,
            aiOverviewOursCited: check.ai_overview_ours_cited,
            featuredSnippetPresent: check.featured_snippet_present,
            featuredSnippetOurs: check.featured_snippet_ours,
          };
        } else if (!existing.previousDesktop) {
          existing.previousDesktop = { position: check.position, checkedAt: check.checked_at };
        }
      } else if (check.device === 'mobile') {
        if (!existing.mobile) {
          existing.mobile = { position: check.position, checkedAt: check.checked_at, foundUrl: check.found_url };
          // If no desktop SERP features yet, use mobile
          if (!existing.serpFeatures) {
            existing.serpFeatures = {
              paaQuestionCount: check.paa_question_count,
              paaOursCount: check.paa_ours_count,
              aiOverviewPresent: check.ai_overview_present,
              aiOverviewOursCited: check.ai_overview_ours_cited,
              featuredSnippetPresent: check.featured_snippet_present,
              featuredSnippetOurs: check.featured_snippet_ours,
            };
          }
        } else if (!existing.previousMobile) {
          existing.previousMobile = { position: check.position, checkedAt: check.checked_at };
        }
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

    // Always show modal with credit info and confirmation (pre-populate location if available)
    setCheckingKeyword({
      keyword,
      conceptId,
      locationCode,
      locationName,
    });
  }, [concepts, business, lookedUpLocation, isLookingUpLocation]);

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
  const handleAddKeywordConcept = useCallback(async (data: { name: string; keywords: string[] }) => {
    // Create keyword with the name as the phrase
    const newKeyword = await createKeyword(data.name);
    if (!newKeyword) {
      throw new Error('Failed to create keyword concept');
    }

    // Update the keyword to add the search terms and enable rank tracking
    const now = new Date().toISOString();
    const searchTerms = data.keywords.map((term, index) => ({
      term,
      isCanonical: index === 0, // First keyword is canonical
      addedAt: now,
    }));

    await apiClient.put(`/keywords/${newKeyword.id}`, {
      searchTerms,
      isUsedInRankTracking: true,
    });

    // Refresh the list
    await refreshKeywords();
  }, [createKeyword, refreshKeywords]);

  // Get all term keys from current concepts for selection purposes
  const allTermKeys = useMemo(() => {
    const keys: string[] = [];
    concepts.forEach((concept) => {
      if (concept.searchTerms && concept.searchTerms.length > 0) {
        concept.searchTerms.forEach((term) => {
          keys.push(`${concept.id}::${term.term}`);
        });
      } else {
        // Concept with no search terms - use the concept name
        const conceptName = concept.searchQuery || concept.phrase;
        keys.push(`${concept.id}::${conceptName}`);
      }
    });
    return keys;
  }, [concepts]);

  // Toggle selection of a single term
  const toggleTermSelection = useCallback((keywordId: string, term: string) => {
    const key = `${keywordId}::${term}`;
    setSelectedTermKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Select all terms
  const selectAllTerms = useCallback(() => {
    setSelectedTermKeys(new Set(allTermKeys));
  }, [allTermKeys]);

  // Deselect all terms
  const deselectAllTerms = useCallback(() => {
    setSelectedTermKeys(new Set());
  }, []);

  // Handle bulk move to group
  const handleBulkMoveToGroup = useCallback(async (groupId: string | null) => {
    if (selectedTermKeys.size === 0) return;

    const count = selectedTermKeys.size;

    // Convert selected keys to termIdentifiers
    const termIdentifiers = Array.from(selectedTermKeys).map((key) => {
      const [keywordId, ...termParts] = key.split('::');
      const term = termParts.join('::'); // In case term contains '::'
      return { keywordId, term };
    });

    const success = await bulkMoveTerms(termIdentifiers, groupId);
    if (success) {
      setSelectedTermKeys(new Set()); // Clear selection
      await refreshGroups();

      // Show success notification
      const groupName = groupId === null
        ? 'Ungrouped'
        : groups.find(g => g.id === groupId)?.name || 'group';
      showSuccess(`Moved ${count} ${count === 1 ? 'term' : 'terms'} to ${groupName}`);
    } else {
      showError('Failed to move terms. Please try again.');
    }
  }, [selectedTermKeys, bulkMoveTerms, refreshGroups, groups, showSuccess, showError]);

  // Convert groups for modal
  const groupsForModal: GroupData[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    displayOrder: g.displayOrder,
    itemCount: g.termCount,
  }));

  // Convert groups for bulk move bar
  const groupsForBar: GroupOption[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
  }));

  // Group management handlers
  const handleCreateGroup = useCallback(async (name: string): Promise<GroupData | null> => {
    const result = await createGroup(name);
    if (result) {
      return {
        id: result.id,
        name: result.name,
        displayOrder: result.displayOrder,
        itemCount: result.termCount,
      };
    }
    return null;
  }, [createGroup]);

  const handleUpdateGroup = useCallback(async (id: string, name: string): Promise<GroupData | null> => {
    const result = await updateGroup(id, { name });
    if (result) {
      return {
        id: result.id,
        name: result.name,
        displayOrder: result.displayOrder,
        itemCount: result.termCount,
      };
    }
    return null;
  }, [updateGroup]);

  const handleDeleteGroup = useCallback(async (id: string): Promise<boolean> => {
    return deleteGroup(id);
  }, [deleteGroup]);

  const handleReorderGroups = useCallback(async (updates: { id: string; displayOrder: number }[]): Promise<boolean> => {
    return reorderGroups(updates);
  }, [reorderGroups]);

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

      {/* Main Tab Navigation */}
      <SubNav
        items={[
          { label: 'Library', icon: 'FaKey', href: '/dashboard/keywords', matchType: 'exact' },
          { label: 'Rank tracking', icon: 'FaChartLine', href: '/dashboard/keywords/rank-tracking', matchType: 'exact' },
          { label: 'PAA questions', icon: 'FaQuestionCircle', href: '/dashboard/keywords/rank-tracking/paa-questions', matchType: 'exact' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaChartLine" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        {/* Header */}
        <PageCardHeader
          title="Rank tracking"
          description="Monitor your Google search rankings across desktop and mobile devices."
          actions={
            <>
              {/* Group filter dropdown */}
              <select
                value={filterGroup || ''}
                onChange={(e) => setFilterGroup(e.target.value || null)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
              >
                <option value="">All groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.termCount})
                  </option>
                ))}
                {ungroupedCount > 0 && (
                  <option value="ungrouped">Ungrouped ({ungroupedCount})</option>
                )}
              </select>
              <button
                onClick={() => setShowManageGroupsModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Icon name="FaTags" className="w-4 h-4" />
                Manage groups
              </button>
              <button
                onClick={() => setShowRunAllModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Icon name="FaRocket" className="w-4 h-4" />
                Check all
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 flex items-center gap-2 transition-colors"
              >
                <Icon name="FaPlus" className="w-4 h-4" />
                Add concept
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

        {/* Batch Run Progress Banner */}
        {activeBatchRun && ['pending', 'processing'].includes(activeBatchRun.status) && (() => {
          const remaining = activeBatchRun.totalKeywords - activeBatchRun.processedKeywords;
          const estimatedMinutes = Math.ceil(remaining / 15); // ~15 keywords per minute
          return (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-3">
                <Icon name="FaSpinner" className="w-5 h-5 text-slate-blue animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-blue">
                    {activeBatchRun.status === 'pending' ? 'Batch queued' : 'Checking rankings'}...
                  </p>
                  <p className="text-xs text-slate-blue/70">
                    {activeBatchRun.processedKeywords} of {activeBatchRun.totalKeywords} keywords
                    {estimatedMinutes > 0 && ` · ~${estimatedMinutes} min remaining`}
                  </p>
                </div>
                <div className="w-32">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-slate-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${activeBatchRun.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Keywords Table */}
        <ConceptsTable
          concepts={filteredConcepts}
          volumeData={volumeData}
          rankData={rankData}
          gridData={gridDataMap}
          scheduleData={scheduleDataMap}
          onConceptClick={handleConceptClick}
          onCheckRank={handleCheckRank}
          onCheckVolume={handleCheckVolume}
          onDelete={(concept) => handleSelectConceptToDelete(concept.id, concept.phrase || concept.name || 'Untitled')}
          isLoading={conceptsLoading}
          checkingRankKeyword={checkingRankKeyword}
          checkingVolumeKeyword={checkingVolumeKeyword}
          selectedTermKeys={selectedTermKeys}
          onToggleTermSelection={toggleTermSelection}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
        onCheckComplete={async (locationCode, locationName) => {
          // Save the location to the concept if it wasn't already set
          if (checkingKeyword?.conceptId && !checkingKeyword.locationCode) {
            try {
              await apiClient.put(`/keywords/${checkingKeyword.conceptId}`, {
                searchVolumeLocationCode: locationCode,
                searchVolumeLocationName: locationName,
              });
              // Refresh keywords to update concept data
              await refreshKeywords();
            } catch (err) {
              console.error('Failed to save location to concept:', err);
            }
          }
          // Refresh rank checks to update the table
          await fetchRankChecks();
        }}
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

      {/* Run All Rank Checks Modal */}
      <RunAllRankModal
        isOpen={showRunAllModal}
        onClose={() => setShowRunAllModal(false)}
        onStarted={(batchStatus) => {
          // Start tracking the batch run
          setActiveBatchRun(batchStatus);
        }}
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

      {/* Bulk Move Bar */}
      <BulkMoveBar
        selectedCount={selectedTermKeys.size}
        totalCount={allTermKeys.length}
        groups={groupsForBar}
        itemLabel="terms"
        onSelectAll={selectAllTerms}
        onDeselectAll={deselectAllTerms}
        onMoveToGroup={handleBulkMoveToGroup}
        allowUngrouped
        ungroupedCount={ungroupedCount}
      />

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        isOpen={showManageGroupsModal}
        onClose={() => setShowManageGroupsModal(false)}
        title="Manage term groups"
        itemLabel="terms"
        groups={groupsForModal}
        isLoading={groupsLoading}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onReorderGroups={handleReorderGroups}
      />

      {/* Delete Concept Confirmation Modal */}
      <Modal
        isOpen={!!conceptToDelete}
        onClose={() => { setConceptToDelete(null); setDeleteCounts(null); }}
        title="Delete concept"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>&quot;{conceptToDelete?.name}&quot;</strong>?
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">Warning: This will permanently delete:</p>
          {isLoadingCounts ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-amber-700">
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
              Loading details...
            </div>
          ) : deleteCounts ? (
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              {deleteCounts.searchTerms > 0 && (
                <li>{deleteCounts.searchTerms} search {deleteCounts.searchTerms === 1 ? 'term' : 'terms'}</li>
              )}
              {deleteCounts.aliases > 0 && (
                <li>{deleteCounts.aliases} review {deleteCounts.aliases === 1 ? 'alias' : 'aliases'}</li>
              )}
              {deleteCounts.aiQuestions > 0 && (
                <li>{deleteCounts.aiQuestions} AI visibility {deleteCounts.aiQuestions === 1 ? 'question' : 'questions'}</li>
              )}
              {deleteCounts.llmChecks > 0 && (
                <li>{deleteCounts.llmChecks} LLM visibility {deleteCounts.llmChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.rankChecks > 0 && (
                <li>{deleteCounts.rankChecks} rank {deleteCounts.rankChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.geoGridChecks > 0 && (
                <li>{deleteCounts.geoGridChecks} geo grid {deleteCounts.geoGridChecks === 1 ? 'check' : 'checks'}</li>
              )}
              {deleteCounts.promptPages > 0 && (
                <li>{deleteCounts.promptPages} prompt page {deleteCounts.promptPages === 1 ? 'assignment' : 'assignments'}</li>
              )}
              {deleteCounts.reviewMatches > 0 && (
                <li>{deleteCounts.reviewMatches} review {deleteCounts.reviewMatches === 1 ? 'match' : 'matches'}</li>
              )}
              {deleteCounts.hasSchedule && (
                <li>1 scheduled check ({deleteCounts.scheduleFrequency})</li>
              )}
              {deleteCounts.searchTerms === 0 && deleteCounts.aliases === 0 && deleteCounts.aiQuestions === 0 &&
               deleteCounts.llmChecks === 0 && deleteCounts.rankChecks === 0 && deleteCounts.geoGridChecks === 0 &&
               deleteCounts.promptPages === 0 && deleteCounts.reviewMatches === 0 && !deleteCounts.hasSchedule && (
                <li>The concept (no associated data)</li>
              )}
            </ul>
          ) : (
            <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>The concept and all associated data</li>
            </ul>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          This action cannot be undone.
        </p>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => { setConceptToDelete(null); setDeleteCounts(null); }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConcept}
            disabled={isDeleting || isLoadingCounts}
          >
            {isDeleting ? 'Deleting...' : 'Delete concept'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
