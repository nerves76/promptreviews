/**
 * shareHandlers.ts
 *
 * Platform-specific share handlers and utilities
 */

export type SharePlatform =
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'bluesky'
  | 'reddit'
  | 'pinterest'
  | 'email'
  | 'sms';

export interface ShareData {
  url: string;
  text: string;
  title?: string;
  imageUrl?: string;
  emailSubject?: string;
}

/**
 * Share to Facebook
 */
export function shareToFacebook(data: ShareData): void {
  // Facebook requires a URL - use text-based sharing if no URL
  if (!data.url) {
    // Fallback: Open Facebook with compose dialog
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(data.text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  } else {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  }
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(data: ShareData): void {
  // LinkedIn's newer share URL format - just use text
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(data.text)}`;
  window.open(shareUrl, '_blank', 'width=600,height=600,noopener,noreferrer');
}

/**
 * Share to X (Twitter)
 */
export function shareToTwitter(data: ShareData): void {
  const params = new URLSearchParams({
    text: data.text,
  });
  if (data.url) {
    params.append('url', data.url);
  }
  const shareUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
  window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
}

/**
 * Share to Bluesky
 */
export function shareToBluesky(data: ShareData): void {
  const shareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(data.text)}`;
  window.open(shareUrl, '_blank', 'width=600,height=600,noopener,noreferrer');
}

/**
 * Share to Reddit
 */
export function shareToReddit(data: ShareData): void {
  // Always create a text post (selftext) instead of link post
  const params = new URLSearchParams({
    title: data.title || data.text.substring(0, 300),
    selftext: data.text, // Use selftext parameter for text posts
  });
  const shareUrl = `https://reddit.com/submit?${params.toString()}`;
  window.open(shareUrl, '_blank', 'width=800,height=600,noopener,noreferrer');
}

/**
 * Share to Pinterest
 */
export function shareToPinterest(data: ShareData): void {
  if (!data.imageUrl) {
    throw new Error('Pinterest requires an image URL');
  }
  const params = new URLSearchParams({
    media: data.imageUrl,
    description: data.text,
  });
  if (data.url) {
    params.append('url', data.url);
  }
  const shareUrl = `https://pinterest.com/pin/create/button/?${params.toString()}`;
  window.open(shareUrl, '_blank', 'width=750,height=550,noopener,noreferrer');
}

/**
 * Share via Email
 */
export function shareViaEmail(data: ShareData): void {
  const subject = data.emailSubject || 'Check out this review!';
  const body = data.text; // URL is already in text if it exists
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}

/**
 * Share via SMS
 * Uses Web Share API if available on mobile, otherwise falls back to sms: protocol
 */
export async function shareViaSMS(data: ShareData): Promise<boolean> {
  const message = data.text; // URL is already in text if it exists

  // Try Web Share API first (works well on mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        text: message,
      });
      return true;
    } catch (error) {
      // User cancelled or share failed, fall back to sms: protocol
      if ((error as Error).name !== 'AbortError') {
        console.warn('Web Share API failed:', error);
      }
    }
  }

  // Fallback to sms: protocol
  const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
  window.location.href = smsUrl;
  return true;
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Main share handler that routes to the appropriate platform
 */
export async function handleShare(
  platform: SharePlatform,
  data: ShareData
): Promise<void> {
  switch (platform) {
    case 'facebook':
      shareToFacebook(data);
      break;
    case 'linkedin':
      shareToLinkedIn(data);
      break;
    case 'twitter':
      shareToTwitter(data);
      break;
    case 'bluesky':
      shareToBluesky(data);
      break;
    case 'reddit':
      shareToReddit(data);
      break;
    case 'pinterest':
      shareToPinterest(data);
      break;
    case 'email':
      shareViaEmail(data);
      break;
    case 'sms':
      await shareViaSMS(data);
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Platform display configuration
 */
export interface PlatformConfig {
  key: SharePlatform;
  name: string;
  icon: string; // Icon name from Icon component
  color: string; // Tailwind color class
  requiresImage?: boolean;
}

export const SHARE_PLATFORMS: PlatformConfig[] = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: 'FaFacebook',
    color: 'text-[#1877F2]',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: 'FaLinkedin',
    color: 'text-[#0A66C2]',
  },
  {
    key: 'twitter',
    name: 'X',
    icon: 'FaXTwitter',
    color: 'text-[#000000]',
  },
  {
    key: 'bluesky',
    name: 'Bluesky',
    icon: 'FaBluesky',
    color: 'text-[#0085ff]',
  },
  {
    key: 'reddit',
    name: 'Reddit',
    icon: 'FaReddit',
    color: 'text-[#FF4500]',
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: 'FaPinterest',
    color: 'text-[#E60023]',
    requiresImage: true,
  },
  {
    key: 'email',
    name: 'Email',
    icon: 'FaEnvelope',
    color: 'text-gray-600',
  },
  {
    key: 'sms',
    name: 'SMS',
    icon: 'FaMobile',
    color: 'text-green-600',
  },
];
