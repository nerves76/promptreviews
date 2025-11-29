/**
 * Review URL Tracking Utilities
 *
 * Generates tracked URLs for review requests to enable attribution analytics.
 * Use these functions when generating links to prompt pages.
 */

export type SourceChannel = 'email' | 'sms' | 'qr' | 'widget' | 'social' | 'referral';

interface TrackingParams {
  /** Source channel (email, sms, qr, widget, etc.) */
  source: SourceChannel;
  /** Communication record ID (for email/sms campaigns) */
  communicationRecordId?: string;
  /** Widget ID (for widget CTAs) */
  widgetId?: string;
  /** QR code ID (for QR code scans) */
  qrId?: string;
  /** Optional UTM parameters */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Generates a tracked review URL with attribution parameters
 *
 * @param baseUrl - The base URL of the application (e.g., https://app.promptreviews.app)
 * @param slug - The prompt page slug
 * @param params - Tracking parameters
 * @returns Full URL with tracking parameters
 *
 * @example
 * // Email campaign
 * generateTrackedReviewUrl('https://app.promptreviews.app', 'my-page', {
 *   source: 'email',
 *   communicationRecordId: '123-456-789'
 * })
 * // Returns: https://app.promptreviews.app/r/my-page?src=email&crid=123-456-789
 *
 * @example
 * // Widget CTA
 * generateTrackedReviewUrl('https://app.promptreviews.app', 'my-page', {
 *   source: 'widget',
 *   widgetId: 'widget-123'
 * })
 * // Returns: https://app.promptreviews.app/r/my-page?src=widget&wid=widget-123
 */
export function generateTrackedReviewUrl(
  baseUrl: string,
  slug: string,
  params: TrackingParams
): string {
  const url = new URL(`/r/${slug}`, baseUrl);

  // Add source parameter
  url.searchParams.set('src', params.source);

  // Add source-specific ID
  if (params.communicationRecordId) {
    url.searchParams.set('crid', params.communicationRecordId);
  }
  if (params.widgetId) {
    url.searchParams.set('wid', params.widgetId);
  }
  if (params.qrId) {
    url.searchParams.set('qid', params.qrId);
  }

  // Add UTM parameters if provided
  if (params.utmSource) {
    url.searchParams.set('utm_source', params.utmSource);
  }
  if (params.utmMedium) {
    url.searchParams.set('utm_medium', params.utmMedium);
  }
  if (params.utmCampaign) {
    url.searchParams.set('utm_campaign', params.utmCampaign);
  }

  return url.toString();
}

/**
 * Generates an email campaign tracked URL
 */
export function generateEmailTrackedUrl(
  baseUrl: string,
  slug: string,
  communicationRecordId?: string
): string {
  return generateTrackedReviewUrl(baseUrl, slug, {
    source: 'email',
    communicationRecordId,
    utmMedium: 'email',
    utmSource: 'email',
  });
}

/**
 * Generates an SMS campaign tracked URL
 */
export function generateSmsTrackedUrl(
  baseUrl: string,
  slug: string,
  communicationRecordId?: string
): string {
  return generateTrackedReviewUrl(baseUrl, slug, {
    source: 'sms',
    communicationRecordId,
    utmMedium: 'sms',
    utmSource: 'sms',
  });
}

/**
 * Generates a widget CTA tracked URL
 */
export function generateWidgetTrackedUrl(
  baseUrl: string,
  slug: string,
  widgetId: string
): string {
  return generateTrackedReviewUrl(baseUrl, slug, {
    source: 'widget',
    widgetId,
    utmMedium: 'widget',
    utmSource: 'widget',
  });
}

/**
 * Generates a QR code tracked URL
 */
export function generateQrTrackedUrl(
  baseUrl: string,
  slug: string,
  qrId?: string
): string {
  return generateTrackedReviewUrl(baseUrl, slug, {
    source: 'qr',
    qrId,
    utmMedium: 'qr',
    utmSource: 'qr',
  });
}

/**
 * Adds tracking parameters to an existing URL
 */
export function addTrackingToUrl(
  existingUrl: string,
  source: SourceChannel,
  sourceId?: string
): string {
  try {
    const url = new URL(existingUrl);
    url.searchParams.set('src', source);

    if (sourceId) {
      switch (source) {
        case 'email':
        case 'sms':
          url.searchParams.set('crid', sourceId);
          break;
        case 'widget':
          url.searchParams.set('wid', sourceId);
          break;
        case 'qr':
          url.searchParams.set('qid', sourceId);
          break;
      }
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return existingUrl;
  }
}
