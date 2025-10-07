/**
 * URL Validator Utility
 *
 * Validates and sanitizes URLs for external links
 */

/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes a URL by ensuring https:// protocol
 * @param url - The URL to sanitize
 * @returns Sanitized URL with https:// or original if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || url.trim().length === 0) return '';

  const trimmed = url.trim();

  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Add https:// by default
  return `https://${trimmed}`;
}

/**
 * Extracts domain from URL for display
 * @param url - The URL to parse
 * @returns Domain name (e.g., "example.com") or original URL if invalid
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Validates and sanitizes a URL
 * @param url - The URL to process
 * @returns Object with isValid flag and sanitized URL
 */
export function validateAndSanitizeUrl(url: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      sanitized: '',
      error: 'URL cannot be empty',
    };
  }

  const sanitized = sanitizeUrl(url);

  if (!isValidUrl(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Invalid URL format',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Checks if URL is from a trusted domain (for anti-phishing)
 * @param url - The URL to check
 * @param trustedDomains - Array of trusted domain patterns
 * @returns True if URL is from a trusted domain
 */
export function isTrustedDomain(url: string, trustedDomains: string[] = []): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if hostname matches any trusted domain pattern
    return trustedDomains.some((domain) => {
      const pattern = domain.toLowerCase();
      return hostname === pattern || hostname.endsWith(`.${pattern}`);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Shortens a URL for display (truncates middle)
 * @param url - The URL to shorten
 * @param maxLength - Maximum length (default 50)
 * @returns Shortened URL
 */
export function shortenUrl(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) return url;

  const half = Math.floor(maxLength / 2);
  const start = url.substring(0, half - 2);
  const end = url.substring(url.length - half + 2);

  return `${start}...${end}`;
}
