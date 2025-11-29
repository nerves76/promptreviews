/**
 * Attribution Tracking Utilities
 *
 * Captures source attribution data from URL parameters to track
 * where reviews come from (email campaigns, widgets, QR codes, etc.)
 */

export type SourceChannel =
  | 'prompt_page_direct'
  | 'prompt_page_qr'
  | 'email_campaign'
  | 'sms_campaign'
  | 'widget_cta'
  | 'gbp_import'
  | 'social_share'
  | 'referral'
  | 'unknown';

export interface AttributionData {
  source_channel: SourceChannel;
  source_id: string | null;
  communication_record_id: string | null;
  widget_id: string | null;
  referrer_url: string | null;
  utm_params: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
  entry_url: string | null;
}

/**
 * Maps URL `src` parameter values to source channels
 */
const SOURCE_PARAM_MAP: Record<string, SourceChannel> = {
  'direct': 'prompt_page_direct',
  'email': 'email_campaign',
  'sms': 'sms_campaign',
  'qr': 'prompt_page_qr',
  'widget': 'widget_cta',
  'social': 'social_share',
  'referral': 'referral',
};

const UTM_MEDIUM_MAP: Record<string, SourceChannel> = {
  email: 'email_campaign',
  sms: 'sms_campaign',
  widget: 'widget_cta',
  qr: 'prompt_page_qr',
  social: 'social_share',
};

/**
 * Extracts attribution data from URL search params
 */
export function extractAttributionFromParams(
  searchParams: URLSearchParams | null,
  referrer?: string
): AttributionData {
  if (!searchParams) {
    return getDefaultAttribution(referrer);
  }

  // Get source channel from 'src' param, fall back to UTM medium inference
  const srcParam = searchParams.get('src');
  const utmMediumParam = searchParams.get('utm_medium') || undefined;
  let sourceChannel: SourceChannel | null = srcParam && SOURCE_PARAM_MAP[srcParam]
    ? SOURCE_PARAM_MAP[srcParam]
    : null;

  if (!sourceChannel && utmMediumParam && UTM_MEDIUM_MAP[utmMediumParam]) {
    sourceChannel = UTM_MEDIUM_MAP[utmMediumParam];
  }

  // Get specific source IDs
  const communicationRecordId = searchParams.get('crid') || null;
  const widgetId = searchParams.get('wid') || null;
  const qrId = searchParams.get('qid') || null;

  // Determine source_id based on channel
  let sourceId: string | null = null;
  if (sourceChannel === 'email_campaign' || sourceChannel === 'sms_campaign') {
    sourceId = communicationRecordId;
  } else if (sourceChannel === 'widget_cta') {
    sourceId = widgetId;
  } else if (sourceChannel === 'prompt_page_qr') {
    sourceId = qrId;
  }

  // Extract UTM parameters
  const utmParams = {
    source: searchParams.get('utm_source') || null,
    medium: utmMediumParam || null,
    campaign: searchParams.get('utm_campaign') || null,
    content: searchParams.get('utm_content') || null,
    term: searchParams.get('utm_term') || null,
  };

  // Get current URL (if in browser)
  const entryUrl = typeof window !== 'undefined' ? window.location.href : null;

  // Get referrer
  const referrerUrl = referrer || (typeof document !== 'undefined' ? document.referrer : null) || null;

  return {
    // If we still can't infer, treat empty referrer as direct, otherwise unknown
    source_channel: sourceChannel || (referrer ? 'unknown' : 'prompt_page_direct'),
    source_id: sourceId,
    communication_record_id: communicationRecordId,
    widget_id: widgetId,
    referrer_url: referrerUrl,
    utm_params: utmParams,
    entry_url: entryUrl,
  };
}

/**
 * Returns default attribution data when no params are available
 */
function getDefaultAttribution(referrer?: string): AttributionData {
  return {
    source_channel: referrer ? 'unknown' : 'prompt_page_direct',
    source_id: null,
    communication_record_id: null,
    widget_id: null,
    referrer_url: referrer || (typeof document !== 'undefined' ? document.referrer : null) || null,
    utm_params: {},
    entry_url: typeof window !== 'undefined' ? window.location.href : null,
  };
}

/**
 * Hook to get attribution data from current URL
 * Call this once on page load and store the result
 */
export function getAttributionData(searchParams: URLSearchParams | null): AttributionData {
  const referrer = typeof document !== 'undefined' ? document.referrer : undefined;
  return extractAttributionFromParams(searchParams, referrer);
}

/**
 * Converts AttributionData to a flat object for API calls
 */
export function flattenAttributionForApi(attribution: AttributionData): Record<string, any> {
  return {
    source_channel: attribution.source_channel,
    source_id: attribution.source_id,
    communication_record_id: attribution.communication_record_id,
    widget_id: attribution.widget_id,
    referrer_url: attribution.referrer_url,
    utm_params: attribution.utm_params,
    entry_url: attribution.entry_url,
  };
}
