/**
 * Client-side utilities for share image generation
 */

import type { GenerateImageResponse, DeleteImageResponse } from '@/types/review-share-images';
import { apiClient } from '@/utils/apiClient';

/**
 * Generate or retrieve share image for a review
 * Returns image URL or falls back to text-only sharing
 */
export async function generateShareImage(
  reviewId: string,
  options: {
    regenerate?: boolean;
    authToken?: string;
  } = {}
): Promise<GenerateImageResponse> {
  try {
    const { regenerate = false } = options;

    const data = await apiClient.post<GenerateImageResponse>('/review-shares/generate-image', {
      review_id: reviewId,
      regenerate,
    });

    return data;
  } catch (error) {
    console.error('Error generating share image:', error);
    return {
      success: false,
      message: 'Network error - use text-only share',
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete generated share images for a review
 * Useful for cleanup or forcing regeneration
 */
export async function deleteShareImage(
  reviewId: string,
  authToken?: string
): Promise<DeleteImageResponse> {
  try {
    const data = await apiClient.delete<DeleteImageResponse>(
      `/review-shares/generate-image?reviewId=${reviewId}`
    );

    return data;
  } catch (error) {
    console.error('Error deleting share images:', error);
    return {
      success: false,
      message: 'Network error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get OG image URL for a review (direct URL, no storage)
 * Useful for dynamic Open Graph meta tags
 */
export function getOgImageUrl(
  reviewId: string,
  options?: {
    baseUrl?: string;
    includeReviewerName?: boolean;
  }
): string {
  const base = options?.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const params = new URLSearchParams({ reviewId });

  if (options?.includeReviewerName) {
    params.set('includeReviewerName', 'true');
  }

  return `${base}/api/review-shares/og-image?${params.toString()}`;
}

/**
 * Preload share image for better performance
 * Call this when user hovers over share button or opens share modal
 */
export async function preloadShareImage(
  reviewId: string,
  authToken?: string
): Promise<void> {
  // Fire and forget - don't wait for response
  generateShareImage(reviewId, { authToken }).catch((err) => {
    console.warn('Failed to preload share image:', err);
  });
}
