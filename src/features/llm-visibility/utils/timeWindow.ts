/**
 * Converts a time window string to a start date for filtering.
 * Returns null for 'all' (no filtering).
 */
export function getStartDateFromTimeWindow(timeWindow: string): Date | null {
  const now = new Date();
  switch (timeWindow) {
    case 'last7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'last30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'last90days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'last6months': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case 'lastYear': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return null; // 'all'
  }
}

export const TIME_WINDOW_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'last6months', label: 'Last 6 months' },
  { value: 'lastYear', label: 'Last year' },
] as const;

export type TimeWindow = typeof TIME_WINDOW_OPTIONS[number]['value'];
