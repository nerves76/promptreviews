import React from 'react';
import StarRating from '../app/dashboard/widget/components/shared/StarRating';

export const renderStars = (rating: number) => {
  return <StarRating rating={rating} size={16} />;
}; 