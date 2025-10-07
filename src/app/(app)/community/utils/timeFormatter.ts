/**
 * Time Formatter Utility
 *
 * Formats timestamps as relative time (e.g., "2 minutes ago")
 */

/**
 * Formats a date as relative time
 * @param date - The date to format
 * @returns Relative time string (e.g., "just now", "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // Less than 1 minute
  if (seconds < 60) {
    return 'just now';
  }

  // Less than 1 hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  // Less than 24 hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  // Less than 7 days
  const days = Math.floor(hours / 24);
  if (days < 7) {
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  // More than 7 days - show date
  return formatShortDate(then);
}

/**
 * Formats a date as short date (e.g., "Jan 15" or "Jan 15, 2024")
 * @param date - The date to format
 * @returns Short date string
 */
export function formatShortDate(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const month = then.toLocaleDateString('en-US', { month: 'short' });
  const day = then.getDate();

  // If same year, omit year
  if (then.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }

  // Different year, include year
  return `${month} ${day}, ${then.getFullYear()}`;
}

/**
 * Formats a date as full datetime
 * @param date - The date to format
 * @returns Full datetime string (e.g., "January 15, 2025 at 3:45 PM")
 */
export function formatFullDateTime(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date) : date;

  const dateStr = then.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = then.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
}

/**
 * Formats a date as ISO 8601 string for datetime attribute
 * @param date - The date to format
 * @returns ISO 8601 string
 */
export function formatISO(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date) : date;
  return then.toISOString();
}

/**
 * Gets the time until a future date
 * @param date - The future date
 * @returns Time until string (e.g., "in 2 hours") or null if past
 */
export function formatTimeUntil(date: Date | string): string | null {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((then.getTime() - now.getTime()) / 1000);

  if (seconds < 0) return null; // Past date

  // Less than 1 minute
  if (seconds < 60) {
    return 'in less than a minute';
  }

  // Less than 1 hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  // Less than 24 hours
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  // Less than 7 days
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `in ${days} day${days === 1 ? '' : 's'}`;
  }

  // More than 7 days
  return `on ${formatShortDate(then)}`;
}
