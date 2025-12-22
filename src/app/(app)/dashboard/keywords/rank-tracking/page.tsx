/**
 * Rank Tracking Page (under Keywords)
 *
 * Shows keyword concepts as accordions with search terms and rankings.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useRankGroups } from '@/features/rank-tracking/hooks';
import { ConceptRankAccordion, CheckRankModal, CheckVolumeModal } from '@/features/rank-tracking/components';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData } from '@/features/keywords/keywordUtils';
import { type RankKeywordGroup } from '@/features/rank-tracking/utils/types';


/** Volume data for a search term */
interface TermVolumeData {
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
}

/** Ranking data for display in accordion */
interface TermRanking {
  configId: string;
  configName: string;
  position: number | null;
  change: number | null;
  checkedAt: string | null;
}

export default function RankTrackingPage() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichingConceptId, setEnrichingConceptId] = useState<string | null>(null);
  const [checkingKeyword, setCheckingKeyword] = useState<{ keyword: string; conceptId: string } | null>(null);
  const [researchResults, setResearchResults] = useState<ResearchResult[]>([]);
  const [rankChecks, setRankChecks] = useState<RankCheck[]>([]);

  // Fetch rank tracking groups (scheduled locations)
  const { groups: scheduledLocations, isLoading: locationsLoading } = useRankGroups();

  // Fetch keyword concepts
  const {
    keywords: concepts,
    isLoading: conceptsLoading,
    refresh: refreshConcepts,
    updateKeyword,
  } = useKeywords({ autoFetch: true });

  // Fetch saved research results for volume data
  const fetchResearchResults = useCallback(async () => {
    try {
      const response = await apiClient.get<{ results: ResearchResult[] }>('/keyword-research/results?limit=100');
      setResearchResults(response.results || []);
    } catch (err) {
      console.error('Failed to fetch research results:', err);
    }
  }, []);

  // Fetch rank checks
  const fetchRankChecks = useCallback(async () => {
    try {
      const response = await apiClient.get<{ checks: RankCheck[] }>('/rank-tracking/checks?limit=200');
      setRankChecks(response.checks || []);
    } catch (err) {
      console.error('Failed to fetch rank checks:', err);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchResearchResults();
    fetchRankChecks();
  }, [fetchResearchResults, fetchRankChecks]);

  // Build term volume data map
  const termVolumeData = useMemo(() => {
    const map = new Map<string, TermVolumeData>();
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

  // Build term rankings map from rank checks
  // Groups by search_query_used, with rankings per location+device
  const termRankings = useMemo(() => {
    const map = new Map<string, TermRanking[]>();

    rankChecks.forEach((check) => {
      const term = check.search_query_used;
      if (!map.has(term)) {
        map.set(term, []);
      }

      // Create a unique config ID from location+device
      const configId = `${check.location_code}-${check.device}`;
      const configName = `${check.location_name} (${check.device})`;

      // Check if we already have this config for this term (avoid duplicates)
      const existing = map.get(term)!;
      const existingIdx = existing.findIndex(r => r.configId === configId);

      const ranking: TermRanking = {
        configId,
        configName,
        position: check.position,
        change: null, // TODO: Calculate change from previous check
        checkedAt: check.checked_at,
      };

      if (existingIdx >= 0) {
        // Keep the most recent one
        if (new Date(check.checked_at) > new Date(existing[existingIdx].checkedAt || 0)) {
          existing[existingIdx] = ranking;
        }
      } else {
        existing.push(ranking);
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

  // Handle AI enrichment for a concept
  const handleAIEnrich = useCallback(async (concept: KeywordData) => {
    setEnrichingConceptId(concept.id);
    try {
      const response = await apiClient.post<{
        success: boolean;
        enrichment: {
          review_phrase: string;
          search_terms: string[];
          aliases: string[];
          location_scope: string | null;
          related_questions: Array<{ question: string; funnelStage: string; addedAt: string }>;
        };
      }>('/ai/enrich-keyword', { phrase: concept.phrase });

      if (response.success && response.enrichment) {
        // Convert search_terms to proper format
        const now = new Date().toISOString();
        const searchTerms = response.enrichment.search_terms.map((term, index) => ({
          term,
          isCanonical: index === 0,
          addedAt: now,
        }));

        // Update the keyword with enriched data
        await updateKeyword(concept.id, {
          reviewPhrase: response.enrichment.review_phrase,
          searchQuery: searchTerms[0]?.term || '',
          aliases: response.enrichment.aliases,
          locationScope: response.enrichment.location_scope,
          relatedQuestions: response.enrichment.related_questions.map(q => ({
            question: q.question,
            funnelStage: q.funnelStage as 'top' | 'middle' | 'bottom',
            addedAt: q.addedAt,
          })),
        });

        // Save search terms separately via API
        await apiClient.put(`/keywords/${concept.id}`, {
          search_terms: searchTerms.map(t => ({
            term: t.term,
            is_canonical: t.isCanonical,
            added_at: t.addedAt,
          })),
        });

        await refreshConcepts();
      }
    } catch (error) {
      console.error('AI enrichment failed:', error);
    } finally {
      setEnrichingConceptId(null);
    }
  }, [updateKeyword, refreshConcepts]);

  // Handle adding a search term to a concept
  const handleAddSearchTerm = useCallback(async (conceptId: string, term: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) return;

    const existingTerms = concept.searchTerms || [];
    const newTerm = {
      term,
      isCanonical: existingTerms.length === 0,
      addedAt: new Date().toISOString(),
    };

    await apiClient.put(`/keywords/${conceptId}`, {
      search_terms: [...existingTerms.map(t => ({
        term: t.term,
        is_canonical: t.isCanonical,
        added_at: t.addedAt,
      })), {
        term: newTerm.term,
        is_canonical: newTerm.isCanonical,
        added_at: newTerm.addedAt,
      }],
    });

    await refreshConcepts();
  }, [concepts, refreshConcepts]);

  // Handle removing a search term from a concept
  const handleRemoveSearchTerm = useCallback(async (conceptId: string, termToRemove: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    if (!concept) return;

    const remaining = concept.searchTerms.filter(t => t.term !== termToRemove);
    // Make first remaining term canonical if we removed the canonical one
    if (remaining.length > 0 && !remaining.some(t => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }

    await apiClient.put(`/keywords/${conceptId}`, {
      search_terms: remaining.map(t => ({
        term: t.term,
        is_canonical: t.isCanonical,
        added_at: t.addedAt,
      })),
    });

    await refreshConcepts();
  }, [concepts, refreshConcepts]);

  // Open the check rank modal for a keyword
  const handleCheckRank = useCallback((keyword: string, conceptId: string) => {
    setCheckingKeyword({ keyword, conceptId });
  }, []);

  // State for volume checking modal
  const [checkingVolumeTerm, setCheckingVolumeTerm] = useState<string | null>(null);

  // Open volume check modal for a term
  const handleCheckVolume = useCallback((term: string) => {
    setCheckingVolumeTerm(term);
  }, []);

  // Perform the actual volume check (called from modal)
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
      keyword: checkingVolumeTerm,
      locationCode,
    });

    // API throws on error, so if we get here it succeeded
    if (response.error) {
      throw new Error(response.error);
    }

    // Save the research result
    await apiClient.post('/keyword-research/save', {
      term: checkingVolumeTerm,
      searchVolume: response.volume,
      cpc: response.cpc,
      competition: null,
      competitionLevel: response.competitionLevel,
      locationCode,
      locationName,
    });

    // Refresh the research results to update the UI
    const refreshedResults = await apiClient.get<{ results: ResearchResult[] }>('/keyword-research/results?limit=100');
    setResearchResults(refreshedResults.results || []);

    return {
      searchVolume: response.volume,
      cpc: response.cpc,
      competitionLevel: response.competitionLevel,
    };
  }, [checkingVolumeTerm]);

  // Actually perform the rank check (called from modal)
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

    // Refresh rank checks to show the new result
    await fetchRankChecks();

    return {
      position: response.position,
      found: response.found,
    };
  }, [checkingKeyword, fetchRankChecks]);

  const isLoading = conceptsLoading;

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

      {/* Main Tab Navigation (Library | Research | Rank Tracking | LLM Visibility) */}
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
        icon={<Icon name="FaChartLine" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-8"
      >
        {/* Search header */}
        <div className="flex items-center justify-end mb-6">
          <div className="relative w-64">
            <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30 transition-all"
            />
          </div>
        </div>

        {/* Concepts Content */}
        <ConceptsTab
          concepts={filteredConcepts}
          configs={scheduledLocations}
          isLoading={isLoading}
          onAIEnrich={handleAIEnrich}
          onAddSearchTerm={handleAddSearchTerm}
          onRemoveSearchTerm={handleRemoveSearchTerm}
          onCheckRank={handleCheckRank}
          onCheckVolume={handleCheckVolume}
          checkingVolumeTerm={checkingVolumeTerm}
          enrichingConceptId={enrichingConceptId}
          termVolumeData={termVolumeData}
          termRankings={termRankings}
        />
      </PageCard>

      {/* Check Rank Modal */}
      <CheckRankModal
        keyword={checkingKeyword?.keyword || ''}
        isOpen={!!checkingKeyword}
        onClose={() => setCheckingKeyword(null)}
        onCheck={performRankCheck}
      />

      {/* Check Volume Modal */}
      <CheckVolumeModal
        keyword={checkingVolumeTerm || ''}
        isOpen={!!checkingVolumeTerm}
        onClose={() => setCheckingVolumeTerm(null)}
        onCheck={performVolumeCheck}
      />
    </div>
  );
}

// ============================================
// Concepts Tab
// ============================================

interface ConceptsTabProps {
  concepts: KeywordData[];
  configs: RankKeywordGroup[];
  isLoading: boolean;
  onAIEnrich: (concept: KeywordData) => Promise<void>;
  onAddSearchTerm: (conceptId: string, term: string) => Promise<void>;
  onRemoveSearchTerm: (conceptId: string, term: string) => Promise<void>;
  onCheckRank: (keyword: string, conceptId: string) => void;
  onCheckVolume: (term: string) => void;
  checkingVolumeTerm: string | null;
  enrichingConceptId: string | null;
  termVolumeData: Map<string, TermVolumeData>;
  termRankings: Map<string, TermRanking[]>;
}

function ConceptsTab({
  concepts,
  configs,
  isLoading,
  onAIEnrich,
  onAddSearchTerm,
  onRemoveSearchTerm,
  onCheckRank,
  onCheckVolume,
  checkingVolumeTerm,
  enrichingConceptId,
  termVolumeData,
  termRankings,
}: ConceptsTabProps) {
  // Separate concepts with and without search terms
  const conceptsWithTerms = concepts.filter(c => c.searchTerms && c.searchTerms.length > 0);
  const conceptsWithoutTerms = concepts.filter(c => !c.searchTerms || c.searchTerms.length === 0);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (concepts.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-blue/10 rounded-full mb-4">
          <Icon name="FaKey" className="w-8 h-8 text-slate-blue" size={32} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No keyword concepts yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Add keyword concepts in the Library tab first, then come back here to track their rankings.
        </p>
        <Link
          href="/dashboard/keywords"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
        >
          <Icon name="FaPlus" className="w-4 h-4" size={16} />
          Go to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">
          <span className="font-semibold text-gray-900">{concepts.length}</span> concepts
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">
          <span className="font-semibold text-green-600">{conceptsWithTerms.length}</span> with search terms
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">
          <span className="font-semibold text-amber-600">{conceptsWithoutTerms.length}</span> need terms
        </span>
      </div>

      {/* Concepts without search terms (show first if any) */}
      {conceptsWithoutTerms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-amber-700 flex items-center gap-2">
            <Icon name="FaExclamationTriangle" className="w-4 h-4" />
            Concepts needing search terms ({conceptsWithoutTerms.length})
          </h3>
          <div className="space-y-2">
            {conceptsWithoutTerms.map((concept) => (
              <ConceptRankAccordion
                key={concept.id}
                concept={concept}
                configs={configs}
                termVolumeData={termVolumeData}
                termRankings={termRankings}
                editable={true}
                onAIEnrich={onAIEnrich}
                onAddSearchTerm={onAddSearchTerm}
                onRemoveSearchTerm={onRemoveSearchTerm}
                onCheckRank={onCheckRank}
                onCheckVolume={onCheckVolume}
                checkingVolumeTerm={checkingVolumeTerm}
                isEnriching={enrichingConceptId === concept.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Concepts with search terms */}
      {conceptsWithTerms.length > 0 && (
        <div className="space-y-3">
          {conceptsWithoutTerms.length > 0 && (
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Icon name="FaCheckCircle" className="w-4 h-4 text-green-500" />
              Concepts with search terms ({conceptsWithTerms.length})
            </h3>
          )}
          <div className="space-y-2">
            {conceptsWithTerms.map((concept) => (
              <ConceptRankAccordion
                key={concept.id}
                concept={concept}
                configs={configs}
                termVolumeData={termVolumeData}
                termRankings={termRankings}
                editable={true}
                onAIEnrich={onAIEnrich}
                onAddSearchTerm={onAddSearchTerm}
                onRemoveSearchTerm={onRemoveSearchTerm}
                onCheckRank={onCheckRank}
                onCheckVolume={onCheckVolume}
                checkingVolumeTerm={checkingVolumeTerm}
                isEnriching={enrichingConceptId === concept.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

