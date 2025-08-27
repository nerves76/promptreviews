import React, { useMemo } from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 16 }: StarRatingProps) {
  // Generate stable IDs for gradients to prevent hydration mismatches
  const gradientIds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => `half-star-gradient-${i + 1}-${rating}-${size}`);
  }, [rating, size]);
  
  if (typeof rating !== 'number' || isNaN(rating)) return null;
  
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    const gradientId = gradientIds[i - 1];
    
    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill={full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}
        stroke="#FBBF24"
        style={{ display: 'inline-block', marginRight: 2 }}
      >
        {half && (
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        )}
        <polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" />
      </svg>
    );
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 4 }}>
      {stars}
    </span>
  );
} 