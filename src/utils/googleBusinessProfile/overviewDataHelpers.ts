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
  businessAttributes?: number;  // Number of attributes set
  productsCount?: number;  // Number of products listed
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
  totalReviews?: number;  // Total number of reviews
  totalQuestions: number;
  unansweredQuestions: number;
  recentPosts: number;
  lastPostDate?: string;
  averageResponseTimeMs?: number | null;  // Average time to respond to reviews in milliseconds
  respondedReviewsCount?: number;  // Number of reviews that have been responded to
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
  
  // Check for categories in nested structure (current Google API format)
  if (location.categories?.primaryCategory) {
    categoriesUsed++;
  }
  if (location.categories?.additionalCategories && Array.isArray(location.categories.additionalCategories)) {
    categoriesUsed += location.categories.additionalCategories.length;
  }
  
  // Also check for categories directly on location object (legacy/backwards compatibility)
  if (!categoriesUsed) {
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

  // Count business attributes more intelligently
  // Attributes vary by business type but common important ones include:
  // - Accessibility (wheelchair_accessible, etc.)
  // - Amenities (wi-fi, parking, outdoor seating, etc.)
  // - Service options (takeout, delivery, dine-in, etc.)
  // - Health & safety (if still available in your region)
  let businessAttributes = 0;

  if (location.attributes) {
    // Count individual attributes that are explicitly set (not just groups)
    // Attributes can be nested in different formats depending on the API response
    for (const [key, value] of Object.entries(location.attributes)) {
      if (value && typeof value === 'object') {
        // If it's a group of attributes (like "payments" or "accessibility")
        const subAttributes = Object.values(value).filter(v => v !== null && v !== undefined);
        businessAttributes += subAttributes.length;
      } else if (value !== null && value !== undefined) {
        // If it's a direct attribute value
        businessAttributes++;
      }
    }
  }

  // Count products (if available)
  const productsCount = location.products?.length || 0;

  return {
    categoriesUsed,
    maxCategories,
    servicesCount,
    servicesWithDescriptions,
    businessDescriptionLength,
    businessDescriptionMaxLength: maxDescriptionLength,
    seoScore,
    photosByCategory,
    businessAttributes,
    productsCount
  };
}

/**
 * Process review data to generate trends and statistics
 */
export function processReviewTrends(reviews: any[]): ReviewTrendsData {
  const totalReviews = reviews.length;
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  console.log('📈 Processing Review Trends:', {
    totalReviews,
    firstReview: reviews[0],
    reviewDates: reviews.slice(0, 5).map(r => r.createTime)
  });
  
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
    
    return sum + rating;
  }, 0);
  const averageRating = totalReviews > 0 ? ratingsSum / totalReviews : 0;
  

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

  console.log('📅 Generating Monthly Review Data:', {
    totalReviews: reviews.length,
    currentDate: now,
    reviewsWithDates: reviews.map(r => ({ createTime: r.createTime, starRating: r.starRating }))
  });

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

    console.log(`  ${monthName} ${date.getFullYear()}:`, monthReviews.length, 'reviews');

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

  console.log('📊 Final Monthly Data:', months);

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
  
  // Length score (0-2 points) - prioritize hitting 500-600 characters for optimal SEO
  if (description.length >= 500 && description.length <= 600) {
    score += 2;  // Optimal range
  } else if (description.length >= 400 && description.length < 500) {
    score += 1.5;  // Good length
  } else if (description.length >= 300 && description.length < 400) {
    score += 1;  // Acceptable but could be better
  } else if (description.length >= 200 && description.length < 300) {
    score += 0.5;  // Too short
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

  // Check if average response time is over 24 hours (86400000 ms)
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  if (engagementData.averageResponseTimeMs && engagementData.averageResponseTimeMs > twentyFourHoursMs) {
    const days = Math.floor(engagementData.averageResponseTimeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((engagementData.averageResponseTimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const timeStr = days > 0 ? `${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr${hours !== 1 ? 's' : ''}` : ''}` : `${hours} hours`;
    opportunities.push({
      id: 'slow-response-time',
      title: 'Respond to Reviews Faster',
      description: `Your average response time is ${timeStr}. Responding within 24 hours shows customers you value their feedback and improves your reputation`,
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=reviews'
    });
  }

  if (profileData.businessDescriptionLength < 500) {
    opportunities.push({
      id: 'business-description',
      title: 'Improve Business Description',
      description: `Your description is only ${profileData.businessDescriptionLength} characters. Aim for 500-600 characters (out of 750 max) for optimal SEO impact`,
      priority: profileData.businessDescriptionLength < 200 ? 'high' : 'medium',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Medium priority opportunities
  if (profileData.categoriesUsed < 5) {
    opportunities.push({
      id: 'add-categories',
      title: 'Add More Categories',
      description: `Select as many relevant categories as you can from Google's 4000+ options (up to ${profileData.maxCategories} total)`,
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=services'
    });
  }

  // Services count recommendations based on SEO best practices
  if (profileData.servicesCount < 5) {
    opportunities.push({
      id: 'add-services',
      title: 'Add More Services',
      description: `Add at least ${5 - profileData.servicesCount} more services (5-10 is a good baseline for local businesses)`,
      priority: 'high',
      actionUrl: '/dashboard/google-business?tab=services'
    });
  } else if (profileData.servicesCount < 10) {
    opportunities.push({
      id: 'add-services',
      title: 'Expand Service Offerings',
      description: `Consider adding more services (10-20 is ideal for competitive industries)`,
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=services'
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
      actionUrl: '/dashboard/google-business?tab=services'
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

  // Check for phone in both possible locations
  const hasPhone = location.primaryPhone || location.phoneNumbers?.primaryPhone;
  if (!hasPhone) {
    opportunities.push({
      id: 'add-phone',
      title: 'Add Phone Number',
      description: 'Make it easy for customers to contact you directly',
      priority: 'low',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Check for business hours
  if (!location.regularHours?.periods || location.regularHours.periods.length === 0) {
    opportunities.push({
      id: 'add-business-hours',
      title: 'Set Business Hours',
      description: 'Help customers know when you\'re open - profiles with hours get 70% more searches',
      priority: 'high',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Check for business attributes (accessibility, amenities, etc.)
  if (!location.attributes || Object.keys(location.attributes).length < 5) {
    opportunities.push({
      id: 'add-attributes',
      title: 'Add Business Attributes',
      description: 'Highlight features like "wheelchair accessible", "free Wi-Fi", or service options to attract more customers',
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=business-info'
    });
  }

  // Check review response rate
  if (engagementData.totalReviews > 0) {
    const responseRate = ((engagementData.totalReviews - engagementData.unrespondedReviews) / engagementData.totalReviews) * 100;
    if (responseRate < 80) {
      opportunities.push({
        id: 'improve-response-rate',
        title: 'Improve Review Response Rate',
        description: `Your response rate is ${responseRate.toFixed(0)}%. Aim for 100% to show customers you care`,
        priority: 'medium',
        actionUrl: '/dashboard/google-business?tab=reviews'
      });
    }
  }

  // Check for products - recommend for ALL businesses
  // Service businesses can list packages, retail can list products
  if (!location.products || location.products.length < 5) {
    opportunities.push({
      id: 'add-products',
      title: 'Add Products or Service Packages',
      description: 'Showcase at least 5 products or service packages with prices and photos directly in search results',
      priority: 'medium',
      actionUrl: '/dashboard/google-business?tab=products'
    });
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  opportunities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return opportunities;
}

/**
 * Format performance data from NEW Business Profile Performance API v1 OR legacy v4
 * Handles both multiDailyMetricsTimeSeries and legacy locationMetrics response formats
 */
export function formatPerformanceData(performanceData: any[], customerActions: any[]): PerformanceData {
  
  if (!performanceData || !Array.isArray(performanceData)) {
    return {
      monthlyViews: 0,
      viewsTrend: 0,
      topSearchQueries: [],
      customerActions: {
        websiteClicks: 0,
        phoneCalls: 0,
        directionRequests: 0,
        photoViews: 0
      }
    };
  }

  // Check if this is NEW API format (multiDailyMetricsTimeSeries) or LEGACY format
  const isNewApiFormat = performanceData.length > 0 && performanceData[0].dailyMetric;
  
  if (isNewApiFormat) {
    return formatNewPerformanceData(performanceData);
  } else {
    return formatLegacyPerformanceData(performanceData);
  }
}

/**
 * Format NEW Performance API v1 response (multiDailyMetricsTimeSeries)
 */
function formatNewPerformanceData(multiDailyMetrics: any[]): PerformanceData {
  
  let totalViews = 0;
  let totalWebsiteClicks = 0;
  let totalPhoneCalls = 0;
  let totalDirectionRequests = 0;
  let totalConversations = 0;
  let totalBookings = 0;
  let totalFoodOrders = 0;
  let totalMenuClicks = 0;

  // Process each daily metric time series
  multiDailyMetrics.forEach((metricSeries: any, index: number) => {
    const dailyMetric = metricSeries.dailyMetric;
    const timeSeries = metricSeries.timeSeries;
    
    if (!timeSeries?.dailyValues) return;

    // Sum up all daily values for the metric
    const totalValue = timeSeries.dailyValues.reduce((sum: number, daily: any) => {
      return sum + (daily.value || 0);
    }, 0);


    // Map new API metrics to our display values
    switch (dailyMetric) {
      case 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS':
      case 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH':
      case 'BUSINESS_IMPRESSIONS_MOBILE_MAPS':
      case 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH':
        totalViews += totalValue;
        break;
      case 'WEBSITE_CLICKS':
        totalWebsiteClicks += totalValue;
        break;
      case 'CALL_CLICKS':
        totalPhoneCalls += totalValue;
        break;
      case 'BUSINESS_DIRECTION_REQUESTS':
        totalDirectionRequests += totalValue;
        break;
      case 'BUSINESS_CONVERSATIONS':
        totalConversations += totalValue;
        break;
      case 'BUSINESS_BOOKINGS':
        totalBookings += totalValue;
        break;
      case 'BUSINESS_FOOD_ORDERS':
        totalFoodOrders += totalValue;
        break;
      case 'BUSINESS_FOOD_MENU_CLICKS':
        totalMenuClicks += totalValue;
        break;
    }
  });


  return {
    monthlyViews: totalViews,
    viewsTrend: 0, // TODO: Implement by comparing with previous period
    topSearchQueries: [], // TODO: Implement searchkeywords API call
    customerActions: {
      websiteClicks: totalWebsiteClicks,
      phoneCalls: totalPhoneCalls,
      directionRequests: totalDirectionRequests,
      photoViews: 0 // Not available in Performance API, would need different endpoint
    }
  };
}

/**
 * Format LEGACY v4 reportInsights response (locationMetrics)
 */
function formatLegacyPerformanceData(locationMetrics: any[]): PerformanceData {
  let totalViews = 0;
  let totalWebsiteClicks = 0;
  let totalPhoneCalls = 0;
  let totalDirectionRequests = 0;

  // Process legacy format
  locationMetrics.forEach((location: any) => {
    if (!location.metricValues) return;

    location.metricValues.forEach((metric: any) => {
      const value = parseInt(metric.totalValue?.value || '0');

      switch (metric.metric) {
        case 'VIEWS_MAPS':
        case 'VIEWS_SEARCH':
        case 'QUERIES_DIRECT':
        case 'QUERIES_INDIRECT':
          totalViews += value;
          break;
        case 'ACTIONS_WEBSITE':
          totalWebsiteClicks += value;
          break;
        case 'ACTIONS_PHONE':
          totalPhoneCalls += value;
          break;
        case 'ACTIONS_DRIVING_DIRECTIONS':
          totalDirectionRequests += value;
          break;
      }
    });
  });


  return {
    monthlyViews: totalViews,
    viewsTrend: 0,
    topSearchQueries: [],
    customerActions: {
      websiteClicks: totalWebsiteClicks,
      phoneCalls: totalPhoneCalls,
      directionRequests: totalDirectionRequests,
      photoViews: 0
    }
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
    },
    businessAttributes: 7,  // Mock: 7 out of 10 attributes set
    productsCount: 3  // Mock: 3 products listed
  };

  const engagementData: EngagementData = {
    unrespondedReviews: 3,
    totalReviews: 42,  // Mock: 42 total reviews
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