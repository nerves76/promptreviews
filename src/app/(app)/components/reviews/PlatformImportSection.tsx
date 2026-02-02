"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import Icon from "@/components/Icon";
import GbpLocationPicker from "./GbpLocationPicker";

interface SearchFieldConfig {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  helpText?: string;
}

interface PlatformInfo {
  id: string;
  displayName: string;
  searchFields: SearchFieldConfig[];
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  totalFetched: number;
  cost: number;
  errors: string[];
  error?: string;
}

interface PreviewReview {
  externalReviewId: string;
  externalPlatform: string;
  reviewerName: string;
  reviewerUrl?: string | null;
  reviewerImageUrl?: string | null;
  reviewContent: string;
  starRating: number;
  sentiment: string;
  reviewDate: string;
  platformDisplayName: string;
  title?: string;
  ownerResponse?: string | null;
  isNew: boolean;
}

interface SearchPreviewResult {
  success: boolean;
  reviews: PreviewReview[];
  totalFetched: number;
  newCount: number;
  duplicateCount: number;
  estimatedCost: number;
  error?: string;
  errors: string[];
}

// Credit cost per review unit
const CREDIT_COSTS: Record<string, { perReviews: number; creditCost: number }> = {
  trustpilot: { perReviews: 20, creditCost: 1 },
  tripadvisor: { perReviews: 10, creditCost: 1 },
  google_play: { perReviews: 150, creditCost: 1 },
  app_store: { perReviews: 50, creditCost: 1 },
  google_business_profile: { perReviews: Infinity, creditCost: 0 },
};

const DEPTH_OPTIONS: Record<string, number[]> = {
  trustpilot: [20, 60, 100, 200],
  tripadvisor: [10, 50, 100, 200],
  google_play: [20, 50, 150, 300, 600, 1000],
  app_store: [20, 50, 100, 200, 500],
};

type FlowStep = "search" | "preview" | "importing" | "done";

interface PlatformImportSectionProps {
  onSuccess?: () => void;
  initialPlatform?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={star <= rating ? "FaStar" : "FaRegStar"}
          className={star <= rating ? "text-brand-gold" : "text-gray-300"}
          size={12}
        />
      ))}
    </span>
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PlatformImportSection({ onSuccess, initialPlatform }: PlatformImportSectionProps) {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [depth, setDepth] = useState<number>(20);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>("search");
  const [isSearching, setIsSearching] = useState(false);
  const [previewResult, setPreviewResult] = useState<SearchPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // GBP-specific state
  const [gbpLocationInfo, setGbpLocationInfo] = useState<{ locationId: string; locationName: string } | null>(null);

  // Fetch supported platforms on mount
  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const response = await apiClient.get<{ platforms: PlatformInfo[] }>("/review-import/platforms");
        setPlatforms(response.platforms || []);
      } catch (err) {
        console.error("[PlatformImport] Failed to load platforms:", err);
      } finally {
        setIsLoadingPlatforms(false);
      }
    };
    fetchPlatforms();
  }, []);

  const currentPlatform = platforms.find((p) => p.id === selectedPlatform);
  const isGbp = selectedPlatform === "google_business_profile";
  const pricing = selectedPlatform ? CREDIT_COSTS[selectedPlatform] : null;
  const estimatedCost = isGbp ? 0 : pricing ? Math.max(1, Math.ceil(depth / pricing.perReviews) * pricing.creditCost) : 0;

  const handlePlatformChange = useCallback((platformId: string) => {
    setSelectedPlatform(platformId);
    setSearchInputs({});
    setDepth(DEPTH_OPTIONS[platformId]?.[0] ?? 20);
    setFlowStep("search");
    setPreviewResult(null);
    setImportResult(null);
    setErrorMessage(null);
    setGbpLocationInfo(null);
  }, []);

  // Auto-select platform when initialPlatform is set and platforms are loaded
  useEffect(() => {
    if (initialPlatform && platforms.length > 0 && !selectedPlatform) {
      const match = platforms.find((p) => p.id === initialPlatform);
      if (match) {
        handlePlatformChange(initialPlatform);
      }
    }
  }, [initialPlatform, platforms, selectedPlatform, handlePlatformChange]);

  const handleInputChange = useCallback((key: string, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetToSearch = useCallback(() => {
    setFlowStep("search");
    setPreviewResult(null);
    setImportResult(null);
    setErrorMessage(null);
    setGbpLocationInfo(null);
  }, []);

  // GBP-specific: fetch reviews from a location
  const handleGbpFetchReviews = async (locationId: string, locationName: string) => {
    setGbpLocationInfo({ locationId, locationName });
    setIsSearching(true);
    setPreviewResult(null);
    setErrorMessage(null);

    try {
      const result = await apiClient.post<SearchPreviewResult>("/review-import/gbp-search", {
        locationId,
      });

      setPreviewResult(result);

      if (result.success) {
        setFlowStep("preview");
      } else {
        setErrorMessage(result.error || "Failed to fetch reviews. Please try again.");
      }
    } catch (err: any) {
      console.error("[PlatformImport] GBP search error:", err);
      setErrorMessage(err.message || "Failed to fetch GBP reviews");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedPlatform || !currentPlatform) return;

    // Validate required fields
    const missingFields = currentPlatform.searchFields
      .filter((f) => f.required && !searchInputs[f.key]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    const hasAnyInput = currentPlatform.searchFields.some((f) => searchInputs[f.key]?.trim());
    if (!hasAnyInput) {
      setErrorMessage("Please fill in at least one search field.");
      return;
    }

    setIsSearching(true);
    setPreviewResult(null);
    setErrorMessage(null);

    try {
      const result = await apiClient.post<SearchPreviewResult>("/review-import/search", {
        platformId: selectedPlatform,
        searchInput: {
          ...searchInputs,
          depth,
        },
      });

      setPreviewResult(result);

      if (result.success) {
        setFlowStep("preview");
      } else {
        setErrorMessage(result.error || "Search failed. Please try again.");
      }
    } catch (err: any) {
      console.error("[PlatformImport] Search error:", err);
      setErrorMessage(err.message || "Failed to search reviews");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!previewResult || !selectedPlatform) return;

    const newReviews = previewResult.reviews.filter((r) => r.isNew);
    if (newReviews.length === 0) return;

    setFlowStep("importing");
    setErrorMessage(null);

    try {
      // Strip isNew before sending — server expects NormalizedReview
      const reviewsToImport = newReviews.map(({ isNew: _isNew, ...review }) => review);

      let result: ImportResult;

      if (isGbp && gbpLocationInfo) {
        // GBP uses its own import endpoint (no credits)
        result = await apiClient.post<ImportResult>("/review-import/gbp-import", {
          locationId: gbpLocationInfo.locationId,
          locationName: gbpLocationInfo.locationName,
          reviews: reviewsToImport,
        });
      } else {
        result = await apiClient.post<ImportResult>("/review-import/import", {
          platformId: selectedPlatform,
          reviews: reviewsToImport,
        });
      }

      setImportResult(result);
      setFlowStep("done");

      if (result.importedCount > 0 && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("[PlatformImport] Import error:", err);
      setErrorMessage(err.message || "Failed to import reviews");
      setFlowStep("preview"); // Go back to preview on error
    }
  };

  if (isLoadingPlatforms) {
    return (
      <div className="mb-8 bg-purple-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
          <span className="text-sm">Loading import options...</span>
        </div>
      </div>
    );
  }

  if (platforms.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-purple-50 rounded-lg p-6 border border-purple-100">
      <h3 className="text-lg font-semibold text-slate-blue flex items-center gap-2 mb-4">
        <Icon name="FaGlobe" className="w-5 h-5" size={20} />
        Import from review platforms
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Import reviews from Google Business Profile, Trustpilot, TripAdvisor, Google Play, or the App Store. Search first to preview before importing.
      </p>

      {/* Platform selector — always visible */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="platform-select">
          Platform
        </label>
        <select
          id="platform-select"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue focus:outline-none"
          value={selectedPlatform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          disabled={flowStep === "importing"}
        >
          <option value="">Select a platform...</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* ===== SEARCH STEP ===== */}
      {currentPlatform && flowStep === "search" && (
        <>
          {isGbp ? (
            /* GBP: show location picker instead of text inputs */
            <div className="mb-4">
              {isSearching ? (
                <div className="flex items-center gap-2 text-blue-800 py-3">
                  <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                  <span className="text-sm font-medium">Fetching reviews from Google... This may take a moment</span>
                </div>
              ) : (
                <GbpLocationPicker onFetchReviews={handleGbpFetchReviews} disabled={isSearching} />
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {currentPlatform.searchFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`field-${field.key}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      id={`field-${field.key}`}
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue focus:outline-none"
                      placeholder={field.placeholder}
                      value={searchInputs[field.key] || ""}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                    />
                    {field.helpText && (
                      <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Depth selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="depth-select">
                  Number of reviews to fetch
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="depth-select"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-blue focus:outline-none"
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                  >
                    {(DEPTH_OPTIONS[selectedPlatform] ?? [20, 40, 60]).map((d) => (
                      <option key={d} value={d}>
                        {d} reviews
                      </option>
                    ))}
                  </select>
                  {pricing && (
                    <span className="text-sm text-gray-600">
                      Estimated cost: <strong>{estimatedCost} credit{estimatedCost !== 1 ? "s" : ""}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isSearching ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
                    Searching... This may take up to 30 seconds
                  </>
                ) : (
                  <>
                    <Icon name="FaSearch" className="w-4 h-4" size={16} />
                    Search reviews
                  </>
                )}
              </button>
            </>
          )}
        </>
      )}

      {/* ===== PREVIEW STEP ===== */}
      {flowStep === "preview" && previewResult && (
        <div className="mt-2">
          {/* Summary banner */}
          {previewResult.totalFetched === 0 ? (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4">
              <div className="flex items-center gap-2">
                <Icon name="FaInfoCircle" size={16} />
                <span>No reviews found. Try a different search term or platform.</span>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                <div className="flex items-center gap-2 font-medium">
                  <Icon name="FaInfoCircle" size={16} />
                  Found {previewResult.totalFetched} review{previewResult.totalFetched !== 1 ? "s" : ""}
                  {" \u2014 "}
                  <span className="text-green-700">{previewResult.newCount} new</span>
                  {previewResult.duplicateCount > 0 && (
                    <>, <span className="text-gray-600">{previewResult.duplicateCount} already imported</span></>
                  )}
                </div>
                {isGbp ? (
                  previewResult.newCount > 0 && (
                    <p className="mt-1 text-xs text-green-700 font-medium">
                      Free import — no credits needed
                    </p>
                  )
                ) : (
                  pricing && previewResult.newCount > 0 && (
                    <p className="mt-1 text-xs text-blue-700">
                      Import cost: {Math.max(1, Math.ceil(previewResult.newCount / pricing.perReviews) * pricing.creditCost)} credit{Math.max(1, Math.ceil(previewResult.newCount / pricing.perReviews) * pricing.creditCost) !== 1 ? "s" : ""}
                    </p>
                  )
                )}
              </div>

              {/* Review table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Status</th>
                      <th className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Reviewer</th>
                      <th className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Rating</th>
                      <th className="px-3 py-2 font-medium text-gray-700">Review</th>
                      <th className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewResult.reviews.map((review) => (
                      <tr key={review.externalReviewId} className={review.isNew ? "bg-white" : "bg-gray-50 opacity-60"}>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              review.isNew
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {review.isNew ? "New" : "Already imported"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{review.reviewerName}</td>
                        <td className="px-3 py-2">
                          <StarRating rating={review.starRating} />
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-xs">
                          {truncateText(review.reviewContent, 80)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                          {formatDate(review.reviewDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={resetToSearch}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Icon name="FaArrowLeft" size={14} />
              Back to search
            </button>
            {previewResult.newCount > 0 && (
              <button
                onClick={handleImportConfirm}
                className="flex items-center gap-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 transition-colors whitespace-nowrap"
              >
                <Icon name="FaUpload" size={14} />
                Import {previewResult.newCount} new review{previewResult.newCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== IMPORTING STEP ===== */}
      {flowStep === "importing" && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Icon name="FaSpinner" className="w-4 h-4 animate-spin" size={16} />
            <span className="text-sm font-medium">Importing reviews...</span>
          </div>
        </div>
      )}

      {/* ===== DONE STEP ===== */}
      {flowStep === "done" && importResult && (
        <div className="mt-2">
          {importResult.success ? (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm mb-4">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Icon name="FaCheckCircle" size={16} />
                Import complete
              </div>
              <p>
                Imported <strong>{importResult.importedCount}</strong> new review{importResult.importedCount !== 1 ? "s" : ""}
                {importResult.skippedCount > 0 && (
                  <>, <strong>{importResult.skippedCount}</strong> duplicate{importResult.skippedCount !== 1 ? "s" : ""} skipped</>
                )}
                {importResult.cost > 0 && (
                  <> ({importResult.cost} credit{importResult.cost !== 1 ? "s" : ""} used)</>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <p className="text-yellow-700 mt-1 text-xs">
                  {importResult.errors.length} warning{importResult.errors.length !== 1 ? "s" : ""}: {importResult.errors[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
              {importResult.error || "Import failed. Please try again."}
            </div>
          )}

          <button
            onClick={resetToSearch}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Icon name="FaSearch" size={14} />
            Search again
          </button>
        </div>
      )}

      {/* Error message (visible in any step) */}
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
