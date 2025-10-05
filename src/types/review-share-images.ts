/**
 * Type definitions for review share image generation
 */

export type ImageSource = 'existing_photo' | 'cached_quote_card' | 'generated_quote_card';

export interface GenerateImageResponse {
  success: boolean;
  image_url?: string;
  source?: ImageSource;
  message: string;
  fallback?: boolean;
  error?: string;
}

export interface ShareImageMetadata {
  id: string;
  review_id: string;
  account_id: string;
  image_url: string;
  storage_path: string;
  image_type: 'quote_card' | 'existing_photo';
  generated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeleteImageResponse {
  success: boolean;
  deleted_count?: number;
  message: string;
  error?: string;
}
