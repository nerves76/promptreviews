'use client';

import { useState } from 'react';
import { ProposalCustomSection, ProposalReviewItem } from '../types';
import { SavedSectionsModal } from './SavedSectionsModal';
import { SaveSectionModal } from './SaveSectionModal';
import { EnhanceSectionModal } from './EnhanceSectionModal';
import { ReviewPickerModal } from './ReviewPickerModal';
import StarRating from '@/app/(app)/dashboard/widget/components/shared/StarRating';
import Icon from '@/components/Icon';

interface ProposalCustomSectionsEditorProps {
  sections: ProposalCustomSection[];
  onChange: (sections: ProposalCustomSection[]) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function ProposalCustomSectionsEditor({ sections, onChange }: ProposalCustomSectionsEditorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [saveTarget, setSaveTarget] = useState<ProposalCustomSection | null>(null);
  const [enhanceTarget, setEnhanceTarget] = useState<ProposalCustomSection | null>(null);
  const [reviewPickerTarget, setReviewPickerTarget] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSection = () => {
    const newSection: ProposalCustomSection = {
      id: generateId(),
      title: '',
      body: '',
      position: sections.length,
    };
    onChange([...sections, newSection]);
  };

  const addReviewsSection = () => {
    const id = generateId();
    const newSection: ProposalCustomSection = {
      id,
      type: 'reviews',
      title: 'What our clients say',
      body: '',
      position: sections.length,
      reviews: [],
    };
    onChange([...sections, newSection]);
    setReviewPickerTarget(id);
  };

  const removeSection = (id: string) => {
    onChange(
      sections
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, position: i }))
    );
  };

  const updateSection = (id: string, field: 'title' | 'subtitle' | 'body', value: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, position: i })));
  };

  const handleImport = (title: string, body: string, subtitle?: string) => {
    const newSection: ProposalCustomSection = {
      id: generateId(),
      title,
      subtitle: subtitle || '',
      body,
      position: sections.length,
    };
    onChange([...sections, newSection]);
  };

  const handleAddReviews = (sectionId: string, newReviews: ProposalReviewItem[]) => {
    onChange(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const existing = s.reviews || [];
        const existingIds = new Set(existing.map((r) => r.id));
        const deduped = newReviews.filter((r) => !existingIds.has(r.id));
        return { ...s, reviews: [...existing, ...deduped] };
      })
    );
  };

  const removeReview = (sectionId: string, reviewId: string) => {
    onChange(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, reviews: (s.reviews || []).filter((r) => r.id !== reviewId) };
      })
    );
  };

  const isReviewsSection = (s: ProposalCustomSection) => s.type === 'reviews';

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {/* Header row — shared between text and reviews sections */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleCollapsed(section.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={collapsedIds.has(section.id) ? 'Expand section' : 'Collapse section'}
            >
              <Icon
                name={collapsedIds.has(section.id) ? 'FaChevronRight' : 'FaChevronDown'}
                size={12}
              />
            </button>
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => moveSection(index, 'up')}
                disabled={index === 0}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move section up"
              >
                <Icon name="FaChevronUp" size={10} />
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 'down')}
                disabled={index === sections.length - 1}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Move section down"
              >
                <Icon name="FaChevronDown" size={10} />
              </button>
            </div>
            {collapsedIds.has(section.id) ? (
              <button
                type="button"
                onClick={() => toggleCollapsed(section.id)}
                className="flex-1 text-left text-sm font-medium text-gray-900 truncate py-1.5 hover:text-slate-blue transition-colors cursor-pointer"
              >
                {section.title || (isReviewsSection(section) ? 'Reviews section' : 'Untitled section')}
              </button>
            ) : (
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                placeholder={isReviewsSection(section) ? 'Reviews section title' : 'Section title'}
                className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                aria-label="Section title"
              />
            )}
            {isReviewsSection(section) && (section.reviews?.length ?? 0) > 0 && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                {section.reviews!.length} review{section.reviews!.length === 1 ? '' : 's'}
              </span>
            )}
            {!collapsedIds.has(section.id) && isReviewsSection(section) && (
              <div className="flex items-center rounded-md border border-gray-200 overflow-hidden text-xs whitespace-nowrap" role="group" aria-label="Review display style">
                <button
                  type="button"
                  onClick={() => onChange(sections.map((s) => s.id === section.id ? { ...s, reviews_on_card: true } : s))}
                  className={`px-2 py-1 transition-colors ${section.reviews_on_card !== false ? 'bg-slate-blue text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Display reviews on card"
                >
                  On card
                </button>
                <button
                  type="button"
                  onClick={() => onChange(sections.map((s) => s.id === section.id ? { ...s, reviews_on_card: false } : s))}
                  className={`px-2 py-1 transition-colors ${section.reviews_on_card === false ? 'bg-slate-blue text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Display reviews floating"
                >
                  Floating
                </button>
              </div>
            )}
            {!collapsedIds.has(section.id) && !isReviewsSection(section) && (
              <button
                type="button"
                onClick={() => setSaveTarget(section)}
                disabled={!section.title.trim()}
                className="p-1.5 text-gray-400 hover:text-slate-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Save section to library"
                title="Save to library"
              >
                <Icon name="FaSave" size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove section"
            >
              <Icon name="FaTrash" size={14} />
            </button>
          </div>

          {/* Section body — hidden when collapsed */}
          {!collapsedIds.has(section.id) && (
            <div className="mt-3">
              {/* Reviews section body */}
              {isReviewsSection(section) ? (
                <div className="space-y-2">
                  {(section.reviews || []).map((review) => (
                    <div
                      key={review.id}
                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating rating={review.star_rating} size={13} />
                          <span className="text-sm font-medium text-gray-900">{review.reviewer_name}</span>
                          {review.platform && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {review.platform}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.review_content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReview(section.id, review.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        aria-label={`Remove review from ${review.reviewer_name}`}
                      >
                        <Icon name="FaTimes" size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReviewPickerTarget(section.id)}
                    className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors mt-2"
                  >
                    <Icon name="FaPlus" size={12} />
                    Add reviews
                  </button>
                </div>
              ) : (
                /* Text section body */
                <>
                  <input
                    type="text"
                    value={section.subtitle || ''}
                    onChange={(e) => updateSection(section.id, 'subtitle', e.target.value)}
                    placeholder="Subtitle (optional)"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 mb-2"
                    aria-label="Section subtitle"
                  />
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      onClick={() => setEnhanceTarget(section)}
                      disabled={section.body.trim().length < 10}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-blue hover:bg-slate-blue/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Enhance section with AI"
                    >
                      <Icon name="prompty" size={16} className="text-slate-blue" />
                      Enhance with AI
                    </button>
                  </div>
                  <textarea
                    value={section.body}
                    onChange={(e) => updateSection(section.id, 'body', e.target.value)}
                    placeholder="Section content..."
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1 resize-y"
                    aria-label="Section content"
                  />
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addSection}
          className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
        >
          <Icon name="FaPlus" size={12} />
          Add section
        </button>
        <button
          type="button"
          onClick={addReviewsSection}
          className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
        >
          <Icon name="FaStar" size={12} />
          Add reviews
        </button>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
        >
          <Icon name="FaSave" size={12} />
          Import saved section
        </button>
      </div>

      <SavedSectionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <SaveSectionModal
        isOpen={!!saveTarget}
        onClose={() => setSaveTarget(null)}
        defaultName={saveTarget?.title || ''}
        sectionTitle={saveTarget?.title || ''}
        sectionSubtitle={saveTarget?.subtitle || ''}
        sectionBody={saveTarget?.body || ''}
      />

      {enhanceTarget && (
        <EnhanceSectionModal
          isOpen={!!enhanceTarget}
          onClose={() => setEnhanceTarget(null)}
          sectionTitle={enhanceTarget.title}
          sectionBody={enhanceTarget.body}
          onAccept={(text) => updateSection(enhanceTarget.id, 'body', text)}
        />
      )}

      {reviewPickerTarget && (
        <ReviewPickerModal
          isOpen={!!reviewPickerTarget}
          onClose={() => setReviewPickerTarget(null)}
          onAdd={(reviews) => handleAddReviews(reviewPickerTarget, reviews)}
          alreadySelectedIds={
            sections
              .find((s) => s.id === reviewPickerTarget)
              ?.reviews?.map((r) => r.id) || []
          }
        />
      )}
    </div>
  );
}
