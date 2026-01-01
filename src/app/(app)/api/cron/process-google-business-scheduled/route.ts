import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { GoogleBusinessProfileClient } from '@/features/social-posting/platforms/google-business-profile/googleBusinessProfileClient';
import type { GoogleBusinessScheduledMediaDescriptor } from '@/features/social-posting';

const RATE_DELAY_MS = Number(process.env.GBP_SCHEDULED_RATE_DELAY_MS ?? 5000);
const MAX_JOBS_PER_RUN = Number(process.env.GBP_SCHEDULED_MAX_JOBS ?? 25);

interface ScheduledJobRecord {
  id: string;
  account_id: string;
  user_id: string;
  post_kind: 'post' | 'photo';
  post_type: string | null;
  content: {
    summary?: string;
    callToAction?: {
      actionType: string;
      url: string;
    } | null;
    metadata?: Record<string, any> | null;
  } | null;
  caption: string | null;
  scheduled_date: string;
  timezone: string;
  selected_locations: Array<{ id: string; name?: string }> | null;
  media_paths: GoogleBusinessScheduledMediaDescriptor[] | null;
  status: string;
  error_log: any;
  additional_platforms?: {
    bluesky?: {
      enabled: boolean;
      connectionId: string;
    };
    linkedin?: {
      enabled: boolean;
      connectionId: string;
    };
  } | null;
}

interface LocationAccountRecord {
  location_id: string;
  account_name: string | null;
}

async function sleep(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanAccountId(value: string | null | undefined): string | null {
  if (!value) return null;
  let result = value.trim();
  while (result.startsWith('accounts/')) {
    result = result.replace('accounts/', '');
  }
  return result || null;
}

function extractLocationId(rawId: string): { locationId: string; accountIdHint: string | null } {
  if (!rawId) {
    return { locationId: rawId, accountIdHint: null };
  }

  if (rawId.includes('/locations/')) {
    const parts = rawId.split('/');
    const locationPart = parts[parts.length - 1];
    const accountHintIndex = parts.findIndex((segment) => segment === 'accounts');
    const accountIdHint = accountHintIndex >= 0 && accountHintIndex + 1 < parts.length ? parts[accountHintIndex + 1] : null;
    return {
      locationId: locationPart,
      accountIdHint: accountIdHint ?? null,
    };
  }

  const stripped = rawId.replace('locations/', '');
  return { locationId: stripped, accountIdHint: null };
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function processPhotoUploads(options: {
  client: GoogleBusinessProfileClient;
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>;
  media: GoogleBusinessScheduledMediaDescriptor[];
  accountId: string;
  locationId: string;
  caption: string | null;
}): Promise<{ success: boolean; googleIds: string[]; error?: string }> {
  const { client, supabaseAdmin, media, accountId, locationId, caption } = options;
  const googleIds: string[] = [];

  for (const item of media) {
    const download = await supabaseAdmin.storage.from(item.bucket).download(item.path);
    if (download.error || !download.data) {
      return {
        success: false,
        googleIds,
        error: download.error?.message || 'Unable to download media from storage',
      };
    }

    const arrayBuffer = await download.data.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: item.mime });
    const filename = item.originalName || item.path.split('/').pop() || `photo-${Date.now()}.jpg`;

    const upload = await client.uploadMedia(accountId, locationId, blob, {
      filename,
      mediaFormat: 'PHOTO',
      description: caption ?? undefined,
    });

    if (!upload.success || !upload.mediaItem) {
      return { success: false, googleIds, error: upload.error || 'unknown upload error' };
    }

    if (upload.mediaItem?.name) {
      googleIds.push(upload.mediaItem.name);
    }

    await sleep(RATE_DELAY_MS);
  }

  return { success: true, googleIds };
}

async function processPost(options: {
  client: GoogleBusinessProfileClient;
  accountId: string;
  locationId: string;
  content: ScheduledJobRecord['content'];
  postType: string | null;
  media: GoogleBusinessScheduledMediaDescriptor[];
}): Promise<{ success: boolean; googleId?: string; error?: string }> {
  const { client, accountId, locationId, content, media, postType } = options;

  const summary = content?.summary?.trim();
  if (!summary) {
    return { success: false, error: 'Missing post summary' };
  }

  const mediaItems = ensureArray(media).slice(0, 10).map((item) => ({
    mediaFormat: 'PHOTO' as const,
    sourceUrl: item.publicUrl,
  }));

  const payload: import('@/features/social-posting/platforms/google-business-profile/googleBusinessProfile').CreateLocalPostRequest = {
    languageCode: 'en-US',
    summary,
    topicType: postType === 'EVENT' ? 'EVENT' : 'STANDARD',
    callToAction: content?.callToAction
      ? {
          actionType: content.callToAction.actionType as any,
          url: content.callToAction.url,
        }
      : undefined,
    media: mediaItems.length > 0 ? mediaItems : undefined,
  };

  try {
    const created = await client.createLocalPost(accountId, locationId, payload);
    return {
      success: true,
      googleId: created?.name || null || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create post',
    };
  }
}

/**
 * Post to Bluesky using the BlueskyAdapter
 * Only supports 'post' kind, not 'photo' uploads
 */
async function processBlueskyPost(options: {
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>;
  connectionId: string;
  content: ScheduledJobRecord['content'];
  caption: string | null;
  media: GoogleBusinessScheduledMediaDescriptor[];
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { supabaseAdmin, connectionId, content, caption, media } = options;

  try {
    // Fetch Bluesky connection credentials
    const { data: connection, error: connError } = await supabaseAdmin
      .from('social_platform_connections')
      .select('credentials, status')
      .eq('id', connectionId)
      .eq('platform', 'bluesky')
      .maybeSingle();

    if (connError || !connection) {
      return { success: false, error: 'Bluesky connection not found' };
    }

    if (connection.status !== 'active') {
      return { success: false, error: `Bluesky connection status is ${connection.status}` };
    }

    const credentials = connection.credentials as {
      identifier: string;
      appPassword: string;
      did?: string;
    };

    if (!credentials.identifier || !credentials.appPassword) {
      return { success: false, error: 'Missing Bluesky credentials' };
    }

    // Import and initialize Bluesky adapter
    const { BlueskyAdapter } = await import('@/features/social-posting/platforms/bluesky');
    const adapter = new BlueskyAdapter(credentials);

    // Authenticate
    const authSuccess = await adapter.authenticate();
    if (!authSuccess) {
      return { success: false, error: 'Failed to authenticate with Bluesky' };
    }

    // Prepare post content
    const postText = content?.summary?.trim() || caption?.trim() || '';
    if (!postText) {
      return { success: false, error: 'No content to post to Bluesky' };
    }

    // Prepare media URLs (Bluesky needs publicly accessible URLs)
    const mediaUrls = ensureArray(media)
      .slice(0, 4) // Bluesky supports max 4 images
      .map((item) => item.publicUrl)
      .filter(Boolean);

    // Create the post
    const result = await adapter.createPost({
      content: postText,
      platforms: ['bluesky'],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      status: 'published',
      callToAction: content?.callToAction || undefined,
    });

    if (result.success) {
      return {
        success: true,
        postId: result.platformPostId,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown Bluesky posting error',
      };
    }
  } catch (error) {
    console.error('[Cron] Bluesky posting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected Bluesky error',
    };
  }
}

/**
 * Post to LinkedIn using the LinkedInAdapter
 * Only supports 'post' kind, not 'photo' uploads
 */
async function processLinkedInPost(options: {
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>;
  connectionId: string;
  content: ScheduledJobRecord['content'];
  caption: string | null;
  media: GoogleBusinessScheduledMediaDescriptor[];
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  const { supabaseAdmin, connectionId, content, caption, media } = options;

  try {
    // Fetch LinkedIn connection credentials
    const { data: connection, error: connError } = await supabaseAdmin
      .from('social_platform_connections')
      .select('credentials, status')
      .eq('id', connectionId)
      .eq('platform', 'linkedin')
      .maybeSingle();

    if (connError || !connection) {
      return { success: false, error: 'LinkedIn connection not found' };
    }

    if (connection.status !== 'active') {
      return { success: false, error: `LinkedIn connection status is ${connection.status}` };
    }

    const credentials = connection.credentials as {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: string;
      linkedinId: string;
    };

    if (!credentials.accessToken || !credentials.linkedinId) {
      return { success: false, error: 'Missing LinkedIn credentials' };
    }

    // Check if token needs refresh
    if (credentials.expiresAt && new Date(credentials.expiresAt) < new Date()) {
      // Token expired, try to refresh
      if (credentials.refreshToken) {
        try {
          const { LinkedInAdapter } = await import('@/features/social-posting/platforms/linkedin');
          const refreshedTokens = await LinkedInAdapter.refreshAccessToken(credentials.refreshToken);

          // Update stored credentials
          const newExpiresAt = new Date(Date.now() + refreshedTokens.expiresIn * 1000).toISOString();
          await supabaseAdmin
            .from('social_platform_connections')
            .update({
              credentials: {
                ...credentials,
                accessToken: refreshedTokens.accessToken,
                refreshToken: refreshedTokens.refreshToken || credentials.refreshToken,
                expiresAt: newExpiresAt,
              },
              last_validated_at: new Date().toISOString(),
            })
            .eq('id', connectionId);

          credentials.accessToken = refreshedTokens.accessToken;
        } catch (refreshError) {
          console.error('[Cron] LinkedIn token refresh failed:', refreshError);
          // Mark connection as needing reauth
          await supabaseAdmin
            .from('social_platform_connections')
            .update({
              status: 'error',
              error_message: 'Token expired and refresh failed. Please reconnect.',
            })
            .eq('id', connectionId);
          return { success: false, error: 'LinkedIn token expired and refresh failed' };
        }
      } else {
        return { success: false, error: 'LinkedIn token expired and no refresh token available' };
      }
    }

    // Import and initialize LinkedIn adapter
    const { LinkedInAdapter } = await import('@/features/social-posting/platforms/linkedin');
    const adapter = new LinkedInAdapter({
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken || '',
      expiresAt: credentials.expiresAt || new Date(Date.now() + 3600000).toISOString(),
      linkedinId: credentials.linkedinId,
    });

    // Prepare post content
    const postText = content?.summary?.trim() || caption?.trim() || '';
    if (!postText) {
      return { success: false, error: 'No content to post to LinkedIn' };
    }

    // Prepare media URLs (LinkedIn needs publicly accessible URLs)
    const mediaUrls = ensureArray(media)
      .slice(0, 9) // LinkedIn supports up to 9 images
      .map((item) => item.publicUrl)
      .filter(Boolean);

    // Create the post
    const result = await adapter.createPost({
      content: postText,
      platforms: ['linkedin'],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      status: 'published',
      callToAction: content?.callToAction || undefined,
    });

    if (result.success) {
      return {
        success: true,
        postId: result.platformPostId,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown LinkedIn posting error',
      };
    }
  } catch (error) {
    console.error('[Cron] LinkedIn posting error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected LinkedIn error',
    };
  }
}

async function processJob(
  job: ScheduledJobRecord,
  supabaseAdmin: ReturnType<typeof createServiceRoleClient>
) {
  const nowIso = new Date().toISOString();

  const updateStatus = await supabaseAdmin
    .from('google_business_scheduled_posts')
    .update({ status: 'processing', updated_at: nowIso })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (updateStatus.error || !updateStatus.data) {
    return {
      id: job.id,
      skipped: true,
      reason: updateStatus.error ? updateStatus.error.message : 'Status already updated',
    };
  }

  // Check if we have GBP locations to process
  const hasGbpLocations = ensureArray(job.selected_locations).length > 0;

  // Only fetch GBP tokens if we have GBP locations
  let tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: string | null;
    selected_account_id: string | null;
    selected_account_name: string | null;
  } | null = null;
  let client: GoogleBusinessProfileClient | null = null;

  if (hasGbpLocations) {
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('google_business_profiles')
      .select('access_token, refresh_token, expires_at, selected_account_id, selected_account_name')
      .eq('account_id', job.account_id)
      .maybeSingle();

    if (tokenError || !tokenData) {
      await supabaseAdmin
        .from('google_business_scheduled_posts')
        .update({
          status: 'failed',
          error_log: {
            message: 'Missing Google Business authentication tokens',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return {
        id: job.id,
        skipped: false,
        successCount: 0,
        failureCount: job.selected_locations?.length ?? 0,
        error: 'Missing Google Business tokens',
      };
    }

    tokens = tokenData;
    client = new GoogleBusinessProfileClient({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at ? new Date(tokens.expires_at).getTime() : Date.now() + 3600000,
    });
  }

  const { data: resultRows, error: resultsError } = await supabaseAdmin
    .from('google_business_scheduled_post_results')
    .select('id, location_id, status')
    .eq('scheduled_post_id', job.id);

  if (resultsError) {
    console.error('[Cron] Failed to load results', resultsError);
    return {
      id: job.id,
      skipped: false,
      successCount: 0,
      failureCount: 0,
      error: 'Unable to load scheduled results',
    };
  }

  const resultMap = new Map<string, { id: string; status: string }>();
  ensureArray(resultRows).forEach((row) => {
    if (row?.location_id) {
      resultMap.set(row.location_id, { id: row.id, status: row.status });
    }
  });

  const locationIds = ensureArray(job.selected_locations).map((loc) => loc.id).filter(Boolean);

  const { data: locationRecords } = await supabaseAdmin
    .from('google_business_locations')
    .select('location_id, account_name')
    .eq('account_id', job.account_id)
    .in('location_id', locationIds);

  const accountMap = new Map<string, string>();
  ensureArray(locationRecords).forEach((record: LocationAccountRecord) => {
    if (!record) return;
    const cleanAccount = cleanAccountId(record.account_name) ?? extractLocationId(record.location_id).accountIdHint ?? undefined;
    if (!cleanAccount) return;
    const rawLocation = record.location_id;
    accountMap.set(rawLocation, cleanAccount);

    const { locationId } = extractLocationId(rawLocation);
    accountMap.set(locationId, cleanAccount);
  });

  let fallbackAccount: string | null = null;
  if (tokens && client) {
    fallbackAccount = cleanAccountId(tokens.selected_account_id) || cleanAccountId(tokens.selected_account_name);

    if (!fallbackAccount) {
      try {
        const accounts = await client.listAccounts();
        if (accounts.length > 0) {
          fallbackAccount = cleanAccountId(accounts[0].name);
        }
      } catch (error) {
        console.warn('[Cron] Unable to fetch accounts for fallback', error);
      }
    }
  }

  const locations = ensureArray(job.selected_locations);
  const hasBluesky = job.additional_platforms?.bluesky?.enabled && job.additional_platforms.bluesky.connectionId;
  const hasLinkedIn = job.additional_platforms?.linkedin?.enabled && job.additional_platforms.linkedin.connectionId;

  // If no GBP locations AND no Bluesky AND no LinkedIn, fail
  if (locations.length === 0 && !hasBluesky && !hasLinkedIn) {
    await supabaseAdmin
      .from('google_business_scheduled_posts')
      .update({
        status: 'failed',
        error_log: {
          message: 'No platforms selected for scheduled job',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return {
      id: job.id,
      skipped: false,
      successCount: 0,
      failureCount: 0,
      error: 'No platforms to process',
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const locationErrors: Array<{ locationId: string; error: string }> = [];
  const googleResourceIds: Array<{ locationId: string; resourceId: string }> = [];

  // Process GBP locations (only if we have a client)
  for (const location of locations) {
    if (!client) {
      // This shouldn't happen since locations.length > 0 means hasGbpLocations was true
      failureCount += 1;
      locationErrors.push({ locationId: location.id, error: 'GBP client not initialized' });
      continue;
    }

    const rawLocationId = location.id;
    const { locationId, accountIdHint } = extractLocationId(rawLocationId);
    const accountId = cleanAccountId(accountMap.get(rawLocationId) || accountMap.get(locationId) || accountIdHint || fallbackAccount);

    const result = resultMap.get(rawLocationId) || resultMap.get(locationId);
    const resultId = result?.id;

    if (!accountId) {
      failureCount += 1;
      locationErrors.push({ locationId: rawLocationId, error: 'Missing Google Business account ID' });

      if (resultId) {
        await supabaseAdmin
          .from('google_business_scheduled_post_results')
          .update({
            status: 'failed',
            error_message: 'Unable to determine Google Business account ID for location',
            updated_at: new Date().toISOString(),
          })
          .eq('id', resultId);
      }
      continue;
    }

    if (resultId) {
      await supabaseAdmin
        .from('google_business_scheduled_post_results')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', resultId);
    }

    let locationOutcome: { success: boolean; googleIds?: string[]; googleId?: string; error?: string };

    if (job.post_kind === 'photo') {
      const media = ensureArray(job.media_paths);
      locationOutcome = await processPhotoUploads({
        client,
        supabaseAdmin,
        media,
        accountId,
        locationId,
        caption: job.caption,
      });
    } else {
      const media = ensureArray(job.media_paths);
      locationOutcome = await processPost({
        client,
        accountId,
        locationId,
        content: job.content,
        postType: job.post_type,
        media,
      });
    }

    if (locationOutcome.success) {
      successCount += 1;
      const publishedAt = new Date().toISOString();
      const resourceIds = locationOutcome.googleIds ?? (locationOutcome.googleId ? [locationOutcome.googleId] : []);
      if (resourceIds.length > 0) {
        googleResourceIds.push({ locationId: rawLocationId, resourceId: resourceIds.join(',') });
      }

      if (resultId) {
        await supabaseAdmin
          .from('google_business_scheduled_post_results')
          .update({
            status: 'success',
            published_at: publishedAt,
            google_resource_id: resourceIds[resourceIds.length - 1] ?? null,
            error_message: null,
            updated_at: publishedAt,
          })
          .eq('id', resultId);
      }
    } else {
      failureCount += 1;
      const errorMessage = locationOutcome.error || 'Unknown publish failure';
      locationErrors.push({ locationId: rawLocationId, error: errorMessage });
      if (resultId) {
        await supabaseAdmin
          .from('google_business_scheduled_post_results')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resultId);
      }
    }

    await sleep(RATE_DELAY_MS);
  }

  // Process Bluesky posting if enabled (only for 'post' kind)
  let blueskySuccess = false;
  let blueskyError: string | null = null;
  let blueskyPostId: string | null = null;

  // Post to Bluesky if enabled - either alongside GBP or standalone
  const shouldPostToBluesky =
    job.post_kind === 'post' && // Only support posts, not photo uploads
    job.additional_platforms?.bluesky?.enabled &&
    job.additional_platforms.bluesky.connectionId &&
    (locations.length === 0 || successCount > 0); // Either Bluesky-only OR at least one GBP succeeded

  if (shouldPostToBluesky && job.additional_platforms?.bluesky?.connectionId) {
    console.log(`[Cron] Attempting Bluesky cross-post for job ${job.id}`);
    const blueskyConnectionId = job.additional_platforms.bluesky.connectionId;

    try {
      const blueskyResult = await processBlueskyPost({
        supabaseAdmin,
        connectionId: blueskyConnectionId,
        content: job.content,
        caption: job.caption,
        media: ensureArray(job.media_paths),
      });

      blueskySuccess = blueskyResult.success;
      blueskyPostId = blueskyResult.postId || null;
      blueskyError = blueskyResult.error || null;

      if (blueskySuccess) {
        console.log(`[Cron] Bluesky post successful for job ${job.id}: ${blueskyPostId}`);
      } else {
        console.warn(`[Cron] Bluesky post failed for job ${job.id}: ${blueskyError}`);
      }

      // Store Bluesky result in the results table with platform='bluesky'
      // Use the first location as a placeholder, or 'bluesky-only' for standalone Bluesky posts
      const firstLocation = locations[0];
      await supabaseAdmin
        .from('google_business_scheduled_post_results')
        .insert({
          scheduled_post_id: job.id,
          location_id: firstLocation?.id || 'bluesky-standalone',
          location_name: firstLocation?.name || 'Bluesky',
          platform: 'bluesky',
          status: blueskySuccess ? 'success' : 'failed',
          published_at: blueskySuccess ? new Date().toISOString() : null,
          google_resource_id: blueskyPostId,
          error_message: blueskyError,
        });
    } catch (error) {
      console.error(`[Cron] Unexpected error posting to Bluesky for job ${job.id}:`, error);
      blueskyError = error instanceof Error ? error.message : 'Unexpected Bluesky error';
    }
  }

  // Process LinkedIn posting if enabled (only for 'post' kind)
  let linkedinSuccess = false;
  let linkedinError: string | null = null;
  let linkedinPostId: string | null = null;

  // Post to LinkedIn if enabled - either alongside GBP or standalone
  const shouldPostToLinkedIn =
    job.post_kind === 'post' && // Only support posts, not photo uploads
    job.additional_platforms?.linkedin?.enabled &&
    job.additional_platforms.linkedin.connectionId &&
    (locations.length === 0 || successCount > 0 || blueskySuccess); // Either social-only OR at least one platform succeeded

  if (shouldPostToLinkedIn && job.additional_platforms?.linkedin?.connectionId) {
    console.log(`[Cron] Attempting LinkedIn cross-post for job ${job.id}`);
    const linkedinConnectionId = job.additional_platforms.linkedin.connectionId;

    try {
      const linkedinResult = await processLinkedInPost({
        supabaseAdmin,
        connectionId: linkedinConnectionId,
        content: job.content,
        caption: job.caption,
        media: ensureArray(job.media_paths),
      });

      linkedinSuccess = linkedinResult.success;
      linkedinPostId = linkedinResult.postId || null;
      linkedinError = linkedinResult.error || null;

      if (linkedinSuccess) {
        console.log(`[Cron] LinkedIn post successful for job ${job.id}: ${linkedinPostId}`);
      } else {
        console.warn(`[Cron] LinkedIn post failed for job ${job.id}: ${linkedinError}`);
      }

      // Store LinkedIn result in the results table with platform='linkedin'
      const firstLocation = locations[0];
      await supabaseAdmin
        .from('google_business_scheduled_post_results')
        .insert({
          scheduled_post_id: job.id,
          location_id: firstLocation?.id || 'linkedin-standalone',
          location_name: firstLocation?.name || 'LinkedIn',
          platform: 'linkedin',
          status: linkedinSuccess ? 'success' : 'failed',
          published_at: linkedinSuccess ? new Date().toISOString() : null,
          google_resource_id: linkedinPostId,
          error_message: linkedinError,
        });
    } catch (error) {
      console.error(`[Cron] Unexpected error posting to LinkedIn for job ${job.id}:`, error);
      linkedinError = error instanceof Error ? error.message : 'Unexpected LinkedIn error';
    }
  }

  // Calculate overall status considering GBP, Bluesky, and LinkedIn
  let overallStatus: 'completed' | 'partial_success' | 'failed';

  if (locations.length === 0) {
    // Social-only post (Bluesky and/or LinkedIn)
    const socialSuccess = blueskySuccess || linkedinSuccess;
    overallStatus = socialSuccess ? 'completed' : 'failed';
  } else if (successCount === locations.length) {
    // All GBP locations succeeded
    overallStatus = 'completed';
  } else if (successCount > 0 || blueskySuccess || linkedinSuccess) {
    // Some GBP succeeded or social platforms succeeded
    overallStatus = 'partial_success';
  } else {
    // Everything failed
    overallStatus = 'failed';
  }

  // Build error log
  const errorLog: Record<string, any> = {};
  if (locationErrors.length > 0) errorLog.locations = locationErrors;
  if (blueskyError) errorLog.bluesky = blueskyError;
  if (linkedinError) errorLog.linkedin = linkedinError;

  await supabaseAdmin
    .from('google_business_scheduled_posts')
    .update({
      status: overallStatus,
      published_at: successCount > 0 || blueskySuccess || linkedinSuccess ? new Date().toISOString() : null,
      error_log: Object.keys(errorLog).length > 0 ? errorLog : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  return {
    id: job.id,
    skipped: false,
    successCount,
    failureCount,
    status: overallStatus,
    errors: locationErrors,
    googleResourceIds,
    bluesky: blueskySuccess ? { success: true, postId: blueskyPostId } : (blueskyError ? { success: false, error: blueskyError } : undefined),
    linkedin: linkedinSuccess ? { success: true, postId: linkedinPostId } : (linkedinError ? { success: false, error: linkedinError } : undefined),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Vercel cron jobs use CRON_SECRET in authorization header automatically
    const expectedToken = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET;

    // In production, Vercel adds the Authorization header for cron jobs
    // In development or manual testing, we check for the Bearer token
    const authHeader = request.headers.get('authorization');

    // Check if the auth header matches either CRON_SECRET or CRON_SECRET_TOKEN
    // Vercel might send either one depending on configuration
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized - no auth header' }, { status: 401 });
    }

    const validAuth =
      (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
      (process.env.CRON_SECRET_TOKEN && authHeader === `Bearer ${process.env.CRON_SECRET_TOKEN}`);

    if (!validAuth) {
      // Log for debugging (remove in production)
      console.log('[Cron] Auth failed');
      console.log('[Cron] Received header:', authHeader.substring(0, 20) + '...');
      console.log('[Cron] CRON_SECRET set:', !!process.env.CRON_SECRET);
      console.log('[Cron] CRON_SECRET_TOKEN set:', !!process.env.CRON_SECRET_TOKEN);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: jobs, error } = await supabaseAdmin
      .from('google_business_scheduled_posts')
      .select(
        `
          id,
          account_id,
          user_id,
          post_kind,
          post_type,
          content,
          caption,
          scheduled_date,
          timezone,
          selected_locations,
          media_paths,
          additional_platforms,
          status,
          error_log
        `
      )
      .eq('status', 'pending')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(MAX_JOBS_PER_RUN);

    if (error) {
      console.error('[Cron] Failed to load scheduled jobs', error);
      return NextResponse.json({ success: false, error: 'Failed to load scheduled jobs' }, { status: 500 });
    }

    const summaries = [] as Array<Awaited<ReturnType<typeof processJob>>>;

    for (const job of jobs ?? []) {
      try {
        const summary = await processJob(job as ScheduledJobRecord, supabaseAdmin);
        summaries.push(summary);
      } catch (jobError) {
        console.error(`[Cron] Failed to process job ${job?.id}`, jobError);
        await supabaseAdmin
          .from('google_business_scheduled_posts')
          .update({
            status: 'failed',
            error_log: {
              message: jobError instanceof Error ? jobError.message : 'Unexpected error running cron job',
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', job?.id ?? '');

        summaries.push({
          id: job?.id ?? '',
          skipped: false,
          successCount: 0,
          failureCount: job?.selected_locations?.length ?? 0,
          error: jobError instanceof Error ? jobError.message : 'Unexpected error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: summaries.length,
      summaries,
    });
  } catch (error) {
    console.error('[Cron] Unexpected error', error);
    return NextResponse.json({ success: false, error: 'Unexpected error while processing scheduled posts' }, { status: 500 });
  }
}
