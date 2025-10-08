import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/auth/providers/supabase';
import { MAX_WIDGET_REVIEWS } from '@/lib/constants';
import { ReviewList } from './ReviewList';
import { PhotoUpload } from './PhotoUpload';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWidget: string | null;
  widgets: any[];
  selectedReviews: any[];
  onSaveReviews: () => Promise<void>;
  onToggleReview: (review: any) => void;
  reviewError: string | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  selectedWidget,
  widgets,
  selectedReviews,
  onSaveReviews,
  onToggleReview,
  reviewError,
}) => {
  const [reviewModalPos, setReviewModalPos] = useState({ x: 0, y: 0 });
  const [reviewModalDragging, setReviewModalDragging] = useState(false);
  const reviewModalDragStart = useRef<{ x: number; y: number } | null>(null);

  // Center modal after mount
  useEffect(() => {
    if (isOpen) {
      const width = 800;
      const height = 600;
      const x = Math.max((window.innerWidth - width) / 2, 0);
      const y = Math.max((window.innerHeight - height) / 2, 0);
      setReviewModalPos({ x, y });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setReviewModalDragging(true);
    reviewModalDragStart.current = {
      x: e.clientX - reviewModalPos.x,
      y: e.clientY - reviewModalPos.y,
    };
    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    setReviewModalDragging(false);
    reviewModalDragStart.current = null;
    document.body.style.userSelect = "";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!reviewModalDragging || !reviewModalDragStart.current) return;
    setReviewModalPos({
      x: e.clientX - reviewModalDragStart.current.x,
      y: e.clientY - reviewModalDragStart.current.y,
    });
  };

  useEffect(() => {
    if (reviewModalDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [reviewModalDragging]);

  if (!isOpen) return null;

      const isPhotoWidget = selectedWidget && widgets.find(w => w.id === selectedWidget)?.type === 'photo';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div
        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-[800px] max-h-[600px] flex flex-col border-2 border-white"
        style={{
          position: 'absolute',
          left: reviewModalPos.x,
          top: reviewModalPos.y,
        }}
      >
        <div
          className="p-4 border-b cursor-move"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold">Edit reviews</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReviewList
            selectedReviews={selectedReviews}
            onToggleReview={onToggleReview}
            isPhotoWidget={!!isPhotoWidget}
          />
          {isPhotoWidget && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload photo
              </label>
              {selectedReviews.map((review) => (
                <PhotoUpload
                  key={review.review_id}
                  reviewId={review.review_id}
                  selectedWidget={selectedWidget}
                />
              ))}
            </div>
          )}
          {reviewError && (
            <div className="text-red-600 text-sm mt-2">{reviewError}</div>
          )}
        </div>
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onSaveReviews}
            className="py-2 px-5 bg-slate-blue text-white rounded-lg font-semibold hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue transition-colors shadow mr-2"
            style={{ minWidth: 90 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}; 