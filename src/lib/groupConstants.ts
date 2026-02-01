/**
 * Default group name constants for AI Search Query Groups and Rank Tracking Term Groups.
 *
 * These are extracted from the route files because Next.js route modules
 * must only export HTTP handlers and config — exporting additional constants
 * causes TypeScript errors in .next/types/.
 */

export const DEFAULT_AI_SEARCH_GROUP_NAME = 'General';
export const DEFAULT_RANK_TRACKING_GROUP_NAME = 'General';
