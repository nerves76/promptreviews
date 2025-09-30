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

  const payload = {
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

  const { data: tokens, error: tokenError } = await supabaseAdmin
    .from('google_business_profiles')
    .select('access_token, refresh_token, expires_at, selected_account_id, selected_account_name')
    .eq('user_id', job.user_id)
    .maybeSingle();

  if (tokenError || !tokens) {
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

  const client = new GoogleBusinessProfileClient({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_at ? new Date(tokens.expires_at).getTime() : Date.now() + 3600000,
  });

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
    .eq('user_id', job.user_id)
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

  let fallbackAccount = cleanAccountId(tokens.selected_account_id) || cleanAccountId(tokens.selected_account_name);

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

  const locations = ensureArray(job.selected_locations);
  if (locations.length === 0) {
    await supabaseAdmin
      .from('google_business_scheduled_posts')
      .update({
        status: 'failed',
        error_log: {
          message: 'No locations selected for scheduled job',
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return {
      id: job.id,
      skipped: false,
      successCount: 0,
      failureCount: 0,
      error: 'No locations to process',
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const locationErrors: Array<{ locationId: string; error: string }> = [];
  const googleResourceIds: Array<{ locationId: string; resourceId: string }> = [];

  for (const location of locations) {
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

  const overallStatus = successCount === locations.length
    ? 'completed'
    : successCount > 0
      ? 'partial_success'
      : 'failed';

  await supabaseAdmin
    .from('google_business_scheduled_posts')
    .update({
      status: overallStatus,
      published_at: successCount > 0 ? new Date().toISOString() : null,
      error_log: locationErrors.length > 0 ? { locations: locationErrors } : null,
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
          id: job?.id,
          skipped: false,
          successCount: 0,
          failureCount: job?.selected_locations?.length ?? 0,
          status: 'failed',
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
