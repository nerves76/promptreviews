/**
 * Review Verification Utilities
 *
 * Fuzzy matching algorithms to automatically verify reviews posted to Google Business Profile
 */

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate name similarity
 * Handles variations like "John Smith" vs "John S." or "J Smith"
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;

  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match
  if (n1 === n2) return 1;

  // Split into parts
  const parts1 = n1.split(/\s+/);
  const parts2 = n2.split(/\s+/);

  // Check if first name matches
  const firstNameMatch = parts1[0] && parts2[0] &&
    stringSimilarity(parts1[0], parts2[0]) > 0.8;

  // Check if last name matches (or initial)
  let lastNameMatch = false;
  if (parts1.length > 1 && parts2.length > 1) {
    const lastName1 = parts1[parts1.length - 1];
    const lastName2 = parts2[parts2.length - 1];

    // Full last name match
    if (stringSimilarity(lastName1, lastName2) > 0.8) {
      lastNameMatch = true;
    }
    // Initial match (e.g., "Smith" vs "S" or "S.")
    else if (lastName1[0] === lastName2[0] ||
             lastName1.startsWith(lastName2) ||
             lastName2.startsWith(lastName1)) {
      lastNameMatch = true;
    }
  }

  // Both parts match
  if (firstNameMatch && lastNameMatch) return 0.95;

  // Only first name matches
  if (firstNameMatch) return 0.7;

  // Fallback to general string similarity
  return stringSimilarity(n1, n2);
}

/**
 * Calculate review text similarity
 * Accounts for minor edits, punctuation changes, emoji additions
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  // Normalize text: remove extra whitespace, lowercase, remove punctuation
  const normalize = (text: string) => text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  const t1 = normalize(text1);
  const t2 = normalize(text2);

  // Exact match after normalization
  if (t1 === t2) return 1;

  // Calculate similarity
  const similarity = stringSimilarity(t1, t2);

  // Bonus for matching key phrases (first 50 chars)
  const prefix1 = t1.substring(0, Math.min(50, t1.length));
  const prefix2 = t2.substring(0, Math.min(50, t2.length));
  const prefixSimilarity = stringSimilarity(prefix1, prefix2);

  // Weight: 70% full text, 30% prefix
  return (similarity * 0.7) + (prefixSimilarity * 0.3);
}

/**
 * Check if dates are within acceptable range
 */
export function isDateInRange(
  submittedDate: Date,
  postedDate: Date,
  maxDaysApart: number = 7
): boolean {
  const diffMs = Math.abs(postedDate.getTime() - submittedDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= maxDaysApart;
}

/**
 * Calculate overall match score for a review
 */
export interface ReviewMatchInput {
  submittedReviewerName: string;
  submittedReviewText: string;
  submittedDate: Date;
  googleReviewerName: string;
  googleReviewText: string;
  googlePostedDate: Date;
}

export interface ReviewMatchResult {
  isMatch: boolean;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  details: {
    nameScore: number;
    textScore: number;
    dateInRange: boolean;
  };
}

export function calculateReviewMatch(input: ReviewMatchInput): ReviewMatchResult {
  const nameScore = calculateNameSimilarity(
    input.submittedReviewerName,
    input.googleReviewerName
  );

  const textScore = calculateTextSimilarity(
    input.submittedReviewText,
    input.googleReviewText
  );

  const dateInRange = isDateInRange(
    input.submittedDate,
    input.googlePostedDate,
    7 // Max 7 days apart
  );

  // Weighted score: Name 30%, Text 50%, Date 20%
  const score = (
    (nameScore * 0.3) +
    (textScore * 0.5) +
    (dateInRange ? 0.2 : 0)
  );

  // Determine match and confidence
  let isMatch = false;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (score >= 0.85) {
    isMatch = true;
    confidence = 'high';
  } else if (score >= 0.70) {
    isMatch = true;
    confidence = 'medium';
  } else if (score >= 0.60) {
    // Potential match - needs manual review
    isMatch = false;
    confidence = 'low';
  }

  return {
    isMatch,
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    confidence,
    details: {
      nameScore: Math.round(nameScore * 100) / 100,
      textScore: Math.round(textScore * 100) / 100,
      dateInRange,
    },
  };
}

/**
 * Find best matching review from a list of Google reviews
 */
export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
  };
  comment?: string;
  createTime: string;
}

export function findBestMatch(
  submittedReview: {
    reviewerName: string;
    reviewText: string;
    submittedDate: Date;
  },
  googleReviews: GoogleReview[]
): ReviewMatchResult & { googleReviewId?: string } | null {
  let bestMatch: (ReviewMatchResult & { googleReviewId?: string }) | null = null;

  for (const googleReview of googleReviews) {
    const matchResult = calculateReviewMatch({
      submittedReviewerName: submittedReview.reviewerName,
      submittedReviewText: submittedReview.reviewText,
      submittedDate: submittedReview.submittedDate,
      googleReviewerName: googleReview.reviewer?.displayName || '',
      googleReviewText: googleReview.comment || '',
      googlePostedDate: new Date(googleReview.createTime),
    });

    if (matchResult.isMatch && (!bestMatch || matchResult.score > bestMatch.score)) {
      bestMatch = {
        ...matchResult,
        googleReviewId: googleReview.reviewId,
      };
    }
  }

  return bestMatch;
}
