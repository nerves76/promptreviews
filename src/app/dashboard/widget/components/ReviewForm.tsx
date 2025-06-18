import React from 'react';
import { PhotoUpload } from './PhotoUpload';

interface ReviewFormProps {
  review: any;
  editedNames: Record<string, string>;
  editedRoles: Record<string, string>;
  editedReviews: Record<string, string>;
  editedRatings: Record<string, number | null>;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onReviewChange: (value: string) => void;
  onRatingChange: (value: number | null) => void;
  onRemove: () => void;
  isPhotoWidget: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  review,
  editedNames,
  editedRoles,
  editedReviews,
  editedRatings,
  onNameChange,
  onRoleChange,
  onReviewChange,
  onRatingChange,
  onRemove,
  isPhotoWidget,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={editedNames[review.review_id] || review.first_name}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input
            type="text"
            value={editedRoles[review.review_id] || review.reviewer_role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Review</label>
        <textarea
          value={editedReviews[review.review_id] || review.review_content}
          onChange={(e) => onReviewChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rating</label>
        <input
          type="number"
          min="1"
          max="5"
          step="0.5"
          value={editedRatings[review.review_id] || review.star_rating || ''}
          onChange={(e) => onRatingChange(e.target.value ? parseFloat(e.target.value) : null)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="1-5 (e.g. 4.5)"
        />
      </div>
      {isPhotoWidget && (
        <PhotoUpload
          reviewId={review.review_id}
          selectedWidget={review.widget_id}
        />
      )}
      <div className="flex justify-end">
        <button
          onClick={onRemove}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
        >
          Remove
        </button>
      </div>
    </div>
  );
}; 