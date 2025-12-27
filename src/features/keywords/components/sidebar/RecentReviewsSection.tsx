'use client';

export interface RecentReview {
  id: string;
  reviewerName: string;
  content: string | null;
}

export interface RecentReviewsSectionProps {
  /** Recent reviews that match this keyword */
  recentReviews: RecentReview[];
  /** Maximum number of reviews to display */
  maxReviews?: number;
}

/**
 * RecentReviewsSection Component
 *
 * Displays recent reviews that match this keyword.
 */
export function RecentReviewsSection({
  recentReviews,
  maxReviews = 5,
}: RecentReviewsSectionProps) {
  // Don't render if no reviews
  if (recentReviews.length === 0) {
    return null;
  }

  const displayedReviews = recentReviews.slice(0, maxReviews);

  return (
    <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl">
      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
        Recent Matches
      </span>
      <div className="space-y-2 mt-2">
        {displayedReviews.map((review) => (
          <div key={review.id} className="text-sm p-2 bg-white/80 rounded-lg">
            <div className="font-medium text-gray-700">{review.reviewerName}</div>
            {review.content && (
              <div className="text-gray-500 text-xs line-clamp-2 mt-1">{review.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentReviewsSection;
