"use client";

import React, { useState, useCallback, useEffect } from "react";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import {
  type SearchTerm,
  type RelatedQuestion,
  type FunnelStage,
  checkSearchTermRelevance,
  getFunnelStageColor,
  getFunnelStageShortLabel,
} from "../keywordUtils";
import { useRelatedQuestions } from "../hooks/useRelatedQuestions";
import LocationPicker from "@/components/LocationPicker";

interface KeywordEnrichment {
  review_phrase: string;
  search_query: string;
  aliases: string[];
  location_scope: "local" | "city" | "region" | "state" | "national" | null;
  related_questions: RelatedQuestion[];
}

interface KeywordConceptInputProps {
  onKeywordAdded: (keyword: {
    phrase: string;
    review_phrase: string;
    search_terms: SearchTerm[];
    aliases: string[];
    location_scope: string | null;
    related_questions: RelatedQuestion[];
    ai_generated: boolean;
    search_volume_location_code: number | null;
    search_volume_location_name: string | null;
  }) => void;
  businessName?: string;
  businessCity?: string;
  businessState?: string;
  /** Default location from business profile */
  businessLocationCode?: number | null;
  businessLocationName?: string | null;
  placeholder?: string;
  className?: string;
}

/**
 * KeywordConceptInput Component
 *
 * A flexible concept input that allows users to:
 * A. Add concept and save without any optional fields (quick add)
 * B. Add concept name, then click to auto-fill with AI
 * C. Fill out fields manually before saving
 *
 * Each concept includes: concept name, review phrase, search terms, aliases,
 * location scope, and related questions for AI visibility tracking.
 */
export default function KeywordConceptInput({
  onKeywordAdded,
  businessName,
  businessCity,
  businessState,
  businessLocationCode,
  businessLocationName,
  placeholder = "Name this concept (e.g., Green eggs and ham)",
  className = "",
}: KeywordConceptInputProps) {
  // Form visibility
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [keyword, setKeyword] = useState("");
  const [reviewPhrase, setReviewPhrase] = useState("");
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [newSearchTerm, setNewSearchTerm] = useState("");
  const [relevanceWarning, setRelevanceWarning] = useState<{
    term: string;
    sharedRoots: string[];
    missingRoots: string[];
  } | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [locationScope, setLocationScope] = useState<string | null>(null);
  // Concept location - defaults to business location
  const [conceptLocation, setConceptLocation] = useState<{
    locationCode: number | null;
    locationName: string | null;
  }>({
    locationCode: businessLocationCode ?? null,
    locationName: businessLocationName ?? null,
  });
  const [isLookingUpLocation, setIsLookingUpLocation] = useState(false);

  // Auto-lookup location from business city/state if no explicit location is set
  useEffect(() => {
    // Only run when form opens and we need to lookup
    if (!showForm) return;
    if (conceptLocation.locationCode) return; // Already has location
    if (businessLocationCode) return; // Business already has location code
    if (!businessCity) return; // No city to lookup

    const lookupLocation = async () => {
      setIsLookingUpLocation(true);
      try {
        const searchQuery = businessState
          ? `${businessCity}, ${businessState}`
          : businessCity;

        const response = await apiClient.get<{
          locations: Array<{
            locationCode: number;
            locationName: string;
            locationType: string;
          }>;
        }>(`/rank-locations/search?q=${encodeURIComponent(searchQuery)}`);

        if (response.locations && response.locations.length > 0) {
          // Find the best match - prefer city type
          const cityMatch = response.locations.find(l => l.locationType === 'City');
          const bestMatch = cityMatch || response.locations[0];

          setConceptLocation({
            locationCode: bestMatch.locationCode,
            locationName: bestMatch.locationName,
          });
        }
      } catch (error) {
        console.error('Failed to auto-lookup location:', error);
        // Silently fail - user can manually set location
      } finally {
        setIsLookingUpLocation(false);
      }
    };

    lookupLocation();
  }, [showForm, conceptLocation.locationCode, businessLocationCode, businessCity, businessState]);

  // Related questions hook
  const {
    questions: relatedQuestions,
    setQuestions: setRelatedQuestions,
    newQuestionText,
    setNewQuestionText,
    newQuestionFunnel,
    setNewQuestionFunnel,
    addQuestion: handleAddQuestion,
    removeQuestion: handleRemoveQuestion,
    isAtLimit: questionsAtLimit,
    reset: resetQuestions,
  } = useRelatedQuestions({ maxQuestions: 20 });

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  // Check if user has entered any data that would be overwritten
  const hasExistingData = reviewPhrase.trim() || searchTerms.length > 0 || aliases.length > 0 || locationScope || relatedQuestions.length > 0;

  // Search volume lookup state
  const [volumeData, setVolumeData] = useState<Record<string, {
    volume: number;
    trend: 'rising' | 'falling' | 'stable' | null;
    competitionLevel: string | null;
  }>>({});
  const [isLookingUpVolume, setIsLookingUpVolume] = useState<string | null>(null);
  const [volumeError, setVolumeError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKeyword("");
    setReviewPhrase("");
    setSearchTerms([]);
    setNewSearchTerm("");
    setRelevanceWarning(null);
    setAliases([]);
    setNewAlias("");
    setLocationScope(null);
    // Reset location to business default
    setConceptLocation({
      locationCode: businessLocationCode ?? null,
      locationName: businessLocationName ?? null,
    });
    resetQuestions();
    setAiGenerated(false);
    setError(null);
    setVolumeData({});
    setVolumeError(null);
    setShowOverwriteWarning(false);
    setShowForm(false);
  }, [resetQuestions, businessLocationCode, businessLocationName]);

  // Search volume lookup handler
  const handleVolumeLookup = useCallback(async (term: string) => {
    setIsLookingUpVolume(term);
    setVolumeError(null);

    try {
      const response = await apiClient.post("/rank-tracking/discovery", {
        keyword: term,
      }) as {
        keyword: string;
        volume: number;
        trend: 'rising' | 'falling' | 'stable' | null;
        competitionLevel: string | null;
        error?: string;
      };

      setVolumeData(prev => ({
        ...prev,
        [term]: {
          volume: response.volume,
          trend: response.trend,
          competitionLevel: response.competitionLevel,
        },
      }));
    } catch (err: unknown) {
      console.error("Volume lookup error:", err);
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 429) {
        setVolumeError("Daily lookup limit reached. Try again tomorrow.");
      } else {
        setVolumeError(err instanceof Error ? err.message : "Failed to look up volume");
      }
    } finally {
      setIsLookingUpVolume(null);
    }
  }, []);

  // Format volume for display
  // Note: Google rounds low-volume keywords to 0, but they may still get traffic
  const formatVolume = (vol: number) => {
    if (vol === 0) return '<10';
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  const handleGenerateWithAI = useCallback(async (fillEmptyOnly = false) => {
    if (!keyword.trim()) return;

    setShowOverwriteWarning(false);
    setIsGenerating(true);
    setError(null);

    try {
      const response = (await apiClient.post("/ai/enrich-keyword", {
        phrase: keyword.trim(),
        businessName,
        businessCity,
        businessState,
      })) as { success: boolean; enrichment?: KeywordEnrichment; error?: string; creditsRemaining?: number };

      if (response.success && response.enrichment) {
        // Fill empty only mode: only set values if current value is empty
        if (fillEmptyOnly) {
          if (!reviewPhrase.trim()) {
            setReviewPhrase(response.enrichment.review_phrase);
          }
          if (searchTerms.length === 0 && response.enrichment.search_query) {
            setSearchTerms([{
              term: response.enrichment.search_query,
              isCanonical: true,
              addedAt: new Date().toISOString(),
            }]);
          }
          if (aliases.length === 0) {
            setAliases(response.enrichment.aliases || []);
          }
          if (!locationScope) {
            setLocationScope(response.enrichment.location_scope);
          }
          if (relatedQuestions.length === 0) {
            setRelatedQuestions(response.enrichment.related_questions || []);
          }
        } else {
          // Replace all mode
          setReviewPhrase(response.enrichment.review_phrase);
          if (response.enrichment.search_query) {
            setSearchTerms([{
              term: response.enrichment.search_query,
              isCanonical: true,
              addedAt: new Date().toISOString(),
            }]);
          }
          setAliases(response.enrichment.aliases || []);
          setLocationScope(response.enrichment.location_scope);
          setRelatedQuestions(response.enrichment.related_questions || []);
        }
        setAiGenerated(true);
      } else {
        throw new Error(response.error || "Failed to generate");
      }
    } catch (err: unknown) {
      console.error("AI generation error:", err);
      // Check for daily limit exceeded (429 error)
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 429) {
        setError("Daily limit reached (30/day). Try again tomorrow!");
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate with AI");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [keyword, businessName, businessCity, businessState, reviewPhrase, searchTerms, aliases, locationScope, relatedQuestions]);

  const handleSave = useCallback(() => {
    if (!keyword.trim()) return;

    // Use defaults if fields are empty
    const finalReviewPhrase = reviewPhrase.trim() || keyword.trim();

    // If no search terms, create a default one from the keyword
    const finalSearchTerms = searchTerms.length > 0
      ? searchTerms
      : [{
          term: keyword.trim().toLowerCase(),
          isCanonical: true,
          addedAt: new Date().toISOString(),
        }];

    onKeywordAdded({
      phrase: keyword.trim(),
      review_phrase: finalReviewPhrase,
      search_terms: finalSearchTerms,
      aliases,
      location_scope: locationScope,
      related_questions: relatedQuestions,
      ai_generated: aiGenerated,
      search_volume_location_code: conceptLocation.locationCode,
      search_volume_location_name: conceptLocation.locationName,
    });

    resetForm();
  }, [keyword, reviewPhrase, searchTerms, aliases, locationScope, relatedQuestions, aiGenerated, conceptLocation, onKeywordAdded, resetForm]);

  const handleRemoveAlias = useCallback(
    (index: number) => {
      setAliases(aliases.filter((_, i) => i !== index));
    },
    [aliases]
  );

  const handleAddAlias = useCallback(() => {
    if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
      setAliases([...aliases, newAlias.trim()]);
      setNewAlias("");
    }
  }, [newAlias, aliases]);

  // Search term handlers
  const handleAddSearchTerm = useCallback((forceAdd = false) => {
    if (!newSearchTerm.trim()) return;

    const termToAdd = newSearchTerm.trim();

    // Check if term already exists
    if (searchTerms.some(t => t.term.toLowerCase() === termToAdd.toLowerCase())) {
      return;
    }

    // Check relevance against concept name
    if (!forceAdd && keyword.trim()) {
      const relevance = checkSearchTermRelevance(keyword.trim(), termToAdd);
      if (!relevance.isRelevant) {
        setRelevanceWarning({
          term: termToAdd,
          sharedRoots: relevance.sharedRoots,
          missingRoots: relevance.missingRoots,
        });
        return;
      }
    }

    const newTerm: SearchTerm = {
      term: termToAdd,
      isCanonical: searchTerms.length === 0,
      addedAt: new Date().toISOString(),
    };

    setSearchTerms([...searchTerms, newTerm]);
    setNewSearchTerm("");
    setRelevanceWarning(null);
  }, [newSearchTerm, searchTerms, keyword]);

  const handleRemoveSearchTerm = useCallback((termToRemove: string) => {
    const remaining = searchTerms.filter(t => t.term !== termToRemove);
    if (remaining.length > 0 && !remaining.some(t => t.isCanonical)) {
      remaining[0].isCanonical = true;
    }
    setSearchTerms(remaining);
  }, [searchTerms]);

  const handleSetCanonical = useCallback((term: string) => {
    setSearchTerms(
      searchTerms.map(t => ({
        ...t,
        isCanonical: t.term === term,
      }))
    );
  }, [searchTerms]);

  // Show "Add concept" button when form is closed
  if (!showForm) {
    return (
      <div className={className}>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-slate-blue text-white rounded-lg text-sm font-medium hover:bg-slate-blue/90 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add concept
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Concept Field (Required) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Concept name <span className="text-red-500">*</span>
          </label>
          {aiGenerated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full">
              <Icon name="prompty" className="w-3.5 h-3.5" />
              AI generated
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-1">
          This is the root phrase. Search terms and aliases should relate to these words.
        </p>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
        />
      </div>

      {/* Generate with AI Button */}
      {keyword.trim() && !aiGenerated && !showOverwriteWarning && (
        <button
          onClick={() => {
            if (hasExistingData) {
              setShowOverwriteWarning(true);
            } else {
              handleGenerateWithAI();
            }
          }}
          disabled={isGenerating}
          className="w-full px-3 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Completing...
            </>
          ) : (
            <>
              <Icon name="prompty" className="w-4 h-4" />
              Auto-fill with AI
            </>
          )}
        </button>
      )}

      {/* Overwrite Warning */}
      {showOverwriteWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-2">
            <strong>Warning:</strong> AI generation can replace data you&apos;ve already entered. Choose an option:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerateWithAI(true)}
              disabled={isGenerating}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
            >
              {isGenerating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                'Fill empty fields only'
              )}
            </button>
            <button
              onClick={() => handleGenerateWithAI(false)}
              disabled={isGenerating}
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1"
            >
              {isGenerating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                'Replace all'
              )}
            </button>
            <button
              onClick={() => setShowOverwriteWarning(false)}
              className="px-3 py-1.5 text-sm text-amber-700 hover:text-amber-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Review Phrase */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          Review phrase
          <span className="text-gray-500 font-normal ml-1">(what you want your customers to say about you)</span>
        </label>
        <input
          type="text"
          value={reviewPhrase}
          onChange={(e) => setReviewPhrase(e.target.value)}
          placeholder={keyword.trim() || "e.g., Best green eggs and ham in San Diego!"}
          className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
        />
      </div>

      {/* Aliases - directly under Review Phrase since they're related */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          Review aliases
          <span className="text-gray-500 font-normal ml-1">(track close variants in your reviews)</span>
        </label>
        {aliases.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {aliases.map((alias, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 text-gray-700 text-sm rounded">
                {alias}
                <button onClick={() => handleRemoveAlias(idx)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAlias())}
            placeholder="e.g., green eggs with ham"
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
          />
          <button
            onClick={handleAddAlias}
            disabled={!newAlias.trim()}
            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Search Terms */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          Search terms
          <span className="text-gray-500 font-normal ml-1">(used for rank tracking and Local Ranking Grid)</span>
        </label>
        {searchTerms.length > 0 && (
          <div className="space-y-1.5 pb-1">
            {searchTerms.map((st) => {
              const vol = volumeData[st.term];
              const isLooking = isLookingUpVolume === st.term;
              return (
                <div
                  key={st.term}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-sm rounded ${
                    st.isCanonical ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <button
                    onClick={() => handleSetCanonical(st.term)}
                    className={`flex-shrink-0 ${st.isCanonical ? "text-yellow-500" : "text-gray-500 hover:text-yellow-500"}`}
                    title={st.isCanonical ? "Canonical term (shown when space is limited)" : "Set as canonical"}
                  >
                    <Icon name={st.isCanonical ? "FaStar" : "FaRegStar"} size={12} />
                  </button>
                  <span className={st.isCanonical ? "text-blue-700" : "text-gray-700"}>{st.term}</span>

                  {/* Volume display or lookup button */}
                  <div className="flex-1 flex items-center justify-end gap-2">
                    {vol ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-500">{formatVolume(vol.volume)}/mo</span>
                        {vol.trend && (
                          <span className={`${
                            vol.trend === 'rising' ? 'text-green-600' :
                            vol.trend === 'falling' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {vol.trend === 'rising' ? '↑' : vol.trend === 'falling' ? '↓' : '→'}
                          </span>
                        )}
                        {vol.competitionLevel && (
                          <span className={`px-1 py-0.5 rounded text-[10px] ${
                            vol.competitionLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                            vol.competitionLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {vol.competitionLevel}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleVolumeLookup(st.term)}
                        disabled={isLooking}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                        title="Check search volume"
                      >
                        {isLooking ? (
                          <>
                            <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="FaSearch" className="w-3 h-3" />
                            <span>Check volume</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveSearchTerm(st.term)}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Volume lookup error */}
        {volumeError && (
          <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-1.5">
            <Icon name="FaExclamationTriangle" className="w-3 h-3" />
            {volumeError}
          </div>
        )}
        {/* Relevance Warning */}
        {relevanceWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="text-amber-800 font-medium mb-1">
              &quot;{relevanceWarning.term}&quot; doesn&apos;t share root words with your concept name
            </p>
            <p className="text-amber-700 text-xs mb-2">
              {relevanceWarning.missingRoots.length > 0 && (
                <>Unrelated roots: {relevanceWarning.missingRoots.join(", ")}</>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleAddSearchTerm(true);
                }}
                className="px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
              >
                Add anyway
              </button>
              <button
                onClick={() => {
                  setRelevanceWarning(null);
                  setNewSearchTerm("");
                }}
                className="px-2 py-1 text-amber-700 hover:text-amber-800 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {!relevanceWarning && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newSearchTerm}
              onChange={(e) => setNewSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSearchTerm())}
              placeholder={keyword.trim().toLowerCase() || "e.g., green eggs ham san diego"}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
            />
            <button
              onClick={() => handleAddSearchTerm()}
              disabled={!newSearchTerm.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Location for rank tracking */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          Location
          <span className="text-gray-500 font-normal ml-1">(for rank tracking and volume lookups)</span>
        </label>
        {isLookingUpLocation ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
            Looking up location from business address...
          </div>
        ) : (
          <LocationPicker
            value={conceptLocation}
            onChange={(location) => {
              setConceptLocation({
                locationCode: location?.locationCode ?? null,
                locationName: location?.locationName ?? null,
              });
            }}
            placeholder="Search for a city or region..."
          />
        )}
        {!conceptLocation.locationCode && !businessLocationCode && !isLookingUpLocation && !businessCity && (
          <p className="text-xs text-amber-600 mt-1">
            Tip: Set a location on your Business Profile to auto-fill new concepts.
          </p>
        )}
      </div>

      {/* Related Questions */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-600">
          Related questions
          <span className="text-gray-500 font-normal ml-1">(for &quot;People Also Ask&quot; and LLM tracking, max 20)</span>
        </label>
        {relatedQuestions.length > 0 && (
          <div className="space-y-1.5 pb-1">
            {relatedQuestions.map((rq, idx) => {
              const funnelColor = getFunnelStageColor(rq.funnelStage);
              const funnelTooltip = rq.funnelStage === 'top'
                ? 'Top of funnel: Awareness stage - broad, educational questions'
                : rq.funnelStage === 'middle'
                  ? 'Middle of funnel: Consideration stage - comparison, evaluation questions'
                  : 'Bottom of funnel: Decision stage - purchase-intent, action questions';
              return (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 text-gray-800 text-sm rounded px-2.5 py-1.5">
                  <div className="relative group">
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded cursor-help ${funnelColor.bg} ${funnelColor.text}`}
                    >
                      {getFunnelStageShortLabel(rq.funnelStage)}
                    </span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      {funnelTooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                  <span className="flex-1">{rq.question}</span>
                  <button onClick={() => handleRemoveQuestion(idx)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {!questionsAtLimit && (
          <div className="flex gap-2">
            <div className="relative group">
              <select
                value={newQuestionFunnel}
                onChange={(e) => setNewQuestionFunnel(e.target.value as FunnelStage)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-slate-blue focus:border-slate-blue min-w-[180px] cursor-help"
              >
                <option value="top">Top (awareness)</option>
                <option value="middle">Middle (consideration)</option>
                <option value="bottom">Bottom (decision)</option>
              </select>
              <div className="absolute bottom-full left-0 mb-1 p-2 bg-gray-900 text-white text-xs rounded w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <div className="font-semibold mb-1">Marketing funnel stage</div>
                <div className="space-y-1">
                  <div><span className="text-blue-300">Top:</span> Awareness - broad, educational questions</div>
                  <div><span className="text-amber-300">Middle:</span> Consideration - comparison questions</div>
                  <div><span className="text-green-300">Bottom:</span> Decision - purchase-intent questions</div>
                </div>
                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
              placeholder="e.g., Are green eggs and ham good for you?"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
            />
            <button
              onClick={() => handleAddQuestion()}
              disabled={!newQuestionText.trim()}
              className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
        <button onClick={resetForm} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!keyword.trim()}
          className="px-4 py-1.5 bg-slate-blue text-white rounded text-sm font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save
        </button>
      </div>
    </div>
  );
}
