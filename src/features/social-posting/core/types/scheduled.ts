/**
 * Google Business Scheduling Types
 *
 * Shared data contracts for scheduled posts and photo uploads.
 */

export type GoogleBusinessScheduledPostKind = 'post' | 'photo';

export type GoogleBusinessScheduledPostStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial_success'
  | 'failed'
  | 'cancelled';

export type GoogleBusinessScheduledPostResultStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed';

export interface GoogleBusinessScheduledLocationSummary {
  id: string;
  name: string;
}

export interface GoogleBusinessScheduledMediaDescriptor {
  bucket: string;
  path: string;
  size: number;
  mime: string;
  publicUrl: string;
  checksum?: string;
  originalName?: string;
}

export interface GoogleBusinessScheduledPost {
  id: string;
  accountId: string;
  userId: string;
  postKind: GoogleBusinessScheduledPostKind;
  postType: 'WHATS_NEW' | null;
  content: any | null; // richer typing applied at usage sites
  caption: string | null;
  scheduledDate: string; // ISO date string (YYYY-MM-DD)
  timezone: string;
  selectedLocations: GoogleBusinessScheduledLocationSummary[];
  mediaPaths: GoogleBusinessScheduledMediaDescriptor[];
  status: GoogleBusinessScheduledPostStatus;
  publishedAt: string | null; // ISO timestamp
  errorLog: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleBusinessScheduledPostResult {
  id: string;
  scheduledPostId: string;
  locationId: string;
  locationName: string | null;
  status: GoogleBusinessScheduledPostResultStatus;
  publishedAt: string | null;
  errorMessage: string | null;
  googleResourceId: string | null;
  createdAt: string;
  updatedAt: string;
}
