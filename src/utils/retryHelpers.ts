/**
 * Helpers for detecting transient errors and deciding whether to retry
 * batch items in LLM and rank tracking cron jobs.
 */

export const MAX_RETRIES = 2; // 3 total attempts (initial + 2 retries)

const TRANSIENT_PATTERNS = [
  'rate limit',
  'timeout',
  'temporarily unavailable',
  'service error',
  '[B4L]',
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'socket hang up',
  '502',
  '503',
  '504',
  '429',
];

/**
 * Check if an error message indicates a transient (retryable) failure.
 */
export function isTransientError(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return TRANSIENT_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
}

/**
 * Determine whether an item should be retried based on its current
 * retry count and the error message.
 */
export function shouldRetry(retryCount: number, errorMsg: string): boolean {
  return retryCount < MAX_RETRIES && isTransientError(errorMsg);
}
