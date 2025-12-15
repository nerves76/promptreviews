"use client";

import React, { useState, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";

interface KeywordEnrichment {
  review_phrase: string;
  search_query: string;
  aliases: string[];
  location_scope: "local" | "city" | "region" | "state" | "national" | null;
  related_questions: string[];
}

interface KeywordConceptInputProps {
  onKeywordAdded: (keyword: {
    phrase: string;
    review_phrase: string;
    search_query: string;
    aliases: string[];
    location_scope: string | null;
    related_questions: string[];
    ai_generated: boolean;
  }) => void;
  businessName?: string;
  businessCity?: string;
  businessState?: string;
  placeholder?: string;
  className?: string;
}

/**
 * KeywordConceptInput Component
 *
 * A flexible keyword input that allows users to:
 * A. Add keyword and save without any optional fields (quick add)
 * B. Add keyword, then click to generate the rest via AI (1 credit)
 * C. Fill out fields manually before saving
 */
export default function KeywordConceptInput({
  onKeywordAdded,
  businessName,
  businessCity,
  businessState,
  placeholder = "Enter a keyword (e.g., best pizza Portland)",
  className = "",
}: KeywordConceptInputProps) {
  // Form visibility
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [keyword, setKeyword] = useState("");
  const [reviewPhrase, setReviewPhrase] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aliases, setAliases] = useState<string[]>([]);
  const [locationScope, setLocationScope] = useState<string | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setKeyword("");
    setReviewPhrase("");
    setSearchQuery("");
    setAliases([]);
    setLocationScope(null);
    setRelatedQuestions([]);
    setNewQuestion("");
    setAiGenerated(false);
    setError(null);
    setShowForm(false);
  }, []);

  const handleGenerateWithAI = useCallback(async () => {
    if (!keyword.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = (await apiClient.post("/ai/enrich-keyword", {
        phrase: keyword.trim(),
        businessName,
        businessCity,
        businessState,
      })) as { success: boolean; enrichment?: KeywordEnrichment; error?: string };

      if (response.success && response.enrichment) {
        setReviewPhrase(response.enrichment.review_phrase);
        setSearchQuery(response.enrichment.search_query);
        setAliases(response.enrichment.aliases || []);
        setLocationScope(response.enrichment.location_scope);
        setRelatedQuestions(response.enrichment.related_questions || []);
        setAiGenerated(true);
      } else {
        throw new Error(response.error || "Failed to generate");
      }
    } catch (err) {
      console.error("AI generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate with AI");
    } finally {
      setIsGenerating(false);
    }
  }, [keyword, businessName, businessCity, businessState]);

  const handleSave = useCallback(() => {
    if (!keyword.trim()) return;

    // Use defaults if fields are empty
    const finalReviewPhrase = reviewPhrase.trim() || keyword.trim();
    const finalSearchQuery = searchQuery.trim() || keyword.trim().toLowerCase();

    onKeywordAdded({
      phrase: keyword.trim(),
      review_phrase: finalReviewPhrase,
      search_query: finalSearchQuery,
      aliases,
      location_scope: locationScope,
      related_questions: relatedQuestions,
      ai_generated: aiGenerated,
    });

    resetForm();
  }, [keyword, reviewPhrase, searchQuery, aliases, locationScope, relatedQuestions, aiGenerated, onKeywordAdded, resetForm]);

  const handleAddQuestion = useCallback(() => {
    if (newQuestion.trim() && relatedQuestions.length < 10) {
      setRelatedQuestions([...relatedQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  }, [newQuestion, relatedQuestions]);

  const handleRemoveQuestion = useCallback(
    (index: number) => {
      setRelatedQuestions(relatedQuestions.filter((_, i) => i !== index));
    },
    [relatedQuestions]
  );

  const handleRemoveAlias = useCallback(
    (index: number) => {
      setAliases(aliases.filter((_, i) => i !== index));
    },
    [aliases]
  );

  // Show "Add keyword" button when form is closed
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
          Add keyword
        </button>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Add keyword</h3>
        {aiGenerated && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            AI generated
          </span>
        )}
      </div>

      {/* Keyword Field (Required) */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Keyword <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
        />
      </div>

      {/* Generate with AI Button */}
      {keyword.trim() && !aiGenerated && (
        <button
          onClick={handleGenerateWithAI}
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
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Generate with AI
              <span className="text-xs text-indigo-400">(1 credit)</span>
            </>
          )}
        </button>
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
        <label className="block text-xs font-medium text-gray-500">
          Review phrase
          <span className="text-gray-400 font-normal ml-1">(shown to customers on prompt pages)</span>
        </label>
        <input
          type="text"
          value={reviewPhrase}
          onChange={(e) => setReviewPhrase(e.target.value)}
          placeholder={keyword.trim() || "Defaults to keyword if empty"}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
        />
      </div>

      {/* Search Query */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500">
          Search query
          <span className="text-gray-400 font-normal ml-1">(used for Local Ranking Grid tracking)</span>
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={keyword.trim().toLowerCase() || "Defaults to keyword lowercase if empty"}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
        />
      </div>

      {/* Aliases */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500">
          Aliases
          <span className="text-gray-400 font-normal ml-1">(variant phrases that match this keyword)</span>
        </label>
        <div className="flex flex-wrap gap-1">
          {aliases.length > 0 ? (
            aliases.map((alias, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                {alias}
                <button onClick={() => handleRemoveAlias(idx)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No aliases</span>
          )}
        </div>
      </div>

      {/* Location Scope */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-500">Location scope</label>
        <select
          value={locationScope || ""}
          onChange={(e) => setLocationScope(e.target.value || null)}
          className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
        >
          <option value="">Not set</option>
          <option value="local">Local</option>
          <option value="city">City</option>
          <option value="region">Region</option>
          <option value="state">State</option>
          <option value="national">National</option>
        </select>
      </div>

      {/* Related Questions */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-500">
          Related questions
          <span className="text-gray-400 font-normal ml-1">(for PAA/LLM tracking, max 10)</span>
        </label>
        <div className="space-y-1">
          {relatedQuestions.map((question, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-purple-50 text-purple-800 text-xs rounded px-2 py-1.5">
              <span className="flex-1">{question}</span>
              <button onClick={() => handleRemoveQuestion(idx)} className="text-purple-600 hover:text-purple-800">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {relatedQuestions.length === 0 && <span className="text-xs text-gray-400">No questions</span>}
        </div>
        {relatedQuestions.length < 10 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddQuestion())}
              placeholder="Add a question..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-slate-blue focus:border-slate-blue"
            />
            <button
              onClick={handleAddQuestion}
              disabled={!newQuestion.trim()}
              className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50"
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
          className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
