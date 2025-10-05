/**
 * Client-side utilities for share image generation
 */

import type { GenerateImageResponse, DeleteImageResponse } from '@/types/review-share-images';

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
    const { regenerate = false, authToken } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch('/api/review-shares/generate-image', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        review_id: reviewId,
        regenerate,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to generate share image:', data);
      return {
        success: false,
        message: data.message || 'Failed to generate image',
        fallback: true,
        error: data.error,
      };
    }

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
    const headers: HeadersInit = {};

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `/api/review-shares/generate-image?reviewId=${reviewId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to delete images',
        error: data.error,
      };
    }

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
