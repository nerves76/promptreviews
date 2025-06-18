import React, { useState } from 'react';
import { ReviewForm } from './ReviewForm';

interface ReviewListProps {
  selectedReviews: any[];
  onToggleReview: (review: any) => void;
  isPhotoWidget: boolean;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  selectedReviews,
  onToggleReview,
  isPhotoWidget,
}) => {
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [editedRoles, setEditedRoles] = useState<Record<string, string>>({});
  const [editedReviews, setEditedReviews] = useState<Record<string, string>>({});
  const [editedRatings, setEditedRatings] = useState<Record<string, number | null>>({});

  return (
    <div className="space-y-4">
      {selectedReviews.map((review) => (
        <div key={review.review_id} className="border rounded-lg p-4">
          <ReviewForm
            review={review}
            editedNames={editedNames}
            editedRoles={editedRoles}
            editedReviews={editedReviews}
            editedRatings={editedRatings}
            onNameChange={(value) => setEditedNames(prev => ({ ...prev, [review.review_id]: value }))}
            onRoleChange={(value) => setEditedRoles(prev => ({ ...prev, [review.review_id]: value }))}
            onReviewChange={(value) => setEditedReviews(prev => ({ ...prev, [review.review_id]: value }))}
            onRatingChange={(value) => setEditedRatings(prev => ({ ...prev, [review.review_id]: value }))}
            onRemove={() => onToggleReview(review)}
            isPhotoWidget={isPhotoWidget}
          />
        </div>
      ))}
    </div>
  );
}; 