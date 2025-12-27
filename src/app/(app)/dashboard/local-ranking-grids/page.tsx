/**
 * Local Ranking Grids Page
 *
 * User-facing page for managing geo grid rank tracking.
 * Allows setting up tracking, viewing results, and managing keywords.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/auth/providers/supabase';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';
import PageCard from '@/app/(app)/components/PageCard';
import StandardLoader from '@/app/(app)/components/StandardLoader';
import Icon from '@/components/Icon';
import { useToast, ToastContainer } from '@/app/(app)/components/reviews/Toast';
import {
  GeoGridSetupWizard,
  GeoGridGoogleMap,
  GeoGridPointModal,
  GeoGridResultsTable,
  GeoGridTrendCard,
  GeoGridKeywordPicker,
  GeoGridScheduleSettings,
  useGeoGridConfig,
  useGeoGridResults,
  useGeoGridSummary,
  useTrackedKeywords,
  GGConfig,
  GGDailySummary,
  GGCheckResult,
  CheckPoint,
  GGPointSummary,
  ViewAsBusiness,
} from '@/features/geo-grid';
import { ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import LocationSelector from '@/components/LocationSelector';

// ============================================
// Types
// ============================================

interface Keyword {
  id: string;
  phrase: string;
}

interface GoogleBusinessLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeId: string;
  address?: string;
}

// ============================================
// Component
// ============================================

export default function LocalRankingGridsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { account, accountId, selectedAccountId } = useAccountData();

  // Compute effective account ID with multiple fallbacks
  const effectiveAccountId = selectedAccountId || accountId || account?.id || null;

  // Track if we've already handled OAuth callback to prevent duplicate toasts
  const oauthHandledRef = useRef(false);

  // Auth state
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gbpJustConnected, setGbpJustConnected] = useState(false);

  // Data state
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);
  const [googleBusinessLocations, setGoogleBusinessLocations] = useState<GoogleBusinessLocation[]>([]);
  const [googleBusinessLocation, setGoogleBusinessLocation] = useState<GoogleBusinessLocation | null>(null);
  const [isCheckRunning, setIsCheckRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAddingNewLocation, setIsAddingNewLocation] = useState(false);
  const [selectedMapKeywordId, setSelectedMapKeywordId] = useState<string | null>(null);
  const [viewAs, setViewAs] = useState<ViewAsBusiness | null>(null);

  // Modal state
  const [selectedPointResult, setSelectedPointResult] = useState<GGCheckResult | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CheckPoint | null>(null);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  // Toast notifications
  const { toasts, closeToast, error: showError, success: showSuccess } = useToast();

  // Hooks
  const {
    configs,
    config,
    selectedConfigId,
    selectConfig,
    hasConfig,
    canAddMore,
    plan,
    maxConfigs,
    isLoading: configLoading,
    refresh: refreshConfig,
  } = useGeoGridConfig();
  const {
    results,
    summary: currentSummary,
    lastCheckedAt,
    isLoading: resultsLoading,
    runCheck,
    refresh: refreshResults,
  } = useGeoGridResults({ configId: selectedConfigId });
  const { trend, isLoading: summaryLoading } = useGeoGridSummary({ configId: selectedConfigId });

  // Convert currentSummary to GGDailySummary format for TrendCard
  const summary = useMemo((): GGDailySummary | null => {
    if (!currentSummary) return null;
    return {
      id: '',
      accountId: '',
      configId: '',
      checkDate: new Date().toISOString().split('T')[0],
      totalKeywordsChecked: currentSummary.totalChecked,
      keywordsInTop3: currentSummary.inTop3,
      keywordsInTop10: currentSummary.inTop10,
      keywordsInTop20: currentSummary.inTop20,
      keywordsNotFound: currentSummary.notFound,
      pointSummaries: {} as Record<CheckPoint, GGPointSummary>,
      totalApiCostUsd: currentSummary.totalCost,
      createdAt: currentSummary.lastCheckedAt || new Date().toISOString(),
    };
  }, [currentSummary]);

  const {
    keywords: trackedKeywords,
    isLoading: keywordsLoading,
    addKeywords,
    removeKeyword,
    refresh: refreshKeywords,
  } = useTrackedKeywords({ configId: selectedConfigId });

  // Build keyword usage counts map for results table
  const keywordUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tk of trackedKeywords) {
      counts[tk.keywordId] = tk.reviewUsageCount ?? 0;
    }
    return counts;
  }, [trackedKeywords]);

  // Collect unique competitors from all results for "View As" dropdown
  const uniqueCompetitors = useMemo(() => {
    const competitorMap = new Map<string, { placeId: string; name: string }>();

    for (const result of results) {
      for (const competitor of result.topCompetitors) {
        if (competitor.placeId && !competitorMap.has(competitor.placeId)) {
          competitorMap.set(competitor.placeId, {
            placeId: competitor.placeId,
            name: competitor.name,
          });
        }
      }
    }

    return Array.from(competitorMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [results]);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/auth/sign-in');
          return;
        }

        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth/sign-in');
      }
    };

    checkAuth();
  }, [router, supabase]);

  // Handle OAuth callback - check for success/error after returning from Google OAuth
  useEffect(() => {
    if (oauthHandledRef.current) return;

    // Check if we just returned from OAuth
    // The OAuth callback sets 'connected=true', and our state sets 'success=true' as a fallback
    const oauthSuccess = searchParams?.get('connected') === 'true' || searchParams?.get('success') === 'true';
    const oauthError = searchParams?.get('error');
    const oauthMessage = searchParams?.get('message');

    // Also check sessionStorage for OAuth in progress flag
    const wasOAuthInProgress = typeof window !== 'undefined' &&
      sessionStorage.getItem('googleOAuthInProgress') === 'true';

    if (oauthSuccess || wasOAuthInProgress) {
      oauthHandledRef.current = true;

      // Clear the OAuth flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('googleOAuthInProgress');
      }

      // Show success message
      if (!oauthError) {
        setGbpJustConnected(true);
        showSuccess('Google Business Profile connected! Your locations are loading...');

        // Clean up URL params without reload
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('success');
          url.searchParams.delete('connected');
          url.searchParams.delete('error');
          url.searchParams.delete('message');
          url.searchParams.delete('tab');
          window.history.replaceState({}, '', url.pathname);
        }
      }
    }

    if (oauthError) {
      oauthHandledRef.current = true;
      showError(decodeURIComponent(oauthMessage || 'Failed to connect Google Business Profile'));

      // Clean up URL params
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('connected');
        url.searchParams.delete('error');
        url.searchParams.delete('message');
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [searchParams, showSuccess, showError]);

  // Load available keywords
  useEffect(() => {
    const loadKeywords = async () => {
      try {
        const response = await apiClient.get<{ keywords: Array<{ id: string; phrase: string }> }>(
          '/keywords'
        );
        setAvailableKeywords(
          response.keywords?.map((k) => ({ id: k.id, phrase: k.phrase })) || []
        );
      } catch (error) {
        console.error('Failed to load keywords:', error);
      }
    };

    if (!loading && isAuthenticated) {
      loadKeywords();
    }
  }, [loading, isAuthenticated]);

  // Load all Google Business locations
  useEffect(() => {
    const loadGBPLocations = async () => {
      try {
        const response = await apiClient.get<{
          data: {
            locations: Array<{
              id: string;
              location_id: string;
              location_name: string;
              address?: string;
              google_place_id?: string;
              lat?: number;
              lng?: number;
            }>;
          };
        }>('/social-posting/platforms/google-business-profile/locations');

        if (response.data?.locations && response.data.locations.length > 0) {
          // Map all locations
          const allLocations = response.data.locations.map(loc => ({
            id: loc.id,
            name: loc.location_name,
            lat: loc.lat || 0,
            lng: loc.lng || 0,
            placeId: loc.google_place_id || loc.location_id,
            address: loc.address,
          }));
          setGoogleBusinessLocations(allLocations);

          // Set first location as default for backwards compatibility
          setGoogleBusinessLocation(allLocations[0]);
        }
      } catch (error) {
        console.error('Failed to load GBP locations:', error);
      }
    };

    if (!loading && isAuthenticated) {
      loadGBPLocations();
    }
  }, [loading, isAuthenticated, gbpJustConnected]); // Re-fetch when OAuth connection completes

  // Handle running a check
  const handleRunCheck = useCallback(async () => {
    setIsCheckRunning(true);
    try {
      const result = await runCheck();
      if (result.success) {
        await refreshResults();
        showSuccess(`Grid check complete! ${result.checksPerformed || 0} checks performed.`);
      } else if (result.error) {
        // Show user-friendly error messages
        if (result.error.includes('No target Place ID') || result.error.includes('Connect a Google Business')) {
          showError('Please connect a Google Business location first before running grid checks.', 8000);
        } else if (result.error.includes('No geo grid configuration')) {
          showError('Please set up your grid configuration first.', 6000);
        } else if (result.error.includes('Insufficient credits')) {
          showError('Not enough credits for this grid check. Please add more credits.', 6000);
        } else if (result.error.includes('disabled')) {
          showError('Grid tracking is currently disabled. Enable it in settings to run checks.', 6000);
        } else {
          showError(result.error, 5000);
        }
      }
    } finally {
      setIsCheckRunning(false);
    }
  }, [runCheck, refreshResults, showError, showSuccess]);

  // Handle setup complete
  const handleSetupComplete = useCallback(() => {
    refreshConfig();
    setShowSettings(false);
    setIsAddingNewLocation(false);
  }, [refreshConfig]);

  // Handle adding keywords
  const handleAddKeywords = useCallback(async (keywordIds: string[]) => {
    await addKeywords(keywordIds);
    refreshKeywords();
  }, [addKeywords, refreshKeywords]);

  // Handle removing keyword
  const handleRemoveKeyword = useCallback(async (trackedKeywordId: string) => {
    await removeKeyword(trackedKeywordId);
  }, [removeKeyword]);

  // Handle refreshing available keywords after new ones are created
  const handleKeywordsCreated = useCallback(async () => {
    try {
      const response = await apiClient.get<{ keywords: Array<{ id: string; phrase: string }> }>(
        '/keywords'
      );
      setAvailableKeywords(
        response.keywords?.map((k) => ({ id: k.id, phrase: k.phrase })) || []
      );
    } catch (error) {
      console.error('Failed to refresh keywords:', error);
    }
  }, []);

  // Handle marker click on map
  const handleMarkerClick = useCallback((point: CheckPoint, result: GGCheckResult) => {
    setSelectedPoint(point);
    setSelectedPointResult(result);
    setIsPointModalOpen(true);
  }, []);

  // Close point modal
  const handleClosePointModal = useCallback(() => {
    setIsPointModalOpen(false);
    setSelectedPoint(null);
    setSelectedPointResult(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <PageCard
        icon={<Icon name="FaMapMarker" className="w-8 h-8 text-slate-blue" size={32} />}
      >
        <StandardLoader isLoading={true} mode="inline" />
      </PageCard>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show setup wizard if no config or settings mode
  if (!hasConfig || showSettings) {
    return (
      <PageCard
        icon={<Icon name="FaMapMarker" className="w-8 h-8 text-slate-blue" size={32} />}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              {isAddingNewLocation ? 'Add New Location' : hasConfig ? 'Grid Settings' : 'Local Ranking Grids'}
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-4">
              {isAddingNewLocation
                ? 'Set up ranking tracking for a new location.'
                : hasConfig
                  ? 'Configure your geo grid tracking settings.'
                  : 'Track your Google Maps visibility across geographic points.'}
            </p>
          </div>
          {/* Back button - only show when editing settings, not on initial setup */}
          {hasConfig && (
            <button
              onClick={() => {
                setShowSettings(false);
                setIsAddingNewLocation(false);
              }}
              className="flex items-center gap-2 px-3 py-2 border-2 border-slate-blue text-slate-blue rounded hover:bg-indigo-50 text-sm font-semibold"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <GeoGridSetupWizard
          configId={showSettings && hasConfig && !isAddingNewLocation ? selectedConfigId || undefined : undefined}
          googleBusinessLocation={googleBusinessLocation || undefined}
          availableLocations={plan === 'maven' ? googleBusinessLocations : undefined}
          accountId={effectiveAccountId || undefined}
          onComplete={handleSetupComplete}
          onCancel={() => {
            setShowSettings(false);
            setIsAddingNewLocation(false);
            if (!hasConfig) router.push('/dashboard');
          }}
        />
      </PageCard>
    );
  }

  return (
    <>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <PageCard
        icon={<Icon name="FaMapMarker" className="w-8 h-8 text-slate-blue" size={32} />}
      >
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 w-full gap-2">
          <div className="flex flex-col mt-0 md:mt-[3px]">
            <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
              Local Ranking Grids
            </h1>
            <p className="text-gray-600 text-base max-w-md mt-0 mb-4">
              Track your Google Maps visibility across geographic points.
            </p>
          </div>
          {/* Action Button - Top Right */}
          <div className="flex items-center gap-2 sm:mt-0 mt-4">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 border-2 border-slate-blue text-slate-blue rounded hover:bg-indigo-50 text-sm font-semibold"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Location Selector - Maven only, when multiple configs exist */}
        {plan === 'maven' && configs.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Location:</span>
              <div className="w-72">
                <LocationSelector
                  locations={configs.map(c => ({
                    id: c.id,
                    name: c.locationName || c.googleBusinessLocation?.location_name || 'Unnamed Location',
                    address: c.googleBusinessLocation?.address || null,
                  }))}
                  selectedId={selectedConfigId}
                  onSelect={selectConfig}
                  showAddButton={canAddMore}
                  onAdd={() => {
                    setIsAddingNewLocation(true);
                    setShowSettings(true);
                  }}
                  addButtonLabel={`Add Location (${configs.length}/${maxConfigs})`}
                  placeholder="Select a location"
                  className=""
                />
              </div>
              {configs.length > 1 && (
                <span className="text-xs text-gray-500">
                  Tracking {configs.length} of {maxConfigs} locations
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Summary Card */}
          <GeoGridTrendCard
            summary={summary}
            trend={trend}
            isLoading={summaryLoading}
            lastCheckedAt={lastCheckedAt}
            onRunCheck={handleRunCheck}
            isCheckRunning={isCheckRunning}
          />

          {/* Google Maps Grid View */}
          {config && (
            <div>
            {/* Keyword & View As Selectors for Map */}
            {trackedKeywords.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Keyword Selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Keyword
                      </label>
                      <select
                        value={selectedMapKeywordId || ''}
                        onChange={(e) => setSelectedMapKeywordId(e.target.value || null)}
                        className="w-52 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select a keyword...</option>
                        {trackedKeywords.map((tk) => (
                          <option key={tk.keywordId} value={tk.keywordId}>
                            {tk.phrase || tk.keywordId}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* View As Selector */}
                    {uniqueCompetitors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          View As
                        </label>
                        <select
                          value={viewAs?.placeId || ''}
                          onChange={(e) => {
                            const placeId = e.target.value;
                            if (!placeId) {
                              setViewAs(null);
                            } else if (placeId === config.targetPlaceId) {
                              setViewAs({
                                placeId,
                                name: googleBusinessLocation?.name || 'Your Business',
                                isOwnBusiness: true,
                              });
                            } else {
                              const competitor = uniqueCompetitors.find((c) => c.placeId === placeId);
                              if (competitor) {
                                setViewAs({
                                  placeId: competitor.placeId,
                                  name: competitor.name,
                                  isOwnBusiness: false,
                                });
                              }
                            }
                          }}
                          className="w-56 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="">Your Business</option>
                          {uniqueCompetitors.map((competitor) => (
                            <option key={competitor.placeId} value={competitor.placeId}>
                              {competitor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Run Grid Check Button */}
                  <button
                    onClick={handleRunCheck}
                    disabled={isCheckRunning}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
                    title="Run checks for all tracked keywords"
                  >
                    {isCheckRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Icon name="FaRedo" className="w-3.5 h-3.5" />
                        Run grid check
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Google Maps */}
            {selectedMapKeywordId ? (
              <GeoGridGoogleMap
                results={results}
                center={{ lat: config.centerLat, lng: config.centerLng }}
                radiusMiles={config.radiusMiles}
                selectedKeywordId={selectedMapKeywordId}
                height="450px"
                onMarkerClick={handleMarkerClick}
                viewAs={viewAs}
              />
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a keyword above to view the geographic grid map</p>
                <p className="text-gray-400 text-sm mt-1">The map shows your ranking at each check point</p>
              </div>
            )}
          </div>
        )}

          {/* Keyword Picker */}
          <GeoGridKeywordPicker
            trackedKeywords={trackedKeywords}
            availableKeywords={availableKeywords}
            isLoading={keywordsLoading}
            onAddKeywords={handleAddKeywords}
            onRemoveKeyword={handleRemoveKeyword}
            maxKeywords={20}
            onKeywordsCreated={handleKeywordsCreated}
          />

          {/* Results Table */}
          <GeoGridResultsTable
            results={results}
            isLoading={resultsLoading}
            lastCheckedAt={lastCheckedAt}
            keywordUsageCounts={keywordUsageCounts}
          />

          {/* Schedule Settings */}
          {config && (
            <GeoGridScheduleSettings
              config={config}
              keywordCount={trackedKeywords.length}
              onScheduleUpdated={refreshConfig}
            />
          )}
        </div>

        {/* Add responsive bottom padding */}
        <div className="pb-8 md:pb-12 lg:pb-16" />
      </PageCard>

      {/* Point Detail Modal */}
      <GeoGridPointModal
        isOpen={isPointModalOpen}
        onClose={handleClosePointModal}
        result={selectedPointResult}
        point={selectedPoint}
      />
    </>
  );
}
