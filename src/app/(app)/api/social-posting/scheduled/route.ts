import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '../utils/getRequestAccountId';
import type {
  GoogleBusinessScheduledMediaDescriptor,
  GoogleBusinessScheduledPost,
  GoogleBusinessScheduledPostResult,
  GoogleBusinessScheduledPostKind,
} from '@/features/social-posting';

interface ScheduleRequestBody {
  postKind?: GoogleBusinessScheduledPostKind;
  postType?: 'WHATS_NEW' | null;
  content?: {
    summary?: string;
    callToAction?: {
      actionType: string;
      url: string;
    } | null;
    metadata?: Record<string, any> | null;
  } | null;
  caption?: string | null;
  scheduledDate?: string;
  timezone?: string;
  locations?: Array<{ id: string; name?: string }>;
  media?: GoogleBusinessScheduledMediaDescriptor[];
  errorLog?: Record<string, any> | null;
}

function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeLocations(input: unknown): Array<{ id: string; name?: string }> {
  const list = ensureArray(input as any);
  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return { id: item, name: undefined };
      }
      if (typeof item === 'object' && 'id' in item) {
        const name = typeof (item as any).name === 'string' ? (item as any).name : undefined;
        const id = String((item as any).id).trim();
        if (!id) return null;
        return { id, name };
      }
      return null;
    })
    .filter((loc): loc is { id: string; name?: string } => !!loc?.id);
}

function normalizeMedia(input: unknown): GoogleBusinessScheduledMediaDescriptor[] {
  const list = ensureArray(input as any);
  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const bucket = typeof (item as any).bucket === 'string' ? (item as any).bucket : undefined;
      const path = typeof (item as any).path === 'string' ? (item as any).path : undefined;
      const publicUrl = typeof (item as any).publicUrl === 'string' ? (item as any).publicUrl : undefined;
      const size = Number((item as any).size ?? 0);
      const mime = typeof (item as any).mime === 'string' ? (item as any).mime : undefined;
      if (!bucket || !path || !publicUrl || !mime) {
        return null;
      }
      return {
        bucket,
        path,
        publicUrl,
        mime,
        size: Number.isFinite(size) ? size : 0,
        checksum: typeof (item as any).checksum === 'string' ? (item as any).checksum : undefined,
        originalName: typeof (item as any).originalName === 'string' ? (item as any).originalName : undefined,
      } satisfies GoogleBusinessScheduledMediaDescriptor;
    })
    .filter((media): media is GoogleBusinessScheduledMediaDescriptor => !!media);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayUtc(): string {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequestBody = await request.json();

    const postKind: GoogleBusinessScheduledPostKind = body.postKind ?? 'post';
    const scheduledDate = body.scheduledDate?.trim();
    const timezone = body.timezone?.trim();
    const locations = normalizeLocations(body.locations);
    const media = normalizeMedia(body.media);

    if (!scheduledDate || !isDateString(scheduledDate)) {
      return NextResponse.json(
        { success: false, error: 'scheduledDate must be provided in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    if (!timezone) {
      return NextResponse.json(
        { success: false, error: 'timezone is required' },
        { status: 400 }
      );
    }

    if (locations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one location must be selected for scheduling' },
        { status: 400 }
      );
    }

    if (scheduledDate < todayUtc()) {
      return NextResponse.json(
        { success: false, error: 'scheduledDate must not be in the past' },
        { status: 400 }
      );
    }

    if (postKind === 'post' && !body.content?.summary) {
      return NextResponse.json(
        { success: false, error: 'Post content summary is required for scheduled posts' },
        { status: 400 }
      );
    }

    if (postKind === 'photo' && media.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one media item is required for photo uploads' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Unable to resolve account for scheduling. Please refresh and try again.' },
        { status: 400 }
      );
    }

    const postType = postKind === 'post' ? body.postType ?? 'WHATS_NEW' : null;

    const insertPayload = {
      account_id: accountId,
      user_id: user.id,
      post_kind: postKind,
      post_type: postType,
      content: body.content ? {
        summary: body.content.summary,
        callToAction: body.content.callToAction ?? null,
        metadata: body.content.metadata ?? null,
      } : null,
      caption: body.caption ?? null,
      scheduled_date: scheduledDate,
      timezone,
      selected_locations: locations,
      media_paths: media,
      status: 'pending' as const,
      error_log: body.errorLog ?? null,
    };

    const { data: scheduled, error: insertError } = await supabase
      .from('google_business_scheduled_posts')
      .insert(insertPayload)
      .select('id, created_at, updated_at')
      .single();

    if (insertError || !scheduled) {
      console.error('[Schedule] Failed to insert scheduled post:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to schedule Google Business content.' },
        { status: 500 }
      );
    }

    const resultRows = locations.map((location) => ({
      scheduled_post_id: scheduled.id,
      location_id: location.id,
      location_name: location.name ?? null,
    }));

    if (resultRows.length > 0) {
      const { error: resultError } = await supabase
        .from('google_business_scheduled_post_results')
        .insert(resultRows);

      if (resultError) {
        console.error('[Schedule] Failed to create result rows:', resultError);
        return NextResponse.json(
          { success: false, error: 'Scheduled, but failed to initialize per-location tracking.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: scheduled.id,
        createdAt: scheduled.created_at,
        updatedAt: scheduled.updated_at,
      },
    });
  } catch (error) {
    console.error('[Schedule] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while scheduling content.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Unable to resolve account for scheduled content.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
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
        published_at,
        error_log,
        created_at,
        updated_at,
        google_business_scheduled_post_results (
          id,
          scheduled_post_id,
          location_id,
          location_name,
          status,
          published_at,
          error_message,
          google_resource_id,
          created_at,
          updated_at
        )
      `
      )
      .eq('account_id', accountId)
      .order('scheduled_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Schedule] Failed to fetch scheduled posts:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load scheduled content.' },
        { status: 500 }
      );
    }

    const today = todayUtc();

    const upcoming: GoogleBusinessScheduledPost[] = [];
    const past: GoogleBusinessScheduledPost[] = [];

    (data ?? []).forEach((row: any) => {
      const mapped: GoogleBusinessScheduledPost = {
        id: row.id,
        accountId: row.account_id,
        userId: row.user_id,
        postKind: row.post_kind,
        postType: row.post_type,
        content: row.content,
        caption: row.caption,
        scheduledDate: row.scheduled_date,
        timezone: row.timezone,
        selectedLocations: row.selected_locations ?? [],
        mediaPaths: row.media_paths ?? [],
        status: row.status,
        publishedAt: row.published_at,
        errorLog: row.error_log,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      if (row.google_business_scheduled_post_results) {
        (mapped as any).results = (row.google_business_scheduled_post_results as any[]).map(
          (resultRow): GoogleBusinessScheduledPostResult => ({
            id: resultRow.id,
            scheduledPostId: resultRow.scheduled_post_id,
            locationId: resultRow.location_id,
            locationName: resultRow.location_name,
            status: resultRow.status,
            publishedAt: resultRow.published_at,
            errorMessage: resultRow.error_message,
            googleResourceId: resultRow.google_resource_id,
            createdAt: resultRow.created_at,
            updatedAt: resultRow.updated_at,
          })
        );
      }

      const isUpcoming = mapped.status === 'pending' || mapped.status === 'processing';
      if (isUpcoming && mapped.scheduledDate >= today) {
        upcoming.push(mapped);
      } else {
        past.push(mapped);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        upcoming,
        past,
      },
    });
  } catch (error) {
    console.error('[Schedule] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while loading scheduled content.' },
      { status: 500 }
    );
  }
}
