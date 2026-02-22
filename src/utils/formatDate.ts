/**
 * Canonical date formatting utilities.
 *
 * Previously, formatDate helpers were duplicated across 20+ files.
 * New code should import from here instead of defining inline helpers.
 */

/**
 * Format a date string as a short, human-readable date.
 * Example output: "Jan 15, 2025"
 *
 * @param dateStr - ISO date string or any value accepted by `new Date()`
 * @returns Formatted date string, or the original string on parse failure
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string as a relative time description.
 * Examples: "Just now", "5 minutes ago", "3 hours ago", "2 days ago",
 *           or falls back to a short date for older dates (> 7 days).
 *
 * @param dateStr - ISO date string or any value accepted by `new Date()`
 * @returns Human-readable relative time string
 */
export function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7)
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string with the weekday included.
 * Example output: "Mon, Jan 15, 2025"
 *
 * @param dateStr - ISO date string or any value accepted by `new Date()`
 * @returns Formatted date string with weekday, or the original string on failure
 */
export function formatDateWithWeekday(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a nullable date string, returning a fallback for null/undefined.
 *
 * @param dateStr - ISO date string, null, or undefined
 * @param fallback - Text to return when dateStr is null/undefined (default: "No date")
 * @returns Formatted date string or the fallback
 */
export function formatDateOrFallback(
  dateStr: string | null | undefined,
  fallback = "No date",
): string {
  if (!dateStr) return fallback;
  return formatDate(dateStr);
}
