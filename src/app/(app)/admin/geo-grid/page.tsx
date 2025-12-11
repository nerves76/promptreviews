/**
 * Admin Geo Grid Page
 *
 * Admin-only page for managing geo grid rank tracking.
 * Allows setting up tracking, viewing results, and managing keywords.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';
import { apiClient } from '@/utils/apiClient';
import AppLoader from '@/app/(app)/components/AppLoader';
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

export default function AdminGeoGridPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth state
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Data state
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);
  const [googleBusinessLocation, setGoogleBusinessLocation] = useState<GoogleBusinessLocation | null>(null);
  const [isCheckRunning, setIsCheckRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMapKeywordId, setSelectedMapKeywordId] = useState<string | null>(null);
  const [viewAs, setViewAs] = useState<ViewAsBusiness | null>(null);

  // Modal state
  const [selectedPointResult, setSelectedPointResult] = useState<GGCheckResult | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CheckPoint | null>(null);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  // Hooks
  const { config, hasConfig, isLoading: configLoading, refresh: refreshConfig } = useGeoGridConfig();
  const {
    results,
    summary: currentSummary,
    lastCheckedAt,
    isLoading: resultsLoading,
    runCheck,
    refresh: refreshResults,
  } = useGeoGridResults();
  // Note: useGeoGridSummary reads from gg_daily_summary table which may be stale
  // We use currentSummary from useGeoGridResults for real-time data
  const { trend, isLoading: summaryLoading } = useGeoGridSummary();

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
      pointSummaries: {} as Record<CheckPoint, GGPointSummary>, // Not used by TrendCard
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
  } = useTrackedKeywords();

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

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/auth/sign-in');
          return;
        }

        const adminStatus = await isAdmin(user.id, supabase);
        setIsAdminUser(adminStatus);

        if (!adminStatus) {
          router.push('/dashboard');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Admin access check error:', error);
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [router, supabase]);

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

    if (!loading && isAdminUser) {
      loadKeywords();
    }
  }, [loading, isAdminUser]);

  // Load Google Business location
  useEffect(() => {
    const loadGBPLocation = async () => {
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

        console.log('GBP locations response:', response);

        if (response.data?.locations && response.data.locations.length > 0) {
          const loc = response.data.locations[0];
          console.log('Setting GBP location:', loc);
          // Use stored Place ID and coordinates from database if available
          setGoogleBusinessLocation({
            id: loc.id,
            name: loc.location_name,
            lat: loc.lat || 0,
            lng: loc.lng || 0,
            placeId: loc.google_place_id || loc.location_id, // Prefer Google Place ID over GBP location ID
            address: loc.address,
          });
        } else {
          console.log('No locations found in response');
        }
      } catch (error) {
        console.error('Failed to load GBP location:', error);
      }
    };

    if (!loading && isAdminUser) {
      console.log('Loading GBP location...');
      loadGBPLocation();
    }
  }, [loading, isAdminUser]);

  // Handle running a check
  const handleRunCheck = useCallback(async () => {
    setIsCheckRunning(true);
    try {
      const result = await runCheck();
      if (result.success) {
        // Refresh results (summary is derived from currentSummary via useMemo)
        await refreshResults();
      }
    } finally {
      setIsCheckRunning(false);
    }
  }, [runCheck, refreshResults]);

  // Handle setup complete
  const handleSetupComplete = useCallback(() => {
    refreshConfig();
    setShowSettings(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  // Not admin
  if (!isAdminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 text-lg">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  // Show setup wizard if no config or settings mode
  if (!hasConfig || showSettings) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back button */}
          <button
            onClick={() => (hasConfig ? setShowSettings(false) : router.push('/admin'))}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {hasConfig ? 'Back to Local Ranking Grid' : 'Back to Admin'}
          </button>

          <GeoGridSetupWizard
            googleBusinessLocation={googleBusinessLocation || undefined}
            onComplete={handleSetupComplete}
            onCancel={() => (hasConfig ? setShowSettings(false) : router.push('/admin'))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Admin
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Geo Grid Rank Tracker</h1>
                <p className="text-sm text-gray-500">
                  Track your Google Maps visibility across geographic points
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Card */}
        <div className="mb-8">
          <GeoGridTrendCard
            summary={summary}
            trend={trend}
            isLoading={summaryLoading}
            lastCheckedAt={lastCheckedAt}
            onRunCheck={handleRunCheck}
            isCheckRunning={isCheckRunning}
          />
        </div>

        {/* Google Maps Grid View */}
        {config && (
          <div className="mb-8">
            {/* Keyword & View As Selectors for Map */}
            {trackedKeywords.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
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
        <div className="mb-8">
          <GeoGridKeywordPicker
            trackedKeywords={trackedKeywords}
            availableKeywords={availableKeywords}
            isLoading={keywordsLoading}
            onAddKeywords={handleAddKeywords}
            onRemoveKeyword={handleRemoveKeyword}
            maxKeywords={20}
            onKeywordsCreated={handleKeywordsCreated}
          />
        </div>

        {/* Results Table */}
        <GeoGridResultsTable
          results={results}
          isLoading={resultsLoading}
          lastCheckedAt={lastCheckedAt}
          keywordUsageCounts={keywordUsageCounts}
        />

        {/* Schedule Settings & Config Info */}
        {config && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Settings */}
            <GeoGridScheduleSettings
              config={config}
              keywordCount={trackedKeywords.length}
              onScheduleUpdated={refreshConfig}
            />

            {/* Config Info (Debug) */}
            <div className="p-4 bg-gray-100 rounded-lg h-fit">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Center:</span>{' '}
                  <span className="font-mono">
                    {config.centerLat.toFixed(4)}, {config.centerLng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Radius:</span> {config.radiusMiles} miles
                </div>
                <div>
                  <span className="text-gray-500">Check Points:</span>{' '}
                  {config.checkPoints.length}
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  <span className={config.isEnabled ? 'text-green-600' : 'text-red-600'}>
                    {config.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Point Detail Modal */}
      <GeoGridPointModal
        isOpen={isPointModalOpen}
        onClose={handleClosePointModal}
        result={selectedPointResult}
        point={selectedPoint}
      />
    </div>
  );
}
