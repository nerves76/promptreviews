'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { KeywordManager } from '@/features/keywords/components';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { CheckRankModal } from '@/features/rank-tracking/components';
import { CheckLLMModal } from '@/features/llm-visibility/components';
import { apiClient } from '@/utils/apiClient';
import { useBusinessData } from '@/auth/hooks/granularAuthHooks';

/**
 * Keywords Dashboard Page
 *
 * Full-screen keyword management interface with subnav
 * for Library and Research tabs.
 * Design matches Prompt Pages convention with PageCard.
 */
export default function KeywordsPage() {
  const pathname = usePathname();
  const { keywords } = useKeywords();
  const { business } = useBusinessData();
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string; locationCode?: number; locationName?: string } | null>(null);
  const [checkingLLM, setCheckingLLM] = useState<{ question: string; conceptId: string } | null>(null);
  const [enrichmentRefreshKey, setEnrichmentRefreshKey] = useState(0);

  // Looked-up location from business address (if location_code not set)
  const [lookedUpLocation, setLookedUpLocation] = useState<{
    locationCode: number;
    locationName: string;
  } | null>(null);

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
      try {
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
      }
    };

    lookupLocation();
  }, [business?.location_code, business?.address_city, business?.address_state]);

  // Trigger refresh of enrichment data when a check completes
  const handleCheckComplete = useCallback(() => {
    setEnrichmentRefreshKey(prev => prev + 1);
  }, []);

  // Handle clicking "Check ranking" on a search term
  // Always show modal with credit info and confirmation
  const handleCheckRank = useCallback((keyword: string, conceptId: string) => {
    // Find the concept to get its location
    const concept = keywords.find(k => k.id === conceptId);
    const conceptLocationCode = concept?.searchVolumeLocationCode;
    const conceptLocationName = concept?.searchVolumeLocationName;

    // Use concept location, or fallback to business location, or looked-up location from address
    const locationCode = conceptLocationCode || business?.location_code || lookedUpLocation?.locationCode;
    const locationName = conceptLocationName || business?.location_name || lookedUpLocation?.locationName;

    // Always show modal with pre-selected location if available
    setCheckingKeyword({
      keyword,
      conceptId,
      locationCode,
      locationName,
    });
  }, [keywords, business, lookedUpLocation]);

  // Handle clicking "Check" on an AI visibility question
  const handleCheckLLMVisibility = useCallback((question: string, conceptId: string) => {
    setCheckingLLM({ question, conceptId });
  }, []);

  // Perform the actual rank check (called from modal) - checks both desktop and mobile
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

    return {
      desktop: { position: desktopResponse.position, found: desktopResponse.found },
      mobile: { position: mobileResponse.position, found: mobileResponse.found },
    };
  }, [checkingKeyword]);

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
        icon={<Icon name="FaKey" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        <KeywordManager
          onCheckRank={handleCheckRank}
          onCheckLLMVisibility={handleCheckLLMVisibility}
          enrichmentRefreshKey={enrichmentRefreshKey}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
        onCheckComplete={handleCheckComplete}
        defaultLocationCode={checkingKeyword?.locationCode}
        defaultLocationName={checkingKeyword?.locationName}
      />

      {/* Check LLM Visibility Modal */}
      <CheckLLMModal
        question={checkingLLM?.question || ''}
        keywordId={checkingLLM?.conceptId || ''}
        isOpen={!!checkingLLM}
        onClose={() => setCheckingLLM(null)}
        onCheckComplete={handleCheckComplete}
        businessName={business?.name || undefined}
      />

    </div>
  );
}
