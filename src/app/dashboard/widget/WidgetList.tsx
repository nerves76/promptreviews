"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FaCopy, FaArrowsAlt } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { smartMergeDesign } from '../utils/smartMergeDesign';

const WORD_LIMIT = 250;
const MAX_WIDGET_REVIEWS = 8;

type Widget = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  widget_type: string;
};

function wordCount(str: string) {
  return str.trim().split(/\s+/).length;
}

// Add type for design state
export type DesignState = {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
  bodyTextColor: string;
  nameTextColor: string;
  roleTextColor: string;
  quoteFontSize: number;
  attributionFontSize: number;
  borderRadius: number;
  shadow: boolean;
  bgOpacity: number;
  autoAdvance: boolean;
  slideshowSpeed: number;
  border: boolean;
  borderWidth: number;
  lineSpacing: number;
  showQuotes: boolean;
  showRelativeDate: boolean;
  showGrid: boolean;
  width: number;
  sectionBgType: "none" | "custom";
  sectionBgColor: string;
  shadowIntensity: number;
  shadowColor: string;
  borderColor: string;
  font: string;
  showSubmitReviewButton: boolean;
};

export default function WidgetList({
  onSelectWidget,
  selectedWidgetId,
  onDesignChange,
  design: parentDesign,
  onWidgetReviewsChange,
}: {
  onSelectWidget?: (widget: any) => void;
  selectedWidgetId?: string;
  onDesignChange?: (design: DesignState) => void;
  design: DesignState; // Make design required
  onWidgetReviewsChange?: () => void;
}) {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null as null | string);
  const [form, setForm] = useState({
    name: "New Widget",
    widgetType: "multi",
  });

  // Remove local design state and use parentDesign directly
  const design = parentDesign;

  // Update design state handlers with proper types
  const handleDesignChange = (field: keyof DesignState, value: any) => {
    if (onDesignChange) {
      const newDesign = {
        ...design,
        [field]: value,
      };
      console.log('handleDesignChange:', field, value, newDesign);
      onDesignChange(newDesign);
    }
  };

  // Update handleResetDesign to use onDesignChange
  const handleResetDesign = () => {
    if (onDesignChange) {
      onDesignChange({
        bgType: "solid",
        bgColor: "#FDFBF2",
        textColor: "#22223b",
        accentColor: "#6a5acd",
        bodyTextColor: "#22223b",
        nameTextColor: "#1a237e",
        roleTextColor: "#6b7280",
        quoteFontSize: 18,
        attributionFontSize: 15,
        borderRadius: 16,
        shadow: true,
        bgOpacity: 1,
        autoAdvance: false,
        slideshowSpeed: 4,
        border: true,
        borderWidth: 2,
        lineSpacing: 1.4,
        showQuotes: false,
        showRelativeDate: false,
        showGrid: false,
        width: 1000,
        sectionBgType: "none",
        sectionBgColor: "#ffffff",
        shadowIntensity: 0.2,
        shadowColor: '#222222',
        borderColor: '#cccccc',
        font: "Inter",
        showSubmitReviewButton: true,
      });
    }
  };

  // Review management state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | string>(null);
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

  // Draggable edit modal state
  const [editModalPos, setEditModalPos] = useState({ x: 0, y: 0 });
  const [editDragging, setEditDragging] = useState(false);
  const editDragStart = useRef<{ x: number; y: number } | null>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Copy embed code state
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);

  // Add a new state for photo uploads
  const [photoUploads, setPhotoUploads] = useState<{ [id: string]: string }>({});

  // Add a new state for photo upload progress and errors
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{ [id: string]: boolean }>({});
  const [photoUploadErrors, setPhotoUploadErrors] = useState<{ [id: string]: string }>({});

  // Add state for name error and input ref
  const [nameError, setNameError] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Center edit modal after mount
  useEffect(() => {
    if (showForm) {
      const width = 500;
      const height = 500;
      const x = Math.max((window.innerWidth - width) / 2, 0);
      const y = Math.max((window.innerHeight - height) / 2, 0);
      setEditModalPos({ x, y });
    }
  }, [showForm]);

  // Update this effect to only depend on showForm:
  useEffect(() => {
    if (onDesignChange) onDesignChange(design);
  }, [design, onDesignChange]);

  // Add effect to update design when selected widget changes
  useEffect(() => {
    if (selectedWidget) {
      const widget = widgets.find(w => w.id === selectedWidget);
      if (widget?.design && onDesignChange) {
        onDesignChange(widget.design);
      }
    }
  }, [selectedWidget, widgets, onDesignChange]);

  // Add effect to ensure showSubmitReviewButton is preserved when saving
  useEffect(() => {
    if (design && typeof design.showSubmitReviewButton === 'undefined' && onDesignChange) {
      onDesignChange({
        ...design,
        showSubmitReviewButton: true
      });
    }
  }, [design, onDesignChange]);

  // Listen for openNewWidgetForm event from parent
  useEffect(() => {
    const handler = () => {
      handleOpenForm();
    };
    window.addEventListener("openNewWidgetForm", handler);
    return () => window.removeEventListener("openNewWidgetForm", handler);
  }, []);

  // Update the useEffect for showReviewModal to fetch from review_submissions for allReviews, and widget_reviews for selectedReviews.
  useEffect(() => {
    if (!showReviewModal || !selectedWidget) return;
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    console.log('[DEBUG] Fetching reviews for widget:', selectedWidget);
    
    // Fetch all available reviews from review_submissions (no prompt_page_id filter)
    supabase
      .from('review_submissions')
      .select('id, first_name, last_name, reviewer_role, review_content, platform, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        console.log('[DEBUG] Raw review_submissions data:', data);
        console.log('[DEBUG] review_submissions error:', error);
        
        if (error) {
          console.error('[DEBUG] Error fetching review_submissions:', error);
          setLoadingReviews(false);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log('[DEBUG] No reviews found in review_submissions');
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
        
        console.log('[DEBUG] Mapped reviews:', mappedReviews);
        setAllReviews(mappedReviews);
        setLoadingReviews(false);
      });

    // Fetch selected reviews for this widget from widget_reviews
    supabase
      .from('widget_reviews')
      .select('id, review_id, review_content, first_name, last_name, reviewer_role, platform, created_at, star_rating, order_index')
      .eq('widget_id', selectedWidget)
      .order('order_index', { ascending: true })
      .then(({ data, error }) => {
        console.log('[DEBUG] widget_reviews data:', data);
        console.log('[DEBUG] widget_reviews error:', error);
        setSelectedReviews(data || []);
      });
  }, [showReviewModal, selectedWidget]);

  // Move fetchWidgets to the top level and use useCallback
  const fetchWidgets = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setWidgets([]);
      return;
    }
    // Only fetch widgets for the current user
    const { data, error } = await supabase
      .from("widgets")
      .select("*")
      .eq("account_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching widgets:", error);
    } else {
      setWidgets(data || []);
    }
  }, []);

  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  const handleOpenForm = (widget?: Widget) => {
    if (widget) {
      setEditing(widget.id);
      setSelectedWidget(widget.id);
      setForm({ name: widget.name, widgetType: widget.widget_type || "multi" });
    } else {
      setEditing(null);
      setSelectedWidget(null);
      setForm({ name: "", widgetType: "multi" });
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
    setShowForm(true);
    setNameError("");
  };

  // Update state update functions with proper types
  const handleSave = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    console.log("DEBUG: handleSave user:", user);
    if (!user) {
      alert("You must be signed in to save a widget");
      return;
    }
    try {
      // Validate required fields
      if (!form.name.trim() || form.name.trim().toLowerCase() === "new widget") {
        setNameError("Please enter a unique widget name");
        nameInputRef.current?.focus();
        throw new Error("Widget name is required");
      }
      setNameError("");

      // First try to get existing account
      let { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', user.id) // CHANGED: use 'id' for accounts table
        .single();

      console.log("DEBUG: Existing account check:", { accountData, accountError });

      // If no account exists, create one
      if (!accountData?.id) {
        console.log("DEBUG: Creating new account for user:", user.id);
        const { data: newAccount, error: createError } = await supabase
          .from('accounts')
          .insert({ id: user.id }) // CHANGED: use 'id' for accounts table
          .select('id')
          .single();

        console.log("DEBUG: Account creation result:", { newAccount, createError });

        if (createError) {
          console.error("Error creating account:", createError);
          // If it's a unique constraint violation, try fetching the account again
          if (createError.code === '23505') { // PostgreSQL unique violation code
            const { data: existingAccount } = await supabase
              .from('accounts')
              .select('id')
              .eq('id', user.id) // CHANGED: use 'id' for accounts table
              .single();
            accountData = existingAccount;
          } else {
            throw new Error(`Failed to create account: ${createError.message}`);
          }
        } else {
          accountData = newAccount;
        }
      }

      if (!accountData?.id) {
        throw new Error("No account found or created for user");
      }

      const accountId = accountData.id;
      console.log("DEBUG: Using account ID:", accountId);

      if (selectedWidget) {
        // Update existing widget
        const { error: updateError } = await supabase
          .from('widgets')
          .update({
            name: form.name.trim(),
            theme: design, // CHANGED: use 'theme' instead of 'design'
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedWidget)
          .eq('account_id', accountId); // use 'account_id' for widgets table

        if (updateError) {
          console.error("Error updating widget:", updateError);
          throw new Error("Failed to update widget");
        }
        await fetchWidgets(); // Refresh after update
      } else {
        // Create new widget
        const { error: insertError } = await supabase
          .from('widgets')
          .insert({
            account_id: accountId, // use 'account_id' for widgets table
            name: form.name.trim(),
            theme: design, // CHANGED: use 'theme' instead of 'design'
            widget_type: form.widgetType || 'multi',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("Error creating widget:", insertError);
          throw new Error("Failed to create widget");
        }
        await fetchWidgets(); // Refresh after insert
      }

      // Refresh widgets after save
      setWidgets(prevWidgets => [...prevWidgets]);
      setShowForm(false);
      setEditing(null);
      setSelectedWidget(null);
      setForm({ name: "", widgetType: "multi" });
    } catch (error: any) {
      if (!error.message.includes("Widget name is required")) {
        alert(error.message || "An error occurred while saving the widget");
      }
    }
  };

  // Review management handlers
  const handleOpenReviewModal = async (widgetId: string) => {
    console.log("[DEBUG] Opening review modal for widgetId:", widgetId);
    setSelectedWidget(widgetId);
    setShowReviewModal(true);
    setReviewError("");
    setLoadingReviews(true);
    
    // Center the modal on screen
    const modalWidth = 1000; // Approximate width of the modal
    const modalHeight = 600; // Approximate height of the modal
    const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
    const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
    setReviewModalPos({ x, y });
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    // Fetch widget_reviews for this widget
    const { data: widgetReviews, error } = await supabase
      .from("widget_reviews")
      .select(
        "review_id, review_content, first_name, last_name, reviewer_role, platform, created_at, star_rating"
      )
      .eq("widget_id", widgetId)
      .order("order_index", { ascending: true });
    console.log(
      "[DEBUG] widgetReviews fetched:",
      widgetReviews,
      "error:",
      error,
    );
    if (error) {
      setSelectedReviews([]);
      setEditedReviews({});
      setEditedNames({});
      setEditedRoles({});
      setEditedRatings({});
      setLoadingReviews(false);
      return;
    }
    // Set selectedReviews to the reviews in the widget
    setSelectedReviews(widgetReviews || []);
    console.log("[DEBUG] selectedReviews set:", widgetReviews);
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
    if (!selectedWidget) {
      setReviewError("No widget selected");
      return;
    }
    const widgetId = selectedWidget;
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
    setShowReviewModal(false);
    if (onWidgetReviewsChange) onWidgetReviewsChange();
  };

  const handleEditMouseDown = (e: React.MouseEvent) => {
    if (!editModalRef.current) return;
    setEditDragging(true);
    editDragStart.current = {
      x: e.clientX - editModalRef.current.getBoundingClientRect().left,
      y: e.clientY - editModalRef.current.getBoundingClientRect().top,
    };
    document.body.style.userSelect = "none";
  };
  const handleEditMouseUp = () => {
    setEditDragging(false);
    editDragStart.current = null;
    document.body.style.userSelect = "";
  };
  const handleEditMouseMove = (e: MouseEvent) => {
    if (!editDragging || !editDragStart.current) return;
    setEditModalPos({
      x: e.clientX - editDragStart.current.x,
      y: e.clientY - editDragStart.current.y,
    });
  };
  useEffect(() => {
    if (editDragging) {
      window.addEventListener("mousemove", handleEditMouseMove);
      window.addEventListener("mouseup", handleEditMouseUp);
    } else {
      window.removeEventListener("mousemove", handleEditMouseMove);
      window.removeEventListener("mouseup", handleEditMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleEditMouseMove);
      window.removeEventListener("mouseup", handleEditMouseUp);
    };
  }, [editDragging]);

  const handleCopyEmbed = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    const widgetType = widget?.widget_type || '';
    // Use the correct script src for each widget type
    let scriptSrc = `https://app.promptreviews.app/widgets/${widgetType}/widget.min.js`;
    // Compose the correct embed code for the widget type
    const code = `<!-- PromptReviews Widget Type: ${widgetType} -->\n<div class=\"promptreviews-widget\" data-widget=\"${widgetId}\" data-widget-type=\"${widgetType}\"></div>\n<script src=\"${scriptSrc}\" async></script>`;
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      alert("Could not copy to clipboard. Please copy manually.");
    }
    setCopiedWidgetId(widgetId);
    setTimeout(() => setCopiedWidgetId(null), 1500);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentWidgetReviews, setCurrentWidgetReviews] = useState<any[]>([]);

  // Edit button handler: always pass the full widget object to handleOpenForm
  const handleEditWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setEditing(widget.id);
      setSelectedWidget(widget.id);
      setForm({ name: widget.name, widgetType: widget.widget_type || "multi" });
      setShowForm(true);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (confirm("Are you sure you want to delete this widget?")) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { error } = await supabase
        .from("widgets")
        .delete()
        .eq("id", widgetId);
      if (error) {
        console.error("Error deleting widget:", error);
        alert("Failed to delete widget. Please try again.");
      } else {
        // Update the widgets list by removing the deleted widget
        setWidgets((currentWidgets) => 
          currentWidgets.filter((w) => w.id !== widgetId)
        );
      }
    }
  };

  useEffect(() => {
    if (!selectedWidget) return;
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    console.log("[DEBUG] Fetching widget reviews for widget:", selectedWidget);
    supabase
      .from("widget_reviews")
      .select(
        "id, review_id, review_content, first_name, last_name, reviewer_role, platform, order_index, star_rating"
      )
      .eq("widget_id", selectedWidget!)
      .order("order_index", { ascending: true })
      .then(({ data, error }) => {
        console.log("[DEBUG] Widget reviews fetched:", data);
        console.log("[DEBUG] Error if any:", error);
        if (error) {
          console.error("[DEBUG] Detailed error:", error.message, error.details, error.hint);
        }
        setCurrentWidgetReviews(data || []);
        setLoadingReviews(false);
      });
  }, [selectedWidget]);

  const handleEditStyle = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setForm({ name: widget.name, widgetType: widget.widget_type || "multi" });
    }
    setSelectedWidget(widgetId);
    setShowEditModal(true);
  };

  // Move handleSaveDesign inside the WidgetList component so it can access fetchWidgets
  const handleSaveDesign = async () => {
    if (!selectedWidget) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase
      .from('widgets')
      .update({
        theme: design,
        name: form.name.trim(), // Ensure the name is trimmed
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedWidget);
    if (error) {
      console.error("Error saving design:", error);
      alert("Failed to save design");
      return;
    }
    // Refresh the widgets list to reflect changes
    await fetchWidgets();
    setShowEditModal(false);
  };

  // Update the getFilteredAndSortedReviews function to include pagination
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

  // Add review modal mouse handlers
  const handleReviewModalMouseDown = (e: React.MouseEvent) => {
    setReviewModalDragging(true);
    reviewModalDragStart.current = {
      x: e.clientX - reviewModalPos.x,
      y: e.clientY - reviewModalPos.y,
    };
    document.body.style.userSelect = "none";
  };
  
  const handleReviewModalMouseUp = () => {
    setReviewModalDragging(false);
    reviewModalDragStart.current = null;
    document.body.style.userSelect = "";
  };
  
  const handleReviewModalMouseMove = (e: MouseEvent) => {
    if (!reviewModalDragging || !reviewModalDragStart.current) return;
    setReviewModalPos({
      x: e.clientX - reviewModalDragStart.current.x,
      y: e.clientY - reviewModalDragStart.current.y,
    });
  };
  
  useEffect(() => {
    if (reviewModalDragging) {
      window.addEventListener("mousemove", handleReviewModalMouseMove);
      window.addEventListener("mouseup", handleReviewModalMouseUp);
    } else {
      window.removeEventListener("mousemove", handleReviewModalMouseMove);
      window.removeEventListener("mouseup", handleReviewModalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleReviewModalMouseMove);
      window.removeEventListener("mouseup", handleReviewModalMouseUp);
    };
  }, [reviewModalDragging]);

  useEffect(() => {
    // Auto-select the only widget if there is one
    if (widgets.length === 1 && onSelectWidget) {
      onSelectWidget(widgets[0]);
    }
  }, [widgets, onSelectWidget]);

  // Ensure only unique review_ids are rendered
  const uniqueSelectedReviews = Array.from(
    new Map(selectedReviews.map(r => [r.review_id, r])).values()
  );

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const handleSaveWidgetName = async (id: string, name: string) => {
    if (!name.trim()) return;
    setWidgets(widgets => widgets.map(w => w.id === id ? { ...w, name } : w));
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await supabase.from("widgets").update({ name: name.trim() }).eq("id", id);
  };

  const handleAddCustomReview = () => {
    // Create a new blank review object with a proper UUID
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

  // Add state for style modal position and dragging
  const [styleModalPos, setStyleModalPos] = useState({ x: 0, y: 0 });
  const [styleModalDragging, setStyleModalDragging] = useState(false);
  const styleModalDragStart = useRef<{ x: number; y: number } | null>(null);
  const styleModalRef = useRef<HTMLDivElement>(null);

  // Center style modal after mount
  useEffect(() => {
    if (showEditModal) {
      const width = 800;
      const height = 600;
      const x = Math.max((window.innerWidth - width) / 2, 0);
      const y = Math.max((window.innerHeight - height) / 2, 0);
      setStyleModalPos({ x, y });
    }
  }, [showEditModal]);

  const handleStyleModalMouseDown = (e: React.MouseEvent) => {
    setStyleModalDragging(true);
    styleModalDragStart.current = {
      x: e.clientX - styleModalPos.x,
      y: e.clientY - styleModalPos.y,
    };
    document.body.style.userSelect = "none";
  };
  const handleStyleModalMouseUp = () => {
    setStyleModalDragging(false);
    styleModalDragStart.current = null;
    document.body.style.userSelect = "";
  };
  const handleStyleModalMouseMove = (e: MouseEvent) => {
    if (!styleModalDragging || !styleModalDragStart.current) return;
    setStyleModalPos({
      x: e.clientX - styleModalDragStart.current.x,
      y: e.clientY - styleModalDragStart.current.y,
    });
  };
  useEffect(() => {
    if (styleModalDragging) {
      window.addEventListener("mousemove", handleStyleModalMouseMove);
      window.addEventListener("mouseup", handleStyleModalMouseUp);
    } else {
      window.removeEventListener("mousemove", handleStyleModalMouseMove);
      window.removeEventListener("mouseup", handleStyleModalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleStyleModalMouseMove);
      window.removeEventListener("mouseup", handleStyleModalMouseUp);
    };
  }, [styleModalDragging]);

  // Update the photo upload handler to use the new endpoint and widgetId
  const handlePhotoUpload = async (reviewId: string, file: File) => {
    setPhotoUploadProgress((prev) => ({ ...prev, [reviewId]: true }));
    setPhotoUploadErrors((prev) => ({ ...prev, [reviewId]: "" }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("widgetId", selectedWidget || "");
      const res = await fetch("/api/upload-widget-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      setPhotoUploads((prev) => ({ ...prev, [reviewId]: data.url }));
    } catch (err: any) {
      setPhotoUploadErrors((prev) => ({ ...prev, [reviewId]: err.message || "Upload failed" }));
    } finally {
      setPhotoUploadProgress((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  // Add fontOptions and textColorOptions (copy from StyleModalPage)
  const fontOptions = [
    { name: "Inter", class: "font-inter" },
    { name: "Roboto", class: "font-roboto" },
    { name: "Open Sans", class: "font-open-sans" },
    { name: "Lato", class: "font-lato" },
    { name: "Montserrat", class: "font-montserrat" },
    { name: "Poppins", class: "font-poppins" },
    { name: "Source Sans 3", class: "font-source-sans" },
    { name: "Raleway", class: "font-raleway" },
    { name: "Nunito", class: "font-nunito" },
    { name: "Playfair Display", class: "font-playfair" },
    { name: "Merriweather", class: "font-merriweather" },
    { name: "Roboto Slab", class: "font-roboto-slab" },
    { name: "PT Sans", class: "font-pt-sans" },
    { name: "Oswald", class: "font-oswald" },
    { name: "Roboto Condensed", class: "font-roboto-condensed" },
    { name: "Source Serif 4", class: "font-source-serif" },
    { name: "Noto Sans", class: "font-noto-sans" },
    { name: "Ubuntu", class: "font-ubuntu" },
    { name: "Work Sans", class: "font-work-sans" },
    { name: "Quicksand", class: "font-quicksand" },
    { name: "Josefin Sans", class: "font-josefin-sans" },
    { name: "Mukta", class: "font-mukta" },
    { name: "Rubik", class: "font-rubik" },
    { name: "IBM Plex Sans", class: "font-ibm-plex-sans" },
    { name: "Barlow", class: "font-barlow" },
    { name: "Mulish", class: "font-mulish" },
    { name: "Comfortaa", class: "font-comfortaa" },
    { name: "Outfit", class: "font-outfit" },
    { name: "Plus Jakarta Sans", class: "font-plus-jakarta-sans" },
    { name: "Courier Prime", class: "font-courier-prime" },
    { name: "IBM Plex Mono", class: "font-ibm-plex-mono" },
    { name: "Arial", class: "font-arial" },
    { name: "Helvetica", class: "font-helvetica" },
    { name: "Verdana", class: "font-verdana" },
    { name: "Tahoma", class: "font-tahoma" },
    { name: "Trebuchet MS", class: "font-trebuchet-ms" },
    { name: "Times New Roman", class: "font-times-new-roman" },
    { name: "Georgia", class: "font-georgia" },
    { name: "Courier New", class: "font-courier-new" },
    { name: "Lucida Console", class: "font-lucida-console" },
    { name: "Palatino", class: "font-palatino" },
    { name: "Garamond", class: "font-garamond" },
  ];
  const textColorOptions = [
    { name: "Black", value: "#1A1A1A" },
    { name: "Charcoal", value: "#22292F" },
    { name: "Dark Gray", value: "#2D3748" },
    { name: "Navy", value: "#1A237E" },
    { name: "Dark Brown", value: "#3E2723" },
  ];

  return (
    <div className="space-y-6">
      {/* Widget List */}
      <div>
        <div className="grid grid-cols-1 gap-8">
          {widgets.map((widget) => {
            let shadowColor = 'rgba(30, 41, 59, 0.18)';
            let borderColor = 'transparent';
            let accentColor = '#4F46E5';
            if (widget.widget_type === 'single') {
              shadowColor = 'rgba(59, 130, 246, 0.18)'; // blue-500
              borderColor = '#3B82F6'; // blue-500
              accentColor = '#3B82F6';
            } else if (widget.widget_type === 'multi') {
              shadowColor = 'rgba(16, 185, 129, 0.18)'; // green-500
              borderColor = '#10B981'; // green-500
              accentColor = '#10B981';
            } else if (widget.widget_type === 'photo') {
              shadowColor = 'rgba(139, 92, 246, 0.18)'; // purple-500
              borderColor = '#8B5CF6'; // purple-500
              accentColor = '#8B5CF6';
            }

            const isSelected = selectedWidgetId === widget.id;

            return (
              <div
                key={widget.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer border-2 transition-all relative ${isSelected ? '' : ''}`}
                style={{
                  boxShadow: isSelected
                    ? `0 4px 24px 0 ${shadowColor}, 0 0 0 2px ${borderColor}`
                    : `0 4px 24px 0 ${shadowColor}`,
                  borderColor: isSelected ? borderColor : 'transparent',
                  borderWidth: '2px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onClick={() => onSelectWidget?.(widget)}
              >
                {/* Top right: Select to view button */}
                <button
                  className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors select-to-view-btn"
                  style={{
                    background: isSelected ? accentColor : 'rgba(100,116,255,0.08)',
                    color: isSelected ? '#fff' : accentColor,
                    border: 'none',
                    outline: 'none',
                    zIndex: 10,
                    fontWeight: 600,
                    boxShadow: isSelected ? `0 2px 8px ${shadowColor}` : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={e => { e.stopPropagation(); onSelectWidget?.(widget); }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = accentColor;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    if (isSelected) {
                      e.currentTarget.style.background = accentColor;
                      e.currentTarget.style.color = '#fff';
                    } else {
                      e.currentTarget.style.background = 'rgba(100,116,255,0.08)';
                      e.currentTarget.style.color = accentColor;
                    }
                  }}
                  aria-label="Select to view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" style={{ display: 'inline-block' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C3.5 7.5 7.5 4.5 12 4.5c4.5 0 8.5 3 9.75 7.5-1.25 4.5-5.25 7.5-9.75 7.5-4.5 0-8.5-3-9.75-7.5z" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span className="ml-1">Select to view</span>
                </button>
                <div className="py-3 px-4">
                  {/* Widget title on its own line */}
                  <div className="mb-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {widget.name}
                    </span>
                  </div>
                  {/* Buttons and tag row */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        widget.widget_type === 'single' ? 'bg-blue-100 text-blue-700' :
                        widget.widget_type === 'multi' ? 'bg-green-100 text-green-700' :
                        widget.widget_type === 'photo' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {widget.widget_type === 'single' ? 'Single' :
                         widget.widget_type === 'multi' ? 'Multi' :
                         widget.widget_type === 'photo' ? 'Photo' :
                         widget.widget_type}
                      </span>
                      <i className="fa-solid fa-up-down-left-right text-gray-400 w-5 h-5"></i>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopyEmbed(widget.id); }}
                        className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium border border-gray-200"
                        title="Copy embed code"
                      >
                        {copiedWidgetId === widget.id ? 'Copied!' : 'Copy Embed Code'}
                      </button>
                      <button
                        onClick={async (e) => { e.stopPropagation(); await handleOpenReviewModal(widget.id); }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Manage Reviews"
                      >
                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium">Manage Reviews</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditStyle(widget.id); }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Style"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id); }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Widget"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {widget.reviews?.slice(0, 3).map((review: any) => (
                      <div
                        key={review.review_id}
                        className="bg-gray-50 rounded-lg p-4 text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {`${review.first_name} ${review.last_name}`}
                        </div>
                        <div className="text-gray-500 text-xs mb-2">
                          {review.reviewer_role}
                        </div>
                        <div className="text-gray-600 line-clamp-3">
                          {review.review_content}
                        </div>
                      </div>
                    ))}
                    {widget.reviews && widget.reviews.length > 3 && (
                      <div className="text-center">
                        <button
                          onClick={async (e) => { e.stopPropagation(); await handleOpenReviewModal(widget.id); }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          +{widget.reviews.length - 3} more reviews
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New/Edit Widget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            style={{
              position: "absolute",
              left: editModalPos.x,
              top: editModalPos.y,
            }}
            ref={editModalRef}
          >
            <div
              className="p-4 border-b cursor-move flex items-center justify-between bg-blue-100 rounded-t-2xl"
              onMouseDown={handleEditMouseDown}
            >
              <div className="flex-1 flex justify-center items-center gap-2">
                <i className="fa-solid fa-up-down-left-right text-gray-400 w-5 h-5"></i>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">drag</span>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500 ml-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {/* Widget Name Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Widget Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      setNameError("");
                    }}
                    className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${nameError ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter widget name"
                    ref={nameInputRef}
                    autoFocus
                  />
                  {nameError && <div className="text-red-500 text-sm mt-1">{nameError}</div>}
                </div>
                {/* Widget Type Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Widget Type</label>
                  <select
                    value={form.widgetType}
                    onChange={(e) => setForm({ ...form, widgetType: e.target.value })}
                    className="block w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-inner"
                  >
                    <option value="single">Single Card</option>
                    <option value="multi">Multi Card</option>
                    <option value="photo">Photo (with image + testimonial)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow mr-2"
                style={{ minWidth: 90 }}
                disabled={!form.name.trim() || form.name.trim().toLowerCase() === "new widget"}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Style Modal */}
      {showEditModal && selectedWidget && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            ref={styleModalRef}
            style={{
              position: "absolute",
              left: styleModalPos.x,
              top: styleModalPos.y,
            }}
          >
            <div className="relative">
              <div className="p-4 border-b bg-blue-100 flex items-center justify-between relative select-none cursor-move rounded-t-2xl" onMouseDown={handleStyleModalMouseDown}>
                <h2 className="text-2xl font-bold text-slate-blue flex items-center gap-2">Edit Style</h2>
                <div className="flex items-center ml-auto">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <i className="fa-solid fa-up-down-left-right text-gray-400 w-5 h-5"></i>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">drag</span>
                  </div>
                  <button
                    onClick={handleResetDesign}
                    className="py-2 px-5 border border-slate-300 bg-white text-slate-blue rounded-lg font-semibold shadow hover:bg-slate-100 transition-colors mr-2"
                    style={{ minWidth: 90 }}
                  >
                    Reset Styles
                  </button>
                  <button
                    onClick={handleSaveDesign}
                    className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow"
                    style={{ minWidth: 90 }}
                  >
                    Save
                  </button>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setShowEditModal(false); }}
                className="absolute -top-4 -right-4 z-20 bg-white rounded-full shadow p-1 border border-gray-200 hover:bg-gray-50"
                style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Main Controls */}
                <div className="space-y-6">
                  {/* Widget Name Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Widget Name</div>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, name: e.target.value }));
                        setNameError("");
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${nameError ? 'border-red-500' : ''}`}
                      placeholder="Enter widget name"
                      ref={nameInputRef}
                    />
                    {nameError && <div className="text-red-500 text-sm mt-1">{nameError}</div>}
                  </div>
                  {/* Background Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Background</div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section Background Type
                        </label>
                        <select
                          value={design.sectionBgType || "none"}
                          onChange={(e) => handleDesignChange("sectionBgType", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="none">None</option>
                          <option value="custom">Custom Color</option>
                        </select>
                      </div>
                      {design.sectionBgType === "custom" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section Background Color
                          </label>
                          <input
                            type="color"
                            value={design.sectionBgColor || "#ffffff"}
                            onChange={(e) => handleDesignChange("sectionBgColor", e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Border Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Border</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.border}
                          onChange={(e) => handleDesignChange("border", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Show Border
                        </label>
                      </div>
                      {design.border && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Border Color
                            </label>
                            <input
                              type="color"
                              value={design.borderColor || "#cccccc"}
                              onChange={(e) => handleDesignChange("borderColor", e.target.value)}
                              className="w-full h-10 rounded-md border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Border Width
                            </label>
                            <input
                              type="number"
                              value={design.borderWidth}
                              onChange={(e) => handleDesignChange("borderWidth", parseInt(e.target.value) || 2)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Border Radius Section (always visible) */}
                  <div className="border border-gray-200 rounded-lg p-4 mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Border Radius
                    </label>
                    <input
                      type="number"
                      value={design.borderRadius}
                      onChange={(e) => handleDesignChange("borderRadius", parseInt(e.target.value) || 16)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  {/* Text Settings */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Font & Colors</div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font</label>
                        <select
                          value={design.font || "Inter"}
                          onChange={e => handleDesignChange("font", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {fontOptions.map(font => (
                            <option key={font.name} value={font.name}>{font.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                        <select
                          value={design.textColor || "#1A1A1A"}
                          onChange={e => handleDesignChange("textColor", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {textColorOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                        <input
                          type="color"
                          value={design.accentColor || "#4F46E5"}
                          onChange={e => handleDesignChange("accentColor", e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Background Color</label>
                        <input
                          type="color"
                          value={design.bgColor || "#ffffff"}
                          onChange={e => handleDesignChange("bgColor", e.target.value)}
                          className="w-full h-10 rounded-md border border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column - Additional Controls */}
                <div className="space-y-6">
                  {/* Vignette Shadow Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Vignette Shadow</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.shadow}
                          onChange={(e) => handleDesignChange("shadow", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Show Vignette Shadow
                        </label>
                      </div>
                      {design.shadow && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Vignette Intensity
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={design.shadowIntensity ?? 0.2}
                                onChange={e => handleDesignChange("shadowIntensity", parseFloat(e.target.value))}
                                className="w-full"
                              />
                              <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                                {Math.round((design.shadowIntensity ?? 0.2) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Vignette Color
                            </label>
                            <input
                              type="color"
                              value={design.shadowColor || "#222222"}
                              onChange={e => handleDesignChange("shadowColor", e.target.value)}
                              className="w-full h-10 rounded-md border border-gray-300"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-700 mb-3 text-sm">Display Options</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.showQuotes}
                          onChange={(e) => handleDesignChange("showQuotes", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Show Quotes
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.showRelativeDate}
                          onChange={(e) => handleDesignChange("showRelativeDate", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Show Relative Date
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.autoAdvance}
                          onChange={(e) => handleDesignChange("autoAdvance", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Auto Advance
                        </label>
                      </div>
                      {design.autoAdvance && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slideshow Speed (seconds)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={design.slideshowSpeed}
                            onChange={(e) => handleDesignChange("slideshowSpeed", parseInt(e.target.value) || 4)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={design.showSubmitReviewButton ?? false}
                          onChange={(e) => handleDesignChange("showSubmitReviewButton", e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          Show Submit a Review Button
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={handleSaveDesign}
                className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow mr-2"
                style={{ minWidth: 90 }}
              >
                Save
              </button>
              <button
                onClick={handleResetDesign}
                className="py-2 px-5 border border-slate-300 bg-white text-slate-blue rounded-lg font-semibold shadow hover:bg-slate-100 transition-colors ml-2"
                style={{ minWidth: 90 }}
              >
                Reset Styles
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div
            ref={reviewModalRef}
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full relative border border-gray-200"
            style={{ minHeight: 600, minWidth: 360, maxWidth: 900 }}
          >
            {/* Top blue area with Save button */}
            <div className="flex items-center justify-between bg-slate-blue text-white rounded-t-lg px-6 py-4">
              <h2 className="text-2xl font-bold">Manage Reviews</h2>
              <button
                onClick={handleSaveReviews}
                className="py-2 px-5 bg-white text-slate-blue rounded-lg font-semibold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow"
                style={{ minWidth: 90 }}
              >
                Save
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Available Reviews</h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={reviewSort}
                          onChange={(e) => {
                            setReviewSort(e.target.value as "recent" | "alphabetical");
                            setCurrentPage(1); // Reset to first page when changing sort
                          }}
                          className="rounded-md border-gray-300 text-sm"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="alphabetical">Alphabetical</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search reviews..."
                        value={reviewSearch}
                        onChange={(e) => {
                          setReviewSearch(e.target.value);
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="w-full rounded-md border-gray-300 text-sm"
                      />
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {getFilteredAndSortedReviews().reviews.map((review) => (
                        <div
                          key={review.review_id}
                          className={`p-3 rounded-lg border ${
                            uniqueSelectedReviews.some((r) => r.review_id === review.review_id)
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {`${review.first_name} ${review.last_name}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {review.reviewer_role}
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                {review.review_content}
                              </div>
                            </div>
                            {!uniqueSelectedReviews.some((r) => r.review_id === review.review_id) && (
                              <button
                                onClick={() => handleToggleReview(review)}
                                className="ml-2 px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {getFilteredAndSortedReviews().reviews.length} of {getFilteredAndSortedReviews().totalReviews} reviews
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm">
                          Page {currentPage} of {getFilteredAndSortedReviews().totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(getFilteredAndSortedReviews().totalPages, p + 1))}
                          disabled={currentPage === getFilteredAndSortedReviews().totalPages}
                          className="px-3 py-1 rounded-md border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={handleAddCustomReview}
                        className="px-3 py-1 rounded-md border border-indigo-500 text-indigo-700 bg-white hover:bg-indigo-50 text-sm font-medium"
                      >
                        + Add Custom Review
                      </button>
                    </div>
                    <h3 className="font-medium mb-2">Selected Reviews</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto bg-blue-50 rounded-md p-2">
                      {uniqueSelectedReviews.map((review) => (
                        <div
                          key={review.review_id}
                          className="p-3 rounded-lg border border-gray-200 bg-blue-50 mb-2"
                        >
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Name
                              </label>
                              <input
                                type="text"
                                value={editedNames[review.review_id] ?? `${review.first_name || ''} ${review.last_name || ''}`.trim()}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setEditedNames((prev) => ({
                                    ...prev,
                                    [review.review_id]: newValue,
                                  }));
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Role
                              </label>
                              <input
                                type="text"
                                value={editedRoles[review.review_id] || ''}
                                onChange={(e) =>
                                  setEditedRoles((prev) => ({
                                    ...prev,
                                    [review.review_id]: e.target.value,
                                  }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Review
                              </label>
                              <textarea
                                value={editedReviews[review.review_id] || ''}
                                onChange={(e) => handleReviewEdit(review.review_id, e.target.value.slice(0, 250))}
                                rows={3}
                                maxLength={250}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${((editedReviews[review.review_id] || '').length > 250) ? 'border-red-500 text-red-600' : ''}`}
                              />
                              <div className="mt-1 text-sm flex justify-between">
                                <span className={(editedReviews[review.review_id] || '').length > 250 ? 'text-red-600' : 'text-gray-500'}>
                                  {(editedReviews[review.review_id] || '').length} / 250 characters
                                </span>
                                {(editedReviews[review.review_id] || '').length > 250 && (
                                  <span className="text-red-600">
                                    Review is too long
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Star Rating
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                step={0.5}
                                value={editedRatings[review.review_id] ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  let parsed: number | null = null;
                                  if (val !== '') {
                                    parsed = parseFloat(val);
                                    if (!isNaN(parsed)) {
                                      if (parsed < 1 || parsed > 5) return;
                                      parsed = Math.round(parsed * 2) / 2;
                                    } else {
                                      parsed = null;
                                    }
                                  }
                                  setEditedRatings(prev => ({ ...prev, [review.review_id]: val === '' ? null : parsed }));
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="1-5 (e.g. 4.5)"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleToggleReview(review)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                            {/* Only show photo upload for photo widgets */}
                            {selectedWidget && widgets.find(w => w.id === selectedWidget)?.widget_type === 'photo' && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Photo</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handlePhotoUpload(review.review_id, file);
                                    }
                                  }}
                                  className="w-full"
                                />
                                {photoUploadProgress[review.review_id] && <span className="text-xs text-blue-600">Uploading...</span>}
                                {photoUploadErrors[review.review_id] && <span className="text-xs text-red-600">{photoUploadErrors[review.review_id]}</span>}
                                {photoUploads[review.review_id] && (
                                  <img src={photoUploads[review.review_id]} alt="Uploaded" className="mt-2 h-20 w-20 object-cover" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {selectedWidget && widgets.find(w => w.id === selectedWidget)?.widget_type === 'photo' && selectedWidget && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Photo
                    </label>
                    {selectedReviews.map((review) => (
                      <div key={review.review_id} className="mb-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handlePhotoUpload(review.review_id, file);
                            }
                          }}
                          className="w-full"
                        />
                        {photoUploadProgress[review.review_id] && <span className="text-xs text-blue-600">Uploading...</span>}
                        {photoUploadErrors[review.review_id] && <span className="text-xs text-red-600">{photoUploadErrors[review.review_id]}</span>}
                        {photoUploads[review.review_id] && (
                          <img src={photoUploads[review.review_id]} alt="Uploaded" className="mt-2 h-20 w-20 object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {reviewError && (
                  <div className="text-red-600 text-sm mt-2">{reviewError}</div>
                )}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              {/* Removed Cancel button as requested */}
              <button
                onClick={handleSaveReviews}
                className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow mr-2"
                style={{ minWidth: 90 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

