"use client";
import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { DraggableModal } from './DraggableModal';
import FiveStarSpinner from "@/app/components/FiveStarSpinner";

const WORD_LIMIT = 250;
const MAX_WIDGET_REVIEWS = 8;

function wordCount(str: string) {
  return str.trim().split(/\s+/).length;
}

interface ReviewManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string | null;
  onReviewsChange?: () => void;
}

export function ReviewManagementModal({ 
  isOpen, 
  onClose, 
  widgetId, 
  onReviewsChange 
}: ReviewManagementModalProps) {
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<any[]>([]);
  const [editedReviews, setEditedReviews] = useState<{ [id: string]: string }>({});
  const [editedNames, setEditedNames] = useState<{ [id: string]: string }>({});
  const [editedRoles, setEditedRoles] = useState<{ [id: string]: string }>({});
  const [editedRatings, setEditedRatings] = useState<{ [id: string]: number | null }>({});
  const [reviewError, setReviewError] = useState("");
  const [reviewSort, setReviewSort] = useState<"recent" | "alphabetical">("recent");
  const [reviewSearch, setReviewSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [reviewModalPos, setReviewModalPos] = useState({ x: 0, y: 0 });
  const [reviewModalDragging, setReviewModalDragging] = useState(false);
  const reviewModalDragStart = useRef<{ x: number; y: number } | null>(null);
  const reviewModalRef = useRef<HTMLDivElement>(null);
  const [showAddCustomReview, setShowAddCustomReview] = useState(false);
  const [newCustomReview, setNewCustomReview] = useState({
    review_content: "",
    first_name: "",
    last_name: "",
    reviewer_role: "",
    star_rating: null,
  });
  const [photoUploads, setPhotoUploads] = useState<{ [id: string]: string }>({});
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{ [id: string]: boolean }>({});
  const [photoUploadErrors, setPhotoUploadErrors] = useState<{ [id: string]: string }>({});

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!isOpen || !widgetId) return;
    handleOpenReviewModal(widgetId);
  }, [isOpen, widgetId]);

  const handleOpenReviewModal = async (widgetId: string) => {
    console.log("[DEBUG] Opening review modal for widgetId:", widgetId);
    setReviewError("");
    setLoadingReviews(true);
    
    // Center the modal on screen
    const modalWidth = 1000;
    const modalHeight = 600;
    const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
    const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
    setReviewModalPos({ x, y });
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Fetch all available reviews from review_submissions
    supabase
      .from('review_submissions')
      .select('id, first_name, last_name, reviewer_role, review_content, platform, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[DEBUG] Error fetching review_submissions:', error);
          setLoadingReviews(false);
          return;
        }
        
        if (!data || data.length === 0) {
          setAllReviews([]);
          setLoadingReviews(false);
          return;
        }

        const mappedReviews = data.map(r => ({
          review_id: r.id,
          first_name: r.first_name,
          last_name: r.last_name,
          reviewer_role: r.reviewer_role,
          review_content: r.review_content,
          platform: r.platform,
          created_at: r.created_at
        }));
        
        setAllReviews(mappedReviews);
        setLoadingReviews(false);
      });

    // Fetch selected reviews for this widget from widget_reviews
    supabase
      .from("widget_reviews")
      .select(
        "review_id, review_content, first_name, last_name, reviewer_role, platform, created_at, star_rating"
      )
      .eq("widget_id", widgetId)
      .order("order_index", { ascending: true })
      .then(({ data: widgetReviews, error }) => {
        if (error) {
          setSelectedReviews([]);
          setEditedReviews({});
          setEditedNames({});
          setEditedRoles({});
          setEditedRatings({});
          setLoadingReviews(false);
          return;
        }
        
        setSelectedReviews(widgetReviews || []);
        
        // Set edited fields to match the widget's current reviews
        const editedReviewsObj: { [id: string]: string } = {};
        const editedNamesObj: { [id: string]: string } = {};
        const editedRolesObj: { [id: string]: string } = {};
        const editedRatingsObj: { [id: string]: number | null } = {};
        
        (widgetReviews || []).forEach((r) => {
          editedReviewsObj[r.review_id] = r.review_content;
          editedNamesObj[r.review_id] = `${r.first_name} ${r.last_name}`;
          editedRolesObj[r.review_id] = r.reviewer_role;
          editedRatingsObj[r.review_id] = r.star_rating ?? null;
        });
        
        setEditedReviews(editedReviewsObj);
        setEditedNames(editedNamesObj);
        setEditedRoles(editedRolesObj);
        setEditedRatings(editedRatingsObj);
        setLoadingReviews(false);
      });
  };

  const handleToggleReview = (review: any) => {
    const alreadySelected = selectedReviews.some((r) => r.review_id === review.review_id);
    let updated;
    
    if (alreadySelected) {
      updated = selectedReviews.filter((r) => r.review_id !== review.review_id);
      // Remove from edited fields when removing
      setEditedReviews((prev) => {
        const { [review.review_id]: _, ...rest } = prev;
        return rest;
      });
      setEditedNames((prev) => {
        const { [review.review_id]: _, ...rest } = prev;
        return rest;
      });
      setEditedRoles((prev) => {
        const { [review.review_id]: _, ...rest } = prev;
        return rest;
      });
      setEditedRatings((prev) => {
        const { [review.review_id]: _, ...rest } = prev;
        return rest;
      });
    } else {
      // Only add if not already present
      if (selectedReviews.some((r) => r.review_id === review.review_id)) return;
      if (selectedReviews.length >= MAX_WIDGET_REVIEWS) return;
      updated = [...selectedReviews, review];
      // Initialize edited fields when adding
      setEditedReviews((prev) => ({
        ...prev,
        [review.review_id]: review.review_content || "",
      }));
      setEditedNames((prev) => ({
        ...prev,
        [review.review_id]: `${review.first_name} ${review.last_name}`,
      }));
      setEditedRoles((prev) => ({
        ...prev,
        [review.review_id]: review.reviewer_role || "",
      }));
      setEditedRatings((prev) => ({
        ...prev,
        [review.review_id]: review.star_rating ?? null,
      }));
    }
    setSelectedReviews(updated);
  };

  const handleReviewEdit = (id: string, value: string) => {
    setEditedReviews((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveReviews = async () => {
    if (!widgetId) {
      setReviewError("No widget selected");
      return;
    }
    
    // Validate all selected reviews are within word limit
    for (const review of selectedReviews) {
      const text = editedReviews[review.review_id] ?? review.review_content;
      if (wordCount(text) > WORD_LIMIT) {
        setReviewError(
          `One or more reviews are too long. Limit: ${WORD_LIMIT} words.`,
        );
        return;
      }
    }
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    // Fetch current widget_reviews for this widget
    const { data: currentWidgetReviews, error: fetchError } = await supabase
      .from("widget_reviews")
      .select("id, review_id")
      .eq("widget_id", widgetId);
      
    if (fetchError) {
      setReviewError("Failed to fetch widget reviews: " + fetchError.message);
      return;
    }
    
    const currentIds = (currentWidgetReviews || []).map((r) => r.review_id);
    // Delete unselected reviews for this widget
    const selectedIds = selectedReviews.map((r) => r.review_id);
    if (currentIds.length > 0) {
      const idsToDelete = currentIds.filter((id) => !selectedIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase
          .from("widget_reviews")
          .delete()
          .eq("widget_id", widgetId)
          .in("review_id", idsToDelete);
      }
    }
    
    // Insert new reviews
    const { error } = await supabase
      .from("widget_reviews")
      .upsert(
        selectedReviews.map((review, index) => ({
          widget_id: widgetId,
          review_id: review.review_id,
          review_content: editedReviews[review.review_id] ?? review.review_content,
          first_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ')[0],
          last_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ').slice(1).join(' '),
          reviewer_role: editedRoles[review.review_id] ?? review.reviewer_role,
          platform: review.platform,
          order_index: index,
          star_rating: (editedRatings[review.review_id] !== undefined && editedRatings[review.review_id] !== null)
            ? Math.round(editedRatings[review.review_id]! * 2) / 2
            : (typeof review.star_rating === 'number' ? Math.round(review.star_rating * 2) / 2 : null),
          photo_url: photoUploads[review.review_id] || null,
        })),
        { onConflict: 'widget_id,review_id' }
      );

    if (error) {
      console.error("Error saving widget reviews:", error, JSON.stringify(error));
      alert("Failed to save reviews. Please try again.\n" + JSON.stringify(error));
      return;
    }
    
    onClose();
    if (onReviewsChange) onReviewsChange();
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = allReviews;
    
    // Apply search filter
    if (reviewSearch) {
      const searchLower = reviewSearch.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.review_content.toLowerCase().includes(searchLower) ||
          `${review.first_name} ${review.last_name}`.toLowerCase().includes(searchLower) ||
          (review.reviewer_role || "").toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      if (reviewSort === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // alphabetical
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });

    // Calculate pagination
    const totalPages = Math.ceil(sorted.length / reviewsPerPage);
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const paginatedReviews = sorted.slice(startIndex, startIndex + reviewsPerPage);
    
    return {
      reviews: paginatedReviews,
      totalPages,
      totalReviews: sorted.length
    };
  };

  const handleAddCustomReview = () => {
    const newReview = {
      review_id: crypto.randomUUID(),
      first_name: '',
      last_name: '',
      reviewer_role: '',
      review_content: '',
      star_rating: null,
      platform: 'custom',
      created_at: new Date().toISOString(),
    };
    setSelectedReviews([newReview, ...selectedReviews]);
    setEditedNames(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedRoles(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedReviews(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedRatings(prev => ({ ...prev, [newReview.review_id]: null }));
  };

  const { reviews, totalPages, totalReviews } = getFilteredAndSortedReviews();

  if (!isOpen) return null;

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Reviews"
      size="xl"
    >
      <div className="space-y-6">
        {/* Review Management Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Reviews</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as "recent" | "alphabetical")}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="recent">Recent</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
            
            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <FiveStarSpinner />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reviews.map((review) => {
                  const isSelected = selectedReviews.some((r) => r.review_id === review.review_id);
                  return (
                    <div
                      key={review.review_id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleReview(review)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {`${review.first_name} ${review.last_name}`}
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {review.reviewer_role}
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-2">
                            {review.review_content}
                          </div>
                        </div>
                        <div className="ml-2">
                          {isSelected ? (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * reviewsPerPage) + 1} to {Math.min(currentPage * reviewsPerPage, totalReviews)} of {totalReviews} reviews
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selected Reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Selected Reviews ({selectedReviews.length}/{MAX_WIDGET_REVIEWS})
              </h3>
              <button
                onClick={handleAddCustomReview}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Add Custom Review
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedReviews.map((review, index) => (
                <div key={review.review_id} className="p-3 border border-gray-200 rounded">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={editedNames[review.review_id] || `${review.first_name} ${review.last_name}`}
                        onChange={(e) => setEditedNames(prev => ({ ...prev, [review.review_id]: e.target.value }))}
                        placeholder="Reviewer name"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={editedRoles[review.review_id] || review.reviewer_role}
                        onChange={(e) => setEditedRoles(prev => ({ ...prev, [review.review_id]: e.target.value }))}
                        placeholder="Role"
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <textarea
                      value={editedReviews[review.review_id] || review.review_content}
                      onChange={(e) => handleReviewEdit(review.review_id, e.target.value)}
                      placeholder="Review content"
                      rows={3}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {wordCount(editedReviews[review.review_id] || review.review_content)} words
                      </div>
                      <button
                        onClick={() => handleToggleReview(review)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {reviewError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {reviewError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveReviews}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Reviews
          </button>
        </div>
      </div>
    </DraggableModal>
  );
} 