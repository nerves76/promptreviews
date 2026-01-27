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
  GeoGridTrendCard,
  GeoGridKeywordsTable,
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
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';

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

  // Run check confirmation modal
  const [showRunCheckModal, setShowRunCheckModal] = useState(false);

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
    saveConfig,
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

  // Pre-select keyword from URL parameter (e.g., when navigating from keyword concepts page)
  useEffect(() => {
    const keywordIdParam = searchParams?.get('keywordId');
    if (keywordIdParam && trackedKeywords.length > 0) {
      // Verify the keyword is actually tracked
      const isTracked = trackedKeywords.some(tk => tk.keywordId === keywordIdParam);
      if (isTracked && !selectedMapKeywordId) {
        setSelectedMapKeywordId(keywordIdParam);
        // Clean up URL after setting state
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('keywordId');
          window.history.replaceState({}, '', url.pathname);
        }
      }
    }
  }, [searchParams, trackedKeywords, selectedMapKeywordId]);

  // Collect unique competitors from all results for "View As" dropdown
  // Excludes the user's own business (they're shown as the default option)
  const uniqueCompetitors = useMemo(() => {
    const competitorMap = new Map<string, { placeId: string; name: string }>();
    const ownPlaceId = config?.targetPlaceId;

    for (const result of results) {
      for (const competitor of result.topCompetitors) {
        // Skip the user's own business - it's already shown as the default option
        if (competitor.placeId && competitor.placeId !== ownPlaceId && !competitorMap.has(competitor.placeId)) {
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
  }, [results, config?.targetPlaceId]);

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

  // Calculate credit cost for a check
  const calculateCheckCost = useMemo(() => {
    if (!config) return 0;
    const gridPoints = config.checkPoints?.length || 5;
    const keywordCount = trackedKeywords.length;
    // Cost formula: 10 base + grid points + (2 × keywords)
    return 10 + gridPoints + (keywordCount * 2);
  }, [config, trackedKeywords]);

  // Handle run check button - show confirmation modal
  const handleRunCheck = useCallback(() => {
    setShowRunCheckModal(true);
  }, []);

  // Confirm and execute the check
  const confirmRunCheck = useCallback(async () => {
    setShowRunCheckModal(false);
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

  // Loading state (auth or config loading)
  if (loading || configLoading) {
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

  // Show setup wizard if no config or settings mode (only after loading complete)
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
              Track your Google Maps visibility across geographic points.{' '}
              <span
                className="inline-flex items-center align-middle"
                title="This feature tracks where your Google Business Profile appears in local search results across different locations in your city. It helps you understand your visibility from various geographic points."
              >
                <Icon name="FaInfoCircle" className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" size={16} />
              </span>
            </p>
          </div>
        </div>

        {/* Location & Connection Status - Combined header */}
        {config && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left side: Location selector/name + Edit button */}
              <div className="flex flex-wrap items-center gap-3">
                {plan === 'maven' && configs.length > 0 ? (
                  <>
                    <span className="text-sm font-medium text-gray-700">Location:</span>
                    <div className="w-64">
                      <LocationSelector
                        locations={configs.map(c => ({
                          id: c.id,
                          name: c.locationName || c.googleBusinessLocation?.location_name || (c.targetPlaceId ? 'Location' : '⚠️ Setup incomplete'),
                          address: c.googleBusinessLocation?.address || (!c.targetPlaceId ? 'Click to complete setup' : null),
                        }))}
                        selectedId={selectedConfigId}
                        onSelect={selectConfig}
                        showAddButton={false}
                        placeholder="Select a location"
                        className=""
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Icon name="FaMapMarker" className="w-4 h-4 text-slate-blue" size={16} />
                    <span className="font-medium text-gray-900">
                      {config.locationName || config.googleBusinessLocation?.location_name || 'Your Business'}
                    </span>
                  </div>
                )}
                {/* Edit grid button - always visible next to location */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-blue border border-slate-blue rounded-lg hover:bg-slate-blue hover:text-white transition-colors whitespace-nowrap"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Edit grid
                </button>
              </div>

              {/* Right side: Connection status + Add location (Maven only) */}
              <div className="flex items-center gap-3">
                {config.targetPlaceId ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <Icon name="FaCheckCircle" className="w-4 h-4" size={16} />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    <Icon name="FaExclamationTriangle" className="w-4 h-4" size={16} />
                    Not connected
                  </span>
                )}
                {/* Add location button - Maven only, separate from dropdown */}
                {plan === 'maven' && canAddMore && (
                  <button
                    onClick={() => {
                      setIsAddingNewLocation(true);
                      setShowSettings(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-blue rounded-lg hover:bg-slate-blue/90 transition-colors whitespace-nowrap"
                  >
                    <Icon name="FaPlus" className="w-3 h-3" size={12} />
                    Add location ({configs.length}/{maxConfigs})
                  </button>
                )}
              </div>
            </div>

            {/* Schedule info row - only show if scheduling is enabled */}
            {config.isEnabled && (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="FaClock" className="w-4 h-4 text-blue-500" size={16} />
                  <span>
                    <span className="font-medium text-gray-700">Scheduled:</span>
                    {' '}
                    {config.scheduleFrequency === 'daily' && 'Daily'}
                    {config.scheduleFrequency === 'weekly' && `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][config.scheduleDayOfWeek || 0]})`}
                    {config.scheduleFrequency === 'monthly' && `Monthly (day ${config.scheduleDayOfMonth || 1})`}
                    {' at '}
                    {config.scheduleHour > 12 ? `${config.scheduleHour - 12}:00 PM` : config.scheduleHour === 0 ? '12:00 AM' : `${config.scheduleHour}:00 AM`}
                    {' UTC'}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    <span className="font-medium text-amber-700">{calculateCheckCost} credits</span>
                    <span className="text-gray-500"> per check</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    ({config.checkPoints?.length || 0} points × {trackedKeywords.length} keywords)
                  </span>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-xs text-slate-blue hover:text-slate-blue/80 font-medium"
                >
                  Edit schedule
                </button>
              </div>
            )}
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
            hasTargetBusiness={!!config?.targetPlaceId}
          />

          {/* Google Maps Grid View */}
          {config && (
            <div>
            {/* Map Controls */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
              {/* Row 1: Keyword selector and run button */}
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
                        <option value="">{config.locationName || config.googleBusinessLocation?.location_name || googleBusinessLocation?.name || 'Your Business'}</option>
                        {uniqueCompetitors.map((competitor) => (
                          <option key={competitor.placeId} value={competitor.placeId}>
                            {competitor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Grid info (read-only display) */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                <span>
                  <span className="font-medium text-gray-700">Radius:</span> {config.radiusMiles} mi
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  <span className="font-medium text-gray-700">Grid:</span> {config.checkPoints.length} points
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  <span className="font-medium text-gray-700">Keywords:</span> {trackedKeywords.length}
                </span>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-slate-blue hover:text-slate-blue/80 text-xs font-medium ml-2"
                >
                  Edit grid
                </button>
              </div>
            </div>

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
                <div className="text-gray-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a keyword above to view the geographic grid map</p>
                <p className="text-gray-500 text-sm mt-1">The map shows your ranking at each check point</p>
              </div>
            )}
          </div>
        )}

          {/* Keywords Table - Unified view of tracked keywords and their results */}
          <GeoGridKeywordsTable
            trackedKeywords={trackedKeywords}
            availableKeywords={availableKeywords}
            results={results}
            isLoadingKeywords={keywordsLoading}
            isLoadingResults={resultsLoading}
            lastCheckedAt={lastCheckedAt}
            onAddKeywords={handleAddKeywords}
            onRemoveKeyword={handleRemoveKeyword}
            maxKeywords={20}
            onKeywordsCreated={handleKeywordsCreated}
            keywordUsageCounts={keywordUsageCounts}
          />

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

      {/* Run Check Confirmation Modal */}
      <Modal
        isOpen={showRunCheckModal}
        onClose={() => setShowRunCheckModal(false)}
        title="Grid check"
        size="md"
      >
        <div className="space-y-4">
          {/* What will be checked */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords to check</h4>
            {trackedKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trackedKeywords.map((tk) => (
                  <span
                    key={tk.keywordId}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tk.phrase}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-600">No keywords tracked. Add keywords first.</p>
            )}
          </div>

          {/* Grid info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Grid points</span>
                <p className="font-medium text-gray-900">{config?.checkPoints?.length || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Keywords</span>
                <p className="font-medium text-gray-900">{trackedKeywords.length}</p>
              </div>
              <div>
                <span className="text-gray-500">Radius</span>
                <p className="font-medium text-gray-900">{config?.radiusMiles || 0} mi</p>
              </div>
            </div>
          </div>

          {/* Cost per check */}
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-amber-800">Cost per check</p>
              <p className="text-xs text-amber-600">10 base + {config?.checkPoints?.length || 0} points + ({trackedKeywords.length} × 2)</p>
            </div>
            <span className="text-2xl font-bold text-amber-800">{calculateCheckCost}</span>
          </div>

          {trackedKeywords.length === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                You need to add at least one keyword before running a check.
              </p>
            </div>
          )}

          {/* Schedule info */}
          {config && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Automated checks</p>
                  <p className="text-xs text-gray-500">
                    {config.isEnabled ? (
                      <>
                        {config.scheduleFrequency === 'daily' && 'Running daily'}
                        {config.scheduleFrequency === 'weekly' && `Running weekly on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][config.scheduleDayOfWeek || 0]}`}
                        {config.scheduleFrequency === 'monthly' && `Running monthly on day ${config.scheduleDayOfMonth || 1}`}
                        {' at '}
                        {config.scheduleHour > 12 ? `${config.scheduleHour - 12}:00 PM` : config.scheduleHour === 0 ? '12:00 AM' : `${config.scheduleHour}:00 AM`}
                      </>
                    ) : (
                      'Not scheduled'
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRunCheckModal(false);
                    setShowSettings(true);
                  }}
                  className="text-sm text-slate-blue hover:text-slate-blue/80 font-medium"
                >
                  {config.isEnabled ? 'Edit schedule' : 'Set up schedule'}
                </button>
              </div>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRunCheckModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmRunCheck}
            disabled={trackedKeywords.length === 0 || !config?.targetPlaceId}
          >
            Run now ({calculateCheckCost} credits)
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
