'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import PageCard from '@/app/(app)/components/PageCard';
import { KeywordManager } from '@/features/keywords/components';
import { CheckRankModal } from '@/features/rank-tracking/components';
import { apiClient } from '@/utils/apiClient';

/**
 * Keywords Dashboard Page
 *
 * Full-screen keyword management interface with subnav
 * for Library and Research tabs.
 * Design matches Prompt Pages convention with PageCard.
 */
export default function KeywordsPage() {
  const pathname = usePathname();
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string } | null>(null);

  // Handle clicking "Check ranking" on a search term
  const handleCheckRank = useCallback((keyword: string, conceptId: string) => {
    setCheckingKeyword({ keyword, conceptId });
  }, []);

  // Perform the actual rank check (called from modal)
  const performRankCheck = useCallback(async (
    locationCode: number,
    locationName: string,
    device: 'desktop' | 'mobile'
  ): Promise<{ position: number | null; found: boolean }> => {
    if (!checkingKeyword) throw new Error('No keyword selected');

    const response = await apiClient.post<{
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
      device,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to check rank');
    }

    return {
      position: response.position,
      found: response.found,
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
        <KeywordManager onCheckRank={handleCheckRank} />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
      />
    </div>
  );
}
