/**
 * shareTextBuilder.ts
 *
 * Utility functions for building platform-specific share text with character limits
 */

export interface ShareTextOptions {
  reviewerName?: string;
  reviewContent: string;
  productName?: string;
  shareUrl: string;
  includeReviewerName?: boolean;
  rating?: number;
}

export interface PlatformLimits {
  maxLength: number;
  urlLength: number; // Approximate URL character count
  name: string;
}

// Platform character limits (accounting for URL shortening)
export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  twitter: {
    name: 'X (Twitter)',
    maxLength: 280,
    urlLength: 23, // Twitter auto-shortens URLs to ~23 chars
  },
  bluesky: {
    name: 'Bluesky',
    maxLength: 300,
    urlLength: 30, // Bluesky URL length
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    urlLength: 50, // LinkedIn shows full URLs
  },
  facebook: {
    name: 'Facebook',
    maxLength: 5000, // Practically unlimited, but we'll keep it reasonable
    urlLength: 50,
  },
  reddit: {
    name: 'Reddit',
    maxLength: 10000, // Post body limit
    urlLength: 50,
  },
  pinterest: {
    name: 'Pinterest',
    maxLength: 500,
    urlLength: 50,
  },
  email: {
    name: 'Email',
    maxLength: 1000,
    urlLength: 50,
  },
  sms: {
    name: 'SMS',
    maxLength: 400,
    urlLength: 30,
  },
};

/**
 * Generate star emoji string based on rating
 */
function generateStars(rating: number = 5): string {
  return '⭐'.repeat(Math.min(5, Math.max(1, rating)));
}

/**
 * Truncate text to fit within character limit
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Build share text for a specific platform
 */
export function buildShareText(
  platform: keyof typeof PLATFORM_LIMITS,
  options: ShareTextOptions
): string {
  const limits = PLATFORM_LIMITS[platform];
  const {
    reviewerName,
    reviewContent,
    productName = 'Our Service',
    shareUrl,
    includeReviewerName = true,
    rating = 5,
  } = options;

  // Calculate available characters for content
  const urlBuffer = shareUrl ? limits.urlLength + 5 : 0; // Only reserve space if URL exists
  const availableChars = limits.maxLength - urlBuffer - 20; // Buffer for spacing

  // Build components
  const stars = generateStars(rating);
  const reviewQuote = `"${reviewContent}"`;
  const attribution = includeReviewerName && reviewerName ? `- ${reviewerName}` : '';
  const urlPart = shareUrl ? `\n${shareUrl}` : '';

  // Assemble text based on platform
  let shareText = '';

  if (platform === 'sms') {
    // SMS: Keep it super short
    const shortReview = truncateText(reviewContent, 80);
    shareText = `${stars} "${shortReview}"${shareUrl ? ' ' + shareUrl : ''}`;
  } else if (platform === 'twitter' || platform === 'bluesky') {
    // Twitter/Bluesky: Very concise
    const maxReviewLength = availableChars - stars.length - 15;
    const shortReview = truncateText(reviewContent, maxReviewLength);
    shareText = `${stars}\n"${shortReview}"\n${attribution}${urlPart}`;
  } else if (platform === 'linkedin') {
    // LinkedIn: Professional and detailed
    const maxReviewLength = availableChars - stars.length - attribution.length - 20;
    const review = truncateText(reviewContent, maxReviewLength);
    shareText = `${stars}\n\n${reviewQuote}\n${attribution}${urlPart}`;
  } else if (platform === 'email') {
    // Email: Full content with proper formatting
    shareText = shareUrl
      ? `${stars}\n\n${reviewQuote}\n${attribution}\n\nRead more: ${shareUrl}`
      : `${stars}\n\n${reviewQuote}\n${attribution}`;
  } else {
    // Default format for other platforms (Facebook, Reddit, Pinterest)
    const maxReviewLength = availableChars - stars.length - attribution.length - 15;
    const review = truncateText(reviewContent, maxReviewLength);
    shareText = `${stars}\n\n"${review}"\n${attribution}${urlPart}`;
  }

  return shareText.trim();
}

/**
 * Get character count info for display
 */
export function getCharacterInfo(
  platform: keyof typeof PLATFORM_LIMITS,
  text: string
): {
  current: number;
  max: number;
  remaining: number;
  isOverLimit: boolean;
  platformName: string;
} {
  const limits = PLATFORM_LIMITS[platform];
  const current = text.length;
  const remaining = limits.maxLength - current;

  return {
    current,
    max: limits.maxLength,
    remaining,
    isOverLimit: remaining < 0,
    platformName: limits.name,
  };
}

/**
 * Generate email subject line
 */
export function buildEmailSubject(productName?: string): string {
  if (!productName) {
    return 'Check out this amazing review!';
  }

  // If productName already looks like a complete title (ends with !), use it as-is
  if (productName.endsWith('!')) {
    return productName;
  }

  // Otherwise, format it
  return `Great review for ${productName}!`;
}
