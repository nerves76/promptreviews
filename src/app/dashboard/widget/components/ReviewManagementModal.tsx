"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { DraggableModal } from './DraggableModal';
import AppLoader from "@/app/components/AppLoader";
import { PhotoUpload } from './PhotoUpload';
import { createClient } from '@/utils/supabaseClient';

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
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('import');
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
  const [newCustomReview, setNewCustomReview] = useState<{
    review_content: string;
    first_name: string;
    last_name: string;
    reviewer_role: string;
    star_rating: number | null;
  }>({
    review_content: "",
    first_name: "",
    last_name: "",
    reviewer_role: "",
    star_rating: null,
  });
  const [photoUploads, setPhotoUploads] = useState<{ [id: string]: string }>({});
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{ [id: string]: boolean }>({});
  const [photoUploadErrors, setPhotoUploadErrors] = useState<{ [id: string]: string }>({});
  const [widgetType, setWidgetType] = useState<string | null>(null);

  // Fetch reviews when modal opens
  useEffect(() => {
    if (!isOpen || !widgetId) return;
    handleOpenReviewModal(widgetId);
  }, [isOpen, widgetId]);

  const handleOpenReviewModal = async (widgetId: string) => {
    console.log('🔍 ReviewManagementModal: Starting to load reviews for widget:', widgetId);
    setLoadingReviews(true);
    setReviewError("");
    
    try {
      console.log('🔍 ReviewManagementModal: Fetching widget type...');
      // First, fetch the widget to determine its type
      const { data: widgetData, error: widgetError } = await supabase
        .from('widgets')
        .select('type')
        .eq('id', widgetId)
        .single();

      if (widgetError) {
        console.error('[DEBUG] Error fetching widget type:', widgetError);
      } else {
        console.log('✅ ReviewManagementModal: Widget type fetched:', widgetData?.type);
        setWidgetType(widgetData?.type || null);
      }

      console.log('🔍 ReviewManagementModal: Fetching review_submissions...');
      
      // Get the current user's account ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ ReviewManagementModal: No authenticated user found');
        setReviewError("Authentication required");
        setLoadingReviews(false);
        return;
      }

      // Get account ID for the current user
      const { data: accountUser, error: accountUserError } = await supabase
        .from('account_users')
        .select('account_id')
        .eq('user_id', user.id)
        .single();

      if (accountUserError || !accountUser?.account_id) {
        console.error('❌ ReviewManagementModal: No account found for user:', accountUserError);
        setReviewError("No account found for user");
        setLoadingReviews(false);
        return;
      }

      const accountId = accountUser.account_id;
      console.log('✅ ReviewManagementModal: Found account ID:', accountId);

      // Fetch reviews from review_submissions for this account by joining with prompt_pages
      const { data: reviews, error: reviewsError } = await supabase
        .from('review_submissions')
        .select(`
          id, 
          first_name, 
          last_name, 
          reviewer_role, 
          review_content, 
          platform, 
          created_at,
          prompt_pages!inner(account_id)
        `)
        .eq('prompt_pages.account_id', accountId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('[DEBUG] Error fetching review_submissions:', reviewsError);
        setReviewError("Failed to load reviews: " + reviewsError.message);
        setLoadingReviews(false);
        return;
      }

      console.log('✅ ReviewManagementModal: Review submissions fetched:', reviews?.length || 0);

      // Fetch selected reviews for this widget from widget_reviews
      const { data: widgetReviews, error: widgetReviewsError } = await supabase
        .from("widget_reviews")
        .select(
          "review_id, review_content, first_name, last_name, reviewer_role, platform, created_at, star_rating, photo_url"
        )
        .eq("widget_id", widgetId)
        .order("order_index", { ascending: true });

      if (widgetReviewsError) {
        console.error('[DEBUG] Error fetching widget_reviews:', widgetReviewsError);
        setSelectedReviews([]);
        setEditedReviews({});
        setEditedNames({});
        setEditedRoles({});
        setEditedRatings({});
        setPhotoUploads({});
        setLoadingReviews(false);
        return;
      }
      
      console.log('✅ ReviewManagementModal: Widget reviews fetched:', widgetReviews?.length || 0);

      // Map review_submissions to the expected format
      const mappedReviews = (reviews || []).map(r => ({
        review_id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        reviewer_role: r.reviewer_role,
        review_content: r.review_content,
        platform: r.platform,
        created_at: r.created_at
      }));

      // Available reviews should ONLY be actual customer submissions from review_submissions
      // Custom reviews should only appear in selected reviews, not in available reviews
      setAllReviews(mappedReviews);
      setSelectedReviews(widgetReviews || []);
      
      console.log('✅ ReviewManagementModal: Available reviews (customer submissions only):', mappedReviews.length);
      console.log('✅ ReviewManagementModal: Selected reviews (includes custom reviews):', widgetReviews?.length || 0);
      
      // Set edited fields to match the widget's current reviews
      const editedReviewsObj: { [id: string]: string } = {};
      const editedNamesObj: { [id: string]: string } = {};
      const editedRolesObj: { [id: string]: string } = {};
      const editedRatingsObj: { [id: string]: number | null } = {};
      const photoUploadsObj: { [id: string]: string } = {};
      
      (widgetReviews || []).forEach((r) => {
        editedReviewsObj[r.review_id] = r.review_content;
        editedNamesObj[r.review_id] = `${r.first_name} ${r.last_name}`;
        editedRolesObj[r.review_id] = r.reviewer_role;
        editedRatingsObj[r.review_id] = r.star_rating ?? null;
        if (r.photo_url) {
          photoUploadsObj[r.review_id] = r.photo_url;
        }
      });
      
      setEditedReviews(editedReviewsObj);
      setEditedNames(editedNamesObj);
      setEditedRoles(editedRolesObj);
      setEditedRatings(editedRatingsObj);
      setPhotoUploads(photoUploadsObj);
      
      console.log('✅ ReviewManagementModal: All data loaded successfully');
      
    } catch (error) {
      console.error('❌ ReviewManagementModal: Unexpected error:', error);
      setReviewError("Failed to load reviews: " + (error as Error).message);
    } finally {
      console.log('🔍 ReviewManagementModal: Setting loadingReviews to false');
      setLoadingReviews(false);
    }
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
      setPhotoUploads((prev) => {
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

  const handleNameEdit = (id: string, value: string) => {
    setEditedNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleRoleEdit = (id: string, value: string) => {
    setEditedRoles((prev) => ({ ...prev, [id]: value }));
  };

  const handleRatingEdit = (id: string, value: number | null) => {
    setEditedRatings((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoUpload = (reviewId: string, photoUrl: string) => {
    setPhotoUploads(prev => ({
      ...prev,
      [reviewId]: photoUrl
    }));
  };

  const handleSaveReviews = async () => {
    if (!widgetId) return;
    
    // Add new custom review if it exists and is valid
    if (
      newCustomReview.review_content?.trim() &&
      newCustomReview.first_name?.trim() &&
      newCustomReview.star_rating !== null
    ) {
      const customReview = {
        review_id: crypto.randomUUID(),
        first_name: newCustomReview.first_name.trim(),
        last_name: newCustomReview.last_name?.trim() || '',
        reviewer_role: newCustomReview.reviewer_role?.trim() || '',
        review_content: newCustomReview.review_content.trim(),
        star_rating: newCustomReview.star_rating,
        platform: 'custom',
        created_at: new Date().toISOString(),
      };
      
      selectedReviews.unshift(customReview);
      setEditedNames(prev => ({ ...prev, [customReview.review_id]: `${customReview.first_name} ${customReview.last_name}`.trim() }));
      setEditedRoles(prev => ({ ...prev, [customReview.review_id]: customReview.reviewer_role }));
      setEditedReviews(prev => ({ ...prev, [customReview.review_id]: customReview.review_content }));
      setEditedRatings(prev => ({ ...prev, [customReview.review_id]: customReview.star_rating }));
      
      // Reset the custom review form
      setNewCustomReview({
        review_content: "",
        first_name: "",
        last_name: "",
        reviewer_role: "",
        star_rating: null,
      });
      setShowAddCustomReview(false);
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
    
    // Prepare reviews for API call
    const reviewsToSave = selectedReviews.map((review, index) => ({
      review_id: review.review_id,
      review_content: editedReviews[review.review_id] ?? review.review_content,
      first_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ')[0],
      last_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ').slice(1).join(' '),
      reviewer_role: editedRoles[review.review_id] ?? review.reviewer_role,
      platform: review.platform,
      star_rating: (editedRatings[review.review_id] !== undefined && editedRatings[review.review_id] !== null)
        ? Math.round(editedRatings[review.review_id]! * 2) / 2
        : (typeof review.star_rating === 'number' ? Math.round(review.star_rating * 2) / 2 : null),
      photo_url: photoUploads[review.review_id] || null,
    }));

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setReviewError("Authentication required. Please refresh the page and try again.");
        return;
      }

      // Call the new API route
      const response = await fetch(`/api/widgets/${widgetId}/reviews`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reviews: reviewsToSave })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        setReviewError(`Failed to save reviews: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const result = await response.json();
      console.log("Reviews saved successfully:", result);
      
      onClose();
      if (onReviewsChange) onReviewsChange();
    } catch (error) {
      console.error("Error saving widget reviews:", error);
      setReviewError("Failed to save reviews. Please try again.");
    }
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
      isCustom: true,
    };
    
    // Add custom review only to selected reviews (right side)
    // Custom reviews should NOT appear in available reviews (left side)
    setSelectedReviews([newReview, ...selectedReviews]);
    
    // Initialize edited fields
    setEditedNames(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedRoles(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedReviews(prev => ({ ...prev, [newReview.review_id]: '' }));
    setEditedRatings(prev => ({ ...prev, [newReview.review_id]: null }));
  };

  const { reviews, totalPages, totalReviews } = getFilteredAndSortedReviews();

  console.log('🔍 ReviewManagementModal: Render state:', {
    isOpen,
    loadingReviews,
    allReviewsCount: allReviews.length,
    selectedReviewsCount: selectedReviews.length,
    activeTab,
    widgetType,
    reviewsCount: reviews.length
  });

  if (!isOpen) return null;

  return (
    <DraggableModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>Manage reviews</span>
          {widgetType && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: 
                  widgetType === 'single' ? '#60A5FA' :
                  widgetType === 'multi' ? '#34D399' :
                  widgetType === 'photo' ? '#A78BFA' : '#6B7280',
                color: 'white'
              }}
            >
              {widgetType === 'single' && 'Single card'}
              {widgetType === 'multi' && 'Multi card'}
              {widgetType === 'photo' && 'Photo'}
            </span>
          )}
        </div>
      }
      onSave={handleSaveReviews}
      saveLabel="Save"
    >
      {/* Top right save button is now handled by DraggableModal via onSave prop */}

      {loadingReviews ? (
        <div className="flex justify-center items-center h-96">
          <AppLoader />
        </div>
      ) : (
        <>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('import')}
                className={`${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Available reviews
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`${
                  activeTab === 'edit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Selected reviews ({selectedReviews.length}/{MAX_WIDGET_REVIEWS})
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'import' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as "recent" | "alphabetical")}
                    className="ml-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {reviews.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No reviews found for your account.</p>
                      <p className="text-sm mt-1">Reviews will appear here once they are submitted through your prompt pages.</p>
                    </div>
                  ) : (
                    reviews.map((review: any) => (
                    <div
                      key={review.review_id}
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedReviews.some((r) => r.review_id === review.review_id)
                          ? "bg-blue-100 border border-blue-300"
                          : "bg-gray-50 hover:bg-gray-100 border"
                      }`}
                      onClick={() => handleToggleReview(review)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {review.first_name} {review.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{review.review_content.substring(0, 70)}...</p>
                        </div>
                        {selectedReviews.some((r) => r.review_id === review.review_id) && (
                           <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white">✓</div>
                        )}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'edit' && (
              <div className="space-y-4">
                {widgetType === 'photo' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📸 <strong>Photo Widget:</strong> You can upload photos for each review below. Photos will be displayed alongside the review content in your widget.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Selected Reviews ({selectedReviews.length}/{MAX_WIDGET_REVIEWS})</h3>
                  <button
                    onClick={() => setShowAddCustomReview(true)}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                  >
                    Add Custom Review
                  </button>
                </div>

                {showAddCustomReview ? (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-3">Add New Custom Review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newCustomReview.first_name}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, first_name: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newCustomReview.last_name}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, last_name: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Role</label>
                        <input
                          type="text"
                          placeholder="e.g. 'Verified Customer'"
                          value={newCustomReview.reviewer_role}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, reviewer_role: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                        <input
                          type="number"
                          placeholder="1-5"
                          step="0.5"
                          min="1"
                          max="5"
                          value={newCustomReview.star_rating !== null ? String(newCustomReview.star_rating) : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewCustomReview({
                              ...newCustomReview,
                              star_rating: value === '' ? null : parseFloat(value),
                            });
                          }}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
                      <textarea
                        placeholder="Write the review content here..."
                        value={newCustomReview.review_content}
                        onChange={(e) => setNewCustomReview({ ...newCustomReview, review_content: e.target.value })}
                        className="w-full p-2 border rounded-md mb-3"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowAddCustomReview(false)} className="text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedReviews.map((review) => (
                      <div key={review.review_id} className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={editedNames[review.review_id] || ''}
                              onChange={(e) => handleNameEdit(review.review_id, e.target.value)}
                              className="p-2 border rounded-md font-semibold w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Role</label>
                            <input
                              type="text"
                              placeholder="e.g. 'Verified Customer'"
                              value={editedRoles[review.review_id] || ''}
                              onChange={(e) => handleRoleEdit(review.review_id, e.target.value)}
                              className="p-2 border rounded-md w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                            <input
                              type="number"
                              placeholder="1-5"
                              step="0.5"
                              min="1"
                              max="5"
                              value={editedRatings[review.review_id] ?? ''}
                              onChange={(e) => handleRatingEdit(review.review_id, parseFloat(e.target.value) || null)}
                              className="p-2 border rounded-md w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Review Content</label>
                          <textarea
                            value={editedReviews[review.review_id] || ""}
                            onChange={(e) => handleReviewEdit(review.review_id, e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows={3}
                          />
                        </div>
                        
                        {/* Photo Upload Section for Photo Widgets */}
                        {widgetType === 'photo' && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Review Photo
                            </label>
                            <PhotoUpload
                              reviewId={review.review_id}
                              selectedWidget={widgetId || ''}
                              onPhotoUpload={handlePhotoUpload}
                              initialPhotoUrl={photoUploads[review.review_id]}
                            />
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-500">
                            {wordCount(editedReviews[review.review_id] || "")}/{WORD_LIMIT} words
                          </div>
                          <button
                            onClick={() => handleToggleReview(review)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                            title="Remove review"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Bottom right save button */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              className="px-5 py-2 bg-slate-blue text-white rounded font-semibold shadow hover:bg-slate-700 transition"
              style={{ minWidth: 90 }}
              onClick={handleSaveReviews}
            >
              Save
            </button>
          </div>
        </>
      )}
    </DraggableModal>
  );
} 