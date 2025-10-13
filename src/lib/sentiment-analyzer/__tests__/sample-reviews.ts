/**
 * Sample reviews for testing sentiment analysis
 * Represents a diverse mix of sentiments, platforms, and themes
 */

import { ReviewForAnalysis } from '../types';

export const sampleReviews: ReviewForAnalysis[] = [
  // Positive reviews (8)
  {
    id: '1',
    content: 'Absolutely fantastic service! The staff went above and beyond to help me find exactly what I needed. Will definitely be back.',
    rating: 5,
    created_at: '2025-10-10T14:30:00Z',
    platform: 'Google',
    reviewer_name: 'Sarah Johnson',
  },
  {
    id: '2',
    content: 'Great experience overall. Quick response time and very knowledgeable team. Product quality exceeded my expectations.',
    rating: 5,
    created_at: '2025-10-09T10:15:00Z',
    platform: 'Yelp',
    reviewer_name: 'Mike Chen',
  },
  {
    id: '3',
    content: 'Love this place! Clean, organized, and the customer service is top-notch. Best purchase I made all year.',
    rating: 5,
    created_at: '2025-10-08T16:45:00Z',
    platform: 'Facebook',
    reviewer_name: 'Emily Rodriguez',
  },
  {
    id: '4',
    content: 'Really impressed with how they handled my order. Fast shipping and everything arrived in perfect condition.',
    rating: 5,
    created_at: '2025-10-07T09:20:00Z',
    platform: 'Google',
    reviewer_name: 'David Thompson',
  },
  {
    id: '5',
    content: 'Excellent communication throughout the process. Staff was friendly and professional. Highly recommend!',
    rating: 4,
    created_at: '2025-10-06T11:30:00Z',
    platform: 'Yelp',
    reviewer_name: 'Lisa Martinez',
  },
  {
    id: '6',
    content: 'Good service and reasonable prices. The team really knows their stuff. Will use again.',
    rating: 4,
    created_at: '2025-10-05T14:10:00Z',
    platform: 'Google',
    reviewer_name: 'James Wilson',
  },
  {
    id: '7',
    content: 'Very satisfied with my experience. Product quality is great and customer support was helpful when I had questions.',
    rating: 4,
    created_at: '2025-10-04T15:50:00Z',
    platform: 'Facebook',
    reviewer_name: 'Jennifer Lee',
  },
  {
    id: '8',
    content: 'Nice atmosphere and attentive staff. Everything was clean and well-maintained. Would definitely return.',
    rating: 4,
    created_at: '2025-10-03T13:25:00Z',
    platform: 'Yelp',
    reviewer_name: 'Robert Taylor',
  },

  // Mixed/Neutral reviews (5)
  {
    id: '9',
    content: 'Service was okay but the wait time was longer than expected. Product quality is good though.',
    rating: 3,
    created_at: '2025-10-02T12:40:00Z',
    platform: 'Google',
    reviewer_name: 'Amanda Brown',
  },
  {
    id: '10',
    content: 'Decent experience. Some things could be improved like the website navigation, but staff was helpful.',
    rating: 3,
    created_at: '2025-10-01T10:30:00Z',
    platform: 'Facebook',
    reviewer_name: 'Chris Anderson',
  },
  {
    id: '11',
    content: 'Mixed feelings. Great customer service but product arrived with minor damage. They did resolve it quickly.',
    rating: 3,
    created_at: '2025-09-30T16:15:00Z',
    platform: 'Yelp',
    reviewer_name: 'Patricia White',
  },
  {
    id: '12',
    content: 'Average experience. Nothing special but nothing terrible either. Pricing is a bit high for what you get.',
    rating: 3,
    created_at: '2025-09-29T11:20:00Z',
    platform: 'Google',
    reviewer_name: 'Kevin Harris',
  },
  {
    id: '13',
    content: 'It\'s fine. Service was acceptable but I expected more based on the reviews. Maybe I caught them on an off day.',
    rating: 3,
    created_at: '2025-09-28T14:45:00Z',
    platform: 'Yelp',
    reviewer_name: 'Nicole Garcia',
  },

  // Negative reviews (5)
  {
    id: '14',
    content: 'Very disappointed. Product quality was poor and customer service was unresponsive when I tried to get help.',
    rating: 2,
    created_at: '2025-09-27T09:10:00Z',
    platform: 'Google',
    reviewer_name: 'Thomas Clark',
  },
  {
    id: '15',
    content: 'Terrible experience. Had to wait forever and the staff seemed disorganized. Won\'t be coming back.',
    rating: 1,
    created_at: '2025-09-26T15:30:00Z',
    platform: 'Facebook',
    reviewer_name: 'Michelle Lewis',
  },
  {
    id: '16',
    content: 'Not happy at all. Item arrived damaged and return process was a hassle. Expected better quality.',
    rating: 2,
    created_at: '2025-09-25T13:20:00Z',
    platform: 'Yelp',
    reviewer_name: 'Daniel Walker',
  },
  {
    id: '17',
    content: 'Poor service and overpriced. Staff was rude when I asked questions. Would not recommend.',
    rating: 1,
    created_at: '2025-09-24T10:45:00Z',
    platform: 'Google',
    reviewer_name: 'Karen Young',
  },
  {
    id: '18',
    content: 'Disappointed with the quality. Website made it look much better. Shipping took way too long as well.',
    rating: 2,
    created_at: '2025-09-23T12:15:00Z',
    platform: 'Facebook',
    reviewer_name: 'Steven Allen',
  },
];

/**
 * Sample reviews categorized by sentiment for targeted testing
 */
export const reviewsBysentiment = {
  positive: sampleReviews.filter(r => r.rating >= 4),
  mixed: sampleReviews.filter(r => r.rating === 3),
  negative: sampleReviews.filter(r => r.rating <= 2),
};

/**
 * Generate a subset of reviews for testing different plan limits
 */
export function getReviewsForPlan(plan: 'grower' | 'builder' | 'maven'): ReviewForAnalysis[] {
  const limits = {
    grower: 18, // All 18 reviews (within 50 limit)
    builder: 18, // All 18 reviews (within 100 limit)
    maven: 18, // All 18 reviews (within 500 limit)
  };

  return sampleReviews.slice(0, limits[plan]);
}

/**
 * Review statistics for testing
 */
export const sampleStats = {
  total: sampleReviews.length,
  positive: reviewsBysentiment.positive.length,
  mixed: reviewsBysentiment.mixed.length,
  negative: reviewsBysentiment.negative.length,
  averageRating: sampleReviews.reduce((sum, r) => sum + r.rating, 0) / sampleReviews.length,
};

/**
 * Expected themes from sample reviews (for validation testing)
 */
export const expectedThemes = [
  'Customer Service',
  'Product Quality',
  'Shipping & Delivery',
  'Wait Time',
  'Website Navigation',
  'Pricing',
  'Staff Knowledge',
  'Cleanliness & Organization',
];

/**
 * Test case: Insufficient reviews (less than 10)
 */
export const insufficientReviews = sampleReviews.slice(0, 9);

/**
 * Test case: Minimal reviews (exactly 10)
 */
export const minimalReviews = sampleReviews.slice(0, 10);

/**
 * Test case: All positive reviews
 */
export const allPositiveReviews = reviewsBysentiment.positive;

/**
 * Test case: All negative reviews
 */
export const allNegativeReviews = reviewsBysentiment.negative;
