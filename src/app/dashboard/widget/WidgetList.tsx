"use client";
import React, { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { FaCopy, FaArrowsAlt } from "react-icons/fa";
import { getUserOrMock } from "@/utils/supabase";
import FiveStarSpinner from "@/app/components/FiveStarSpinner";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

const WORD_LIMIT = 120;
const MAX_WIDGET_REVIEWS = 8;

type Widget = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
};

function wordCount(str: string) {
  return str.trim().split(/\s+/).length;
}

// Add type for design state
type DesignState = {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
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
  onDesignChange?: (design: any) => void;
  design?: any;
  onWidgetReviewsChange?: () => void;
}) {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null as null | string);
  const [form, setForm] = useState({
    name: "",
  });

  // Review management state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | string>(null);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<any[]>([]);
  const [editedReviews, setEditedReviews] = useState<{ [id: string]: string }>({});
  const [editedNames, setEditedNames] = useState<{ [id: string]: string }>({});
  const [editedRoles, setEditedRoles] = useState<{ [id: string]: string }>({});
  const [reviewError, setReviewError] = useState("");
  const [reviewSort, setReviewSort] = useState<"recent" | "alphabetical">("recent");
  const [reviewSearch, setReviewSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  const [reviewModalPos, setReviewModalPos] = useState({ x: 0, y: 0 });
  const [reviewModalDragging, setReviewModalDragging] = useState(false);
  const reviewModalDragStart = useRef<{ x: number; y: number } | null>(null);
  const reviewModalRef = useRef<HTMLDivElement>(null);

  // Widget design state (for editing)
  const [design, setDesign] = useState(
    parentDesign || {
      bgType: "solid", // 'none' | 'solid'
      bgColor: "#ffffff",
      textColor: "#22223b",
      accentColor: "#6c47ff",
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
      width: 1000, // Set default width to 1000
    },
  );

  // Draggable edit modal state
  const [editModalPos, setEditModalPos] = useState({ x: 0, y: 0 });
  const [editDragging, setEditDragging] = useState(false);
  const editDragStart = useRef<{ x: number; y: number } | null>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Copy embed code state
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);

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

  // Listen for openNewWidgetForm event from parent
  useEffect(() => {
    const handler = () => {
      console.log("[DEBUG] New widget event received");
      handleOpenForm();
    };
    window.addEventListener("openNewWidgetForm", handler);
    return () => window.removeEventListener("openNewWidgetForm", handler);
  }, []);

  // Fetch real reviews from Supabase
  useEffect(() => {
    if (!showReviewModal) return;
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    console.log("[DEBUG] Fetching reviews for widget modal...");
    supabase
      .from("review_submissions")
      .select("id, first_name, last_name, reviewer_role, review_content, platform, created_at")
      .then(({ data, error }) => {
        console.log("[DEBUG] Reviews fetched:", data);
        console.log("[DEBUG] Error if any:", error);
        if (error) {
          console.error("[DEBUG] Detailed error:", error.message, error.details, error.hint);
        }
        setAllReviews(data || []);
        setLoadingReviews(false);
      });
  }, [showReviewModal]);

  // On mount, fetch widgets from Supabase
  useEffect(() => {
    const fetchWidgets = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching widgets:", error);
      } else {
        setWidgets(data || []);
      }
    };
    fetchWidgets();
  }, []);

  const handleOpenForm = (widget?: Widget) => {
    if (widget) {
      setEditing(widget.id);
      setForm({ name: widget.name });
    } else {
      setEditing(null);
      setForm({ name: "" });
    }
    setShowForm(true);
  };

  // Update state update functions with proper types
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Please enter a widget name");
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be signed in to create a widget");
        return;
      }

      if (editing) {
        // Update existing widget
        const { error } = await supabase
          .from("widgets")
          .update({
            name: form.name.trim(),
          })
          .eq("id", editing);

        if (error) throw error;

        setWidgets(widgets.map((w) =>
          w.id === editing ? { ...w, name: form.name.trim() } : w
        ));
      } else {
        // Create new widget
        const { data, error } = await supabase
          .from("widgets")
          .insert([
            {
              name: form.name.trim(),
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setWidgets((prev: any[]) => [...prev, data]);
      }

      setShowForm(false);
      setForm({ name: "" });
    } catch (error) {
      console.error("Error creating widget:", error);
      alert("Failed to create widget. Please try again.");
    }
  };

  // Review management handlers
  const handleOpenReviewModal = async (widgetId: string) => {
    console.log("[DEBUG] Opening review modal for widgetId:", widgetId);
    setSelectedWidget(widgetId);
    setShowReviewModal(true);
    setReviewError("");
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    // Fetch widget_reviews for this widget
    const { data: widgetReviews, error } = await supabase
      .from("widget_reviews")
      .select(
        "review_id, review_content, first_name, last_name, reviewer_role, platform, created_at",
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
      setLoadingReviews(false);
      return;
    }
    // Set selectedReviews to the reviews in the widget, mapping id: review_id
    const mappedReviews = (widgetReviews || []).map((r) => ({
      ...r,
      id: r.review_id,
    }));
    setSelectedReviews(mappedReviews);
    console.log("[DEBUG] selectedReviews set:", mappedReviews);
    // Set edited fields to match the widget's current reviews
    const editedReviewsObj: { [id: string]: string } = {};
    const editedNamesObj: { [id: string]: string } = {};
    const editedRolesObj: { [id: string]: string } = {};
    (widgetReviews || []).forEach((r) => {
      editedReviewsObj[r.review_id] = r.review_content;
      editedNamesObj[r.review_id] = `${r.first_name} ${r.last_name}`;
      editedRolesObj[r.review_id] = r.reviewer_role;
    });
    setEditedReviews(editedReviewsObj);
    setEditedNames(editedNamesObj);
    setEditedRoles(editedRolesObj);
    setLoadingReviews(false);
  };

  const handleToggleReview = (review: any) => {
    const alreadySelected = selectedReviews.some((r) => r.id === review.id);
    let updated;
    if (alreadySelected) {
      updated = selectedReviews.filter((r) => r.id !== review.id);
    } else {
      if (selectedReviews.length >= MAX_WIDGET_REVIEWS) return;
      updated = [...selectedReviews, review];
    }
    setSelectedReviews(updated);
  };

  const handleReviewEdit = (id: string, value: string) => {
    setEditedReviews((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveReviews = async () => {
    if (!selectedWidget) return;
    // Validate all selected reviews are within word limit
    for (const review of selectedReviews) {
      const text = editedReviews[review.id] ?? review.review_content;
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
      .eq("widget_id", selectedWidget);
    if (fetchError) {
      setReviewError("Failed to fetch widget reviews: " + fetchError.message);
      return;
    }
    const currentIds = (currentWidgetReviews || []).map((r) => r.review_id);
    // Insert new reviews
    const { error } = await supabase
      .from("widget_reviews")
      .insert(
        selectedReviews.map((review, index) => ({
          widget_id: selectedWidget,
          review_id: review.id,
          review_content: editedReviews[review.id] ?? review.review_content,
          first_name: (editedNames[review.id] ?? `${review.first_name} ${review.last_name}`).split(' ')[0],
          last_name: (editedNames[review.id] ?? `${review.first_name} ${review.last_name}`).split(' ').slice(1).join(' '),
          reviewer_role: editedRoles[review.id] ?? review.reviewer_role,
          platform: review.platform,
          order_index: index,
        }))
      );

    if (error) {
      console.error("Error saving widget reviews:", error);
      alert("Failed to save reviews. Please try again.");
      return;
    }
    setShowReviewModal(false);
    if (onWidgetReviewsChange) onWidgetReviewsChange();
  };

  const handleEditMouseDown = (e: React.MouseEvent) => {
    setEditDragging(true);
    editDragStart.current = {
      x: e.clientX - editModalPos.x,
      y: e.clientY - editModalPos.y,
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
    const code = `<div id="promptreviews-widget" data-widget="${widgetId}"></div>\n<script src="https://yourdomain.com/widget.js" async></script>`;
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

  const handleEditWidget = (widget: any) => {
    handleOpenReviewModal(widget.id);
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
        "id, review_id, review_content, first_name, last_name, reviewer_role, platform, order_index",
      )
      .eq("widget_id", selectedWidget)
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
    console.log("[DEBUG] Opening style editor for widget:", widgetId);
    setSelectedWidget(widgetId);
    setShowEditModal(true);
  };

  const handleSaveDesign = async () => {
    if (!selectedWidget) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    try {
      const { error } = await supabase
        .from("widgets")
        .update({
          theme: design,
        })
        .eq("id", selectedWidget);

      if (error) throw error;

      setWidgets(widgets.map((w) =>
        w.id === selectedWidget ? { ...w, theme: design } : w
      ));
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating widget design:", error);
      alert("Failed to update widget design. Please try again.");
    }
  };

  // Update design state handlers with proper types
  const handleDesignChange = (field: keyof DesignState, value: any) => {
    setDesign((prev: DesignState) => ({
      ...prev,
      [field]: value,
    }));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-dustyPlum text-pureWhite rounded hover:bg-lavenderHaze hover:text-dustyPlum transition-colors font-semibold"
        >
          + New widget
        </button>
      </div>

      {isClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {widget.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => await handleOpenReviewModal(widget.id)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Manage Reviews"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleOpenForm(widget)}
                      className="p-2 text-gray-600 hover:text-gray-900"
                      title="Edit Widget"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEditStyle(widget.id)}
                      className="p-2 text-gray-600 hover:text-gray-900"
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
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
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
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {widget.reviews?.slice(0, 2).map((review: any) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="font-medium text-gray-900">
                        {`${review.first_name} ${review.last_name}`}
                      </div>
                      <div className="text-gray-500 text-xs mb-1">
                        {review.reviewer_role}
                      </div>
                      <div className="text-gray-600 line-clamp-2">
                        {review.review_content}
                      </div>
                    </div>
                  ))}
                  {widget.reviews && widget.reviews.length > 2 && (
                    <div className="text-center">
                      <button
                        onClick={async () => await handleOpenReviewModal(widget.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        +{widget.reviews.length - 2} more reviews
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              className="p-4 border-b cursor-move"
              onMouseDown={handleEditMouseDown}
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit Widget" : "New Widget"}
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Widget Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter widget name"
                  />
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
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Style Modal */}
      {showEditModal && selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div
              className="flex items-center justify-between p-4 border-b cursor-move"
              onMouseDown={handleEditMouseDown}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-blue rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Style
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Type
                    </label>
                    <select
                      value={design.bgType}
                      onChange={(e) => handleDesignChange("bgType", e.target.value as "none" | "solid")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="none">None</option>
                      <option value="solid">Solid Color</option>
                    </select>
                  </div>
                  {design.bgType === "solid" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={design.bgColor}
                        onChange={(e) => handleDesignChange("bgColor", e.target.value)}
                        className="w-full h-10 rounded-md border border-gray-300"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={design.textColor}
                      onChange={(e) => handleDesignChange("textColor", e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={design.accentColor}
                      onChange={(e) => handleDesignChange("accentColor", e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Font Size
                    </label>
                    <input
                      type="number"
                      value={design.quoteFontSize}
                      onChange={(e) => handleDesignChange("quoteFontSize", parseInt(e.target.value) || 18)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attribution Font Size
                    </label>
                    <input
                      type="number"
                      value={design.attributionFontSize}
                      onChange={(e) => handleDesignChange("attributionFontSize", parseInt(e.target.value) || 15)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Line Spacing
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={design.lineSpacing}
                      onChange={(e) => handleDesignChange("lineSpacing", parseFloat(e.target.value) || 1.4)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={design.shadow}
                      onChange={(e) => handleDesignChange("shadow", e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Show Shadow
                    </label>
                  </div>
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
                      checked={design.showGrid}
                      onChange={(e) => handleDesignChange("showGrid", e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Show Grid
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
                </div>
                {design.autoAdvance && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slideshow Speed (seconds)
                    </label>
                    <input
                      type="number"
                      value={design.slideshowSpeed}
                      onChange={(e) => handleDesignChange("slideshowSpeed", parseInt(e.target.value) || 4)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDesign}
                className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow mr-2"
                style={{ minWidth: 90 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            style={{
              position: 'absolute',
              left: reviewModalPos.x,
              top: reviewModalPos.y,
            }}
            ref={reviewModalRef}
          >
            <div 
              className="p-4 border-b cursor-move flex items-center justify-between"
              onMouseDown={handleReviewModalMouseDown}
            >
              <h2 className="text-lg font-semibold text-gray-900">Manage Reviews</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
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
                          key={review.id}
                          className={`p-3 rounded-lg border ${
                            selectedReviews.some((r) => r.id === review.id)
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
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
                            <button
                              onClick={() => handleToggleReview(review)}
                              className={`ml-2 px-3 py-1 rounded ${
                                selectedReviews.some((r) => r.id === review.id)
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {selectedReviews.some((r) => r.id === review.id)
                                ? "Remove"
                                : "Add"}
                            </button>
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
                    <h3 className="font-medium mb-2">Selected Reviews</h3>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {selectedReviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-3 rounded-lg border border-gray-200"
                        >
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Name
                              </label>
                              <input
                                type="text"
                                value={editedNames[review.id] || ""}
                                onChange={(e) =>
                                  setEditedNames((prev) => ({
                                    ...prev,
                                    [review.id]: e.target.value,
                                  }))
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Role
                              </label>
                              <input
                                type="text"
                                value={editedRoles[review.id] || ""}
                                onChange={(e) =>
                                  setEditedRoles((prev) => ({
                                    ...prev,
                                    [review.id]: e.target.value,
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
                                value={editedReviews[review.id] || ""}
                                onChange={(e) => handleReviewEdit(review.id, e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <button
                              onClick={() => handleToggleReview(review)}
                              className="w-full px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {reviewError && (
                  <div className="text-red-600 text-sm mt-2">{reviewError}</div>
                )}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowReviewModal(false)}
                className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow mr-2"
              >
                Cancel
              </button>
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
