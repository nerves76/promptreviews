'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FaCopy } from 'react-icons/fa';

// Mock widget data for now
const mockWidgets = [
  {
    id: 'widget-1',
    name: 'Homepage Widget',
    review_count: 5,
    is_active: true,
  },
  {
    id: 'widget-2',
    name: 'Product Page Widget',
    review_count: 3,
    is_active: true,
  },
];

const WORD_LIMIT = 120;
const MAX_WIDGET_REVIEWS = 8;

function wordCount(str: string) {
  return str.trim().split(/\s+/).length;
}

export default function WidgetList({ onSelectWidget, selectedWidgetId, onDesignChange }: { onSelectWidget?: (widget: any) => void, selectedWidgetId?: string, onDesignChange?: (design: any) => void }) {
  const [widgets, setWidgets] = useState(mockWidgets);
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
  const [design, setDesign] = useState({
    bgColor: '#ffffff',
    textColor: '#22223b',
    accentColor: '#6c47ff',
    fontSize: 16,
    borderRadius: 16,
    shadow: true,
    bgOpacity: 1,
    autoAdvance: false,
    slideshowSpeed: 4,
    border: true,
    borderWidth: 2,
    lineSpacing: 1.4,
    showQuotes: false,
  });

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

  // Notify parent of design changes
  useEffect(() => {
    if (onDesignChange) onDesignChange(design);
  }, [design, onDesignChange]);

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

  const handleOpenForm = (widget?: typeof mockWidgets[0]) => {
    if (widget) {
      setEditing(widget.id);
      setForm({ name: widget.name, review_count: widget.review_count });
    } else {
      setEditing(null);
      setForm({ name: '', review_count: 5 });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      setWidgets(widgets.map(w => w.id === editing ? { ...w, ...form } : w));
    } else {
      setWidgets([
        ...widgets,
        { id: `widget-${Date.now()}`, name: form.name, review_count: form.review_count, is_active: true },
      ]);
    }
    setShowForm(false);
  };

  // Review management handlers
  const handleOpenReviewModal = (widgetId: string) => {
    setSelectedWidget(widgetId);
    setShowReviewModal(true);
    setSelectedReviews([]);
    setEditedReviews({});
    setReviewError('');
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

  const handleSaveReviews = () => {
    // Validate all selected reviews are within word limit
    for (const review of selectedReviews) {
      const text = editedReviews[review.id] ?? review.review_content;
      if (wordCount(text) > WORD_LIMIT) {
        setReviewError(`One or more reviews are too long. Limit: ${WORD_LIMIT} words.`);
        return;
      }
    }
    // For now, just close modal. In production, save to widget config/db.
    setShowReviewModal(false);
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

  const handleCopyEmbed = (widgetId: string) => {
    const code = `<div id="promptreviews-widget" data-widget="${widgetId}"></div>\n<script src="https://yourdomain.com/widget.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedWidgetId(widgetId);
    setTimeout(() => setCopiedWidgetId(null), 1500);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-900">Your widgets</h2>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => handleOpenForm()}
        >
          + New widget
        </button>
      </div>
      <ul className="space-y-4">
        {widgets.map(widget => (
          <li
            key={widget.id}
            className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-pointer hover:shadow-lg ${selectedWidgetId === widget.id ? 'bg-purple-50 border-purple-300 shadow-md' : 'bg-gray-50'}`}
            onClick={() => onSelectWidget && onSelectWidget(widget)}
          >
            <div>
              <div className="font-semibold text-lg text-gray-900">{widget.name}</div>
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
                Edit
              </button>
              <button
                className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                onClick={e => { e.stopPropagation(); handleOpenReviewModal(widget.id); }}
                aria-label={`Manage reviews for ${widget.name}`}
              >
                Manage reviews
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
            className="bg-white rounded-lg shadow-lg pt-0 px-8 pb-8 max-w-sm w-full fixed flex flex-col"
            style={{
              minHeight: 400,
              left: editModalPos.x,
              top: editModalPos.y,
              cursor: editDragging ? 'grabbing' : undefined,
              width: 500,
              maxWidth: '90vw',
            }}
          >
            {/* Draggable Header (absolute, full width, taller) */}
            <div
              className="absolute left-0 top-0 w-full h-8 rounded-t-lg bg-gradient-to-r from-indigo-100 to-purple-100 cursor-grab select-none flex items-center justify-between px-4 z-10"
              style={{ cursor: editDragging ? 'grabbing' : 'grab' }}
              onMouseDown={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleEditMouseDown(e);
              }}
            >
              <span className="text-xs text-gray-400">Drag to move</span>
              <button
                className="text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowForm(false)}
                aria-label="Close"
                style={{ cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="mt-10" />
            <h3 className="text-xl font-bold mb-4 text-indigo-900">{editing ? 'Edit widget' : 'New widget'}</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Widget name</label>
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
              <h4 className="font-semibold text-indigo-900 mb-2">Design</h4>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Background</label>
                  <input type="color" value={design.bgColor} onChange={e => setDesign(d => ({ ...d, bgColor: e.target.value }))} />
                  <input type="text" className="border rounded px-2 py-1 w-28" value={design.bgColor} onChange={e => setDesign(d => ({ ...d, bgColor: e.target.value }))} />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Transparency</label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={design.bgOpacity}
                    onChange={e => setDesign(d => ({ ...d, bgOpacity: Number(e.target.value) }))}
                    className="w-32"
                  />
                  <span className="text-xs text-gray-500">{Math.round(design.bgOpacity * 100)}%</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Text</label>
                  <input type="color" value={design.textColor} onChange={e => setDesign(d => ({ ...d, textColor: e.target.value }))} />
                  <input type="text" className="border rounded px-2 py-1 w-28" value={design.textColor} onChange={e => setDesign(d => ({ ...d, textColor: e.target.value }))} />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Accent</label>
                  <input type="color" value={design.accentColor} onChange={e => setDesign(d => ({ ...d, accentColor: e.target.value }))} />
                  <input type="text" className="border rounded px-2 py-1 w-28" value={design.accentColor} onChange={e => setDesign(d => ({ ...d, accentColor: e.target.value }))} />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Font size</label>
                  <input type="number" min={12} max={32} value={design.fontSize} onChange={e => setDesign(d => ({ ...d, fontSize: Number(e.target.value) }))} className="border rounded px-2 py-1 w-20" />
                  <span className="text-xs text-gray-500">px</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Shadow</label>
                  <input type="checkbox" checked={design.shadow} onChange={e => setDesign(d => ({ ...d, shadow: e.target.checked }))} />
                  <span className="text-xs text-gray-500">On</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Auto-advance reviews</label>
                  <input type="checkbox" checked={design.autoAdvance} onChange={e => setDesign(d => ({ ...d, autoAdvance: e.target.checked }))} />
                  <span className="text-xs text-gray-500">On</span>
                </div>
                {design.autoAdvance && (
                  <div className="flex gap-4 items-center">
                    <label className="text-sm w-32">Slideshow speed</label>
                    <input
                      type="range"
                      min={2}
                      max={10}
                      step={1}
                      value={design.slideshowSpeed}
                      onChange={e => setDesign(d => ({ ...d, slideshowSpeed: Number(e.target.value) }))}
                      className="w-32"
                    />
                    <span className="text-xs text-gray-500">{design.slideshowSpeed} sec</span>
                  </div>
                )}
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Border</label>
                  <input type="checkbox" checked={design.border} onChange={e => setDesign(d => ({ ...d, border: e.target.checked }))} />
                  <span className="text-xs text-gray-500">On</span>
                </div>
                {design.border && (
                  <>
                    <div className="flex gap-4 items-center">
                      <label className="text-sm w-32">Border thickness</label>
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        value={design.borderWidth}
                        onChange={e => setDesign(d => ({ ...d, borderWidth: Number(e.target.value) }))}
                        className="w-32"
                      />
                      <span className="text-xs text-gray-500">{design.borderWidth}px</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <label className="text-sm w-32">Border radius</label>
                      <input type="range" min={0} max={32} value={design.borderRadius} onChange={e => setDesign(d => ({ ...d, borderRadius: Number(e.target.value) }))} />
                      <span className="text-xs text-gray-500">{design.borderRadius}px</span>
                    </div>
                  </>
                )}
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Line spacing</label>
                  <input
                    type="range"
                    min={1}
                    max={2}
                    step={0.05}
                    value={design.lineSpacing}
                    onChange={e => setDesign(d => ({ ...d, lineSpacing: Number(e.target.value) }))}
                    className="w-32"
                  />
                  <span className="text-xs text-gray-500">{design.lineSpacing.toFixed(2)}x</span>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="text-sm w-32">Show decorative quotes</label>
                  <input type="checkbox" checked={design.showQuotes} onChange={e => setDesign(d => ({ ...d, showQuotes: e.target.checked }))} />
                  <span className="text-xs text-gray-500">On</span>
                </div>
              </div>
            </div>
            <button
              className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      )}
      {/* Review Management Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full fixed flex flex-col"
            style={{
              minHeight: 500,
              left: modalPos.x,
              top: modalPos.y,
              cursor: dragging ? 'grabbing' : undefined,
              width: 600,
              maxWidth: '90vw',
            }}
          >
            {/* Draggable Header */}
            <div
              className="w-full h-6 mb-2 rounded-t-lg bg-gradient-to-r from-indigo-100 to-purple-100 cursor-grab select-none flex items-center justify-between px-4"
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
              onMouseDown={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                handleMouseDown(e);
              }}
            >
              <span className="text-xs text-gray-400">Drag to move</span>
              <button
                className="text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowReviewModal(false)}
                aria-label="Close"
                style={{ cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            {/* Tab Bar */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'select' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-700'}`}
                onClick={() => setActiveTab('select')}
              >
                Add/Remove Reviews
              </button>
              <button
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'edit' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-indigo-700'}`}
                onClick={() => setActiveTab('edit')}
                disabled={selectedReviews.length === 0}
              >
                Edit Selected
              </button>
            </div>
            <h3 className="text-xl font-bold mb-4 text-indigo-900">Manage reviews</h3>
            {loadingReviews ? (
              <div className="text-center py-8 text-gray-500">Loading reviews…</div>
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
                        .map(r => (
                          <li key={r.id} className={`border rounded p-2 flex items-start gap-2 ${selectedReviews.some(sel => sel.id === r.id) ? 'bg-indigo-50 border-indigo-400' : 'hover:bg-gray-50'}`}>
                            <input
                              type="checkbox"
                              checked={selectedReviews.some(sel => sel.id === r.id)}
                              onChange={() => handleToggleReview(r)}
                              disabled={!selectedReviews.some(sel => sel.id === r.id) && selectedReviews.length >= MAX_WIDGET_REVIEWS}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="text-sm text-gray-800">{r.review_content.slice(0, 80)}{r.review_content.length > 80 ? '…' : ''}</div>
                              <div className="text-xs text-gray-500">— {r.reviewer_name}, {r.reviewer_role} ({r.platform})</div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {activeTab === 'edit' && (
                  <div className="flex flex-col h-full">
                    <div className="font-medium mb-2">Edit selected reviews (max {WORD_LIMIT} words each):</div>
                    {selectedReviews.map(r => {
                      const tooLong = wordCount(editedReviews[r.id] ?? r.review_content) > WORD_LIMIT;
                      return (
                        <div key={r.id} className={`mb-4 border rounded p-3 bg-gray-50 ${tooLong ? 'border-orange-400' : ''}`}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Review by {r.reviewer_name} ({r.platform}):</label>
                          <textarea
                            className={`w-full border rounded px-3 py-2 mb-2 ${tooLong ? 'border-orange-400' : ''}`}
                            rows={3}
                            value={editedReviews[r.id] ?? r.review_content}
                            onChange={e => handleReviewEdit(r.id, e.target.value)}
                          />
                          <div className="flex justify-between text-xs">
                            <span className={tooLong ? 'text-orange-600' : 'text-gray-500'}>
                              {wordCount(editedReviews[r.id] ?? r.review_content)} / {WORD_LIMIT} words
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Error message and Save button bar at bottom */}
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  {reviewError && <div className="text-red-600 text-xs mb-2">{reviewError}</div>}
                  <button
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handleSaveReviews}
                    disabled={selectedReviews.some(r => wordCount(editedReviews[r.id] ?? r.review_content) > WORD_LIMIT)}
                  >
                    Save to widget
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 