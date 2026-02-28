'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';
import { LoadingSpinner } from '@/app/(app)/components/ui/loading-spinner';
import { apiClient } from '@/utils/apiClient';
import { ProposalReviewItem } from '../types';
import StarRating from '@/app/(app)/dashboard/widget/components/shared/StarRating';
import Icon from '@/components/Icon';

interface ReviewFromApi {
  id: string;
  first_name: string | null;
  last_name: string | null;
  review_content: string;
  star_rating: number;
  platform: string;
  created_at: string;
}

interface ReviewPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (reviews: ProposalReviewItem[]) => void;
  alreadySelectedIds: string[];
}

export function ReviewPickerModal({ isOpen, onClose, onAdd, alreadySelectedIds }: ReviewPickerModalProps) {
  const [reviews, setReviews] = useState<ReviewFromApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set());
    setError(null);
    fetchReviews();
  }, [isOpen]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const data = await apiClient.get<{ reviews: ReviewFromApi[] }>('/reviews/list');
      setReviews(data.reviews);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  function toggleReview(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleAdd() {
    const selected = reviews
      .filter((r) => selectedIds.has(r.id))
      .map((r): ProposalReviewItem => ({
        id: r.id,
        reviewer_name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Anonymous',
        star_rating: r.star_rating,
        review_content: r.review_content,
        platform: r.platform,
        created_at: r.created_at,
      }));
    onAdd(selected);
    onClose();
  }

  const available = reviews.filter((r) => !alreadySelectedIds.includes(r.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select reviews" size="2xl">
      <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && available.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            {reviews.length === 0
              ? 'No reviews found. Reviews with 4+ stars will appear here.'
              : 'All available reviews have already been added.'}
          </div>
        )}

        {!loading && !error && available.length > 0 && (
          <div className="space-y-2">
            {available.map((review) => {
              const isSelected = selectedIds.has(review.id);
              const name = [review.first_name, review.last_name].filter(Boolean).join(' ') || 'Anonymous';
              return (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => toggleReview(review.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-slate-blue bg-slate-blue/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-slate-blue bg-slate-blue' : 'border-gray-300'
                    }`}>
                      {isSelected && <Icon name="FaCheck" size={10} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.star_rating} size={14} />
                        <span className="text-sm font-medium text-gray-900">{name}</span>
                        {review.platform && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                            {review.platform}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{review.review_content}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
          Add {selectedIds.size > 0 ? `${selectedIds.size} review${selectedIds.size === 1 ? '' : 's'}` : 'selected'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
