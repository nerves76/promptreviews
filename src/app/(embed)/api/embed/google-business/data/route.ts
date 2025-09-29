/**
 * Secure API endpoint to fetch Google Business Profile data for the embed
 * Validates session token and uses encrypted OAuth tokens to fetch real data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateSession } from '@/lib/services/optimizerLeadService';
import { unpackAndDecryptToken } from '@/lib/crypto/googleTokenCipher';

const BUSINESS_PROFILE_API_BASE = 'https://businessprofile.googleapis.com/v1';
const ACCOUNT_MANAGEMENT_API_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const BUSINESS_INFORMATION_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GOOGLE_MY_BUSINESS_LEGACY_BASE = 'https://mybusiness.googleapis.com/v4';

type AccountFetchMode = 'business-profile' | 'legacy';

interface LocationFetchAttempt {
  endpoint: string;
  status: 'success' | 'empty' | 'error';
  message?: string;
}

interface LocationFetchResult {
  locations: any[];
  attempts: LocationFetchAttempt[];
}

function extractLocationId(name?: string | null) {
  if (!name) return null;
  const parts = String(name).split('/');
  const last = parts[parts.length - 1];
  return last || null;
}

function canonicalizeLocationName(name?: string | null) {
  const locationId = extractLocationId(name);
  return locationId ? `locations/${locationId}` : null;
}

function jsonSample(value: unknown) {
  try {
    if (value === undefined || value === null) {
      return value;
    }
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (typeof parsed === 'object') {
      return JSON.stringify(parsed, null, 2).slice(0, 400);
    }
    return String(parsed);
  } catch (error) {
    return `Unable to serialize: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function buildAuthHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  } as const;
}

async function fetchJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed (${response.status}) for ${url}: ${errorText}`);
  }

  return response.json();
}

async function fetchAccounts(accessToken: string) {
  async function fetchWithMode(mode: AccountFetchMode) {
    const accounts: any[] = [];
    let pageToken: string | undefined;
    let page = 0;
    const maxPages = 10;

    while (page < maxPages) {
      // Always use Account Management API for fetching accounts
      // Business Profile API doesn't have an accounts endpoint
      const url = new URL(`${ACCOUNT_MANAGEMENT_API_BASE}/accounts`);
      url.searchParams.set('pageSize', '20');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const json = await fetchJson(url.toString(), accessToken);
      const pageAccounts = json.accounts || [];

      // Log account details for debugging
      if (pageAccounts.length > 0) {
        console.log(`📊 Found ${pageAccounts.length} accounts on page ${page + 1}:`);
        pageAccounts.forEach((acc: any) => {
          console.log(`  - ${acc.name} (type: ${acc.type}, listingCount: ${acc.listingCount}, accountName: ${acc.accountName})`);
        });
      }

      accounts.push(...pageAccounts);

      pageToken = json.nextPageToken;
      page += 1;

      if (!pageToken) {
        break;
      }
    }

    return { accounts, mode };
  }

  // Always use the Account Management API for fetching accounts
  try {
    return await fetchWithMode('legacy');
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    throw error;
  }
}

async function fetchLocationsForAccount(
  accessToken: string,
  account: any,
  preferredMode: AccountFetchMode,
) {
  const MAX_PAGES = 10;
  const attempts: LocationFetchAttempt[] = [];

  // Determine the correct resource path based on account type
  const isLocationGroup = account.type === 'LOCATION_GROUP';
  const accountResourceName = account.name;
  const locationGroupResourceName = account.name.replace('accounts/', 'locationGroups/');

  // Debug logging for location group detection
  if (isLocationGroup) {
    console.log(`🔍 LOCATION_GROUP detected for ${account.name}`);
    console.log(`  - Will try location group endpoints with: ${locationGroupResourceName}`);
  }

  const endpointConfigs = [
    {
      label: 'business-profile',
      buildUrl: (pageToken?: string) => {
        const url = new URL(`${BUSINESS_PROFILE_API_BASE}/${accountResourceName}/locations`);
        url.searchParams.set('pageSize', '100');
        url.searchParams.set(
          'readMask',
          'name,locationName,title,storefrontAddress,websiteUri,metadata,phoneNumbers,categories,profile,regularHours',
        );
        if (pageToken) {
          url.searchParams.set('pageToken', pageToken);
        }
        return url;
      },
    },
    {
      label: 'business-information',
      buildUrl: (pageToken?: string) => {
        const url = new URL(`${BUSINESS_INFORMATION_API_BASE}/${accountResourceName}/locations`);
        url.searchParams.set('pageSize', '100');
        // Use only valid fields for Business Information API - removed primaryCategory
        url.searchParams.set(
          'readMask',
          'name,languageCode,storeCode,title,phoneNumbers,regularHours,storefrontAddress,websiteUri,profile,categories,metadata',
        );
        if (pageToken) {
          url.searchParams.set('pageToken', pageToken);
        }
        return url;
      },
    },
    {
      label: 'legacy-v4',
      buildUrl: (pageToken?: string) => {
        const url = new URL(`${GOOGLE_MY_BUSINESS_LEGACY_BASE}/${accountResourceName}/locations`);
        url.searchParams.set('pageSize', '100');
        if (pageToken) {
          url.searchParams.set('pageToken', pageToken);
        }
        return url;
      },
    },
    ...(isLocationGroup
      ? [{
        label: 'legacy-v4-location-group',
        buildUrl: (pageToken?: string) => {
          const url = new URL(`${GOOGLE_MY_BUSINESS_LEGACY_BASE}/${locationGroupResourceName}/locations`);
          url.searchParams.set('pageSize', '100');
          if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
          }
          return url;
        },
      },
      {
        label: 'business-profile-location-group',
        buildUrl: (pageToken?: string) => {
          const url = new URL(`${BUSINESS_PROFILE_API_BASE}/${locationGroupResourceName}/locations`);
          url.searchParams.set('pageSize', '100');
          url.searchParams.set(
            'readMask',
            'name,locationName,title,storefrontAddress,websiteUri,metadata,phoneNumbers,categories,profile,regularHours',
          );
          if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
          }
          return url;
        },
      },
      {
        label: 'business-information-location-group',
        buildUrl: (pageToken?: string) => {
          const url = new URL(`${BUSINESS_INFORMATION_API_BASE}/${locationGroupResourceName}/locations`);
          url.searchParams.set('pageSize', '100');
          url.searchParams.set(
            'readMask',
            'name,languageCode,storeCode,title,phoneNumbers,regularHours,storefrontAddress,websiteUri,profile,categories,metadata',
          );
          if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
          }
          return url;
        },
      }]
      : []),
  ];

  // Prioritise whichever mode fetched the accounts successfully
  const orderedConfigs = endpointConfigs.slice().sort((a, b) => {
    if (preferredMode === 'business-profile') {
      if (a.label === 'business-profile' && b.label !== 'business-profile') return -1;
      if (b.label === 'business-profile' && a.label !== 'business-profile') return 1;
    }
    if (preferredMode === 'legacy') {
      if (a.label === 'legacy-v4' && b.label !== 'legacy-v4') return -1;
      if (b.label === 'legacy-v4' && a.label !== 'legacy-v4') return 1;
    }
    return 0;
  });

  const aggregated: any[] = [];
  let success = false;

  for (const endpoint of orderedConfigs) {
    const collected: any[] = [];
    let pageToken: string | undefined;
    let page = 0;
    let lastResponse: unknown = null;

    try {
      do {
        const url = endpoint.buildUrl(pageToken);
        const json = await fetchJson(url.toString(), accessToken);
        lastResponse = json;
        const pageLocations = json.locations || [];
        collected.push(...pageLocations);

        pageToken = json.nextPageToken;
        page += 1;
      } while (pageToken && page < MAX_PAGES);

      if (collected.length > 0) {
        success = true;
        aggregated.push(...collected);
        console.log(
          `✅ Located ${collected.length} locations for ${account.name} using ${endpoint.label}`,
        );
        if (collected[0]) {
          console.log(`  📍 Sample location: ${collected[0].name || collected[0].locationName || 'unnamed'}`);
        }
        attempts.push({ endpoint: endpoint.label, status: 'success' });
        continue;
      }

      const sample = jsonSample(lastResponse);
      const message = `ℹ️ No locations returned for ${account.name} via ${endpoint.label}, attempting fallback...`;
      attempts.push({
        endpoint: endpoint.label,
        status: 'empty',
        message: JSON.stringify({ url: endpoint.buildUrl().toString(), reason: 'empty', sample }),
      });
      console.log(message, sample);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Location listing failed for ${account.name} via ${endpoint.label}:`,
        error,
      );
      attempts.push({
        endpoint: endpoint.label,
        status: 'error',
        message: JSON.stringify({ url: endpoint.buildUrl().toString(), error: errorMessage }),
      });
    }
  }

  if (!success) {
    console.warn(`⚠️ No locations resolved for account ${account.name} after all attempts`);
  }

  return { locations: aggregated, attempts } satisfies LocationFetchResult;
}

function normalizeLocation(account: any, location: any) {
  const accountName = account?.name;
  const accountDisplay = account?.accountName || accountName;

  const rawName: string | undefined = location?.name
    || location?.locationName
    || location?.metadata?.locationName
    || undefined;

  const locationId = extractLocationId(rawName);
  const canonicalName = canonicalizeLocationName(rawName);
  const legacyName = accountName && locationId
    ? `${accountName}/locations/${locationId}`
    : (rawName?.startsWith('accounts/') ? rawName : undefined);

  const resolvedName = canonicalName || rawName || legacyName || '';

  return {
    name: resolvedName,
    legacyName,
    canonicalName: canonicalName || resolvedName,
    title: location?.title || location?.locationName || location?.displayName || 'Business Location',
    address: location?.storefrontAddress || location?.address || location?.storefrontAddress,
    placeId: location?.metadata?.placeId || location?.placeId,
    accountId: accountName,
    accountName: accountDisplay,
    rawName,
  };
}

async function fetchAvailableLocations(accessToken: string) {
  const { accounts, mode } = await fetchAccounts(accessToken);

  const allLocations: any[] = [];
  const debug: Record<string, LocationFetchAttempt[]> = {};
  const perAccountLocations: Record<string, any[]> = {};

  for (const account of accounts) {
    try {
      console.log(`🏢 Processing account: ${account.name} (type: ${account.type}, accountName: ${account.accountName}, listingCount: ${account.listingCount})`);

      const { locations, attempts } = await fetchLocationsForAccount(accessToken, account, mode);
      debug[account.name] = attempts;

      const normalized = locations
        .map((location: any) => normalizeLocation(account, location))
        .filter((location) => Boolean(location.name));
      allLocations.push(...normalized);
      perAccountLocations[account.name] = normalized;
    } catch (error) {
      console.error(`Failed to fetch locations for account ${account.name}:`, error);
    }
  }

  const dedupedLocations = Array.from(
    new Map(allLocations.map((location) => [location.name, location])).values()
  );

  const locationGroupDiagnostics = accounts
    .filter((account) => account.type === 'LOCATION_GROUP')
    .map((account) => {
      const attempts = debug[account.name] ?? [];
      const groupAttempts = attempts.filter((attempt) => attempt.endpoint.includes('location-group'));
      const groupSuccesses = groupAttempts.filter((attempt) => attempt.status === 'success');
      const totalLocations = (perAccountLocations[account.name] || dedupedLocations.filter((loc) => loc.accountId === account.name)).length;

      return {
        accountId: account.name,
        accountName: account.accountName || account.name,
        locationGroupAttempts: groupAttempts.length,
        locationGroupSuccesses: groupSuccesses.length,
        locationsFound: totalLocations,
        potentiallyIncomplete: groupAttempts.length > 0 && groupSuccesses.length === 0,
      };
    });

  return { locations: dedupedLocations, mode, accounts, debug, locationGroupDiagnostics };
}

async function fetchLocationDetails(
  accessToken: string,
  locationName: string,
  legacyLocationName?: string | null,
) {
  const candidateNames = new Set<string>();
  const canonicalFromLocation = canonicalizeLocationName(locationName);
  const canonicalFromLegacy = canonicalizeLocationName(legacyLocationName);

  if (locationName) candidateNames.add(locationName);
  if (legacyLocationName) candidateNames.add(legacyLocationName);
  if (canonicalFromLocation) candidateNames.add(canonicalFromLocation);
  if (canonicalFromLegacy) candidateNames.add(canonicalFromLegacy);

  const detailCandidates = new Set<string>();

  candidateNames.forEach((candidate) => {
    if (candidate.startsWith('locations/')) {
      const url = new URL(`${BUSINESS_PROFILE_API_BASE}/${candidate}`);
      url.searchParams.set('readMask', 'name,locationName,title,storefrontAddress,websiteUri,phoneNumbers,categories,profile,metadata,regularHours');
      detailCandidates.add(url.toString());
    } else if (candidate.startsWith('accounts/')) {
      const url = new URL(`${BUSINESS_PROFILE_API_BASE}/${candidate}`);
      url.searchParams.set('readMask', 'name,locationName,title,storefrontAddress,websiteUri,phoneNumbers,categories,profile,metadata,regularHours');
      detailCandidates.add(url.toString());
    }

    const infoUrl = new URL(`${BUSINESS_INFORMATION_API_BASE}/${candidate}`);
    infoUrl.searchParams.set('readMask', 'name,languageCode,storeCode,title,phoneNumbers,regularHours,storefrontAddress,websiteUri,profile,categories,metadata');
    detailCandidates.add(infoUrl.toString());

    if (candidate.startsWith('accounts/')) {
      detailCandidates.add(`${GOOGLE_MY_BUSINESS_LEGACY_BASE}/${candidate}`);
    }
  });

  for (const url of detailCandidates) {
    try {
      return await fetchJson(url, accessToken);
    } catch (error) {
      console.error('Location detail fetch failed:', url, error);
    }
  }

  throw new Error('Unable to fetch location details from any supported endpoint');
}

async function fetchLocationReviews(
  accessToken: string,
  locationName: string,
  legacyLocationName?: string | null,
) {
  const candidateNames = new Set<string>();
  const canonicalFromLocation = canonicalizeLocationName(locationName);
  const canonicalFromLegacy = canonicalizeLocationName(legacyLocationName);

  if (locationName) candidateNames.add(locationName);
  if (legacyLocationName) candidateNames.add(legacyLocationName);
  if (canonicalFromLocation) candidateNames.add(canonicalFromLocation);
  if (canonicalFromLegacy) candidateNames.add(canonicalFromLegacy);

  const reviewCandidates = new Set<string>();

  candidateNames.forEach((candidate) => {
    reviewCandidates.add(`${BUSINESS_PROFILE_API_BASE}/${candidate}/reviews?pageSize=100`);
    if (candidate.startsWith('accounts/')) {
      reviewCandidates.add(`${GOOGLE_MY_BUSINESS_LEGACY_BASE}/${candidate}/reviews?pageSize=100`);
    }
  });

  for (const url of reviewCandidates) {
    try {
      return await fetchJson(url, accessToken);
    } catch (error) {
      console.error('Location reviews fetch failed:', url, error);
    }
  }

  return null;
}

async function fetchLocationInsights(
  accessToken: string,
  locationName: string,
  legacyLocationName?: string | null,
) {
  const metricsPayload = (targetName: string) => ({
    locationNames: [targetName],
    basicRequest: {
      metricRequests: [
        { metric: 'QUERIES_DIRECT' },
        { metric: 'QUERIES_INDIRECT' },
        { metric: 'VIEWS_MAPS' },
        { metric: 'VIEWS_SEARCH' },
        { metric: 'ACTIONS_WEBSITE' },
        { metric: 'ACTIONS_PHONE' },
        { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
      ],
      timeRange: {
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
      },
    },
  });

  const candidates: { url: string; bodyName: string }[] = [];
  const candidateNames = new Set<string>();
  const canonicalFromLocation = canonicalizeLocationName(locationName);
  const canonicalFromLegacy = canonicalizeLocationName(legacyLocationName);

  if (locationName) candidateNames.add(locationName);
  if (legacyLocationName) candidateNames.add(legacyLocationName);
  if (canonicalFromLocation) candidateNames.add(canonicalFromLocation);
  if (canonicalFromLegacy) candidateNames.add(canonicalFromLegacy);

  candidateNames.forEach((candidate) => {
    candidates.push({
      url: `${BUSINESS_PROFILE_API_BASE}/${candidate}:fetchInsights`,
      bodyName: candidate,
    });
    candidates.push({
      url: `${BUSINESS_INFORMATION_API_BASE}/${candidate}:fetchInsights`,
      bodyName: candidate,
    });
    if (candidate.startsWith('accounts/')) {
      candidates.push({
        url: `${GOOGLE_MY_BUSINESS_LEGACY_BASE}/${candidate}:fetchInsights`,
        bodyName: candidate,
      });
    }
  });

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate.url, {
        method: 'POST',
        headers: buildAuthHeaders(accessToken),
        body: JSON.stringify(metricsPayload(candidate.bodyName)),
      });

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text();
      console.error('Insights fetch failed:', candidate.url, response.status, errorText);
    } catch (error) {
      console.error('Insights request threw:', candidate.url, error);
    }
  }

  return null;
}

function mapBusinessInfo(locationData: any, fallbackName: string) {
  if (!locationData) {
    return null;
  }

  const categories = Array.isArray(locationData.categories)
    ? locationData.categories
    : locationData.primaryCategory
      ? [locationData.primaryCategory]
      : undefined;

  const storefrontAddress = locationData.storefrontAddress || locationData.address || null;
  const phoneNumbers = locationData.phoneNumbers || {};

  return {
    name: locationData.title || locationData.locationName || locationData.displayName || 'Business Location',
    address: storefrontAddress,
    phone: phoneNumbers.primaryPhone || locationData.primaryPhone || null,
    website: locationData.websiteUri || locationData.websiteUrl || null,
    categories,
    description: locationData.profile?.description || locationData.description || null,
    hours: locationData.regularHours || locationData.businessHours || null,
    placeId: locationData.metadata?.placeId || locationData.location?.placeId || null,
    locationName: fallbackName,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locationName = searchParams.get('location');
    const legacyLocationName = searchParams.get('legacyLocation');
    const listOnly = searchParams.get('list') === 'true';

    // Get session token from authorization header
    const authHeader = request.headers.get('authorization');
    const sessionHeader = request.headers.get('x-session-token');

    let sessionToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    } else if (sessionHeader) {
      sessionToken = sessionHeader.trim();
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Missing or invalid session token' },
        { status: 401 }
      );
    }

    // Validate session
    let sessionInfo;
    try {
      sessionInfo = await validateSession(sessionToken);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get the session data from database to retrieve Google tokens
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('optimizer_sessions')
      .select('*')
      .eq('id', sessionInfo.sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if Google tokens exist
    if (!session.google_access_token_cipher) {
      return NextResponse.json(
        { error: 'Google Business Profile not connected' },
        { status: 400 }
      );
    }

    // Decrypt the access token
    let accessToken: string;
    try {
      if (session.google_token_key_version) {
        // Token is encrypted
        accessToken = unpackAndDecryptToken(session.google_access_token_cipher);
      } else {
        // Token is not encrypted (dev mode)
        accessToken = session.google_access_token_cipher;
      }
    } catch (decryptError) {
      console.error('Failed to decrypt access token:', decryptError);
      return NextResponse.json(
        { error: 'Failed to access Google credentials' },
        { status: 500 }
      );
    }

    // Log the Google account being used
    console.log('🔐 Session scope:', session.session_scope);
    if (session.session_scope?.googleEmail) {
      console.log('📧 Using Google account:', session.session_scope.googleEmail);
    }

    // Check if token has expired
    if (session.google_token_expires_at && new Date(session.google_token_expires_at) < new Date()) {
      // TODO: Implement token refresh
      return NextResponse.json(
        { error: 'Google access token expired. Please reconnect.' },
        { status: 401 }
      );
    }

    // If listing locations only or debug mode
    const debugMode = searchParams.get('debug') === 'true';

    if (listOnly || debugMode) {
      try {
        const { locations, accounts, debug, locationGroupDiagnostics } = await fetchAvailableLocations(accessToken);

        // Enhanced debug output
        if (debugMode) {
          const debugInfo = {
            timestamp: new Date().toISOString(),
            googleEmail: session.session_scope?.googleEmail,
            accountsSummary: accounts.map((acc: any) => ({
              name: acc.name,
              type: acc.type,
              listingCount: acc.listingCount,
              accountName: acc.accountName,
              organizationInfo: acc.organizationInfo,
              state: acc.state,
              verified: acc.verified
            })),
            locationsFound: locations.length,
            locationsSample: locations.slice(0, 3).map((loc: any) => ({
              name: loc.name,
              title: loc.title,
              accountName: loc.accountName
            })),
            apiAttempts: debug,
            locationGroupDiagnostics,
            sessionId: sessionInfo.sessionId
          };

          console.log('🔍 Debug mode output:', JSON.stringify(debugInfo, null, 2));

          return NextResponse.json({
            success: true,
            debug: debugInfo,
            locations,
            accounts,
            locationGroupDiagnostics,
          });
        }

        return NextResponse.json({
          success: true,
          locations,
          accounts,
          debug,
          locationGroupDiagnostics,
        });
      } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
          { error: 'Failed to fetch locations' },
          { status: 500 }
        );
      }
    }

    // Fetch data for specific location or first location
  const businessData: any = {
    reviews: null,
    insights: null,
    businessInfo: null,
    accounts: null,
    availableLocations: [],
    needsLocationSelection: false,
    locationDebug: {},
    locationGroupDiagnostics: [],
  };

    try {
      if (locationName) {
        try {
          const locationDetails = await fetchLocationDetails(accessToken, locationName, legacyLocationName);
          businessData.businessInfo = mapBusinessInfo(locationDetails, locationName);

          const reviewsData = await fetchLocationReviews(accessToken, locationName, legacyLocationName);
          if (reviewsData) {
            businessData.reviews = {
              reviews: reviewsData.reviews || [],
              averageRating: reviewsData.averageRating || reviewsData.averageRatingValue || 0,
              totalReviewCount: reviewsData.totalReviewCount || reviewsData.totalReviewCountValue || (reviewsData.reviews?.length ?? 0),
            };
          }

          const insightsData = await fetchLocationInsights(accessToken, locationName, legacyLocationName);
          if (insightsData) {
            businessData.insights = insightsData;
          }
        } catch (specificLocationError) {
          console.error('Failed to fetch data for requested location, falling back to list:', locationName, specificLocationError);
          const { locations, accounts, debug, locationGroupDiagnostics } = await fetchAvailableLocations(accessToken);
          businessData.accounts = accounts;
          businessData.availableLocations = locations;
          businessData.locationDebug = debug;
          businessData.locationGroupDiagnostics = locationGroupDiagnostics;
          businessData.needsLocationSelection = true;
        }
      } else {
        const { locations, accounts, debug, locationGroupDiagnostics } = await fetchAvailableLocations(accessToken);

        businessData.accounts = accounts;
        businessData.locationDebug = debug;
        businessData.locationGroupDiagnostics = locationGroupDiagnostics;

        if (locations.length >= 1) {
          businessData.availableLocations = locations;
          businessData.needsLocationSelection = true;
          console.log(`✅ Locations discovered for selection: ${locations.length}`);
        } else {
          console.warn('⚠️ No Google Business locations returned for this account');
        }
      }
    } catch (apiError) {
      console.error('Google API error:', apiError);
      return NextResponse.json(
        { error: 'Failed to fetch Google Business data' },
        { status: 500 }
      );
    }

    // Update the lead with the latest business info if we have it
    if (sessionInfo.leadId && businessData.businessInfo?.name) {
      await supabaseAdmin
        .from('optimizer_leads')
        .update({
          business_name: businessData.businessInfo.name,
          place_id: businessData.businessInfo.placeId,
          location_address: businessData.businessInfo.address?.addressLines?.join(', ')
        })
        .eq('id', sessionInfo.leadId);
    }

    return NextResponse.json({
      success: true,
      data: businessData,
      sessionInfo: {
        email: sessionInfo.email,
        leadId: sessionInfo.leadId
      }
    });

  } catch (error) {
    console.error('Error fetching Google Business data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
