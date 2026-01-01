'use client';

import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEY_POST_CONTENT } from '../utils/localStorage';
import type { PostType, CTAType } from '../types/google-business';

type PostTypeValue = 'WHATS_NEW' | 'EVENT' | 'OFFER' | 'PRODUCT';
type CTATypeValue = 'LEARN_MORE' | 'CALL' | 'ORDER_ONLINE' | 'BOOK' | 'SIGN_UP' | 'BUY';

interface PostResult {
  success: boolean;
  message: string;
}

interface UsePostCreationReturn {
  // Post content
  postContent: string;
  setPostContent: (content: string) => void;
  postType: PostTypeValue;
  setPostType: (type: PostTypeValue) => void;

  // Images
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  uploadingImages: boolean;
  setUploadingImages: (uploading: boolean) => void;
  imageUrlsRef: React.MutableRefObject<string[]>;

  // CTA
  showCTA: boolean;
  setShowCTA: (show: boolean) => void;
  ctaType: CTATypeValue;
  setCTAType: (type: CTATypeValue) => void;
  ctaUrl: string;
  setCTAUrl: (url: string) => void;

  // Posting status
  isPosting: boolean;
  setIsPosting: (posting: boolean) => void;
  postResult: PostResult | null;
  setPostResult: (result: PostResult | null) => void;

  // AI improvement
  improvingWithAI: boolean;
  setImprovingWithAI: (improving: boolean) => void;

  // Rate limiting
  hasRateLimitError: boolean;
  setHasRateLimitError: (hasError: boolean) => void;
  rateLimitCountdown: number;
  setRateLimitCountdown: (countdown: number) => void;
  rateLimitedUntil: number | null;
  setRateLimitedUntil: (until: number | null) => void;

  // OAuth state for post
  isPostOAuthConnecting: boolean;
  setIsPostOAuthConnecting: (connecting: boolean) => void;
  fetchingLocations: string | null;
  setFetchingLocations: (locationId: string | null) => void;

  // Disconnect confirm modal
  showDisconnectConfirm: boolean;
  setShowDisconnectConfirm: (show: boolean) => void;
}

/**
 * Hook to manage post creation state
 *
 * Handles:
 * - Post content with localStorage persistence and autosave
 * - Post type selection
 * - Image selection and upload state
 * - CTA configuration
 * - Posting status and results
 * - AI improvement state
 * - Rate limiting state
 */
export function usePostCreation(): UsePostCreationReturn {
  // Post content from localStorage with autosave
  const [postContent, setPostContent] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedContent = localStorage.getItem(STORAGE_KEY_POST_CONTENT);
      if (savedContent) {
        return savedContent;
      }
    }
    return '';
  });

  const [postType, setPostType] = useState<PostTypeValue>('WHATS_NEW');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Ref to track image URLs for cleanup
  const imageUrlsRef = useRef<string[]>([]);

  // CTA state
  const [showCTA, setShowCTA] = useState(false);
  const [ctaType, setCTAType] = useState<CTATypeValue>('LEARN_MORE');
  const [ctaUrl, setCTAUrl] = useState('');

  // Posting status
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<PostResult | null>(null);

  // AI improvement
  const [improvingWithAI, setImprovingWithAI] = useState(false);

  // Rate limiting
  const [hasRateLimitError, setHasRateLimitError] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);

  // OAuth and location states
  const [isPostOAuthConnecting, setIsPostOAuthConnecting] = useState(false);
  const [fetchingLocations, setFetchingLocations] = useState<string | null>(null);

  // Disconnect confirm modal
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Auto-save post content to localStorage (debounced)
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && postContent) {
        localStorage.setItem(STORAGE_KEY_POST_CONTENT, postContent);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveTimeout);
  }, [postContent]);

  // Update ref whenever imageUrls changes
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // Auto-clear SUCCESS messages after a delay (error messages stay)
  useEffect(() => {
    if (postResult && postResult.success) {
      const timer = setTimeout(() => {
        setPostResult(null);
      }, 5000); // Clear success messages after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [postResult]);

  return {
    postContent,
    setPostContent,
    postType,
    setPostType,
    selectedImages,
    setSelectedImages,
    imageUrls,
    setImageUrls,
    uploadingImages,
    setUploadingImages,
    imageUrlsRef,
    showCTA,
    setShowCTA,
    ctaType,
    setCTAType,
    ctaUrl,
    setCTAUrl,
    isPosting,
    setIsPosting,
    postResult,
    setPostResult,
    improvingWithAI,
    setImprovingWithAI,
    hasRateLimitError,
    setHasRateLimitError,
    rateLimitCountdown,
    setRateLimitCountdown,
    rateLimitedUntil,
    setRateLimitedUntil,
    isPostOAuthConnecting,
    setIsPostOAuthConnecting,
    fetchingLocations,
    setFetchingLocations,
    showDisconnectConfirm,
    setShowDisconnectConfirm,
  };
}
