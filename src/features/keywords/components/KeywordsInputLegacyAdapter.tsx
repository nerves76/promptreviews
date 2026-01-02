'use client';

import { useState, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import Icon from '@/components/Icon';
import KeywordChip from './KeywordChip';
import { useKeywords } from '../hooks/useKeywords';
import { validateBusinessForKeywordGeneration } from '@/utils/businessValidation';
import Link from 'next/link';
import { apiClient } from '@/utils/apiClient';

interface KeywordsInputLegacyAdapterProps {
  /** Keywords as string array (legacy format) */
  keywords: string[];
  /** Callback when keywords change (legacy format) */
  onChange: (keywords: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum keywords allowed */
  maxKeywords?: number;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Business information for keyword generation */
  businessInfo?: {
    name?: string;
    industry?: string[] | null;
    industries_other?: string;
    industry_other?: string;
    address_city?: string;
    address_state?: string;
    accountId?: string;
    about_us?: string;
    differentiators?: string;
    years_in_business?: string | null;
    services_offered?: string | string[] | null;
    industries_served?: string;
  };
  /** Optional prompt page ID for linking keywords */
  promptPageId?: string;
  /** Callback when a keyword chip is clicked (for showing details) */
  onKeywordClick?: (phrase: string) => void;
}

/**
 * KeywordsInputLegacyAdapter Component
 *
 * A bridge component that provides the same interface as the old KeywordsInput
 * but uses the unified keyword system under the hood.
 *
 * Features:
 * - Same props interface as old KeywordsInput (keywords: string[], onChange: (string[]) => void)
 * - Automatically syncs string keywords to/from the unified keyword system
 * - Includes AI keyword generation capability
 * - Shows usage indicators for long-tail keywords (4+ words)
 * - Preserves keyword library picker functionality
 *
 * Use this component during migration. Once all forms are updated to use
 * keyword IDs directly, switch to UnifiedKeywordsInput.
 */
export default function KeywordsInputLegacyAdapter({
  keywords,
  onChange,
  placeholder = 'Enter keywords separated by commas...',
  maxKeywords,
  disabled = false,
  businessInfo,
  promptPageId,
  onKeywordClick,
}: KeywordsInputLegacyAdapterProps) {
  const { keywords: allKeywords, isLoading, createKeyword, refresh } = useKeywords();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const libraryRef = useRef<HTMLDivElement>(null);

  // AI Generation state
  const [showGeneratorPanel, setShowGeneratorPanel] = useState(false);
  const [showMissingFieldsError, setShowMissingFieldsError] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState<{ searchTerm: string; reviewPhrase: string }[]>([]);
  const [selectedGeneratedKeywords, setSelectedGeneratedKeywords] = useState<Set<number>>(new Set());
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number; remaining: number } | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  // Ensure keywords is always a clean array
  const cleanKeywords = Array.isArray(keywords)
    ? keywords.filter((k) => typeof k === 'string' && k.trim() !== '')
    : [];

  // Map string keywords to unified keyword data (for usage indicators)
  const keywordDataMap = useMemo(() => {
    const map = new Map<string, typeof allKeywords[0]>();
    for (const kw of allKeywords) {
      map.set(kw.phrase.toLowerCase(), kw);
    }
    return map;
  }, [allKeywords]);

  // Get enriched keyword data for display
  const enrichedKeywords = useMemo(() => {
    return cleanKeywords.map((phrase) => {
      const unified = keywordDataMap.get(phrase.toLowerCase());
      return {
        phrase,
        id: unified?.id,
        wordCount: unified?.wordCount || phrase.split(/\s+/).length,
        reviewUsageCount: unified?.reviewUsageCount || 0,
        showUsageIndicator: unified?.showUsageIndicator || false,
        usageColor: unified?.usageColor || 'gray',
      };
    });
  }, [cleanKeywords, keywordDataMap]);

  // Available keywords from library (not already selected)
  const availableKeywords = useMemo(() => {
    const selectedPhrases = new Set(cleanKeywords.map((k) => k.toLowerCase()));
    let filtered = allKeywords.filter((kw) => !selectedPhrases.has(kw.phrase.toLowerCase()));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((kw) => kw.phrase.toLowerCase().includes(query));
    }
    return filtered;
  }, [allKeywords, cleanKeywords, searchQuery]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeywordsFromInput();
    } else if (e.key === 'Backspace' && inputValue === '' && cleanKeywords.length > 0) {
      removeKeyword(cleanKeywords.length - 1);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addKeywordsFromInput();
    }
  };

  const addKeywordsFromInput = async () => {
    if (!inputValue.trim()) return;

    const newPhrases = inputValue
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .filter((k) => !cleanKeywords.some((ck) => ck.toLowerCase() === k.toLowerCase()));

    if (newPhrases.length > 0) {
      const updatedKeywords = [...cleanKeywords, ...newPhrases];

      if (maxKeywords && updatedKeywords.length > maxKeywords) {
        alert(`Maximum ${maxKeywords} keywords allowed`);
        return;
      }

      // Also add to unified system if not already there
      for (const phrase of newPhrases) {
        const exists = allKeywords.some((kw) => kw.phrase.toLowerCase() === phrase.toLowerCase());
        if (!exists) {
          await createKeyword(phrase, undefined, promptPageId);
        }
      }

      onChange(updatedKeywords);
      setInputValue('');
      refresh();
    }
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = cleanKeywords.filter((_, i) => i !== index);
    onChange(updatedKeywords);
  };

  const handleSelectFromLibrary = (phrase: string) => {
    if (maxKeywords && cleanKeywords.length >= maxKeywords) {
      alert(`Maximum ${maxKeywords} keywords allowed`);
      return;
    }
    if (!cleanKeywords.some((k) => k.toLowerCase() === phrase.toLowerCase())) {
      onChange([...cleanKeywords, phrase]);
    }
  };

  // AI Generation handlers (from old component)
  const normalizeBusinessInfo = () => {
    if (!businessInfo) return null;

    let normalizedServices: string[] = [];
    if (Array.isArray(businessInfo.services_offered)) {
      normalizedServices = businessInfo.services_offered.filter(
        (service) => typeof service === 'string' && service.trim() !== ''
      );
    } else if (typeof businessInfo.services_offered === 'string') {
      normalizedServices = businessInfo.services_offered
        .split(',')
        .map((service) => service.trim())
        .filter(Boolean);
    } else if (businessInfo.services_offered && typeof businessInfo.services_offered === 'object') {
      const servicesObj = businessInfo.services_offered as any;
      normalizedServices = Object.values(servicesObj).filter(
        (service) => typeof service === 'string' && service.trim() !== ''
      ) as string[];
    }

    return {
      ...businessInfo,
      name: businessInfo.name || '',
      industry: Array.isArray(businessInfo.industry)
        ? businessInfo.industry.filter(Boolean)
        : businessInfo.industry
          ? [businessInfo.industry as unknown as string].filter(Boolean)
          : [],
      industries_other: businessInfo.industries_other || businessInfo.industry_other || '',
      address_city: businessInfo.address_city || '',
      address_state: businessInfo.address_state || '',
      about_us: businessInfo.about_us || '',
      differentiators: businessInfo.differentiators || '',
      years_in_business:
        businessInfo.years_in_business !== undefined && businessInfo.years_in_business !== null
          ? String(businessInfo.years_in_business)
          : '',
      services_offered: normalizedServices,
    };
  };

  const handleGenerateClick = async () => {
    if (!businessInfo) {
      setMissingFields([
        'Business Name',
        'Business Type/Industry',
        'City',
        'State',
        'About Us',
        'Differentiators',
        'Years in Business',
        'Services Offered',
      ]);
      setShowMissingFieldsError(true);
      return;
    }

    if (businessInfo.name === 'Your Business' || !businessInfo.name) {
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
        'Years in Business',
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
        keywords?: { searchTerm: string; reviewPhrase: string }[];
        usage?: { current: number; limit: number; remaining: number };
      }>('/ai/generate-keywords', {
        businessName: normalized.name || '',
        businessType: normalized.industry?.[0] || normalized.industries_other || normalized.industry_other || '',
        city: normalized.address_city || '',
        state: normalized.address_state || '',
        aboutUs: normalized.about_us || '',
        differentiators: normalized.differentiators || '',
        yearsInBusiness: normalized.years_in_business || '0',
        servicesOffered: Array.isArray(normalized.services_offered) ? normalized.services_offered.join(', ') : '',
        industriesServed: normalized.industries_served,
      });

      setGeneratedKeywords(data.keywords || []);
      setUsageInfo(data.usage || null);
      // Auto-select all keywords
      const allIndices = new Set<number>((data.keywords || []).map((_, index) => index));
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
    // Capture the phrases before any state changes
    const selectedPhrases = Array.from(selectedGeneratedKeywords).map(
      (index) => generatedKeywords[index]?.reviewPhrase
    ).filter(Boolean);

    if (selectedPhrases.length === 0) {
      console.warn('No keywords selected to add');
      return;
    }

    // Close the panel first for better UX
    setShowGeneratorPanel(false);

    // Add the keywords
    await handleKeywordsGenerated(selectedPhrases);

    // Clear state after adding
    setGeneratedKeywords([]);
    setSelectedGeneratedKeywords(new Set());
  };

  const handleCloseGenerator = () => {
    setShowGeneratorPanel(false);
    setGeneratedKeywords([]);
    setSelectedGeneratedKeywords(new Set());
    setGeneratorError(null);
  };

  const handleKeywordsGenerated = async (newKeywords: string[]) => {
    try {
      console.log('[KeywordsInput] handleKeywordsGenerated called with:', newKeywords);
      console.log('[KeywordsInput] Current cleanKeywords:', cleanKeywords);

      const uniqueKeywords = [...cleanKeywords];
      for (const kw of newKeywords) {
        if (!uniqueKeywords.some((uk) => uk.toLowerCase() === kw.toLowerCase())) {
          uniqueKeywords.push(kw);
          // Add to unified system (don't await to avoid blocking)
          const exists = allKeywords.some((ak) => ak.phrase.toLowerCase() === kw.toLowerCase());
          if (!exists) {
            createKeyword(kw, undefined, promptPageId).catch(err => {
              console.error('Error creating keyword in unified system:', err);
            });
          }
        }
      }

      console.log('[KeywordsInput] Calling onChange with uniqueKeywords:', uniqueKeywords);
      // Call onChange to update the parent form
      onChange(uniqueKeywords);
      // Refresh the keywords list
      refresh();
    } catch (err) {
      console.error('Error in handleKeywordsGenerated:', err);
    }
  };

  return (
    <div className="space-y-2">
      {/* Missing Business Info Error Banner */}
      {showMissingFieldsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="FaInfoCircle" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-2">Complete Your Business Profile</h4>
              <p className="text-sm text-red-800 mb-3">
                To use the AI Keyword Generator, please complete the following business information:
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
                  Go to Business Profile
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

      {/* Header with Generate and Library buttons */}
      <div className="flex justify-end gap-2 mb-2">
        <button
          type="button"
          onClick={() => {
            const newState = !showPicker;
            setShowPicker(newState);
            if (newState) {
              // Scroll to library after it renders
              setTimeout(() => {
                libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }, 100);
            }
          }}
          disabled={disabled || isLoading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            showPicker
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Icon name="FaBookmark" className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={disabled || isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-blue rounded-lg hover:bg-opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          {isGenerating ? (
            <Icon name="FaSpinner" className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Icon name="prompty" className="w-3.5 h-3.5" />
          )}
          <span>{isGenerating ? 'Generating...' : 'AI Generate'}</span>
          {!isGenerating && <span className="text-white/60">(5 credits)</span>}
        </button>
      </div>

      {/* Input field - moved above keywords */}
      <div className={`relative ${isFocused ? 'ring-2 ring-indigo-500 rounded-md' : ''}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleInputBlur}
          placeholder="best pizza Seattle, wood-fired oven, authentic Italian"
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {inputValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            Press Enter to add
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">Enter keywords separated by commas</p>

      {/* Keywords chips display with usage indicators */}
      {enrichedKeywords.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {enrichedKeywords.map((keyword, index) => (
            <div
              key={index}
              onClick={() => {
                if (!disabled && onKeywordClick) {
                  onKeywordClick(keyword.phrase);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors group ${onKeywordClick ? 'cursor-pointer' : ''}`}
            >
              <span>{keyword.phrase}</span>
              {/* Usage indicator for 4+ word keywords - only show if count > 0 */}
              {keyword.showUsageIndicator && keyword.reviewUsageCount > 0 && (
                <span className="relative group/tooltip">
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-xs rounded-full cursor-help ${
                      keyword.usageColor === 'red'
                        ? 'bg-red-100 text-red-700'
                        : keyword.usageColor === 'orange'
                          ? 'bg-orange-100 text-orange-700'
                          : keyword.usageColor === 'yellow'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {keyword.reviewUsageCount}
                  </span>
                  {/* Custom tooltip */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10">
                    Found in {keyword.reviewUsageCount} review{keyword.reviewUsageCount !== 1 ? 's' : ''}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                  </span>
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeKeyword(index);
                  }}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 transition-colors"
                  aria-label={`Remove keyword: ${keyword.phrase}`}
                >
                  <Icon name="FaTimes" className="w-3 h-3 text-indigo-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {cleanKeywords.length > 0
            ? `${cleanKeywords.length} keyword${cleanKeywords.length === 1 ? '' : 's'}`
            : 'No keywords yet'}
          {maxKeywords && ` (max: ${maxKeywords})`}
        </span>
      </div>

      {/* Library picker dropdown */}
      {showPicker && (
        <div ref={libraryRef} className="border border-blue-200 rounded-lg bg-blue-50 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-100 px-4 py-3 flex items-center justify-between border-b border-blue-200">
            <div className="flex items-center gap-2">
              <Icon name="FaBookmark" className="w-4 h-4 text-blue-700" />
              <h4 className="text-sm font-semibold text-blue-900">Keyword Concepts library</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-200 hover:bg-blue-300 transition-colors"
              aria-label="Close library"
            >
              <Icon name="FaTimes" className="w-3 h-3 text-blue-700" />
            </button>
          </div>
          <div className="p-3 border-b border-blue-100">
            <p className="text-xs text-blue-700 mb-2">Click keywords to add them to your Prompt Page</p>
            <div className="relative">
              <Icon
                name="FaSearch"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library..."
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-blue-200 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48 p-2 bg-white/50">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-blue-600">
                <Icon name="FaSpinner" className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : availableKeywords.length === 0 ? (
              <div className="text-center py-4 text-sm text-blue-600">
                {searchQuery ? 'No matching keywords' : 'No more keywords available'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableKeywords.slice(0, 50).map((kw) => (
                  <button
                    key={kw.id}
                    type="button"
                    onClick={() => handleSelectFromLibrary(kw.phrase)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full hover:bg-blue-200 hover:border-blue-300 transition-colors"
                  >
                    {kw.phrase}
                    {kw.showUsageIndicator && kw.reviewUsageCount > 0 && (
                      <span
                        className={`px-1 rounded text-xs ${
                          kw.usageColor === 'red'
                            ? 'bg-red-100 text-red-600'
                            : kw.usageColor === 'orange'
                              ? 'bg-orange-100 text-orange-600'
                              : kw.usageColor === 'yellow'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-200 text-gray-500'
                        }`}
                        title={`Found in ${kw.reviewUsageCount} review${kw.reviewUsageCount !== 1 ? 's' : ''}`}
                      >
                        {kw.reviewUsageCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Keyword Generator Panel */}
      {showGeneratorPanel && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg overflow-hidden">
          {/* Panel Header */}
          <div className="bg-slate-blue px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon name="FaSparkles" className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI keyword generator</h4>
                <p className="text-xs text-white/80">Generate SEO-optimized phrases that can be included in your customer reviews</p>
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
                <p className="text-gray-700 font-medium">Generating keywords...</p>
                <p className="text-gray-500 text-sm mt-1">
                  AI is creating 10 SEO-optimized keyword ideas for {businessInfo?.name}
                </p>
              </div>
            )}

            {/* Keywords Table */}
            {generatedKeywords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Generated keywords ({selectedGeneratedKeywords.size} selected)
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
                            <div className="text-xs font-bold text-gray-900">Review phrase</div>
                            <div className="text-xs font-normal text-gray-500">Added to form</div>
                          </th>
                          <th className="px-3 py-2 text-left">
                            <div className="text-xs font-bold text-gray-900">Search term</div>
                            <div className="text-xs font-normal text-gray-500">Target query</div>
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
                            <td className="px-3 py-2 text-sm text-gray-700">{kw.reviewPhrase}</td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{kw.searchTerm}</td>
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
                    Add {selectedGeneratedKeywords.size} keyword{selectedGeneratedKeywords.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
