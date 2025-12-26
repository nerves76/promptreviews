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
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [autoCheckResult, setAutoCheckResult] = useState<{
    keyword: string;
    desktop: { position: number | null; found: boolean };
    mobile: { position: number | null; found: boolean };
    locationName: string;
  } | null>(null);

  // Trigger refresh of enrichment data when a check completes
  const handleCheckComplete = useCallback(() => {
    setEnrichmentRefreshKey(prev => prev + 1);
  }, []);

  // Auto-dismiss result toast after 5 seconds
  useEffect(() => {
    if (autoCheckResult) {
      const timer = setTimeout(() => setAutoCheckResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [autoCheckResult]);

  // Handle clicking "Check ranking" on a search term
  // If concept has location, auto-run the check. Otherwise show modal.
  const handleCheckRank = useCallback(async (keyword: string, conceptId: string) => {
    // Find the concept to get its location
    const concept = keywords.find(k => k.id === conceptId);
    const conceptLocationCode = concept?.searchVolumeLocationCode;
    const conceptLocationName = concept?.searchVolumeLocationName;

    // Use concept location, or fallback to business location
    const locationCode = conceptLocationCode || business?.location_code;
    const locationName = conceptLocationName || business?.location_name;

    if (locationCode && locationName) {
      // Auto-run the check without modal
      setIsAutoChecking(true);
      setAutoCheckResult(null);
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
          setAutoCheckResult({
            keyword,
            desktop: { position: desktopResponse.position, found: desktopResponse.found },
            mobile: { position: mobileResponse.position, found: mobileResponse.found },
            locationName,
          });
          handleCheckComplete();
        }
      } catch (error) {
        console.error('Auto rank check failed:', error);
        // Fall back to showing modal on error
        setCheckingKeyword({ keyword, conceptId });
      } finally {
        setIsAutoChecking(false);
      }
    } else {
      // No location available, show modal
      setCheckingKeyword({ keyword, conceptId });
    }
  }, [keywords, business, handleCheckComplete]);

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
      />

      {/* Check LLM Visibility Modal */}
      <CheckLLMModal
        question={checkingLLM?.question || ''}
        keywordId={checkingLLM?.conceptId || ''}
        isOpen={!!checkingLLM}
        onClose={() => setCheckingLLM(null)}
        onCheckComplete={handleCheckComplete}
      />

      {/* Auto-check loading toast */}
      {isAutoChecking && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3">
          <Icon name="FaSpinner" className="w-5 h-5 text-slate-blue animate-spin" />
          <span className="text-sm text-gray-700">Checking ranking...</span>
        </div>
      )}

      {/* Auto-check result toast */}
      {autoCheckResult && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Rank check complete
              </p>
              <p className="text-xs text-gray-500 mb-3 truncate" title={autoCheckResult.keyword}>
                &quot;{autoCheckResult.keyword}&quot; in {autoCheckResult.locationName}
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🖥️</span>
                  <span className={`text-sm font-medium ${
                    autoCheckResult.desktop.found && autoCheckResult.desktop.position !== null
                      ? autoCheckResult.desktop.position <= 10 ? 'text-green-600' : 'text-amber-600'
                      : 'text-gray-500'
                  }`}>
                    {autoCheckResult.desktop.found && autoCheckResult.desktop.position !== null
                      ? `#${autoCheckResult.desktop.position}`
                      : 'Not found'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📱</span>
                  <span className={`text-sm font-medium ${
                    autoCheckResult.mobile.found && autoCheckResult.mobile.position !== null
                      ? autoCheckResult.mobile.position <= 10 ? 'text-green-600' : 'text-amber-600'
                      : 'text-gray-500'
                  }`}>
                    {autoCheckResult.mobile.found && autoCheckResult.mobile.position !== null
                      ? `#${autoCheckResult.mobile.position}`
                      : 'Not found'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAutoCheckResult(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="FaTimes" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
