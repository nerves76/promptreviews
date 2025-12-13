'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { Button } from '@/app/(app)/components/ui/button';
import { useKeywordDiscovery } from '@/features/rank-tracking/hooks';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { apiClient } from '@/utils/apiClient';
import LocationPicker from '@/features/rank-tracking/components/LocationPicker';

/**
 * Keyword Research Page
 *
 * Standalone page for discovering new keywords with search volume,
 * competition, and trend data from DataForSEO.
 * Design matches Prompt Pages convention with PageCard.
 */
export default function KeywordResearchPage() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ code: number; name: string } | null>(null);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);

  const { discover, getSuggestions, isLoading, error, isRateLimited, remainingLookups } = useKeywordDiscovery();
  const { refresh: refreshLibrary } = useKeywords({ autoFetch: false });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const locationCode = location?.code || 2840; // Default to USA

    // Get main keyword data
    const discoveryResult = await discover(searchQuery.trim(), locationCode);
    setResult(discoveryResult);

    // Get related suggestions
    const suggestionsResult = await getSuggestions(searchQuery.trim(), locationCode);
    setSuggestions(suggestionsResult);
  };

  const handleAddToLibrary = async (keyword: string, volume: number, cpc: number | null) => {
    setAddingKeyword(keyword);
    try {
      await apiClient.post('/keywords', {
        phrase: keyword,
        review_phrase: keyword,
        search_query: keyword,
        aliases: [],
        location_scope: null,
        ai_generated: false,
      });

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
            Keywords
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center w-full mt-0 mb-0 z-20 px-4">
        <div className="flex bg-white/10 backdrop-blur-sm border border-white/30 rounded-full p-1 shadow-lg gap-0">
          <Link
            href="/dashboard/keywords"
            className={`px-6 py-2 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaBook" className="w-4 h-4" size={16} />
            Library
          </Link>
          <Link
            href="/dashboard/keywords/research"
            className={`px-6 py-2 font-semibold text-sm focus:outline-none transition-all duration-200 rounded-full flex items-center gap-2
              ${pathname === '/dashboard/keywords/research'
                ? 'bg-slate-blue text-white'
                : 'bg-transparent text-white hover:bg-white/10'}
            `}
          >
            <Icon name="FaSearch" className="w-4 h-4" size={16} />
            Research
          </Link>
        </div>
      </div>

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaSearch" className="w-6 h-6 text-slate-blue" size={24} />}
        topMargin="mt-8"
      >
        {/* Search Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Keyword Research</h2>
          <p className="text-sm text-gray-500 mb-4">
            Discover search volume, competition, and trends for any keyword.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
            <div className="md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="United States (default)"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="w-full md:w-auto px-8 py-3"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
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
                <Button
                  onClick={() => handleAddToLibrary(result.keyword, result.searchVolume, result.cpc)}
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
                            <span className={`px-1.5 py-0.5 rounded text-xs ${getCompetitionColor(sug.competition)}`}>
                              {sug.competition}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddToLibrary(sug.keyword, sug.searchVolume, sug.cpc)}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && !error && (
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
      </PageCard>
    </div>
  );
}
