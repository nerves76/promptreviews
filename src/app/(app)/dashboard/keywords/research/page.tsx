'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  BookmarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywordDiscovery } from '@/features/rank-tracking/hooks';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { apiClient } from '@/utils/apiClient';
import LocationPicker from '@/features/rank-tracking/components/LocationPicker';

interface SavedResearchResult {
  id: string;
  term: string;
  normalizedTerm: string;
  searchVolume: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  locationCode: number;
  locationName: string;
  keywordId: string | null;
  researchedAt: string;
}

/**
 * Keyword Research Page
 *
 * Standalone page for discovering new keywords with search volume,
 * competition, and trend data from DataForSEO.
 * Design matches Prompt Pages convention with PageCard.
 */
export default function KeywordResearchPage() {
  const pathname = usePathname();
  // Track selected account to refetch when it changes
  const { selectedAccountId } = useAccountData();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ code: number; name: string } | null>(null);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);
  const [savedResults, setSavedResults] = useState<Set<string>>(new Set());
  const [savingResult, setSavingResult] = useState<string | null>(null);

  // Saved searches state
  const [savedSearches, setSavedSearches] = useState<SavedResearchResult[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { discover, getSuggestions, isLoading, error, isRateLimited, remainingLookups } = useKeywordDiscovery();
  const { refresh: refreshLibrary } = useKeywords({ autoFetch: false });

  // Load saved searches on mount
  const loadSavedSearches = useCallback(async () => {
    try {
      const response = await apiClient.get<{ results: SavedResearchResult[] }>('/keyword-research/results?limit=50');
      setSavedSearches(response.results || []);
      // Also populate the savedResults set for bookmark icon state
      const savedTerms = new Set((response.results || []).map(r => r.term));
      setSavedResults(savedTerms);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  // Clear data and refetch when account changes
  useEffect(() => {
    // Clear stale data immediately when account changes
    setSavedSearches([]);
    setSavedResults(new Set());
    setResult(null);
    setSuggestions([]);
    setAddedKeywords(new Set());

    if (selectedAccountId) {
      loadSavedSearches();
    }
  }, [selectedAccountId]); // Only depend on selectedAccountId to avoid infinite loops

  // Also fetch on mount
  useEffect(() => {
    if (selectedAccountId) {
      loadSavedSearches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete a saved search
  const handleDeleteSaved = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/keyword-research/results/${id}`);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
      // Also update savedResults set
      const deleted = savedSearches.find(s => s.id === id);
      if (deleted) {
        setSavedResults(prev => {
          const next = new Set(prev);
          next.delete(deleted.term);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to delete saved search:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Get current location code for lookups
  const getLocationCode = () => location?.code || 2840; // Default to USA
  const getLocationName = () => location?.name || 'United States';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const locationCode = location?.code || 2840; // Default to USA

    // Get main keyword data
    const discoveryResult = await discover(searchQuery.trim(), locationCode);
    setResult(discoveryResult);

    // Get related suggestions using the same location
    const suggestionsResult = await getSuggestions(searchQuery.trim(), locationCode);
    setSuggestions(suggestionsResult);
  };

  /**
   * Save a research result (term + volume data) without adding to library.
   * Stores in keyword_research_results table for later use.
   */
  const handleSaveResult = async (keyword: string, resultData: any) => {
    setSavingResult(keyword);
    try {
      const response = await apiClient.post<{ result: SavedResearchResult }>('/keyword-research/save', {
        term: keyword,
        searchVolume: resultData.searchVolume ?? null,
        cpc: resultData.cpc ?? null,
        competition: resultData.competitionValue ?? null,
        competitionLevel: resultData.competition ?? null,
        searchVolumeTrend: resultData.monthlyTrend ? {
          monthlyData: resultData.monthlyTrend.map((m: any) => ({
            month: m.month,
            year: m.year,
            volume: m.volume,
          })),
        } : null,
        monthlySearches: resultData.monthlyTrend ?? null,
        locationCode: getLocationCode(),
        locationName: getLocationName(),
      });

      setSavedResults(prev => new Set([...prev, keyword]));
      // Add to saved searches list (or update if exists)
      if (response.result) {
        setSavedSearches(prev => {
          const exists = prev.some(s => s.id === response.result.id);
          if (exists) {
            return prev.map(s => s.id === response.result.id ? response.result : s);
          }
          return [response.result, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to save result:', err);
    } finally {
      setSavingResult(null);
    }
  };

  const handleAddToLibrary = async (keyword: string, volume: number, cpc: number | null, resultData?: any) => {
    setAddingKeyword(keyword);
    try {
      // First, create the keyword concept
      const response = await apiClient.post<{ keyword: { id: string } }>('/keywords', {
        phrase: keyword,
        review_phrase: keyword,
        search_query: keyword,
        aliases: [],
        location_scope: null,
        ai_generated: false,
      });

      // Then save the research result linked to this keyword
      if (response?.keyword?.id && resultData) {
        await apiClient.post('/keyword-research/save', {
          term: keyword,
          searchVolume: resultData.searchVolume ?? volume ?? null,
          cpc: resultData.cpc ?? cpc ?? null,
          competition: resultData.competitionValue ?? null,
          competitionLevel: resultData.competition ?? null,
          searchVolumeTrend: resultData.monthlyTrend ? {
            monthlyData: resultData.monthlyTrend.map((m: any) => ({
              month: m.month,
              year: m.year,
              volume: m.volume,
            })),
          } : null,
          monthlySearches: resultData.monthlyTrend ?? null,
          locationCode: getLocationCode(),
          locationName: getLocationName(),
          keywordId: response.keyword.id,
        });
        setSavedResults(prev => new Set([...prev, keyword]));
      }

      setAddedKeywords(prev => new Set([...prev, keyword]));
      await refreshLibrary();
    } catch (err) {
      console.error('Failed to add keyword:', err);
    } finally {
      setAddingKeyword(null);
    }
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'rising':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'falling':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendLabel = (trend: string | null) => {
    switch (trend) {
      case 'rising':
        return <span className="text-green-600">Rising</span>;
      case 'falling':
        return <span className="text-red-600">Falling</span>;
      default:
        return <span className="text-gray-500">Stable</span>;
    }
  };

  const getCompetitionColor = (level: string | null) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

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

      {/* Tab Navigation */}
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
        icon={<Icon name="FaSearch" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        {/* Search Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Keyword Research</h2>
          <p className="text-sm text-gray-500 mb-4">
            Discover search volume, competition, and trends for any keyword.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keyword
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter a keyword to research..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="United States (default)"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="h-[46px] px-8"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Rate limit info */}
          {remainingLookups !== null && (
            <div className="mt-4 text-sm text-gray-500">
              {remainingLookups} searches remaining today
            </div>
          )}
        </div>

        {/* Rate Limited Message */}
        {isRateLimited && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <h3 className="font-medium text-yellow-800">Daily Limit Reached</h3>
            <p className="text-yellow-700 mt-1">
              You&apos;ve reached your daily keyword research limit. Try again tomorrow.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && !isRateLimited && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Result Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{result.keyword}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Trend:</span>
                      {getTrendIcon(result.trend)}
                      {getTrendLabel(result.trend)}
                    </div>
                    {result.competition && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCompetitionColor(result.competition)}`}>
                        {result.competition} competition
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Save result button */}
                  <button
                    onClick={() => handleSaveResult(result.keyword, result)}
                    disabled={savedResults.has(result.keyword) || savingResult === result.keyword}
                    className={`p-2 rounded-lg transition-colors ${
                      savedResults.has(result.keyword)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={savedResults.has(result.keyword) ? 'Saved' : 'Save result'}
                  >
                    {savingResult === result.keyword ? (
                      <Icon name="FaSpinner" className="w-5 h-5 animate-spin" />
                    ) : savedResults.has(result.keyword) ? (
                      <BookmarkIconSolid className="w-5 h-5" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                  </button>
                  <Button
                    onClick={() => handleAddToLibrary(result.keyword, result.searchVolume, result.cpc, result)}
                    disabled={addedKeywords.has(result.keyword) || addingKeyword === result.keyword}
                    variant={addedKeywords.has(result.keyword) ? 'outline' : 'default'}
                  >
                    {addedKeywords.has(result.keyword) ? (
                      'Added'
                    ) : addingKeyword === result.keyword ? (
                      'Adding...'
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add to Library
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500">Monthly Volume</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {result.searchVolume?.toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500">CPC</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {result.cpc ? `$${result.cpc.toFixed(2)}` : '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500">Competition</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {result.competition || '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-500">Trend</div>
                  <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {getTrendIcon(result.trend)}
                    {result.trend ? result.trend.charAt(0).toUpperCase() + result.trend.slice(1) : '-'}
                  </div>
                </div>
              </div>

              {/* Monthly Trend Chart (simple version) */}
              {result.monthlyTrend && result.monthlyTrend.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Search Trend (Last 12 Months)</h3>
                  <div className="flex items-end gap-1 h-24">
                    {result.monthlyTrend.slice(-12).map((m: any, i: number) => {
                      const maxVol = Math.max(...result.monthlyTrend.map((x: any) => x.volume || 0));
                      const height = maxVol > 0 ? ((m.volume || 0) / maxVol) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-slate-blue/20 hover:bg-slate-blue/40 rounded-t transition-colors"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${m.volume?.toLocaleString() || 0} searches`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {result.monthlyTrend.slice(-12).map((m: any, i: number) => {
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return (
                        <div key={i} className="flex-1 text-center text-xs text-gray-400">
                          {monthNames[m.month - 1]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Related Keywords */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Related Keywords ({suggestions.length})
                </h3>
                <div className="space-y-2">
                  {suggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{sug.keyword}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span>{sug.searchVolume?.toLocaleString() || 0}/mo</span>
                          {sug.cpc && <span>CPC: ${sug.cpc.toFixed(2)}</span>}
                          {sug.competition && (
                            <>
                              <span>Comp:</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${getCompetitionColor(sug.competition)}`}>
                                {sug.competition}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Save button */}
                        <button
                          onClick={() => handleSaveResult(sug.keyword, sug)}
                          disabled={savedResults.has(sug.keyword) || savingResult === sug.keyword}
                          className={`p-1.5 rounded-lg transition-colors ${
                            savedResults.has(sug.keyword)
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={savedResults.has(sug.keyword) ? 'Saved' : 'Save result'}
                        >
                          {savingResult === sug.keyword ? (
                            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                          ) : savedResults.has(sug.keyword) ? (
                            <BookmarkIconSolid className="w-4 h-4" />
                          ) : (
                            <BookmarkIcon className="w-4 h-4" />
                          )}
                        </button>
                        {/* Add to library button */}
                        <button
                          onClick={() => handleAddToLibrary(sug.keyword, sug.searchVolume, sug.cpc, sug)}
                          disabled={addedKeywords.has(sug.keyword) || addingKeyword === sug.keyword}
                          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                            addedKeywords.has(sug.keyword)
                              ? 'bg-green-100 text-green-700'
                              : 'text-slate-blue hover:bg-slate-blue/10'
                          }`}
                        >
                          {addedKeywords.has(sug.keyword) ? 'Added' : addingKeyword === sug.keyword ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && !error && savedSearches.length === 0 && !isLoadingSaved && (
          <div className="py-12 text-center">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start Your Research
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a keyword above to discover search volume, competition levels,
              and related keyword suggestions.
            </p>
          </div>
        )}

        {/* Saved Searches Section */}
        {(savedSearches.length > 0 || isLoadingSaved) && (
          <div className={`${result ? 'mt-8 pt-8 border-t border-gray-200' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookmarkIconSolid className="w-5 h-5 text-blue-600" />
              Saved searches ({savedSearches.length})
            </h3>

            {isLoadingSaved ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="FaSpinner" className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{saved.term}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                        <span>{saved.searchVolume?.toLocaleString() || 0}/mo</span>
                        {saved.cpc && <span>CPC: ${saved.cpc.toFixed(2)}</span>}
                        {saved.competitionLevel && (
                          <>
                            <span>Comp:</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getCompetitionColor(saved.competitionLevel)}`}>
                              {saved.competitionLevel}
                            </span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400">{saved.locationName}</span>
                        {saved.keywordId && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-green-600 text-xs">In library</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Re-search button */}
                      <button
                        onClick={() => {
                          setSearchQuery(saved.term);
                          setLocation({ code: saved.locationCode, name: saved.locationName });
                        }}
                        className="p-1.5 text-gray-400 hover:text-slate-blue hover:bg-slate-blue/10 rounded-lg transition-colors"
                        title="Search again"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteSaved(saved.id)}
                        disabled={deletingId === saved.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === saved.id ? (
                          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                      {/* Add to library button (if not already linked) */}
                      {!saved.keywordId && (
                        <button
                          onClick={() => handleAddToLibrary(saved.term, saved.searchVolume || 0, saved.cpc, {
                            searchVolume: saved.searchVolume,
                            cpc: saved.cpc,
                            competition: saved.competitionLevel,
                          })}
                          disabled={addedKeywords.has(saved.term) || addingKeyword === saved.term}
                          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                            addedKeywords.has(saved.term)
                              ? 'bg-green-100 text-green-700'
                              : 'text-slate-blue hover:bg-slate-blue/10'
                          }`}
                        >
                          {addedKeywords.has(saved.term) ? 'Added' : addingKeyword === saved.term ? 'Adding...' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </PageCard>
    </div>
  );
}
