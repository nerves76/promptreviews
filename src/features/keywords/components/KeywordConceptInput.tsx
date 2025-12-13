"use client";

import React, { useState, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";

interface KeywordEnrichment {
  review_phrase: string;
  search_query: string;
  aliases: string[];
  location_scope: "local" | "city" | "region" | "state" | "national" | null;
  related_questions: string[];
  ai_generated: boolean;
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
 * A smart keyword input that:
 * 1. Takes a simple keyword phrase from the user
 * 2. Uses AI to generate review_phrase and search_query
 * 3. Allows user to edit/customize before saving
 */
export default function KeywordConceptInput({
  onKeywordAdded,
  businessName,
  businessCity,
  businessState,
  placeholder = "Enter a keyword (e.g., best green eggs ham San Diego)",
  className = "",
}: KeywordConceptInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<KeywordEnrichment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editable fields after enrichment
  const [editedReviewPhrase, setEditedReviewPhrase] = useState("");
  const [editedSearchQuery, setEditedSearchQuery] = useState("");
  const [editedQuestions, setEditedQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  const handleEnrich = useCallback(async () => {
    if (!inputValue.trim()) return;

    setIsEnriching(true);
    setError(null);
    setEnrichment(null);

    try {
      const response = await apiClient.post("/ai/enrich-keyword", {
        phrase: inputValue.trim(),
        businessName,
        businessCity,
        businessState,
      }) as { success: boolean; enrichment?: KeywordEnrichment; error?: string };

      if (response.success && response.enrichment) {
        setEnrichment(response.enrichment);
        setEditedReviewPhrase(response.enrichment.review_phrase);
        setEditedSearchQuery(response.enrichment.search_query);
        setEditedQuestions(response.enrichment.related_questions || []);
      } else {
        throw new Error(response.error || "Failed to enrich keyword");
      }
    } catch (err) {
      console.error("Keyword enrichment error:", err);
      setError(err instanceof Error ? err.message : "Failed to process keyword");
      // Fallback: use the input as-is for both fields
      setEnrichment({
        review_phrase: inputValue.trim(),
        search_query: inputValue.trim().toLowerCase(),
        aliases: [],
        location_scope: null,
        related_questions: [],
        ai_generated: false,
      });
      setEditedReviewPhrase(inputValue.trim());
      setEditedSearchQuery(inputValue.trim().toLowerCase());
      setEditedQuestions([]);
    } finally {
      setIsEnriching(false);
    }
  }, [inputValue, businessName, businessCity, businessState]);

  const handleAdd = useCallback(() => {
    if (!enrichment) return;

    onKeywordAdded({
      phrase: inputValue.trim(),
      review_phrase: editedReviewPhrase,
      search_query: editedSearchQuery,
      aliases: enrichment.aliases,
      location_scope: enrichment.location_scope,
      related_questions: editedQuestions,
      ai_generated: enrichment.ai_generated,
    });

    // Reset form
    setInputValue("");
    setEnrichment(null);
    setEditedReviewPhrase("");
    setEditedSearchQuery("");
    setEditedQuestions([]);
    setNewQuestion("");
    setShowAdvanced(false);
    setError(null);
  }, [enrichment, inputValue, editedReviewPhrase, editedSearchQuery, editedQuestions, onKeywordAdded]);

  const handleCancel = useCallback(() => {
    setEnrichment(null);
    setEditedReviewPhrase("");
    setEditedSearchQuery("");
    setEditedQuestions([]);
    setNewQuestion("");
    setShowAdvanced(false);
    setError(null);
  }, []);

  const handleAddQuestion = useCallback(() => {
    if (newQuestion.trim() && editedQuestions.length < 10) {
      setEditedQuestions([...editedQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  }, [newQuestion, editedQuestions]);

  const handleRemoveQuestion = useCallback((index: number) => {
    setEditedQuestions(editedQuestions.filter((_, i) => i !== index));
  }, [editedQuestions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !enrichment && inputValue.trim()) {
        e.preventDefault();
        handleEnrich();
      }
    },
    [enrichment, inputValue, handleEnrich]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Field */}
      {!enrichment && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isEnriching}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            onClick={handleEnrich}
            disabled={!inputValue.trim() || isEnriching}
            className="px-4 py-2 bg-slate-blue text-white rounded-lg text-sm font-medium hover:bg-slate-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isEnriching ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Keyword
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && !enrichment && (
        <p className="text-sm text-amber-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error} (using input as fallback)
        </p>
      )}

      {/* Enrichment Preview */}
      {enrichment && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Keyword:</span>
              <span className="text-sm text-gray-900">{inputValue}</span>
              {enrichment.ai_generated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  AI Enhanced
                </span>
              )}
            </div>
          </div>

          {/* Review Phrase */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500">
              Review Phrase
              <span className="text-gray-400 font-normal ml-1">(shown to customers on prompt pages)</span>
            </label>
            <input
              type="text"
              value={editedReviewPhrase}
              onChange={(e) => setEditedReviewPhrase(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
            />
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500">
              Search Query
              <span className="text-gray-400 font-normal ml-1">(used for Local Ranking Grid tracking)</span>
            </label>
            <input
              type="text"
              value={editedSearchQuery}
              onChange={(e) => setEditedSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-blue/30 focus:border-slate-blue"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-slate-blue hover:text-slate-blue/80 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
              {/* Aliases */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">
                  Aliases
                  <span className="text-gray-400 font-normal ml-1">(variant phrases that match this keyword)</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {enrichment.aliases.length > 0 ? (
                    enrichment.aliases.map((alias, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                      >
                        {alias}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No aliases generated</span>
                  )}
                </div>
              </div>

              {/* Location Scope */}
              {enrichment.location_scope && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">Location Scope</label>
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                    {enrichment.location_scope}
                  </span>
                </div>
              )}

              {/* Related Questions */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500">
                  Related Questions
                  <span className="text-gray-400 font-normal ml-1">(for PAA/LLM tracking, max 10)</span>
                </label>
                <div className="space-y-1">
                  {editedQuestions.map((question, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-purple-50 text-purple-800 text-xs rounded px-2 py-1.5"
                    >
                      <span className="flex-1">{question}</span>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {editedQuestions.length === 0 && (
                    <span className="text-xs text-gray-400">No questions generated</span>
                  )}
                </div>
                {editedQuestions.length < 10 && (
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!editedReviewPhrase.trim() || !editedSearchQuery.trim()}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirm & Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
