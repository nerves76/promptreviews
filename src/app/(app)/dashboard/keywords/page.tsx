'use client';

import { useState, useCallback, useEffect } from 'react';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import { KeywordManager } from '@/features/keywords/components';
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
  const { business } = useBusinessData();
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string; locationCode?: number; locationName?: string } | null>(null);
  const [checkingLLM, setCheckingLLM] = useState<{ question: string; conceptId: string } | null>(null);
  const [enrichmentRefreshKey, setEnrichmentRefreshKey] = useState(0);

  // Track which concepts have a manual rank check in progress
  const [rankCheckingConceptIds, setRankCheckingConceptIds] = useState<Set<string>>(new Set());

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

        if (!searchQuery) return;

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
  // Location is passed directly from ConceptCard (freshest data) to avoid stale lookups
  const handleCheckRank = useCallback((keyword: string, conceptId: string, locationCode?: number | null, locationName?: string | null) => {
    // Use passed-in concept location, or fallback to business location, or looked-up location from address
    const resolvedLocationCode = locationCode || business?.location_code || lookedUpLocation?.locationCode;
    const resolvedLocationName = locationName || business?.location_name || lookedUpLocation?.locationName;

    // Always show modal with pre-selected location if available
    setCheckingKeyword({
      keyword,
      conceptId,
      locationCode: resolvedLocationCode,
      locationName: resolvedLocationName,
    });
  }, [business, lookedUpLocation]);

  // Handle clicking "Check" on an AI visibility question
  const handleCheckLLMVisibility = useCallback((question: string, conceptId: string) => {
    setCheckingLLM({ question, conceptId });
  }, []);

  // Fire-and-forget rank check (called from modal after confirmation)
  const startRankCheck = useCallback((
    locationCode: number,
    locationName: string
  ) => {
    if (!checkingKeyword) return;

    const conceptId = checkingKeyword.conceptId;
    const kw = checkingKeyword.keyword;

    // Mark concept as checking
    setRankCheckingConceptIds(prev => new Set(prev).add(conceptId));

    // Fire off the check without awaiting
    (async () => {
      try {
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
            keyword: kw,
            keywordId: conceptId,
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
            keyword: kw,
            keywordId: conceptId,
            locationCode,
            device: 'mobile',
          }),
        ]);

        if (!desktopResponse.success) {
          console.error('Desktop rank check failed:', desktopResponse.error);
        }
        if (!mobileResponse.success) {
          console.error('Mobile rank check failed:', mobileResponse.error);
        }

        // Trigger enrichment data refresh
        handleCheckComplete();
      } catch (err) {
        console.error('Rank check failed:', err);
      } finally {
        // Remove concept from checking set
        setRankCheckingConceptIds(prev => {
          const next = new Set(prev);
          next.delete(conceptId);
          return next;
        });
      }
    })();
  }, [checkingKeyword, handleCheckComplete]);

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Keyword Concepts
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <SubNav
        items={[
          { label: 'Concepts', icon: 'FaKey', href: '/dashboard/keywords', matchType: 'exact' },
          { label: 'Rank tracking', icon: 'FaChartLine', href: '/dashboard/keywords/rank-tracking', matchType: 'exact' },
          { label: 'PAA questions', icon: 'FaQuestionCircle', href: '/dashboard/keywords/rank-tracking/paa-questions', matchType: 'exact' },
        ]}
      />

      {/* Content in PageCard */}
      <PageCard
        icon={<Icon name="FaKey" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <KeywordManager
          onCheckRank={handleCheckRank}
          onCheckLLMVisibility={handleCheckLLMVisibility}
          enrichmentRefreshKey={enrichmentRefreshKey}
          rankCheckingConceptIds={rankCheckingConceptIds}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={startRankCheck}
        defaultLocationCode={checkingKeyword?.locationCode}
        defaultLocationName={checkingKeyword?.locationName}
        locationLocked={!!checkingKeyword?.locationCode}
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
