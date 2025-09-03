"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { DraggableModal } from './DraggableModal';
import StandardLoader from "@/app/(app)/components/StandardLoader";
import { PhotoUpload } from './PhotoUpload';
import { createClient } from '@/auth/providers/supabase';
import { apiClient } from '@/utils/apiClient';

const CHARACTER_LIMIT = 250;
const MAX_WIDGET_REVIEWS = 50;

function characterCount(str: string) {
  return str.trim().length;
}

interface ReviewManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetId: string | null;
  accountId?: string; // Account ID from parent component
  onReviewsChange?: () => void;
  design?: any; // Design configuration with showPlatform setting
}

export function ReviewManagementModal({ 
  isOpen, 
  onClose, 
  widgetId,
  accountId, 
  onReviewsChange,
  design
}: ReviewManagementModalProps) {
  const supabase = createClient();
  
  // Storage key for form data persistence
  const formStorageKey = `reviewManagement_${widgetId || 'new'}`;
  const selectedReviewsKey = `selectedReviews_${widgetId || 'new'}`;
  
  const [activeTab, setActiveTab] = useState('import');
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<any[]>(() => {
    // Restore selected reviews from localStorage
    if (typeof window !== 'undefined' && widgetId) {
      const savedSelected = localStorage.getItem(selectedReviewsKey);
      if (savedSelected) {
        try {
          const parsed = JSON.parse(savedSelected);
          console.log('📝 Restored selected reviews from localStorage:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('Failed to parse saved selected reviews:', e);
        }
      }
    }
    return [];
  });
  
  // Initialize edited fields from localStorage if available
  const [editedReviews, setEditedReviews] = useState<{ [id: string]: string }>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('📝 Restored review management data from localStorage');
          return parsed.editedReviews || {};
        } catch (e) {
          console.error('Failed to parse saved review data:', e);
        }
      }
    }
    return {};
  });
  
  const [editedNames, setEditedNames] = useState<{ [id: string]: string }>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.editedNames || {};
        } catch (e) {
          // Ignore
        }
      }
    }
    return {};
  });
  
  const [editedRoles, setEditedRoles] = useState<{ [id: string]: string }>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.editedRoles || {};
        } catch (e) {
          // Ignore
        }
      }
    }
    return {};
  });
  
  const [editedRatings, setEditedRatings] = useState<{ [id: string]: number | null }>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.editedRatings || {};
        } catch (e) {
          // Ignore
        }
      }
    }
    return {};
  });
  
  const [editedPlatforms, setEditedPlatforms] = useState<{ [id: string]: string }>(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(formStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          return parsed.editedPlatforms || {};
        } catch (e) {
          // Ignore
        }
      }
    }
    return {};
  });
  const [reviewError, setReviewError] = useState("");
  const [reviewSort, setReviewSort] = useState<"recent" | "alphabetical">("recent");
  const [reviewSearch, setReviewSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [reviewModalPos, setReviewModalPos] = useState({ x: 0, y: 0 });
  const [reviewModalDragging, setReviewModalDragging] = useState(false);
  const reviewModalDragStart = useRef<{ x: number; y: number } | null>(null);
  const reviewModalRef = useRef<HTMLDivElement>(null);
  const [photoUploads, setPhotoUploads] = useState<{ [id: string]: string }>({});
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{ [id: string]: boolean }>({});
  const [photoUploadErrors, setPhotoUploadErrors] = useState<{ [id: string]: string }>({});
  const [widgetType, setWidgetType] = useState<string | null>(null);
  const [showTrimConfirmation, setShowTrimConfirmation] = useState(false);
  const [reviewsToTrim, setReviewsToTrim] = useState<Array<{review: any, text: string, characterCount: number}>>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRestoredNotification, setShowRestoredNotification] = useState(false);

  // Auto-save edited review data to localStorage
  // IMPORTANT: We save the FULL text even if over character limit
  // This prevents data loss during editing - truncation only happens on actual save
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && widgetId && 
          (Object.keys(editedReviews).length > 0 || 
           Object.keys(editedNames).length > 0 || 
           Object.keys(editedRoles).length > 0 || 
           Object.keys(editedRatings).length > 0 ||
           Object.keys(editedPlatforms).length > 0)) {
        const dataToSave = {
          editedReviews, // Full text preserved, even if over 250 chars
          editedNames,
          editedRoles,
          editedRatings,
          editedPlatforms,
          timestamp: Date.now(),
          widgetId, // Include widgetId to ensure we restore to correct widget
          version: 2 // Version to handle future changes
        };
        localStorage.setItem(formStorageKey, JSON.stringify(dataToSave));
        console.log('💾 Auto-saved review management data to localStorage (full text preserved)');
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [editedReviews, editedNames, editedRoles, editedRatings, editedPlatforms, formStorageKey, widgetId]);

  // Auto-save selected reviews to localStorage
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && widgetId && selectedReviews.length > 0) {
        localStorage.setItem(selectedReviewsKey, JSON.stringify(selectedReviews));
        console.log('💾 Auto-saved selected reviews to localStorage:', selectedReviews.length);
      }
    }, 500); // Shorter debounce for selected reviews

    return () => clearTimeout(saveTimeout);
  }, [selectedReviews, selectedReviewsKey, widgetId]);

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
      // Get the current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ ReviewManagementModal: No authenticated user found');
        setReviewError("Authentication required. Please refresh the page and try again.");
        setLoadingReviews(false);
        return;
      }

      // Use account ID from prop - should always be provided by parent component
      const currentAccountId = accountId;
      if (!currentAccountId) {
        console.error('❌ ReviewManagementModal: No account ID provided as prop');
        setReviewError("Account information missing. Please refresh the page and try again.");
        setLoadingReviews(false);
        return;
      }

      console.log('🔍 ReviewManagementModal: Validating widget access for account:', currentAccountId);
      
      // Validate that the widget belongs to the current account
      const { data: widgetData, error: widgetError } = await supabase
        .from('widgets')
        .select('id, type, account_id')
        .eq('id', widgetId)
        .eq('account_id', currentAccountId)
        .single();

      if (widgetError || !widgetData) {
        console.error('❌ ReviewManagementModal: Widget validation failed:', {
          widgetId,
          accountId,
          error: widgetError,
          widgetData
        });
        
        // Clear the invalid widget selection
        setReviewError("This widget is not accessible with the current account. Please select a different widget or switch accounts.");
        setLoadingReviews(false);
        
        // Trigger modal close after a brief delay to show the error
        setTimeout(() => {
          onClose();
        }, 3000);
        
        return;
      }

      console.log('✅ ReviewManagementModal: Widget validated successfully:', widgetData);
      setWidgetType(widgetData.type || null);

      console.log('🔍 ReviewManagementModal: Fetching review_submissions...');
      // We already have accountId from the validation above

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
          star_rating,
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
        created_at: r.created_at,
        star_rating: r.star_rating
      }));

      // Available reviews should ONLY be actual customer submissions from review_submissions
      // Custom reviews should only appear in selected reviews, not in available reviews
      setAllReviews(mappedReviews);
      
      // Merge original created_at dates from review_submissions into widget_reviews
      // This fixes the issue where widget_reviews have incorrect dates
      const mergedWidgetReviews = (widgetReviews || []).map(wr => {
        // Find matching review from review_submissions to get original date
        const originalReview = mappedReviews.find(mr => mr.review_id === wr.review_id);
        if (originalReview) {
          // Use original created_at from review_submissions
          return { ...wr, created_at: originalReview.created_at };
        }
        // For custom reviews or reviews not found in submissions, keep existing date
        return wr;
      });
      
      // Check if we have unsaved selected reviews in localStorage
      const savedSelected = localStorage.getItem(selectedReviewsKey);
      if (savedSelected && (!widgetReviews || widgetReviews.length === 0)) {
        try {
          const parsed = JSON.parse(savedSelected);
          console.log('📝 Using unsaved selected reviews from localStorage:', parsed.length);
          setSelectedReviews(parsed);
          setHasUnsavedChanges(true);
          // Show a warning that there are unsaved selections
          setReviewError("You have unsaved review selections. Click Save to persist them or they will be lost.");
        } catch (e) {
          setSelectedReviews(mergedWidgetReviews);
        }
      } else {
        setSelectedReviews(mergedWidgetReviews);
        setHasUnsavedChanges(false);
      }
      
      console.log('✅ ReviewManagementModal: Available reviews (customer submissions only):', mappedReviews.length);
      console.log('✅ ReviewManagementModal: Selected reviews (includes custom reviews):', widgetReviews?.length || 0);
      
      // Try to restore saved data from localStorage first
      let restoredData: any = null;
      if (typeof window !== 'undefined') {
        const savedData = localStorage.getItem(formStorageKey);
        if (savedData) {
          try {
            restoredData = JSON.parse(savedData);
            // Check if the saved data is for the same widget
            if (restoredData.widgetId === widgetId) {
              console.log('📝 Found saved review data in localStorage, will merge with database data');
            } else {
              restoredData = null; // Ignore saved data if it's for a different widget
            }
          } catch (e) {
            console.error('Failed to parse saved review data:', e);
          }
        }
      }
      
      // Set edited fields to match the widget's current reviews
      const editedReviewsObj: { [id: string]: string } = {};
      const editedNamesObj: { [id: string]: string } = {};
      const editedRolesObj: { [id: string]: string } = {};
      const editedRatingsObj: { [id: string]: number | null } = {};
      const editedPlatformsObj: { [id: string]: string } = {};
      const photoUploadsObj: { [id: string]: string } = {};
      
      (widgetReviews || []).forEach((r) => {
        // Use saved data if available, otherwise use database values
        editedReviewsObj[r.review_id] = restoredData?.editedReviews?.[r.review_id] ?? r.review_content;
        editedNamesObj[r.review_id] = restoredData?.editedNames?.[r.review_id] ?? `${r.first_name} ${r.last_name}`;
        editedRolesObj[r.review_id] = restoredData?.editedRoles?.[r.review_id] ?? r.reviewer_role;
        editedRatingsObj[r.review_id] = restoredData?.editedRatings?.[r.review_id] ?? r.star_rating ?? null;
        editedPlatformsObj[r.review_id] = restoredData?.editedPlatforms?.[r.review_id] ?? r.platform ?? '';
        if (r.photo_url) {
          photoUploadsObj[r.review_id] = r.photo_url;
        }
      });
      
      // Also restore any edits for reviews that might have been removed from selection
      // but still have unsaved edits
      if (restoredData) {
        Object.keys(restoredData.editedReviews || {}).forEach(reviewId => {
          if (!editedReviewsObj[reviewId]) {
            editedReviewsObj[reviewId] = restoredData.editedReviews[reviewId];
          }
        });
        Object.keys(restoredData.editedNames || {}).forEach(reviewId => {
          if (!editedNamesObj[reviewId]) {
            editedNamesObj[reviewId] = restoredData.editedNames[reviewId];
          }
        });
        Object.keys(restoredData.editedRoles || {}).forEach(reviewId => {
          if (!editedRolesObj[reviewId]) {
            editedRolesObj[reviewId] = restoredData.editedRoles[reviewId];
          }
        });
        Object.keys(restoredData.editedRatings || {}).forEach(reviewId => {
          if (!editedRatingsObj[reviewId]) {
            editedRatingsObj[reviewId] = restoredData.editedRatings[reviewId];
          }
        });
        Object.keys(restoredData.editedPlatforms || {}).forEach(reviewId => {
          if (!editedPlatformsObj[reviewId]) {
            editedPlatformsObj[reviewId] = restoredData.editedPlatforms[reviewId];
          }
        });
      }
      
      setEditedReviews(editedReviewsObj);
      setEditedNames(editedNamesObj);
      setEditedRoles(editedRolesObj);
      setEditedRatings(editedRatingsObj);
      setEditedPlatforms(editedPlatformsObj);
      setPhotoUploads(photoUploadsObj);
      
      // If we restored data, show a notification
      if (restoredData && Object.keys(restoredData.editedReviews || {}).length > 0) {
        console.log('✅ ReviewManagementModal: Restored autosaved edits from localStorage');
        setHasUnsavedChanges(true);
        setShowRestoredNotification(true);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setShowRestoredNotification(false), 5000);
      }
      
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
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    
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
      setEditedPlatforms((prev) => {
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
      setEditedPlatforms((prev) => ({
        ...prev,
        [review.review_id]: review.platform || "",
      }));
    }
    setSelectedReviews(updated);
  };

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    setSelectedReviews(prev => {
      const newReviews = [...prev];
      if (direction === 'up' && index > 0) {
        [newReviews[index - 1], newReviews[index]] = [newReviews[index], newReviews[index - 1]];
      } else if (direction === 'down' && index < newReviews.length - 1) {
        [newReviews[index], newReviews[index + 1]] = [newReviews[index + 1], newReviews[index]];
      }
      return newReviews;
    });
    setHasUnsavedChanges(true);
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

  const handlePlatformEdit = (id: string, value: string) => {
    setEditedPlatforms((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhotoUpload = (reviewId: string, photoUrl: string) => {
    setPhotoUploads(prev => ({
      ...prev,
      [reviewId]: photoUrl
    }));
  };

  const handleSaveReviews = async () => {
    console.log('🎯 handleSaveReviews called', { widgetId, selectedReviewsCount: selectedReviews.length });
    if (!widgetId) {
      console.error('❌ No widgetId provided to handleSaveReviews');
      return;
    }
    
    // Check if any reviews exceed character limit and offer to trim
    const reviewsToTrim = [];
    for (const review of selectedReviews) {
      const text = editedReviews[review.review_id] ?? review.review_content;
      if (characterCount(text) > CHARACTER_LIMIT) {
        reviewsToTrim.push({
          review,
          text,
          characterCount: characterCount(text)
        });
      }
    }
    
    if (reviewsToTrim.length > 0) {
      console.log('📝 Reviews need trimming:', reviewsToTrim.length);
      setReviewsToTrim(reviewsToTrim);
      setShowTrimConfirmation(true);
      return;
    }
    
    // If no trimming needed, proceed with save
    console.log('✅ No trimming needed, proceeding with save');
    await handleSaveReviewsInternal();
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

  const handleConfirmTrim = async () => {
    console.log('🔍 ReviewManagementModal: handleConfirmTrim called');
    console.log('🔍 ReviewManagementModal: reviewsToTrim:', reviewsToTrim);
    
    // Auto-trim the reviews that are too long
    const trimmedUpdates: { [id: string]: string } = {};
    
    for (const item of reviewsToTrim) {
      const originalText = item.text;
      const trimmedText = item.text.substring(0, CHARACTER_LIMIT).trim();
      
      console.log(`🔍 ReviewManagementModal: Trimming review ${item.review.review_id}:`);
      console.log(`   Original length: ${originalText.length}`);
      console.log(`   Original text: "${originalText}"`);
      console.log(`   Trimmed length: ${trimmedText.length}`);
      console.log(`   Trimmed text: "${trimmedText}"`);
      
      trimmedUpdates[item.review.review_id] = trimmedText;
    }
    
    console.log('🔍 ReviewManagementModal: trimmedUpdates:', trimmedUpdates);
    
    // Update the edited reviews state with trimmed content for UI
    setEditedReviews(prev => {
      const newState = { ...prev, ...trimmedUpdates };
      console.log('🔍 ReviewManagementModal: Updated editedReviews state:', newState);
      return newState;
    });
    
    setShowTrimConfirmation(false);
    setReviewsToTrim([]);
    
    // Continue with save, passing the trimmed updates
    console.log('🔍 ReviewManagementModal: Calling handleSaveReviewsInternal with trimmedUpdates');
    await handleSaveReviewsInternal(trimmedUpdates);
  };

  const handleCancelTrim = () => {
    setShowTrimConfirmation(false);
    setReviewsToTrim([]);
    setReviewError(
      `${reviewsToTrim.length} review(s) exceed the ${CHARACTER_LIMIT} character limit. Please edit them under the Selected reviews tab.`
    );
  };

  const handleSaveReviewsInternal = async (trimmedUpdates: { [id: string]: string } = {}) => {
    console.log('🎯 handleSaveReviewsInternal called', { widgetId, selectedReviewsCount: selectedReviews.length });
    if (!widgetId) {
      console.error('❌ No widgetId in handleSaveReviewsInternal');
      setReviewError("No widget selected. Please select a widget and try again.");
      return;
    }
    
    // Clear any existing errors
    setReviewError("");
    
    // Validate widget access before attempting to save
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReviewError("Your session has expired. Please refresh the page and try again.");
        return;
      }
      
      // Use account ID from prop - should always be provided by parent component
      const currentAccountId = accountId;
      if (!currentAccountId) {
        setReviewError("Account information missing. Please refresh the page and try again.");
        return;
      }
      
      // Quick validation check to ensure widget is still accessible
      const { data: widgetCheck, error: checkError } = await supabase
        .from('widgets')
        .select('id')
        .eq('id', widgetId)
        .eq('account_id', currentAccountId)
        .single();
        
      if (checkError || !widgetCheck) {
        console.error('❌ Widget validation failed before save:', {
          widgetId,
          accountId,
          error: checkError
        });
        setReviewError("This widget is no longer accessible. Please close this dialog and select a different widget.");
        
        // Close modal after showing error
        setTimeout(() => {
          onClose();
        }, 3000);
        return;
      }
    } catch (validationError) {
      console.error('❌ Error validating widget access:', validationError);
      setReviewError("Unable to verify widget access. Please refresh the page and try again.");
      return;
    }
    
    // Use selectedReviews directly - they already contain all reviews including custom ones
    const reviewsToProcess = [...selectedReviews];
    
    // Prepare reviews for API call (all reviews should now be within limits)
    const reviewsToSave = reviewsToProcess.map((review, index) => {
      const rawRating = editedRatings[review.review_id] !== undefined 
        ? editedRatings[review.review_id]
        : review.star_rating;
      
      const finalRating = rawRating !== null && rawRating !== undefined
        ? Math.round(rawRating * 2) / 2
        : null;
      
      console.log(`🌟 Star Rating Debug for ${review.review_id}:`, {
        original: review.star_rating,
        edited: editedRatings[review.review_id],
        raw: rawRating,
        final: finalRating
      });
      
      return {
        review_id: review.review_id,
        review_content: trimmedUpdates[review.review_id] ?? editedReviews[review.review_id] ?? review.review_content,
        first_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ')[0],
        last_name: (editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()).split(' ').slice(1).join(' '),
        reviewer_role: editedRoles[review.review_id] ?? review.reviewer_role,
        platform: editedPlatforms[review.review_id] ?? review.platform,
        star_rating: finalRating,
        photo_url: photoUploads[review.review_id] || null,
        created_at: review.created_at, // Preserve original submission date
      };
    });

    console.log('📤 Saving reviews to API:', { widgetId, reviewsCount: reviewsToSave.length });
    try {
      // Use apiClient which handles auth automatically
      const result = await apiClient.put(`/widgets/${widgetId}/reviews`, { reviews: reviewsToSave });
      console.log("✅ Reviews saved successfully:", result);
      
      // Clear saved form data on successful save
      if (typeof window !== 'undefined') {
        localStorage.removeItem(formStorageKey);
        localStorage.removeItem(selectedReviewsKey);
        console.log('🗑️ Cleared review management data and selected reviews from localStorage after successful save');
      }
      
      setHasUnsavedChanges(false);
      
      // Show success message temporarily
      setReviewError(""); // Clear any errors
      const successMsg = document.createElement('div');
      successMsg.textContent = `Successfully saved ${reviewsToSave.length} reviews`;
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
      onClose();
      if (onReviewsChange) onReviewsChange();
    } catch (error: any) {
      console.error("❌ Error saving widget reviews:", error);
      
      // Provide user-friendly error messages based on error type
      let errorMessage = "Failed to save reviews. ";
      
      if (error.message?.includes('403') || error.message?.includes('access denied')) {
        errorMessage = "This widget is not accessible with the current account. Please refresh the page or switch to the correct account.";
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
        errorMessage = "Your session has expired. Please refresh the page and try again.";
      } else if (error.message?.includes('404') || error.message?.includes('not found')) {
        errorMessage = "Widget not found. It may have been deleted. Please refresh the page.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = `Failed to save reviews: ${error.message}`;
      } else {
        errorMessage = "An unexpected error occurred. Please try again or contact support if the issue persists.";
      }
      
      // Log detailed error info for debugging
      if (error.response) {
        console.error("❌ Error response:", error.response);
      }
      if (error.data) {
        console.error("❌ Error data:", error.data);
      }
      
      setReviewError(errorMessage);
    }
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
          {hasUnsavedChanges && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </span>
          )}
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
      
      {/* Restored data notification */}
      {showRestoredNotification && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-blue-800">
            Your unsaved edits have been restored. Remember to save your changes when you're done.
          </span>
        </div>
      )}

      {loadingReviews ? (
        <StandardLoader isLoading={true} mode="inline" />
      ) : (
        <>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/30">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('import')}
                className={`${
                  activeTab === 'import'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } whitespace-nowrap py-2 px-3 rounded-lg font-medium text-sm transition-colors`}
              >
                Available reviews
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`${
                  activeTab === 'edit'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } whitespace-nowrap py-2 px-3 rounded-lg font-medium text-sm transition-colors`}
              >
                Selected reviews ({selectedReviews.length}/{MAX_WIDGET_REVIEWS})
              </button>
            </nav>
          </div>

          <div className="mt-2">
            {activeTab === 'import' && (
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
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
                          {review.star_rating && (
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span
                                  key={star}
                                  className={`text-sm ${star <= review.star_rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">({review.star_rating})</span>
                            </div>
                          )}
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
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-white/30 space-y-4">
                {widgetType === 'photo' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      📸 <strong>Photo Widget:</strong> You can upload photos for each review below. Photos will be displayed alongside the review content in your widget.
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Selected reviews ({selectedReviews.length}/{MAX_WIDGET_REVIEWS})</h3>
                  <button
                    onClick={() => {
                      // Just add a blank custom review to the selected list
                      const customReview = {
                        review_id: crypto.randomUUID(),
                        first_name: '',
                        last_name: '',
                        reviewer_role: '',
                        review_content: '',
                        star_rating: 5,
                        platform: '',
                        created_at: new Date().toISOString(),
                        isCustom: true,
                      };
                      
                      // Add to selected reviews at the beginning
                      setSelectedReviews([customReview, ...selectedReviews]);
                      setEditedNames(prev => ({ ...prev, [customReview.review_id]: '' }));
                      setEditedRoles(prev => ({ ...prev, [customReview.review_id]: '' }));
                      setEditedReviews(prev => ({ ...prev, [customReview.review_id]: '' }));
                      setEditedRatings(prev => ({ ...prev, [customReview.review_id]: 5 }));
                      setEditedPlatforms(prev => ({ ...prev, [customReview.review_id]: '' }));
                      setHasUnsavedChanges(true);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                    disabled={selectedReviews.length >= MAX_WIDGET_REVIEWS}
                  >
                    Add custom review
                  </button>
                </div>

                {false ? (
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-3">Add new custom review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newCustomReview.first_name}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, first_name: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newCustomReview.last_name}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, last_name: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer role</label>
                        <input
                          type="text"
                          placeholder="e.g. 'Verified Customer'"
                          value={newCustomReview.reviewer_role}
                          onChange={(e) => setNewCustomReview({ ...newCustomReview, reviewer_role: e.target.value })}
                          className="p-2 border rounded-md w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Star rating</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review content</label>
                      <textarea
                        placeholder="Write the review content here..."
                        value={newCustomReview.review_content}
                        onChange={(e) => setNewCustomReview({ ...newCustomReview, review_content: e.target.value })}
                        className={`w-full p-2 border rounded-md mb-1 ${
                          newCustomReview.review_content.length > 250
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                        }`}
                        rows={3}
                      />
                      <div className="mb-3 flex items-center justify-between">
                        <div className={`text-xs ${
                          newCustomReview.review_content.length > 250
                            ? 'text-yellow-600 font-medium'
                            : 'text-gray-500'
                        }`}>
                          {newCustomReview.review_content.length}/250 characters
                        </div>
                        {newCustomReview.review_content.length > 250 && (
                          <div className="text-xs text-yellow-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Text will be truncated when saved
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowAddCustomReview(false)} className="text-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedReviews.map((review, index) => (
                      <div key={review.review_id} className="p-4 bg-white rounded-lg border shadow-sm relative">
                        {/* Move arrows */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => handleMoveReview(index, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Move up"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveReview(index, 'down')}
                            disabled={index === selectedReviews.length - 1}
                            className={`p-1 rounded ${index === selectedReviews.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            title="Move down"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Date and platform info */}
                        <div className="text-xs text-gray-500 mb-2">
                          Submitted {new Date(review.created_at).toLocaleDateString()} 
                          {design?.showPlatform && review.platform && ` via ${review.platform}`}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={editedNames[review.review_id] || ''}
                              onChange={(e) => handleNameEdit(review.review_id, e.target.value)}
                              className="p-2 border rounded-md font-semibold w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer role</label>
                            <input
                              type="text"
                              placeholder="e.g. 'Verified Customer'"
                              value={editedRoles[review.review_id] || ''}
                              onChange={(e) => handleRoleEdit(review.review_id, e.target.value)}
                              className="p-2 border rounded-md w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Star rating</label>
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
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                            <input
                              type="text"
                              placeholder="e.g. 'Google', 'Yelp', 'Facebook'"
                              value={editedPlatforms[review.review_id] || ''}
                              onChange={(e) => handlePlatformEdit(review.review_id, e.target.value)}
                              className="p-2 border rounded-md w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Review content <span className="text-red-500">*</span></label>
                          <textarea
                            value={editedReviews[review.review_id] || ""}
                            onChange={(e) => handleReviewEdit(review.review_id, e.target.value)}
                            className={`w-full p-2 border rounded-md ${
                              (editedReviews[review.review_id] || "").length > 250
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-300'
                            }`}
                            rows={3}
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <div className={`text-xs ${
                              (editedReviews[review.review_id] || "").length > 250
                                ? 'text-yellow-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              {(editedReviews[review.review_id] || "").length}/250 characters
                            </div>
                            {(editedReviews[review.review_id] || "").length > 250 && (
                              <div className="text-xs text-yellow-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Text will be truncated when saved
                              </div>
                            )}
                          </div>
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
              onClick={() => {
                console.log('🔘 Save button clicked!');
                handleSaveReviews();
              }}
            >
              Save
            </button>
          </div>
        </>
      )}
      
      {/* Character Limit Confirmation Modal */}
      {showTrimConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 max-w-md mx-4 border-2 border-white">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Character Limit Exceeded</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                {reviewsToTrim.length} review(s) are over the {CHARACTER_LIMIT} character limit. 
                Continue and they will be automatically trimmed, or cancel and edit under the Selected reviews tab.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelTrim}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTrim}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </DraggableModal>
  );
} 