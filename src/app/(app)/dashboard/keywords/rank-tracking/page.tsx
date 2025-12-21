/**
 * Rank Tracking Page (under Keywords)
 *
 * Two-tab layout:
 * - Concepts (default): Shows keyword concepts as accordions with search terms and rankings
 * - Configurations: Manage tracking configurations (location/device/schedule)
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PageCard from '@/app/(app)/components/PageCard';
import Icon from '@/components/Icon';
import { useRankGroups } from '@/features/rank-tracking/hooks';
import { RankGroupCard, CreateGroupModal, ConceptRankAccordion } from '@/features/rank-tracking/components';
import { useKeywords } from '@/features/keywords/hooks/useKeywords';
import { apiClient } from '@/utils/apiClient';
import { type KeywordData } from '@/features/keywords/keywordUtils';
import { type RankKeywordGroup } from '@/features/rank-tracking/utils/types';
import { PlusIcon } from '@heroicons/react/24/outline';

type TabType = 'concepts' | 'configurations';

export default function RankTrackingPage() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('concepts');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrichingConceptId, setEnrichingConceptId] = useState<string | null>(null);

  // Fetch rank tracking groups (configurations)
  const { groups, isLoading: groupsLoading, refresh: refreshGroups, createGroup } = useRankGroups();

  // Fetch keyword concepts
  const {
    keywords: concepts,
    isLoading: conceptsLoading,
    refresh: refreshConcepts,
    updateKeyword,
  } = useKeywords({ autoFetch: true });

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

  const isLoading = activeTab === 'concepts' ? conceptsLoading : groupsLoading;

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
        {/* Sub-tabs: Concepts | Configurations */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('concepts')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'concepts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name="FaKey" className="w-4 h-4 inline mr-2" />
              Concepts
            </button>
            <button
              onClick={() => setActiveTab('configurations')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'configurations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon name="FaCog" className="w-4 h-4 inline mr-2" />
              Configurations
            </button>
          </div>

          {activeTab === 'configurations' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90"
            >
              <PlusIcon className="w-5 h-5" />
              New configuration
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'concepts' ? (
          <ConceptsTab
            concepts={filteredConcepts}
            configs={groups}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAIEnrich={handleAIEnrich}
            onAddSearchTerm={handleAddSearchTerm}
            onRemoveSearchTerm={handleRemoveSearchTerm}
            enrichingConceptId={enrichingConceptId}
          />
        ) : (
          <ConfigurationsTab
            groups={groups}
            isLoading={isLoading}
            onCreateClick={() => setShowCreateModal(true)}
            onRefresh={refreshGroups}
          />
        )}
      </PageCard>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createGroup}
        onSuccess={() => {
          refreshGroups();
          setShowCreateModal(false);
        }}
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAIEnrich: (concept: KeywordData) => Promise<void>;
  onAddSearchTerm: (conceptId: string, term: string) => Promise<void>;
  onRemoveSearchTerm: (conceptId: string, term: string) => Promise<void>;
  enrichingConceptId: string | null;
}

function ConceptsTab({
  concepts,
  configs,
  isLoading,
  searchQuery,
  onSearchChange,
  onAIEnrich,
  onAddSearchTerm,
  onRemoveSearchTerm,
  enrichingConceptId,
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
      {/* Search */}
      <div className="relative">
        <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search concepts or search terms..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30 transition-all"
        />
      </div>

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
                editable={true}
                onAIEnrich={onAIEnrich}
                onAddSearchTerm={onAddSearchTerm}
                onRemoveSearchTerm={onRemoveSearchTerm}
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
                editable={true}
                onAIEnrich={onAIEnrich}
                onAddSearchTerm={onAddSearchTerm}
                onRemoveSearchTerm={onRemoveSearchTerm}
                isEnriching={enrichingConceptId === concept.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Configurations Tab
// ============================================

interface ConfigurationsTabProps {
  groups: RankKeywordGroup[];
  isLoading: boolean;
  onCreateClick: () => void;
  onRefresh: () => void;
}

function ConfigurationsTab({ groups, isLoading, onCreateClick, onRefresh }: ConfigurationsTabProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-blue/10 rounded-full mb-4">
          <Icon name="FaCog" className="w-8 h-8 text-slate-blue" size={32} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tracking configurations yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create a configuration to start tracking your Google search rankings for different locations and devices.
        </p>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Create your first configuration
        </button>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Track rankings</h4>
            <p className="text-sm text-gray-600">
              Monitor your position in Google search results for important keywords.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Location-specific</h4>
            <p className="text-sm text-gray-600">
              Track rankings for different cities, states, or countries.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Automated checks</h4>
            <p className="text-sm text-gray-600">
              Schedule automatic ranking checks daily, weekly, or monthly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Configurations define where and how to track rankings. Each configuration tracks keywords for a specific location and device.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <RankGroupCard
            key={group.id}
            group={group}
            onRefresh={onRefresh}
            linkPrefix="/dashboard/keywords/rank-tracking"
          />
        ))}
      </div>
    </div>
  );
}
