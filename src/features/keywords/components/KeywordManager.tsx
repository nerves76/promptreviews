'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Icon from '@/components/Icon';
import Link from 'next/link';
import KeywordConceptInput from './KeywordConceptInput';
import { KeywordDetailsSidebar } from './KeywordDetailsSidebar';
import ConceptCard from './ConceptCard';
import { useKeywords, useKeywordDetails } from '../hooks/useKeywords';

import { type KeywordData, type KeywordGroupData, type ResearchResultData, type RelatedQuestion, DEFAULT_GROUP_NAME } from '../keywordUtils';
import { apiClient } from '@/utils/apiClient';
import { BulkActionBar } from './BulkActionBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { useBusinessData } from '@/auth/hooks/granularAuthHooks';
import { validateBusinessForKeywordGeneration } from '@/utils/businessValidation';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon, DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Types for enrichment data from batch-enrich API
interface RankingData {
  groupId: string;
  groupName: string;
  device: string;
  location: string;
  locationCode: number;
  isEnabled: boolean;
  latestCheck: {
    position: number | null;
    foundUrl: string | null;
    checkedAt: string;
    searchQuery: string;
    positionChange: number | null;
  } | null;
}

interface RankStatusData {
  isTracked: boolean;
  rankings: RankingData[];
}

interface LLMVisibilityResult {
  question: string;
  llmProvider: string;
  domainCited: boolean;
  citationPosition: number | null;
  checkedAt: string;
}

/**
 * Discovered question from SERP (People Also Ask)
 */
interface DiscoveredQuestion {
  question: string;
  answerDomain: string | null;
  isOurs: boolean;
}

export interface GeoGridSummary {
  averagePosition: number | null;
  bestPosition: number | null;
  pointsInTop3: number;
  pointsInTop10: number;
  pointsInTop20: number;
  pointsNotFound: number;
  totalPoints: number;
}

// Per-search-term geo grid data
export interface GeoGridSearchTermData {
  searchQuery: string;
  summary: GeoGridSummary;
  lastCheckedAt: string | null;
}

export interface GeoGridStatusData {
  isTracked: boolean;
  configId: string | null;
  locationName: string | null;
  lastCheckedAt: string | null;
  /** Overall summary across all search terms */
  summary: GeoGridSummary | null;
  /** Per-search-term geo grid results */
  searchTerms?: GeoGridSearchTermData[];
}

export interface ScheduleStatusData {
  isScheduled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | null;
  isEnabled: boolean;
  nextScheduledAt: string | null;
}

export interface EnrichmentData {
  volumeData: ResearchResultData[];
  rankStatus: RankStatusData | null;
  llmResults: LLMVisibilityResult[];
  geoGridStatus: GeoGridStatusData | null;
  discoveredQuestions?: DiscoveredQuestion[];
  scheduleStatus?: ScheduleStatusData | null;
}

interface KeywordManagerProps {
  /** Optional prompt page ID to filter keywords */
  promptPageId?: string;
  /** Whether to show in compact mode (for embedding in other UIs) */
  compact?: boolean;
  /** Callback when keyword selection changes (for prompt page editor) */
  onSelectionChange?: (selectedKeywordIds: string[]) => void;
  /** Initially selected keyword IDs */
  selectedKeywordIds?: string[];
  /** Business info for AI enrichment context */
  businessName?: string;
  businessCity?: string;
  businessState?: string;
  /** Callback when user wants to check rank for a search term */
  onCheckRank?: (keyword: string, conceptId: string) => void;
  /** Callback when user wants to check LLM visibility for a question */
  onCheckLLMVisibility?: (question: string, conceptId: string) => void;
  /** Key that triggers enrichment data refresh when changed */
  enrichmentRefreshKey?: number;
}

/**
 * KeywordManager Component
 *
 * Full-featured keyword management UI with:
 * - Group accordion view
 * - Add keyword input
 * - Create/edit/delete groups
 * - Keyword details panel
 * - Search/filter
 * - Usage statistics
 */
export default function KeywordManager({
  promptPageId,
  compact = false,
  onSelectionChange,
  selectedKeywordIds = [],
  businessName,
  businessCity,
  businessState,
  onCheckRank,
  onCheckLLMVisibility,
  enrichmentRefreshKey,
}: KeywordManagerProps) {
  const {
    keywords,
    groups,
    ungroupedCount,
    isLoading,
    error,
    refresh,
    createKeyword,
    createEnrichedKeyword,
    updateKeyword,
    deleteKeyword,
    createGroup,
    updateGroup,
    deleteGroup,
    promptPageUsage,
  } = useKeywords({ includeUsage: true });

  // Get business data for AI generation
  const { business } = useBusinessData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<KeywordGroupData | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // null = All groups

  // Multi-select state for bulk operations
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // AI Generation state
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(false);
  const [showMissingFieldsError, setShowMissingFieldsError] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState<{ conceptName: string; searchTerms: string[]; reviewPhrase: string; relatedQuestions: any[] }[]>([]);
  const [selectedGeneratedKeywords, setSelectedGeneratedKeywords] = useState<Set<number>>(new Set());
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Looked-up location from business address (if location_code not set)
  const [lookedUpLocation, setLookedUpLocation] = useState<{
    locationCode: number;
    locationName: string;
  } | null>(null);

  // Look up location from business address if no location_code is set
  // Use props if provided, otherwise fall back to business object from hook
  const effectiveCity = businessCity || business?.address_city;
  const effectiveState = businessState || business?.address_state;

  useEffect(() => {
    if (business?.location_code) {
      // Business already has location_code set
      setLookedUpLocation(null);
      return;
    }
    if (!effectiveCity) {
      setLookedUpLocation(null);
      return;
    }

    const lookupLocation = async () => {
      try {
        const searchQuery = effectiveState
          ? `${effectiveCity}, ${effectiveState}`
          : effectiveCity;

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
  }, [business?.location_code, effectiveCity, effectiveState]);

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    keywordsCreated?: number;
    duplicatesSkipped?: number;
    skippedPhrases?: string[];
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addKeywordFormRef = useRef<HTMLDivElement>(null);

  // Fetch details for selected keyword
  const { keyword: selectedKeyword, promptPages, recentReviews, refresh: refreshKeywordDetails } = useKeywordDetails(selectedKeywordId);

  // Enrichment data state (batch fetched for all keywords)
  const [enrichmentData, setEnrichmentData] = useState<Map<string, EnrichmentData>>(new Map());
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

  // Fetch enrichment data for all keywords
  const fetchEnrichmentData = useCallback(async (keywordIds: string[]) => {
    if (keywordIds.length === 0) return;

    setIsLoadingEnrichment(true);
    setEnrichmentError(null);

    try {
      const response = await apiClient.post<{ enrichment: Record<string, EnrichmentData> }>(
        '/keywords/batch-enrich',
        { keywordIds }
      );

      setEnrichmentData(new Map(Object.entries(response.enrichment)));
    } catch (err: any) {
      console.error('Failed to fetch enrichment data:', err);
      setEnrichmentError(err?.message || 'Failed to load enrichment data');
    } finally {
      setIsLoadingEnrichment(false);
    }
  }, []);

  // Fetch enrichment when keywords change or refresh is triggered
  useEffect(() => {
    if (keywords.length > 0) {
      const keywordIds = keywords.map(k => k.id);
      fetchEnrichmentData(keywordIds);
    }
  }, [keywords.length, enrichmentRefreshKey]); // Refetch when keyword count changes or refresh triggered

  // Refetch enrichment data when page becomes visible (user navigates back)
  // This ensures data is fresh after running checks on other pages
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && keywords.length > 0) {
        const keywordIds = keywords.map(k => k.id);
        fetchEnrichmentData(keywordIds);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [keywords, fetchEnrichmentData]);

  // Manual refresh handler
  const handleRefreshEnrichment = useCallback(() => {
    if (keywords.length > 0) {
      const keywordIds = keywords.map(k => k.id);
      fetchEnrichmentData(keywordIds);
    }
  }, [keywords, fetchEnrichmentData]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger keyboard shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape to work in inputs/textareas
        if (e.key !== 'Escape') {
          return;
        }
      }

      // Escape - close sidebar, clear selection, exit edit mode
      if (e.key === 'Escape') {
        setSelectedKeywordId(null);
        // If in selection mode (has onSelectionChange), clear selection
        if (onSelectionChange) {
          onSelectionChange([]);
        }
      }

      // Cmd+N or Ctrl+N - focus the add keyword input
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // Scroll to and focus the add keyword form
        addKeywordFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Focus the first input in the form
        const firstInput = addKeywordFormRef.current?.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }

      // Cmd+A or Ctrl+A - select all keywords (only in selection mode)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && onSelectionChange) {
        e.preventDefault();
        // Select all currently filtered keywords
        const allKeywordIds = keywords.filter(k => {
          // Apply search filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
              k.phrase.toLowerCase().includes(query) ||
              k.groupName?.toLowerCase().includes(query) ||
              k.reviewPhrase?.toLowerCase().includes(query) ||
              k.aliases?.some((a) => a.toLowerCase().includes(query)) ||
              k.searchTerms?.some((t) => t.term.toLowerCase().includes(query)) ||
              k.relatedQuestions?.some((r) => r.question.toLowerCase().includes(query))
            );
          }
          return true;
        }).map(k => k.id);
        onSelectionChange(allKeywordIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedKeywordId, onSelectionChange, keywords, searchQuery]);

  // Filter keywords by search query
  const filteredKeywords = useMemo(() => {
    let result = keywords;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (kw) =>
          kw.phrase.toLowerCase().includes(query) ||
          kw.groupName?.toLowerCase().includes(query) ||
          kw.reviewPhrase?.toLowerCase().includes(query) ||
          kw.aliases?.some((a) => a.toLowerCase().includes(query)) ||
          kw.searchTerms?.some((t) => t.term.toLowerCase().includes(query)) ||
          kw.relatedQuestions?.some((r) => r.question.toLowerCase().includes(query))
      );
    }

    return result;
  }, [keywords, searchQuery]);

  // Filter keywords by selected group (for Concepts view)
  const groupFilteredKeywords = useMemo(() => {
    if (selectedGroupId === null) return filteredKeywords; // All groups
    return filteredKeywords.filter((kw) => kw.groupId === selectedGroupId);
  }, [filteredKeywords, selectedGroupId]);

  // Handle adding AI-enriched keyword
  const handleAddEnrichedKeyword = useCallback(
    async (keyword: {
      phrase: string;
      review_phrase: string;
      search_terms: { term: string; isCanonical: boolean; addedAt: string }[];
      aliases: string[];
      location_scope: string | null;
      related_questions: RelatedQuestion[];
      ai_generated: boolean;
      search_volume_location_code: number | null;
      search_volume_location_name: string | null;
    }) => {
      await createEnrichedKeyword({
        ...keyword,
        promptPageId,
      });
    },
    [createEnrichedKeyword, promptPageId]
  );

  // Handle creating new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    await createGroup(newGroupName.trim());
    setNewGroupName('');
    setShowNewGroupModal(false);
  };

  // Handle updating group
  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    await updateGroup(editingGroup.id, { name: newGroupName.trim() });
    setNewGroupName('');
    setEditingGroup(null);
  };

  // Handle deleting group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this group? Keywords will be moved to "General".')) return;
    await deleteGroup(groupId);
  };

  // Handle group drag-and-drop reordering
  const handleGroupDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Don't allow reordering if dropped in same position
    if (result.source.index === result.destination.index) return;

    // Get draggable groups (exclude "General" which should always be first)
    const draggableGroups = groups.filter(g => g.name !== DEFAULT_GROUP_NAME);

    // Reorder the groups
    const reordered = Array.from(draggableGroups);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Calculate new display orders
    const updates = reordered.map((g, i) => ({ id: g.id, displayOrder: i + 1 }));

    try {
      // Optimistically update local state
      // Note: The useKeywords hook will refetch and update automatically

      // Persist the changes
      await apiClient.patch('/keyword-groups/reorder', { updates });

      // Refresh to get updated order
      await refresh();
    } catch (error) {
      console.error('Failed to reorder groups:', error);
      // On error, refresh to revert to server state
      await refresh();
    }
  };

  // Handle keyword click
  const handleKeywordClick = (keyword: KeywordData) => {
    if (onSelectionChange) {
      // Toggle selection mode
      const isSelected = selectedKeywordIds.includes(keyword.id);
      const newSelection = isSelected
        ? selectedKeywordIds.filter((id) => id !== keyword.id)
        : [...selectedKeywordIds, keyword.id];
      onSelectionChange(newSelection);
    } else {
      // Details view mode
      setSelectedKeywordId(keyword.id);
    }
  };

  // Handle keyword remove
  const handleKeywordRemove = async (keywordId: string) => {
    if (!confirm('Delete this keyword permanently?')) return;
    await deleteKeyword(keywordId);
  };

  // === Bulk Operations Handlers ===

  // Handle toggling individual selection
  const handleToggleSelection = useCallback((keywordId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keywordId)) {
        newSet.delete(keywordId);
      } else {
        newSet.add(keywordId);
      }
      return newSet;
    });
  }, []);

  // Handle select all (within current group filter)
  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(groupFilteredKeywords.map((kw) => kw.id)));
  }, [groupFilteredKeywords]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Handle bulk move to group
  const handleBulkMoveToGroup = useCallback(async (groupId: string) => {
    const selectedKeywords = Array.from(selectedIds);
    for (const keywordId of selectedKeywords) {
      await updateKeyword(keywordId, { groupId });
    }
    setSelectedIds(new Set());
    await refresh();
  }, [selectedIds, updateKeyword, refresh]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    setIsBulkDeleting(true);
    const selectedKeywords = Array.from(selectedIds);
    for (const keywordId of selectedKeywords) {
      await deleteKeyword(keywordId);
    }
    setIsBulkDeleting(false);
    setShowBulkDeleteModal(false);
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    await refresh();
  }, [selectedIds, deleteKeyword, refresh]);

  // Handle bulk export (selected keywords only)
  const handleBulkExport = useCallback(async () => {
    try {
      const selectedKeywords = keywords.filter((kw) => selectedIds.has(kw.id));

      // Create CSV content
      const headers = ['phrase', 'review_phrase', 'search_terms', 'group', 'aliases', 'location_scope'];
      const rows = selectedKeywords.map((kw) => [
        kw.phrase,
        kw.reviewPhrase || '',
        kw.searchTerms?.map((st) => st.term).join('|') || '',
        kw.groupName || '',
        kw.aliases?.join(', ') || '',
        kw.locationScope || '',
      ]);

      const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('|')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keywords-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export keywords. Please try again.');
    }
  }, [keywords, selectedIds]);

  // Get selected keywords for delete modal
  const selectedKeywordsForDelete = useMemo(
    () => keywords.filter((kw) => selectedIds.has(kw.id)),
    [keywords, selectedIds]
  );

  // AI Generation handlers
  const normalizeBusinessInfo = () => {
    if (!business) return null;

    let normalizedServices: string[] = [];
    if (Array.isArray(business.services_offered)) {
      normalizedServices = business.services_offered.filter(
        (service: unknown) => typeof service === 'string' && (service as string).trim() !== ''
      );
    } else if (typeof business.services_offered === 'string') {
      normalizedServices = (business.services_offered as string)
        .split(',')
        .map((service: string) => service.trim())
        .filter(Boolean);
    }

    return {
      name: business.name || '',
      industry: Array.isArray(business.industry)
        ? business.industry.filter(Boolean)
        : business.industry
          ? [business.industry].filter(Boolean)
          : [],
      industries_other: business.industries_other || business.industry_other || '',
      address_city: business.address_city || '',
      address_state: business.address_state || '',
      about_us: business.about_us || '',
      differentiators: business.differentiators || '',
      years_in_business:
        business.years_in_business !== undefined && business.years_in_business !== null
          ? String(business.years_in_business)
          : '',
      services_offered: normalizedServices,
      industries_served: business.industries_served || '',
    };
  };

  const handleGenerateClick = async () => {
    if (!business) {
      setMissingFields([
        'Business Name',
        'Business Type/Industry',
        'City',
        'State',
        'About Us',
        'Differentiators',
        'Services Offered',
      ]);
      setShowMissingFieldsError(true);
      return;
    }

    if (business.name === 'Your Business' || !business.name) {
      setMissingFields(['Business Name']);
      setShowMissingFieldsError(true);
      return;
    }

    const normalized = normalizeBusinessInfo();
    if (!normalized) {
      setMissingFields([
        'Business Name',
        'Business Type/Industry',
        'City',
        'State',
        'About Us',
        'Differentiators',
        'Services Offered',
      ]);
      setShowMissingFieldsError(true);
      return;
    }

    const validation = validateBusinessForKeywordGeneration(normalized);
    if (!validation.isValid) {
      setMissingFields(validation.missingFields);
      setShowMissingFieldsError(true);
      return;
    }

    // Show the panel and start generating
    setShowGeneratorPanel(true);
    setIsGenerating(true);
    setGeneratorError(null);
    setGeneratedKeywords([]);
    setSelectedGeneratedKeywords(new Set());

    try {
      const data = await apiClient.post<{
        keywords?: {
          conceptName: string;
          searchTerms: string[];
          reviewPhrase: string;
          relatedQuestions?: { question: string; funnelStage: 'top' | 'middle' | 'bottom'; addedAt: string }[];
        }[];
        usage?: { current: number; limit: number; remaining: number };
      }>('/ai/generate-keywords', {
        businessName: normalized.name || '',
        businessType: normalized.industry?.[0] || normalized.industries_other || '',
        city: normalized.address_city || '',
        state: normalized.address_state || '',
        aboutUs: normalized.about_us || '',
        differentiators: normalized.differentiators || '',
        yearsInBusiness: normalized.years_in_business || '0',
        servicesOffered: Array.isArray(normalized.services_offered) ? normalized.services_offered.join(', ') : '',
        industriesServed: normalized.industries_served,
      });

      // Normalize keywords to ensure searchTerms is always an array
      const normalizedKeywords = (data.keywords || []).map((kw: any) => ({
        conceptName: kw.conceptName || kw.searchTerms?.[0] || kw.reviewPhrase || 'Untitled',
        searchTerms: Array.isArray(kw.searchTerms)
          ? kw.searchTerms
          : kw.searchTerm
            ? [kw.searchTerm]
            : [],
        reviewPhrase: kw.reviewPhrase || '',
        relatedQuestions: Array.isArray(kw.relatedQuestions) ? kw.relatedQuestions : [],
      }));

      setGeneratedKeywords(normalizedKeywords);
      setUsageInfo(data.usage || null);
      // Auto-select all keywords
      const allIndices = new Set<number>(normalizedKeywords.map((_: any, index: number) => index));
      setSelectedGeneratedKeywords(allIndices);
    } catch (err: any) {
      console.error('Error generating keywords:', err);
      setGeneratorError(err?.message || err?.error || 'An error occurred while generating keywords');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGeneratedKeyword = (index: number) => {
    const newSelected = new Set(selectedGeneratedKeywords);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedGeneratedKeywords(newSelected);
  };

  const toggleAllGeneratedKeywords = () => {
    if (selectedGeneratedKeywords.size === generatedKeywords.length) {
      setSelectedGeneratedKeywords(new Set());
    } else {
      setSelectedGeneratedKeywords(new Set(generatedKeywords.map((_, index) => index)));
    }
  };

  const handleAddGeneratedKeywords = async () => {
    const selectedPhrases = Array.from(selectedGeneratedKeywords).map(
      (index) => generatedKeywords[index]
    ).filter(Boolean);

    if (selectedPhrases.length === 0) {
      return;
    }

    // Close the panel for better UX
    setShowGeneratorPanel(false);

    // Add each keyword to the library with enriched data
    const now = new Date().toISOString();
    for (const kw of selectedPhrases) {
      // Convert searchTerms array to search_terms format (first one is canonical)
      const searchTermsFormatted = kw.searchTerms.map((term, index) => ({
        term,
        isCanonical: index === 0,
        addedAt: now,
      }));

      // Use conceptName from AI generation, apply business location or looked-up location
      const locationCode = business?.location_code ?? lookedUpLocation?.locationCode ?? null;
      const locationName = business?.location_name ?? lookedUpLocation?.locationName ?? null;

      await createEnrichedKeyword({
        phrase: kw.conceptName,
        review_phrase: kw.reviewPhrase,
        search_terms: searchTermsFormatted,
        aliases: [],
        location_scope: null,
        related_questions: kw.relatedQuestions || [],
        ai_generated: true,
        search_volume_location_code: locationCode,
        search_volume_location_name: locationName,
      });
    }

    // Clear state
    setGeneratedKeywords([]);
    setSelectedGeneratedKeywords(new Set());

    // Refresh to show the new keywords
    await refresh();
  };

  const handleCloseGenerator = () => {
    setShowGeneratorPanel(false);
    setGeneratedKeywords([]);
    setSelectedGeneratedKeywords(new Set());
    setGeneratorError(null);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/keywords/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `concepts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export keywords. Please try again.');
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/keywords/upload', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'concepts-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .slice(0, 6); // Header + 5 rows

      const rows = lines.map(line => {
        const result: string[] = [];
        let inQuotes = false;
        let current = '';

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      setImportPreview(rows);
    };
    reader.readAsText(file);
  };

  // Handle import submit
  const handleImportSubmit = async () => {
    if (!importFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('/api/keywords/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'X-Selected-Account': localStorage.getItem('selectedAccountId') || '',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || 'Import successful',
          keywordsCreated: result.keywordsCreated,
          duplicatesSkipped: result.duplicatesSkipped,
          errors: result.errors,
        });
        refresh(); // Refresh the keyword list
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
          errors: result.errors,
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import modal
  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="FaSpinner" className="w-6 h-6 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading keywords...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <Icon name="FaExclamationTriangle" className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {!compact && (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-blue">Keyword Concepts Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize concepts for SEO rank tracking, review keyword matching, and AI visibility monitoring.
            </p>
          </div>
          {/* Action buttons - top right */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshEnrichment}
              disabled={isLoadingEnrichment}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              title="Refresh volume and ranking data"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoadingEnrichment ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center gap-2"
            >
              <Icon name="FaPlus" className="w-4 h-4" />
              <span>Group</span>
            </button>
          </div>
        </div>
      )}

      {/* Missing Business Info Error Banner */}
      {showMissingFieldsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="FaInfoCircle" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-2">Complete your business profile</h4>
              <p className="text-sm text-red-800 mb-3">
                To use the AI keyword generator, please complete the following business information:
              </p>
              <ul className="space-y-1 mb-3">
                {missingFields.map((field, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold text-lg flex-shrink-0">×</span>
                    <span className="text-sm text-red-800">{field}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/business-profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Icon name="FaStore" className="w-3.5 h-3.5" />
                  Go to business profile
                </Link>
                <button
                  type="button"
                  onClick={() => setShowMissingFieldsError(false)}
                  className="text-sm text-red-700 hover:text-red-900 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Keyword Generator Panel */}
      {showGeneratorPanel && (
        <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden">
          {/* Panel Header */}
          <div className="bg-slate-blue px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon name="prompty" className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI concept generator</h4>
                <p className="text-xs text-white/80">Generate concepts with search terms, review phrases, and AI visibility questions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseGenerator}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close generator"
            >
              <Icon name="FaTimes" className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="p-4">
            {/* Error State */}
            {generatorError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="FaInfoCircle" className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700">{generatorError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && generatedKeywords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Icon name="FaSpinner" className="w-8 h-8 text-slate-blue animate-spin mb-3" />
                <p className="text-gray-700 font-medium">Generating concepts...</p>
                <p className="text-gray-500 text-sm mt-1">
                  Creating 10 concepts with search terms, review phrases, and AI visibility questions
                </p>
              </div>
            )}

            {/* Generated Concepts Table */}
            {generatedKeywords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Generated concepts ({selectedGeneratedKeywords.size} selected)
                  </h5>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={selectedGeneratedKeywords.size === generatedKeywords.length}
                              onChange={toggleAllGeneratedKeywords}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left">
                            <div className="text-xs font-bold text-gray-900">Concept name</div>
                            <div className="text-xs font-normal text-gray-500">Added to library</div>
                          </th>
                          <th className="px-3 py-2 text-left">
                            <div className="text-xs font-bold text-gray-900">Search terms</div>
                            <div className="text-xs font-normal text-gray-500">3 variations</div>
                          </th>
                          <th className="px-3 py-2 text-left">
                            <div className="text-xs font-bold text-gray-900">Review phrase</div>
                            <div className="text-xs font-normal text-gray-500">For prompts</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {generatedKeywords.map((kw, index) => (
                          <tr
                            key={index}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedGeneratedKeywords.has(index) ? 'bg-indigo-50' : ''
                            }`}
                            onClick={() => toggleGeneratedKeyword(index)}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedGeneratedKeywords.has(index)}
                                onChange={() => toggleGeneratedKeyword(index)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{kw.conceptName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="flex flex-wrap gap-1">
                                {kw.searchTerms.map((term, i) => (
                                  <span
                                    key={i}
                                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                                      i === 0
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {term}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600 italic">{kw.reviewPhrase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGenerateClick}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Regenerate</span>
                      )}
                    </button>
                    {usageInfo && (
                      <span className="text-xs text-gray-500">
                        {usageInfo.current}/{usageInfo.limit} this month
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGeneratedKeywords}
                    disabled={selectedGeneratedKeywords.size === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add {selectedGeneratedKeywords.size} keyword{selectedGeneratedKeywords.size !== 1 ? 's' : ''} to library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Concept Section */}
      <div ref={addKeywordFormRef} className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Add concept</h3>
            <p className="text-sm text-gray-500">Each concept includes search terms for rank tracking, review phrases, and questions for AI visibility.</p>
          </div>
          <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="px-3 py-1.5 text-sm font-medium text-slate-blue bg-white border border-slate-blue rounded-md hover:bg-slate-blue/5 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="prompty" className="w-4 h-4" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate 10 concepts'}</span>
          </button>
        </div>
        <KeywordConceptInput
          onKeywordAdded={handleAddEnrichedKeyword}
          businessName={businessName}
          businessCity={businessCity}
          businessState={businessState}
          businessLocationCode={business?.location_code}
          businessLocationName={business?.location_name}
        />
      </div>

      {/* Group tabs and search header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Group tabs */}
        <DragDropContext onDragEnd={handleGroupDragEnd}>
          <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
            {/* "All" tab - not draggable */}
            <button
              onClick={() => setSelectedGroupId(null)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedGroupId === null
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({filteredKeywords.length})
            </button>

            {/* Sort groups: "General" first (not draggable), then custom groups (draggable) */}
            {(() => {
              const sortedGroups = groups.sort((a, b) => {
                if (a.name === DEFAULT_GROUP_NAME) return -1;
                if (b.name === DEFAULT_GROUP_NAME) return 1;
                return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
              });

              const generalGroup = sortedGroups.find(g => g.name === DEFAULT_GROUP_NAME);
              const customGroups = sortedGroups.filter(g => g.name !== DEFAULT_GROUP_NAME);

              return (
                <>
                  {/* General group - not draggable */}
                  {generalGroup && (
                    <button
                      key={generalGroup.id}
                      onClick={() => setSelectedGroupId(generalGroup.id)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                        selectedGroupId === generalGroup.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {generalGroup.name} ({filteredKeywords.filter((kw) => kw.groupId === generalGroup.id).length})
                    </button>
                  )}

                  {/* Custom groups - draggable */}
                  {customGroups.length > 0 && (
                    <Droppable droppableId="group-tabs" direction="horizontal">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex items-center gap-2"
                        >
                          {customGroups.map((group, index) => {
                            const count = filteredKeywords.filter((kw) => kw.groupId === group.id).length;
                            return (
                              <Draggable key={group.id} draggableId={group.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="relative group"
                                  >
                                    <button
                                      onClick={() => setSelectedGroupId(group.id)}
                                      className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                                        selectedGroupId === group.id
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      } ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
                                    >
                                      <span
                                        {...provided.dragHandleProps}
                                        className="opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                        title="Drag to reorder"
                                      >
                                        <Icon name="FaBars" size={12} />
                                      </span>
                                      {group.name} ({count})
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </>
              );
            })()}
          </div>
        </DragDropContext>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <Icon
            name="FaSearch"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-32 pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-slate-blue focus:border-transparent focus:w-48 transition-all"
          />
        </div>
      </div>

      {/* Concepts view */}
      <div className="space-y-4">
          {/* Concept cards */}
          {groupFilteredKeywords.length > 0 ? (
            groupFilteredKeywords.map((keyword) => (
              <div key={keyword.id} className="relative flex items-start gap-3">
                {/* Selection checkbox (only in selection mode) */}
                {isSelectionMode && (
                  <div className="flex-shrink-0 pt-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(keyword.id)}
                      onChange={() => handleToggleSelection(keyword.id)}
                      className="w-5 h-5 text-slate-blue rounded border-gray-300 focus:ring-slate-blue cursor-pointer"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <ConceptCard
                    keyword={keyword}
                    onOpenDetails={handleKeywordClick}
                    onUpdate={updateKeyword}
                    onCheckRank={onCheckRank}
                    onCheckLLMVisibility={onCheckLLMVisibility}
                    promptPageNames={promptPageUsage[keyword.id] || []}
                    enrichedData={enrichmentData.get(keyword.id)}
                    isLoadingEnrichment={isLoadingEnrichment}
                    businessLocationCode={business?.location_code ?? lookedUpLocation?.locationCode}
                    businessLocationName={business?.location_name ?? lookedUpLocation?.locationName}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon name="FaSearch" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No keywords match your search</p>
            </div>
          )}
      </div>

      {/* Empty state */}
      {keywords.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="FaTags" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No keywords yet</p>
          <p className="text-sm mt-1">Add keywords to start tracking their usage in reviews.</p>
        </div>
      )}

      {/* New/Edit Group Modal */}
      {(showNewGroupModal || editingGroup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingGroup ? 'Edit Group' : 'Create New Group'}
            </h3>
            <div className="mb-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group name..."
                maxLength={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingGroup ? handleUpdateGroup() : handleCreateGroup();
                  }
                }}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {newGroupName.length}/30
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewGroupModal(false);
                  setEditingGroup(null);
                  setNewGroupName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {editingGroup ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Import concepts</h3>
              <button onClick={resetImportModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template download */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Download Template</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with all available fields and example data.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {/* File upload */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Upload CSV File</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-slate-blue file:text-white
                    hover:file:bg-slate-blue/90
                    file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {importPreview[0]?.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {header || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {importPreview.slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.success ? 'Import Complete' : 'Import Failed'}
                  </h4>
                  <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {importResult.message}
                  </p>
                  {importResult.success && (
                    <div className="mt-2 text-sm text-green-700">
                      <p>{importResult.keywordsCreated} keywords created</p>
                      {importResult.duplicatesSkipped ? (
                        <p>{importResult.duplicatesSkipped} duplicates skipped</p>
                      ) : null}
                      {importResult.skippedPhrases && importResult.skippedPhrases.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-amber-600 hover:text-amber-700">
                            View {importResult.duplicatesSkipped} skipped duplicates
                          </summary>
                          <ul className="mt-1 text-xs text-gray-600 max-h-32 overflow-y-auto pl-4">
                            {importResult.skippedPhrases.map((phrase, i) => (
                              <li key={i} className="list-disc">{phrase}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">Warnings/Errors:</p>
                      <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>...and {importResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={resetImportModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {importResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!importResult?.success && (
                <button
                  onClick={handleImportSubmit}
                  disabled={!importFile || isImporting}
                  className="px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isImporting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Import Keywords'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyword Details Sidebar */}
      {!onSelectionChange && (
        <KeywordDetailsSidebar
          isOpen={!!selectedKeyword}
          keyword={selectedKeyword}
          promptPages={promptPages}
          recentReviews={recentReviews}
          groups={groups}
          showGroupSelector={true}
          onClose={() => setSelectedKeywordId(null)}
          onUpdate={updateKeyword}
          onRefresh={refreshKeywordDetails}
          onCheckRank={onCheckRank}
        />
      )}

      {/* Bulk Action Bar (fixed bottom) */}
      {isSelectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={groupFilteredKeywords.length}
          groups={groups}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onMoveToGroup={handleBulkMoveToGroup}
          onDelete={() => setShowBulkDeleteModal(true)}
          onExport={handleBulkExport}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        keywords={selectedKeywordsForDelete}
        onConfirm={handleBulkDelete}
        onClose={() => setShowBulkDeleteModal(false)}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
