/**
 * Google Business Profile Overview Data Helpers
 * 
 * Utility functions for processing and calculating overview page metrics,
 * including profile completeness, optimization opportunities, and data transformations.
 */

import type { BusinessLocation } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfile';

// Types for overview data processing
export interface ProfileCompletenessData {
  categoriesUsed: number;
  maxCategories: number;
  servicesCount: number;
  servicesWithDescriptions: number;
  businessDescriptionLength: number;
  businessDescriptionMaxLength: number;
  seoScore: number;
  photosByCategory: Record<string, number>;
}

export interface ReviewTrendsData {
  totalReviews: number;
  reviewTrend: number;
  averageRating: number;
  monthlyReviewData: Array<{
    month: string;
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
    noRating: number;
  }>;
}

export interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface EngagementData {
  unrespondedReviews: number;
  totalQuestions: number;
  unansweredQuestions: number;
  recentPosts: number;
  lastPostDate?: string;
}

export interface PerformanceData {
  monthlyViews: number;
  viewsTrend: number;
  topSearchQueries: string[];
  customerActions: {
    websiteClicks: number;
    phoneCalls: number;
    directionRequests: number;
    photoViews: number;
  };
}

/**
 * Calculate profile completeness metrics from business location data
 */
export function calculateProfileCompleteness(
  location: BusinessLocation,
  categories: any[] = [],
  photos: any[] = []
): ProfileCompletenessData {
  const maxCategories = 10; // Google allows up to 10 categories
  const maxDescriptionLength = 750; // Google's limit for business descriptions

  // Count categories - handle different Google API structures
  let categoriesUsed = 0;
  
  // Check for categories under 'categories' object (common Google structure)
  if (location.categories) {
    if (location.categories.primaryCategory) categoriesUsed++;
    if (location.categories.additionalCategories && Array.isArray(location.categories.additionalCategories)) {
      categoriesUsed += location.categories.additionalCategories.length;
    }
  } else {
    // Check for categories directly on location object (fallback)
    if (location.primaryCategory) categoriesUsed++;
    if (location.additionalCategories && Array.isArray(location.additionalCategories)) {
      categoriesUsed += location.additionalCategories.length;
    }
  }

  // Count services
  const servicesCount = location.serviceItems?.length || 0;
  const servicesWithDescriptions = location.serviceItems?.filter(service => 
    (service.structuredServiceItem?.description && service.structuredServiceItem.description.trim().length > 0) ||
    (service.freeFormServiceItem?.label?.description && service.freeFormServiceItem.label.description.trim().length > 0)
  ).length || 0;

  // Business description
  const businessDescription = location.profile?.description || '';
  const businessDescriptionLength = businessDescription.length;

  // Calculate SEO score
  const seoScore = calculateSEOScore(businessDescription, location);

  // Process photos by category
  const photosByCategory = processPhotosByCategory(photos);

  return {
    categoriesUsed,
    maxCategories,
    servicesCount,
    servicesWithDescriptions,
    businessDescriptionLength,
    businessDescriptionMaxLength: maxDescriptionLength,
    seoScore,
    photosByCategory
  };
}

/**
 * Process review data to generate trends and statistics
 */
export function processReviewTrends(reviews: any[]): ReviewTrendsData {
  const totalReviews = reviews.length;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Debug: Log first few reviews to see their structure
  if (reviews.length > 0) {
    console.log('📊 Sample review structure:', reviews[0]);
    console.log('📊 Available review fields:', Object.keys(reviews[0]));
  }
  
  // Calculate average rating
  const ratingsSum = reviews.reduce((sum, review) => {
    let rating = 0;
    
    // Handle Google's text-based rating format
    if (review.starRating) {
      const starRating = review.starRating.toString().toUpperCase();
      switch (starRating) {
        case 'FIVE': rating = 5; break;
        case 'FOUR': rating = 4; break;
        case 'THREE': rating = 3; break;
        case 'TWO': rating = 2; break;
        case 'ONE': rating = 1; break;
        default:
          // Try parsing as number
          rating = parseInt(review.starRating) || parseFloat(review.starRating) || 0;
      }
    } else if (review.rating) {
      rating = parseInt(review.rating) || parseFloat(review.rating) || 0;
    } else if (review.star_rating) {
      rating = parseInt(review.star_rating) || parseFloat(review.star_rating) || 0;
    }
    
    console.log(`📊 Review rating: ${rating} (from starRating: ${review.starRating}, rating: ${review.rating})`);
    return sum + rating;
  }, 0);
  const averageRating = totalReviews > 0 ? ratingsSum / totalReviews : 0;
  
  console.log(`📊 Rating calculation: ${ratingsSum} / ${totalReviews} = ${averageRating}`);

  // Calculate review trend (new reviews in last 30 days)
  const recentReviews = reviews.filter(review => {
    const reviewDate = new Date(review.createTime);
    return reviewDate >= lastMonth;
  });
  const reviewTrend = recentReviews.length;

  // Generate monthly data for the last 12 months
  const monthlyReviewData = generateMonthlyReviewData(reviews);

  return {
    totalReviews,
    reviewTrend,
    averageRating,
    monthlyReviewData
  };
}

/**
 * Generate monthly review data for chart display
 */
function generateMonthlyReviewData(reviews: any[]): ReviewTrendsData['monthlyReviewData'] {
  const months = [];
  const now = new Date();
  
  // Generate last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Filter reviews for this month
    const monthReviews = reviews.filter(review => {
      const reviewDate = new Date(review.createTime);
      return reviewDate.getMonth() === date.getMonth() && 
             reviewDate.getFullYear() === date.getFullYear();
    });

    // Count by star rating
    const starCounts = {
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
      noRating: 0
    };

    monthReviews.forEach(review => {
      let rating = 0;
      
      // Handle Google's text-based rating format
      if (review.starRating) {
        const starRating = review.starRating.toString().toUpperCase();
        switch (starRating) {
          case 'FIVE': rating = 5; break;
          case 'FOUR': rating = 4; break;
          case 'THREE': rating = 3; break;
          case 'TWO': rating = 2; break;
          case 'ONE': rating = 1; break;
          default:
            rating = parseInt(review.starRating) || parseFloat(review.starRating) || 0;
        }
      } else if (review.rating) {
        rating = parseInt(review.rating) || parseFloat(review.rating) || 0;
      }
      
      switch (rating) {
        case 5: starCounts.fiveStar++; break;
        case 4: starCounts.fourStar++; break;
        case 3: starCounts.threeStar++; break;
        case 2: starCounts.twoStar++; break;
        case 1: starCounts.oneStar++; break;
        default: starCounts.noRating++; break;
      }
    });

    months.push({
      month: monthName,
      ...starCounts
    });
  }

  return months;
}

/**
 * Process photos by category for completeness tracking
 */
function processPhotosByCategory(photos: any[]): Record<string, number> {
  const categories = ['LOGO', 'COVER', 'INTERIOR', 'EXTERIOR', 'TEAM', 'PRODUCT', 'FOOD_AND_DRINK', 'MENU', 'COMMON_AREA', 'AT_WORK'];
  const photosByCategory: Record<string, number> = {};

  categories.forEach(category => {
    photosByCategory[category] = photos.filter(photo => 
      photo.locationAssociation?.category === category
    ).length;
  });

  return photosByCategory;
}

/**
 * Calculate SEO score based on business description and location data
 */
function calculateSEOScore(description: string, location: BusinessLocation): number {
  let score = 0;
  const maxScore = 10;
  
  if (!description || description.trim().length === 0) {
    return 0;
  }

  const lowerDesc = description.toLowerCase();
  const words = description.trim().split(/\s+/).length;
  
  // Length score (0-2 points) - prioritize hitting 250+ characters
  if (description.length >= 250 && description.length <= 750) {
    score += 2;
  } else if (description.length >= 200 && description.length < 250) {
    score += 1;
  }
  
  // Business name inclusion (0-2 points)
  const businessName = location.locationName || location.title || '';
  if (businessName && lowerDesc.includes(businessName.toLowerCase())) {
    score += 2;
  }
  
  // Location/address keywords (0-2 points)
  const address = location.address;
  if (address) {
    if (address.locality && lowerDesc.includes(address.locality.toLowerCase())) {
      score += 1;
    }
    if (address.administrativeArea && lowerDesc.includes(address.administrativeArea.toLowerCase())) {
      score += 1;
    }
  }
  
  // Category keywords (0-2 points)
  const primaryCategory = location.primaryCategory?.displayName;
  if (primaryCategory && lowerDesc.includes(primaryCategory.toLowerCase())) {
    score += 2;
  }
  
  // Readability (0-1 point) - prefer shorter sentences
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = words / sentences.length;
  if (avgWordsPerSentence <= 20) {
    score += 1;
  }
  
  // Call to action (0-1 point)
  const ctaWords = ['contact', 'call', 'visit', 'book', 'schedule', 'learn more', 'get quote'];
  if (ctaWords.some(word => lowerDesc.includes(word))) {
    score += 1;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Identify optimization opportunities based on profile data
 */
export function identifyOptimizationOpportunities(
  location: BusinessLocation,
  profileData: ProfileCompletenessData,
  engagementData: EngagementData,
  photos: any[] = []
): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // High priority opportunities
  if (engagementData.unrespondedReviews > 0) {
    opportunities.push({
      id: 'unresponded-reviews',
      title: 'Respond to Reviews',
      description: `${engagementData.unrespondedReviews} reviews need responses to improve customer relations`,
      priority: 'high',
      actionUrl: '/dashboard/google-business?tab=reviews'
    });
  }

  if (profileData.businessDescriptionLength < 100) {
    opportunities.push({
      id: 'business-description',
      title: 'Improve Business Description',
      description: 'Add a detailed business description to improve search visibility',
      priority: 'high',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Medium priority opportunities
  if (profileData.categoriesUsed < 3) {
    opportunities.push({
      id: 'add-categories',
      title: 'Add More Categories',
      description: `Use ${profileData.maxCategories - profileData.categoriesUsed} more categories to improve discoverability`,
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  if (engagementData.unansweredQuestions > 0) {
    opportunities.push({
      id: 'answer-questions',
      title: 'Answer Customer Questions',
      description: `${engagementData.unansweredQuestions} customer questions need answers`,
      priority: 'medium'
    });
  }

  if (profileData.servicesCount > 0 && profileData.servicesWithDescriptions < profileData.servicesCount) {
    opportunities.push({
      id: 'service-descriptions',
      title: 'Add Service Descriptions',
      description: `${profileData.servicesCount - profileData.servicesWithDescriptions} services need detailed descriptions`,
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Low priority opportunities
  const expectedPhotos = { 'LOGO': 1, 'COVER': 1, 'INTERIOR': 3, 'EXTERIOR': 3, 'TEAM': 2, 'PRODUCT': 5 };
  const missingPhotoCategories = Object.entries(expectedPhotos).filter(([category, expected]) => 
    (profileData.photosByCategory[category] || 0) < expected
  );

  if (missingPhotoCategories.length > 0) {
    opportunities.push({
      id: 'add-photos',
      title: 'Add More Photos',
      description: `Upload ${missingPhotoCategories.length} photo categories to showcase your business`,
      priority: 'low',
      actionUrl: '/dashboard/google-business?tab=photos'
    });
  }

  if (engagementData.recentPosts < 4) {
    opportunities.push({
      id: 'create-posts',
      title: 'Increase Posting Frequency',
      description: 'Post regularly to keep customers engaged and improve visibility',
      priority: 'low',
      actionUrl: '/dashboard/google-business?tab=post'
    });
  }

  if (!location.websiteUri) {
    opportunities.push({
      id: 'add-website',
      title: 'Add Website URL',
      description: 'Include your website to drive more traffic to your business',
      priority: 'low',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  if (!location.primaryPhone) {
    opportunities.push({
      id: 'add-phone',
      title: 'Add Phone Number',
      description: 'Make it easy for customers to contact you directly',
      priority: 'low',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return opportunities;
}

/**
 * Format performance data for display
 */
export function formatPerformanceData(insights: any[], customerActions: any[]): PerformanceData {
  // Process insights data (this would come from Google's Insights API)
  const monthlyViews = insights.reduce((total, insight) => {
    return total + (insight.metricValues?.find((mv: any) => mv.metric === 'QUERIES_DIRECT')?.value || 0);
  }, 0);

  // Calculate trends (simplified - would need historical data)
  const viewsTrend = 0; // This would require comparing to previous period

  // Extract top search queries
  const searchQueryData = insights.filter(insight => insight.metric === 'QUERIES_INDIRECT');
  const topSearchQueries = searchQueryData
    .slice(0, 5)
    .map(query => query.dimensionValues?.QUERY || 'Unknown query');

  // Process customer actions
  const actions = {
    websiteClicks: customerActions.filter(action => action.action === 'WEBSITE').length,
    phoneCalls: customerActions.filter(action => action.action === 'PHONE').length,
    directionRequests: customerActions.filter(action => action.action === 'DRIVING_DIRECTIONS').length,
    photoViews: customerActions.filter(action => action.action === 'PHOTOS_VIEWED').length
  };

  return {
    monthlyViews,
    viewsTrend,
    topSearchQueries,
    customerActions: actions
  };
}

/**
 * Generate mock monthly review data that matches current date logic
 */
function generateMockMonthlyReviewData(): ReviewTrendsData['monthlyReviewData'] {
  const months = [];
  const now = new Date();
  
  // Generate last 12 months (same logic as real data)
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Generate some mock review data with realistic distribution
    let mockData;
    const monthIndex = 11 - i; // 0 to 11, where 11 is current month
    
    // Create a pattern where recent months have more reviews
    if (monthIndex === 1) { // March equivalent (second month)
      mockData = { fiveStar: 5, fourStar: 2, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 2) { // April equivalent
      mockData = { fiveStar: 1, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 3) { // May equivalent
      mockData = { fiveStar: 1, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 4) { // June equivalent
      mockData = { fiveStar: 2, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 6) { // August equivalent
      mockData = { fiveStar: 1, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 10) { // December equivalent (2 months ago)
      mockData = { fiveStar: 8, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else if (monthIndex === 11) { // Current month equivalent
      mockData = { fiveStar: 1, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    } else {
      // Empty months
      mockData = { fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 };
    }
    
    months.push({
      month: monthName,
      ...mockData
    });
  }
  
  return months;
}

/**
 * Generate mock data for testing (remove in production)
 */
export function generateMockOverviewData(): {
  profileData: ProfileCompletenessData;
  engagementData: EngagementData;
  performanceData: PerformanceData;
  reviewTrends: ReviewTrendsData;
  optimizationOpportunities: OptimizationOpportunity[];
} {
  const profileData: ProfileCompletenessData = {
    categoriesUsed: 3,
    maxCategories: 10,
    servicesCount: 8,
    servicesWithDescriptions: 5,
    businessDescriptionLength: 245,
    businessDescriptionMaxLength: 750,
    seoScore: 7,
    photosByCategory: {
      'LOGO': 1,
      'COVER': 1,
      'INTERIOR': 2,
      'EXTERIOR': 3,
      'TEAM': 1,
      'PRODUCT': 4
    }
  };

  const engagementData: EngagementData = {
    unrespondedReviews: 3,
    totalQuestions: 15,
    unansweredQuestions: 2,
    recentPosts: 6,
    lastPostDate: '2025-01-15T10:00:00Z'
  };

  const performanceData: PerformanceData = {
    monthlyViews: 1250,
    viewsTrend: 15,
    topSearchQueries: [
      'local marketing agency',
      'business consulting services',
      'digital marketing help'
    ],
    customerActions: {
      websiteClicks: 45,
      phoneCalls: 12,
      directionRequests: 28,
      photoViews: 156
    }
  };

  // Generate dynamic mock data that matches current date logic
  const mockMonthlyData = generateMockMonthlyReviewData();
  
  const reviewTrends: ReviewTrendsData = {
    totalReviews: 22,
    reviewTrend: 20,
    averageRating: 4.8,
    monthlyReviewData: mockMonthlyData
  };

  const optimizationOpportunities = identifyOptimizationOpportunities(
    {} as BusinessLocation,
    profileData,
    engagementData
  );

  return {
    profileData,
    engagementData,
    performanceData,
    reviewTrends,
    optimizationOpportunities
  };
}