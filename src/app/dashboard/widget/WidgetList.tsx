'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FaCopy } from 'react-icons/fa';
import { getUserOrMock } from '@/utils/supabase';
import FiveStarSpinner from '@/app/components/FiveStarSpinner';

const WORD_LIMIT = 120;
const MAX_WIDGET_REVIEWS = 8;

function wordCount(str: string) {
  return str.trim().split(/\s+/).length;
}

export default function WidgetList({ onSelectWidget, selectedWidgetId, onDesignChange, design: parentDesign, onWidgetReviewsChange }: { onSelectWidget?: (widget: any) => void, selectedWidgetId?: string, onDesignChange?: (design: any) => void, design?: any, onWidgetReviewsChange?: () => void }) {
  const [widgets, setWidgets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null as null | string);
  const [form, setForm] = useState({ name: '', review_count: 5 });

  // Review management state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<null | string>(null);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<any[]>([]); // Array of selected review objects
  const [editedReviews, setEditedReviews] = useState<{ [id: string]: string }>({});
  const [reviewError, setReviewError] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'az'>('recent');
  const [activeTab, setActiveTab] = useState<'select' | 'edit'>('select');

  // Widget design state (for editing)
  const [design, setDesign] = useState(parentDesign || {
    bgType: 'solid', // 'none' | 'solid'
    bgColor: '#ffffff',
    textColor: '#22223b',
    accentColor: '#6c47ff',
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
  });

  // Draggable edit modal state
  const [editModalPos, setEditModalPos] = useState({ x: 0, y: 0 });
  const [editDragging, setEditDragging] = useState(false);
  const editDragStart = useRef<{ x: number; y: number } | null>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Copy embed code state
  const [copiedWidgetId, setCopiedWidgetId] = useState<string | null>(null);

  // Add these new states at the top with other review management state:
  const [editedNames, setEditedNames] = useState<{ [id: string]: string }>({});
  const [editedRoles, setEditedRoles] = useState<{ [id: string]: string }>({});

  // Add this state near other modal states:
  const [editTabError, setEditTabError] = useState('');

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
    const handler = () => handleOpenForm();
    window.addEventListener('openNewWidgetForm', handler);
    return () => window.removeEventListener('openNewWidgetForm', handler);
  }, []);

  // Fetch real reviews from Supabase
  useEffect(() => {
    if (!showReviewModal) return;
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from('review_submissions')
      .select('id, reviewer_name, reviewer_role, review_content, platform, created_at')
      .eq('status', 'submitted')
      .not('review_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setAllReviews(data || []);
        setLoadingReviews(false);
      });
  }, [showReviewModal]);

  // On mount, fetch widgets from Supabase
  useEffect(() => {
    const fetchWidgets = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('[DEBUG] Failed to fetch widgets:', error);
        setWidgets([]);
      } else {
        setWidgets(data || []);
        console.log('[DEBUG] widgets fetched:', data);
      }
    };
    fetchWidgets();
  }, []);

  const handleOpenForm = (widget?: typeof widgets[0]) => {
    if (widget) {
      setEditing(widget.id);
      setForm({ name: widget.name, review_count: widget.review_count });
    } else {
      setEditing(null);
      setForm({ name: '', review_count: 5 });
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await getUserOrMock(supabase);
    if (!user) {
      alert('You must be signed in to create a widget.');
      return;
    }
    if (editing) {
      // Update existing widget
      const { error } = await supabase
        .from('widgets')
        .update({
          name: form.name,
          review_count: form.review_count,
          theme: design,
        })
        .eq('id', editing);
      if (error) {
        alert('Failed to update widget: ' + error.message);
        return;
      }
      setWidgets(widgets.map(w => w.id === editing ? { ...w, ...form, theme: design } : w));
    } else {
      // Create new widget
      const { data, error } = await supabase
        .from('widgets')
        .insert([
          {
            name: form.name,
            review_count: form.review_count,
            theme: design,
            is_active: true,
            account_id: user.id,
          },
        ])
        .select();
      if (error) {
        alert('Failed to create widget: ' + error.message);
        return;
      }
      if (data && data[0]) {
        setWidgets([...widgets, data[0]]);
      }
    }
    if (onDesignChange) onDesignChange(design);
    setShowForm(false);
  };

  // Review management handlers
  const handleOpenReviewModal = async (widgetId: string) => {
    console.log('[DEBUG] Opening review modal for widgetId:', widgetId);
    setSelectedWidget(widgetId);
    setShowReviewModal(true);
    setReviewError('');
    setLoadingReviews(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Fetch widget_reviews for this widget
    const { data: widgetReviews, error } = await supabase
      .from('widget_reviews')
      .select('review_id, review_content, reviewer_name, reviewer_role, platform, created_at')
      .eq('widget_id', widgetId)
      .order('order_index', { ascending: true });
    console.log('[DEBUG] widgetReviews fetched:', widgetReviews, 'error:', error);
    if (error) {
      setSelectedReviews([]);
      setEditedReviews({});
      setEditedNames({});
      setEditedRoles({});
      setLoadingReviews(false);
      return;
    }
    // Set selectedReviews to the reviews in the widget, mapping id: review_id
    const mappedReviews = (widgetReviews || []).map(r => ({ ...r, id: r.review_id }));
    setSelectedReviews(mappedReviews);
    console.log('[DEBUG] selectedReviews set:', mappedReviews);
    // Set edited fields to match the widget's current reviews
    const editedReviewsObj: { [id: string]: string } = {};
    const editedNamesObj: { [id: string]: string } = {};
    const editedRolesObj: { [id: string]: string } = {};
    (widgetReviews || []).forEach(r => {
      editedReviewsObj[r.review_id] = r.review_content;
      editedNamesObj[r.review_id] = r.reviewer_name;
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
        setReviewError(`One or more reviews are too long. Limit: ${WORD_LIMIT} words.`);
        return;
      }
    }
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    // Fetch current widget_reviews for this widget
    const { data: currentWidgetReviews, error: fetchError } = await supabase
      .from('widget_reviews')
      .select('id, review_id')
      .eq('widget_id', selectedWidget);
    if (fetchError) {
      setReviewError('Failed to fetch widget reviews: ' + fetchError.message);
      return;
    }
    const currentIds = (currentWidgetReviews || []).map(r => r.review_id);
    // Insert new reviews
    for (let i = 0; i < selectedReviews.length; i++) {
      const review = selectedReviews[i];
      const editedText = editedReviews[review.id] ?? review.review_content;
      const editedName = editedNames[review.id] ?? review.reviewer_name;
      const editedRole = editedRoles[review.id] ?? review.reviewer_role;
      if (!currentIds.includes(review.id)) {
        // Insert new widget_review
        const { error: insertError } = await supabase
          .from('widget_reviews')
          .insert([
            {
              widget_id: selectedWidget,
              review_id: review.id,
              review_content: editedText,
              reviewer_name: editedName,
              reviewer_role: editedRole,
              platform: review.platform,
              order_index: i,
            },
          ]);
        if (insertError) {
          setReviewError('Failed to add review: ' + insertError.message);
          return;
        }
      } else {
        // Update edited review
        const widgetReview = (currentWidgetReviews || []).find(r => r.review_id === review.id);
        if (widgetReview) {
          const { error: updateError } = await supabase
            .from('widget_reviews')
            .update({
              review_content: editedText,
              reviewer_name: editedName,
              reviewer_role: editedRole,
              platform: review.platform,
              order_index: i,
            })
            .eq('id', widgetReview.id);
          if (updateError) {
            setReviewError('Failed to update review: ' + updateError.message);
            return;
          }
        }
      }
    }
    // Delete removed reviews
    for (const widgetReview of currentWidgetReviews || []) {
      if (!selectedReviews.some(r => r.id === widgetReview.review_id)) {
        const { error: deleteError } = await supabase
          .from('widget_reviews')
          .delete()
          .eq('id', widgetReview.id);
        if (deleteError) {
          setReviewError('Failed to remove review: ' + deleteError.message);
          return;
        }
      }
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
    document.body.style.userSelect = 'none';
  };
  const handleEditMouseUp = () => {
    setEditDragging(false);
    editDragStart.current = null;
    document.body.style.userSelect = '';
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
      window.addEventListener('mousemove', handleEditMouseMove);
      window.addEventListener('mouseup', handleEditMouseUp);
    } else {
      window.removeEventListener('mousemove', handleEditMouseMove);
      window.removeEventListener('mouseup', handleEditMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleEditMouseMove);
      window.removeEventListener('mouseup', handleEditMouseUp);
    };
  }, [editDragging]);

  const handleCopyEmbed = async (widgetId: string) => {
    const code = `<div id="promptreviews-widget" data-widget="${widgetId}"></div>\n<script src="https://yourdomain.com/widget.js" async></script>`;
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      alert('Could not copy to clipboard. Please copy manually.');
    }
    setCopiedWidgetId(widgetId);
    setTimeout(() => setCopiedWidgetId(null), 1500);
  };

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {/* Title and button now handled in parent card header */}
      </div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Widgets</div>
      <ul className="space-y-4">
        {widgets.map(widget => (
          <li
            key={widget.id}
            className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:shadow-lg ${selectedWidgetId === widget.id ? 'bg-purple-50 border-purple-300 shadow-md' : 'bg-gray-50'}`}
            onClick={() => onSelectWidget && onSelectWidget(widget)}
          >
            <div>
              <div className="font-semibold text-lg text-dustyPlum">{widget.name}</div>
              <button
                className="mt-2 flex items-center gap-2 text-xs text-indigo-700 hover:text-indigo-900 border border-indigo-100 rounded px-2 py-1 bg-indigo-50 hover:bg-indigo-100"
                onClick={(e) => { e.stopPropagation(); handleCopyEmbed(widget.id); }}
                aria-label={`Copy embed code for ${widget.name}`}
              >
                <FaCopy />
                Copy embed code
                {copiedWidgetId === widget.id && <span className="ml-2 text-green-600">Copied!</span>}
              </button>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                onClick={e => { e.stopPropagation(); handleOpenForm(widget); }}
                aria-label={`Edit widget ${widget.name}`}
              >
                Edit Style
              </button>
              <button
                className="px-3 py-1 bg-paleGold text-charcoalBlack border border-paleGold rounded hover:bg-softPeach hover:border-softPeach transition-colors"
                onClick={async e => { e.stopPropagation(); await handleOpenReviewModal(widget.id); }}
                aria-label={`Manage reviews for ${widget.name}`}
              >
                Add/Edit Reviews
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Widget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50">
          <div
            ref={editModalRef}
            className="bg-white rounded-lg shadow-lg pt-0 px-8 pb-8 max-w-3xl w-full fixed flex flex-col"
            style={{
              minHeight: 400,
              left: editModalPos.x,
              top: editModalPos.y,
              cursor: editDragging ? 'grabbing' : undefined,
              width: 860,
              maxWidth: '94vw',
            }}
          >
            {/* Draggable Header (absolute, full width, taller) with Save and Close buttons */}
            <div
              className="absolute left-0 top-0 w-full h-16 rounded-t-lg bg-gradient-to-r from-indigo-100 to-purple-100 select-none z-20"
              style={{ cursor: editDragging ? 'grabbing' : 'grab' }}
              onMouseDown={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleEditMouseDown(e);
              }}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4 ml-8">
                  <span className="text-xl font-bold text-white">{editing ? 'Edit widget' : 'New widget'}</span>
                  <span className="text-xs text-white ml-4">Drag to move</span>
                </div>
                <button
                  className="py-2 px-5 bg-indigo text-white rounded-lg font-semibold hover:bg-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo transition-colors shadow mr-8"
                  onClick={handleSave}
                  style={{ minWidth: 90 }}
                >
                  Save
                </button>
              </div>
              <button
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow text-gray-400 hover:text-gray-700 text-xl z-20 border border-gray-200"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                style={{ position: 'absolute', top: '-12px', right: '-12px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            {/* Add extra space below the draggable header */}
            <div className="mt-16" />
            <label className="block text-sm font-medium text-gray-500 mb-2 mt-8">Widget name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 mb-4"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={50}
              autoFocus
            />
            {/* Design Controls */}
            <div className="mt-6 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Widget Type Selector - spans all columns */}
                <div className="flex flex-col mb-2 md:col-span-3">
                  <span className="text-sm font-bold text-gray-500 mb-2">Widget type:</span>
                  <div className="flex gap-4 items-center">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="single"
                        checked={!design.showGrid}
                        onChange={() => {
                          const newDesign = { ...design, showGrid: false };
                          setDesign(newDesign);
                          if (onDesignChange) onDesignChange(newDesign);
                        }}
                      />
                      <span className="ml-2 text-sm">Single</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="multi"
                        checked={design.showGrid}
                        onChange={() => {
                          const newDesign = { ...design, showGrid: true };
                          setDesign(newDesign);
                          if (onDesignChange) onDesignChange(newDesign);
                        }}
                      />
                      <span className="ml-2 text-sm">Multi (3 reviews)</span>
                    </label>
                  </div>
                </div>
                {/* Column 1: Background */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Background type</span>
                    <div className="flex gap-3 items-center">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="none"
                          checked={design.bgType === 'none'}
                          onChange={() => {
                            const newDesign = { ...design, bgType: 'none', bgColor: 'transparent', bgOpacity: 1 };
                            setDesign(newDesign);
                            if (onDesignChange) onDesignChange(newDesign);
                          }}
                        />
                        <span className="ml-2 text-sm">No Background</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="solid"
                          checked={design.bgType === 'solid'}
                          onChange={() => {
                            const newDesign = { ...design, bgType: 'solid', bgColor: design.bgColor === 'transparent' ? '#ffffff' : design.bgColor };
                            setDesign(newDesign);
                            if (onDesignChange) onDesignChange(newDesign);
                          }}
                        />
                        <span className="ml-2 text-sm">Solid</span>
                      </label>
                    </div>
                  </div>
                  {design.bgType !== 'none' && (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-500 mb-2">Background</span>
                      <div className="flex gap-3 items-center">
                        <input type="color" value={design.bgColor} onChange={e => {
                          const newDesign = { ...design, bgColor: e.target.value };
                          setDesign(newDesign);
                          if (onDesignChange) onDesignChange(newDesign);
                        }} />
                        <input type="text" className="border rounded px-2 py-1 w-28" value={design.bgColor} onChange={e => {
                          const newDesign = { ...design, bgColor: e.target.value };
                          setDesign(newDesign);
                          if (onDesignChange) onDesignChange(newDesign);
                        }} />
                      </div>
                    </div>
                  )}
                  {design.bgType !== 'none' && (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-500 mb-2">Transparency</span>
                      <div className="flex gap-3 items-center">
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.01}
                          value={design.bgOpacity}
                          onChange={e => {
                            const newDesign = { ...design, bgOpacity: Number(e.target.value) };
                            setDesign(newDesign);
                            if (onDesignChange) onDesignChange(newDesign);
                          }}
                          className="w-32"
                        />
                        <span className="text-xs text-gray-500">{Math.round(design.bgOpacity * 100)}%</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Shadow</span>
                    <div className="flex gap-3 items-center">
                      <input type="checkbox" checked={design.shadow} onChange={() => {
                        const newDesign = { ...design, shadow: !design.shadow };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <span className="text-xs text-gray-500">On</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Border</span>
                    <div className="flex gap-3 items-center">
                      <input type="checkbox" checked={design.border} onChange={() => {
                        const newDesign = { ...design, border: !design.border };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <span className="text-xs text-gray-500">On</span>
                    </div>
                  </div>
                  {design.border && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-500 mb-2">Border thickness</span>
                        <div className="flex gap-3 items-center">
                          <input
                            type="range"
                            min={1}
                            max={8}
                            step={1}
                            value={design.borderWidth}
                            onChange={e => {
                              const newDesign = { ...design, borderWidth: Number(e.target.value) };
                              setDesign(newDesign);
                              if (onDesignChange) onDesignChange(newDesign);
                            }}
                            className="w-32"
                          />
                          <span className="text-xs text-gray-500">{design.borderWidth}px</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-500 mb-2">Border radius</span>
                        <div className="flex gap-3 items-center">
                          <input type="range" min={0} max={32} value={design.borderRadius} onChange={e => {
                            const newDesign = { ...design, borderRadius: Number(e.target.value) };
                            setDesign(newDesign);
                            if (onDesignChange) onDesignChange(newDesign);
                          }} />
                          <span className="text-xs text-gray-500">{design.borderRadius}px</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {/* Column 2: Typography */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Quote font size</span>
                    <div className="flex gap-3 items-center">
                      <input type="number" min={12} max={32} value={design.quoteFontSize} onChange={e => {
                        const newDesign = { ...design, quoteFontSize: Number(e.target.value) };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} className="border rounded px-2 py-1 w-20" />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Attribution font size</span>
                    <div className="flex gap-3 items-center">
                      <input type="number" min={10} max={24} value={design.attributionFontSize} onChange={e => {
                        const newDesign = { ...design, attributionFontSize: Number(e.target.value) };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} className="border rounded px-2 py-1 w-20" />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Text</span>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={design.textColor} onChange={e => {
                        const newDesign = { ...design, textColor: e.target.value };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <input type="text" className="border rounded px-2 py-1 w-28" value={design.textColor} onChange={e => {
                        const newDesign = { ...design, textColor: e.target.value };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Accent</span>
                    <div className="flex gap-3 items-center">
                      <input type="color" value={design.accentColor} onChange={e => {
                        const newDesign = { ...design, accentColor: e.target.value };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <input type="text" className="border rounded px-2 py-1 w-28" value={design.accentColor} onChange={e => {
                        const newDesign = { ...design, accentColor: e.target.value };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Line spacing</span>
                    <div className="flex gap-3 items-center">
                      <input
                        type="range"
                        min={1}
                        max={2}
                        step={0.05}
                        value={design.lineSpacing}
                        onChange={e => {
                          const newDesign = { ...design, lineSpacing: Number(e.target.value) };
                          setDesign(newDesign);
                          if (onDesignChange) onDesignChange(newDesign);
                        }}
                        className="w-32"
                      />
                      <span className="text-xs text-gray-500">{design.lineSpacing.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
                {/* Column 3: Misc */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Show review age & platform</span>
                    <div className="flex gap-3 items-center">
                      <input type="checkbox" checked={design.showRelativeDate} onChange={() => {
                        const newDesign = { ...design, showRelativeDate: !design.showRelativeDate };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <span className="text-xs text-gray-500">On</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Show decorative quotes</span>
                    <div className="flex gap-3 items-center">
                      <input type="checkbox" checked={design.showQuotes} onChange={() => {
                        const newDesign = { ...design, showQuotes: !design.showQuotes };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <span className="text-xs text-gray-500">On</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-500 mb-2">Auto-advance reviews</span>
                    <div className="flex gap-3 items-center">
                      <input type="checkbox" checked={design.autoAdvance} onChange={e => {
                        const newDesign = { ...design, autoAdvance: e.target.checked };
                        setDesign(newDesign);
                        if (onDesignChange) onDesignChange(newDesign);
                      }} />
                      <span className="text-xs text-gray-500">On</span>
                    </div>
                  </div>
                  {design.autoAdvance && (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-500 mb-2">Slideshow speed</span>
                      <div className="flex gap-3 items-center">
                        <input
                          type="range"
                          min={2}
                          max={10}
                          step={1}
                          value={design.slideshowSpeed}
                          onChange={e => {
                            const newDesign = { ...design, slideshowSpeed: Number(e.target.value) };
                            setDesign(newDesign);
                            if (onDesignChange) onDesignChange(newDesign);
                          }}
                          className="w-32"
                        />
                        <span className="text-xs text-gray-500">{design.slideshowSpeed} sec</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Save button bottom right */}
            <div className="flex justify-end mt-8">
              <button
                className="py-2 px-5 bg-indigo text-white rounded-lg font-semibold hover:bg-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo transition-colors shadow"
                onClick={handleSave}
                style={{ minWidth: 90 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Review Management Modal */}
      {isClient && showReviewModal && (
        <div className="fixed inset-0 z-50">
          <div
            ref={editModalRef}
            className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full fixed flex flex-col"
            style={{
              minHeight: 500,
              left: editModalPos.x,
              top: editModalPos.y,
              cursor: editDragging ? 'grabbing' : undefined,
              width: 600,
              maxWidth: '90vw',
            }}
          >
            {/* Header */}
            <div className="absolute left-0 top-0 w-full h-16 rounded-t-lg bg-gradient-to-r from-indigo-100 to-purple-100 select-none z-20"
              style={{ cursor: editDragging ? 'grabbing' : 'grab' }}
              onMouseDown={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleEditMouseDown(e);
              }}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-4 ml-8">
                  <span className="text-xl font-bold text-white">Manage reviews</span>
                  <span className="text-xs text-white ml-4">Drag to move</span>
                </div>
                <button
                  className="py-2 px-5 bg-indigo text-white rounded-lg font-semibold hover:bg-indigo/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo transition-colors shadow mr-8"
                  onClick={handleSaveReviews}
                  style={{ minWidth: 90 }}
                >
                  Save
                </button>
              </div>
              <button
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow text-gray-400 hover:text-gray-700 text-xl z-20 border border-gray-200"
                onClick={() => setShowReviewModal(false)}
                aria-label="Close"
                style={{ position: 'absolute', top: '-12px', right: '-12px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="mt-16" />
            {/* Modal content starts here */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'select' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-700'}`}
                onClick={() => setActiveTab('select')}
              >
                Add/Remove Reviews
              </button>
              <button
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'edit' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-700'}`}
                onClick={() => {
                  setActiveTab('edit');
                  if (selectedReviews.length === 0) {
                    setEditTabError('No reviews to edit. Add reviews to your widget first.');
                  } else {
                    setEditTabError('');
                  }
                }}
              >
                Edit Selected
              </button>
            </div>
            {activeTab === 'edit' && editTabError && (
              <div className="text-red-500 text-center mb-4">{editTabError}</div>
            )}
            <h3 className="text-xl font-bold mb-4 text-dustyPlum">Manage reviews</h3>
            {loadingReviews ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <FiveStarSpinner />
                Loading reviews…
              </div>
            ) : (
              <>
                {/* Tab Content */}
                {activeTab === 'select' && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Select up to {MAX_WIDGET_REVIEWS} reviews to add to your widget:</div>
                      <div className="flex gap-2 text-xs">
                        <button
                          className={`px-2 py-1 rounded ${sortMode === 'recent' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                          onClick={() => setSortMode('recent')}
                        >
                          Most Recent
                        </button>
                        <button
                          className={`px-2 py-1 rounded ${sortMode === 'az' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                          onClick={() => setSortMode('az')}
                        >
                          A–Z
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {[...allReviews]
                        .sort((a, b) => {
                          if (sortMode === 'az') {
                            return (a.reviewer_name || '').toLowerCase().localeCompare((b.reviewer_name || '').toLowerCase());
                          } else {
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                          }
                        })
                        .map(r => {
                          // Create a snippet of the first 10 words of the review
                          const words = (r.review_content || '').split(/\s+/);
                          const snippet = words.length > 10 ? words.slice(0, 10).join(' ') + '…' : r.review_content;
                          return (
                            <li
                              key={r.id}
                              className={`border rounded p-2 flex items-start gap-2 ${selectedReviews.some(sel => sel.id === r.id) ? 'bg-indigo-50 border-indigo-400' : 'hover:bg-gray-50'}`}
                              onClick={() => handleToggleReview(r)}
                              style={{ cursor: 'pointer' }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedReviews.some(sel => sel.id === r.id)}
                                readOnly
                                className="mt-1"
                              />
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {r.reviewer_name}
                                  <span className="text-xs text-gray-500 font-normal">{snippet}</span>
                                </div>
                                <div className="text-xs text-gray-500">{r.reviewer_role}</div>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}