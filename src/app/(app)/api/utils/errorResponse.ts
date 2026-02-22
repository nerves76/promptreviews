/**
 * Standardized API Error Response Utilities
 *
 * These helpers ensure that:
 * 1. Internal error details are NEVER exposed to clients in production
 * 2. All error responses follow a consistent JSON shape: { error, details? }
 * 3. Every unexpected error is logged server-side for debugging
 *
 * Usage:
 * ```ts
 * import { errorResponse, handleApiError } from '@/app/(app)/api/utils/errorResponse';
 *
 * // Known error with a specific status
 * return errorResponse('Payment method declined', 402);
 *
 * // Unknown/unexpected error in a catch block
 * return handleApiError(error, 'create-checkout-session');
 * ```
 */

import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Build a standardised error response.
 *
 * @param message  - User-facing error message (always returned)
 * @param status   - HTTP status code (default 500)
 * @param details  - Optional technical details (stripped in production)
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string,
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && !isProduction ? { details } : {}),
    },
    { status },
  );
}

/**
 * Handle an unexpected error caught in an API route.
 *
 * - Logs the full error server-side (with optional context label)
 * - Returns a generic message in production so internals are not leaked
 * - Returns the real message in development for easier debugging
 *
 * @param error   - The caught value (Error, string, or unknown)
 * @param context - Optional label for the log line, e.g. route name
 */
export function handleApiError(error: unknown, context?: string) {
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';

  console.error(
    `[API Error]${context ? ` ${context}:` : ''}`,
    error,
  );

  return errorResponse(
    isProduction ? 'An unexpected error occurred' : message,
    500,
  );
}
