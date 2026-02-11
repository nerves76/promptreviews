'use client';

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import PageCard, { PageCardHeader } from '@/app/(app)/components/PageCard';
import { SubNav } from '@/app/(app)/components/SubNav';
import Icon from '@/components/Icon';
import { apiClient } from '@/utils/apiClient';
import { useAccountData } from '@/auth/hooks/granularAuthHooks';
import { Pagination } from '@/components/Pagination';
import { AddPAAToConceptModal } from '@/features/keywords/components';

interface AnsweringDomain {
  domain: string;
  count: number;
  isOurs: boolean;
  urls: string[];
}

interface TriggeringKeyword {
  keywordId: string;
  phrase: string;
}

interface PAAQuestionAggregated {
  question: string;
  frequency: number;
  answeringDomains: AnsweringDomain[];
  triggeringKeywords: TriggeringKeyword[];
  firstSeen: string;
  lastSeen: string;
  isOursLatest: boolean;
  ourAnswerCount: number;
}

interface PAAQuestionsResponse {
  questions: PAAQuestionAggregated[];
  summary: {
    totalUniqueQuestions: number;
    totalChecksWithPAA: number;
    questionsWeAnswer: number;
    mostRecentCheck: string | null;
  };
}

type SortField = 'question' | 'frequency' | 'lastSeen';
type SortDirection = 'asc' | 'desc';
type OwnershipFilter = 'all' | 'ours' | 'competitors';

const PAGE_SIZE = 50;

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * PAA Questions Page
 *
 * Shows aggregated People Also Ask questions discovered during rank checks.
 * Helps users identify common questions in their niche and track which ones they answer.
 */
export default function PAAQuestionsPage() {
  const { selectedAccountId } = useAccountData();
  const [data, setData] = useState<PAAQuestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Selection state for bulk actions
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'bulk' | 'individual'>('individual');
  const [questionsForModal, setQuestionsForModal] = useState<string[]>([]);

  // Filtering
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!selectedAccountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<PAAQuestionsResponse>(
        '/rank-tracking/paa-questions'
      );
      setData(response);
    } catch (err: unknown) {
      console.error('[PAAQuestionsPage] Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PAA questions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!data?.questions) return;

    setIsExporting(true);
    try {
      // Build CSV content
      const headers = ['Question', 'Frequency', 'We Answer', 'Our Answer Count', 'Top Answer Domain', 'Keywords', 'First Seen', 'Last Seen'];
      const rows = data.questions.map(q => [
        `"${q.question.replace(/"/g, '""')}"`,
        q.frequency.toString(),
        q.ourAnswerCount > 0 ? 'Yes' : 'No',
        q.ourAnswerCount.toString(),
        q.answeringDomains[0]?.domain || '',
        `"${q.triggeringKeywords.map(k => k.phrase).join(', ').replace(/"/g, '""')}"`,
        q.firstSeen,
        q.lastSeen,
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paa-questions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[PAAQuestionsPage] Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'question' ? 'asc' : 'desc');
    }
  };

  // Filtered and sorted data
  const filteredAndSortedQuestions = useMemo(() => {
    if (!data?.questions) return [];

    let filtered = data.questions;

    // Apply ownership filter
    if (ownershipFilter === 'ours') {
      filtered = filtered.filter(q => q.ourAnswerCount > 0);
    } else if (ownershipFilter === 'competitors') {
      filtered = filtered.filter(q => q.ourAnswerCount === 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(query) ||
        q.triggeringKeywords.some(k => k.phrase.toLowerCase().includes(query))
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'question':
          comparison = a.question.localeCompare(b.question);
          break;
        case 'frequency':
          comparison = a.frequency - b.frequency;
          break;
        case 'lastSeen':
          comparison = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.questions, ownershipFilter, searchQuery, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedQuestions.length / PAGE_SIZE);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedQuestions, currentPage]);

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection, ownershipFilter, searchQuery]);

  // Get top question for summary
  const topQuestion = filteredAndSortedQuestions.length > 0 ? filteredAndSortedQuestions[0] : null;

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Icon name="FaChevronDown" className="w-2.5 h-2.5 text-gray-500" />;
    }
    return sortDirection === 'asc' ? (
      <Icon name="FaCaretUp" className="w-3 h-3 text-slate-blue" />
    ) : (
      <Icon name="FaCaretDown" className="w-3 h-3 text-slate-blue" />
    );
  };

  // Toggle row expand
  const toggleRowExpand = useCallback((question: string) => {
    setExpandedQuestion(prev => prev === question ? null : question);
  }, []);

  // Selection handlers
  const handleToggleSelect = useCallback((question: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(question)) {
        next.delete(question);
      } else {
        next.add(question);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedQuestions(new Set(paginatedQuestions.map(q => q.question)));
  }, [paginatedQuestions]);

  const handleDeselectAll = useCallback(() => {
    setSelectedQuestions(new Set());
  }, []);

  // Open modal for individual add
  const handleIndividualAdd = useCallback((question: string) => {
    setQuestionsForModal([question]);
    setModalMode('individual');
    setModalOpen(true);
  }, []);

  // Open modal for bulk add
  const handleBulkAdd = useCallback(() => {
    setQuestionsForModal(Array.from(selectedQuestions));
    setModalMode('bulk');
    setModalOpen(true);
  }, [selectedQuestions]);

  // Handle modal success
  const handleModalSuccess = useCallback(() => {
    setSelectedQuestions(new Set());
    fetchData();
  }, [fetchData]);

  return (
    <div>
      {/* Page Title */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center mb-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">Keyword Concepts</h1>
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
        icon={<Icon name="FaQuestionCircle" className="w-8 h-8 text-slate-blue" size={32} />}
        topMargin="mt-16"
      >
        <PageCardHeader
          title="People Also Ask questions"
          description="Questions discovered in Google's PAA boxes during rank checks. Track which questions you answer and identify content opportunities."
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-slate-blue rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Loading PAA questions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.questions.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Icon name="FaQuestionCircle" className="w-8 h-8 text-slate-blue" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No PAA questions discovered yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Run rank checks on your keywords to discover People Also Ask questions in Google search results.
            </p>
            <Link
              href="/dashboard/keywords/rank-tracking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-medium"
            >
              <Icon name="FaChartLine" className="w-4 h-4" />
              Go to rank tracking
            </Link>
          </div>
        )}

        {/* Data Display */}
        {!isLoading && !error && data && data.questions.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {data.summary.totalUniqueQuestions}
                </div>
                <div className="text-sm text-gray-600">Unique questions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-800">
                  {data.summary.totalChecksWithPAA}
                </div>
                <div className="text-sm text-gray-600">Checks analyzed</div>
              </div>
              <div className={`p-4 rounded-xl border ${
                data.summary.questionsWeAnswer > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-2xl font-bold ${
                  data.summary.questionsWeAnswer > 0 ? 'text-green-700' : 'text-gray-800'
                }`}>
                  {data.summary.questionsWeAnswer}
                </div>
                <div className="text-sm text-gray-600">Questions we answer</div>
              </div>
              {topQuestion && (
                <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-sm font-medium text-slate-blue truncate" title={topQuestion.question}>
                    {topQuestion.question}
                  </div>
                  <div className="text-sm text-gray-600">
                    Most frequent ({topQuestion.frequency}x)
                  </div>
                </div>
              )}
            </div>

            {/* Filter and Action Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Icon name="FaSearch" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
                  />
                </div>
                {/* Ownership filter */}
                <select
                  value={ownershipFilter}
                  onChange={(e) => setOwnershipFilter(e.target.value as OwnershipFilter)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-blue/50 focus:border-slate-blue/30"
                >
                  <option value="all">All questions</option>
                  <option value="ours">We answer</option>
                  <option value="competitors">Competitors answer</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {isExporting ? (
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon name="FaFileAlt" className="w-4 h-4" />
                )}
                Export CSV
              </button>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500 mb-3">
              Showing {paginatedQuestions.length} of {filteredAndSortedQuestions.length} questions
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-2 w-10">
                      <input
                        type="checkbox"
                        checked={paginatedQuestions.length > 0 && selectedQuestions.size === paginatedQuestions.length}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                        className="w-4 h-4 text-slate-blue rounded focus:ring-slate-blue"
                        aria-label="Select all questions"
                      />
                    </th>
                    <th className="py-3 px-4 text-left">
                      <button
                        onClick={() => handleSort('question')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Question
                        <SortIcon field="question" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleSort('frequency')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Frequency
                        <SortIcon field="frequency" />
                      </button>
                    </th>
                    <th className="py-3 px-3 text-left">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Answer source
                      </span>
                    </th>
                    <th className="py-3 px-3 text-left">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Keywords
                      </span>
                    </th>
                    <th className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleSort('lastSeen')}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 mx-auto"
                      >
                        Last seen
                        <SortIcon field="lastSeen" />
                      </button>
                    </th>
                    <th className="py-3 px-2 text-center w-20">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestions.map((question) => {
                    const isExpanded = expandedQuestion === question.question;
                    const hasOurAnswer = question.ourAnswerCount > 0;

                    return (
                      <React.Fragment key={question.question}>
                        <tr
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            hasOurAnswer ? 'bg-green-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-2">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.has(question.question)}
                              onChange={() => handleToggleSelect(question.question)}
                              className="w-4 h-4 text-slate-blue rounded focus:ring-slate-blue"
                              aria-label={`Select "${question.question}"`}
                            />
                          </td>

                          {/* Question */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2">
                              <span className={`text-sm ${hasOurAnswer ? 'text-green-800' : 'text-gray-900'}`}>
                                {question.question}
                              </span>
                              {hasOurAnswer && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                  You answer
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Frequency */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              question.frequency >= 10
                                ? 'bg-slate-blue/10 text-slate-blue'
                                : question.frequency >= 5
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {question.frequency}x
                            </span>
                          </td>

                          {/* Answer Source */}
                          <td className="py-3 px-3">
                            {question.answeringDomains.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {question.answeringDomains.slice(0, 2).map((d) => (
                                  <span
                                    key={d.domain}
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium truncate max-w-[120px] ${
                                      d.isOurs
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                    title={d.domain}
                                  >
                                    {d.isOurs ? 'You' : d.domain}
                                  </span>
                                ))}
                                {question.answeringDomains.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{question.answeringDomains.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>

                          {/* Keywords */}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {question.triggeringKeywords.slice(0, 2).map((k) => (
                                <span
                                  key={k.keywordId}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 truncate max-w-[100px]"
                                  title={k.phrase}
                                >
                                  {k.phrase}
                                </span>
                              ))}
                              {question.triggeringKeywords.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{question.triggeringKeywords.length - 2}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Last Seen */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(question.lastSeen)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleIndividualAdd(question.question)}
                                className="p-1.5 hover:bg-slate-blue/10 rounded text-slate-blue"
                                aria-label="Create or add to concept"
                                title="Create or add to concept"
                              >
                                <Icon name="FaPlus" className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => toggleRowExpand(question.question)}
                                className="p-1.5 hover:bg-gray-100 rounded"
                                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              >
                                <Icon
                                  name={isExpanded ? 'FaChevronDown' : 'FaChevronRight'}
                                  className="w-3 h-3 text-gray-500"
                                />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="py-4 px-6">
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Answer Sources */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Answer sources ({question.answeringDomains.length})
                                  </h4>
                                  {question.answeringDomains.length > 0 ? (
                                    <ul className="space-y-2">
                                      {question.answeringDomains.map((d) => (
                                        <li key={d.domain} className="text-sm">
                                          <div className="flex items-center gap-2">
                                            <a
                                              href={`https://${d.domain}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`hover:underline ${
                                                d.isOurs ? 'text-green-700 font-medium' : 'text-gray-700'
                                              }`}
                                            >
                                              {d.domain}
                                            </a>
                                            <span className="text-gray-500">({d.count}x)</span>
                                            {d.isOurs && (
                                              <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                                                Your site
                                              </span>
                                            )}
                                          </div>
                                          {d.urls.length > 0 && (
                                            <div className="mt-1 ml-4">
                                              {d.urls.map((url, i) => (
                                                <a
                                                  key={i}
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block text-xs text-blue-600 hover:underline truncate max-w-md"
                                                >
                                                  {url}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-500">No answer sources recorded</p>
                                  )}
                                </div>

                                {/* Triggering Keywords */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Triggered by keywords ({question.triggeringKeywords.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {question.triggeringKeywords.map((k) => (
                                      <Link
                                        key={k.keywordId}
                                        href={`/dashboard/keywords?highlight=${k.keywordId}`}
                                        className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
                                      >
                                        {k.phrase}
                                      </Link>
                                    ))}
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span>First seen: {formatRelativeTime(question.firstSeen)}</span>
                                      <span>Last seen: {formatRelativeTime(question.lastSeen)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAndSortedQuestions.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => {
                    startTransition(() => {
                      setCurrentPage(page);
                    });
                  }}
                />
              </div>
            )}
          </>
        )}
      </PageCard>

      {/* Bulk Action Bar */}
      {selectedQuestions.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-blue text-white py-3 px-4 shadow-lg z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-white/80 hover:text-white underline"
              >
                Select all on page
              </button>
              <button
                onClick={handleDeselectAll}
                className="text-sm text-white/80 hover:text-white underline"
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleBulkAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-blue rounded-lg font-medium text-sm hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              <Icon name="FaPlus" className="w-4 h-4" />
              Create concepts
            </button>
          </div>
        </div>
      )}

      {/* Add to Concept Modal */}
      <AddPAAToConceptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        questions={questionsForModal}
        mode={modalMode}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
