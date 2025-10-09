import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import type {
  GoogleBusinessScheduledMediaDescriptor,
  GoogleBusinessScheduledPost,
  GoogleBusinessScheduledPostResult,
} from '@/features/social-posting';

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

async function fetchScheduledPost(supabase: any, id: string) {
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
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function mapRecordToScheduledPost(row: any): GoogleBusinessScheduledPost & {
  results?: GoogleBusinessScheduledPostResult[];
} {
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

  return mapped as GoogleBusinessScheduledPost & { results?: GoogleBusinessScheduledPostResult[] };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ success: false, error: 'Account context unavailable' }, { status: 400 });
    }

    const record = await fetchScheduledPost(supabase, params.id);
    if (!record || record.account_id !== accountId) {
      return NextResponse.json({ success: false, error: 'Scheduled item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mapRecordToScheduledPost(record) });
  } catch (error) {
    console.error('[Schedule] detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load scheduled item.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
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
      return NextResponse.json({ success: false, error: 'Account context unavailable' }, { status: 400 });
    }

    const record = await fetchScheduledPost(supabase, params.id);
    if (!record || record.account_id !== accountId) {
      return NextResponse.json({ success: false, error: 'Scheduled item not found' }, { status: 404 });
    }

    if (record.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending schedules can be edited.' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (typeof body.caption === 'string' || body.caption === null) {
      updates.caption = body.caption;
    }

    if (body.content) {
      updates.content = {
        summary: body.content.summary ?? record.content?.summary ?? null,
        callToAction: body.content.callToAction ?? record.content?.callToAction ?? null,
        metadata: body.content.metadata ?? record.content?.metadata ?? null,
      };
    }

    if (typeof body.postType === 'string' || body.postType === null) {
      updates.post_type = body.postType;
    }

    if (typeof body.timezone === 'string' && body.timezone.trim()) {
      updates.timezone = body.timezone.trim();
    }

    if (typeof body.scheduledDate === 'string') {
      if (!isDateString(body.scheduledDate)) {
        return NextResponse.json(
          { success: false, error: 'scheduledDate must use YYYY-MM-DD format.' },
          { status: 400 }
        );
      }
      updates.scheduled_date = body.scheduledDate;
    }

    const nextLocations = body.locations ? normalizeLocations(body.locations) : null;
    if (nextLocations && nextLocations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one location must remain selected.' },
        { status: 400 }
      );
    }

    const nextMedia = body.media ? normalizeMedia(body.media) : null;
    if (nextMedia && nextMedia.length === 0 && record.post_kind === 'photo') {
      return NextResponse.json(
        { success: false, error: 'Photo schedules require media.' },
        { status: 400 }
      );
    }

    if (nextLocations) {
      updates.selected_locations = nextLocations;
    }

    if (nextMedia) {
      updates.media_paths = nextMedia;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, data: mapRecordToScheduledPost(record) });
    }

    const { data: updated, error: updateError } = await supabase
      .from('google_business_scheduled_posts')
      .update(updates)
      .eq('id', params.id)
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
        updated_at
        `
      )
      .single();

    if (updateError || !updated) {
      console.error('[Schedule] update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update scheduled item.' },
        { status: 500 }
      );
    }

    if (nextLocations) {
      const existingLocations: string[] = (record.selected_locations ?? []).map((loc: any) => loc?.id).filter(Boolean);
      const nextIds = nextLocations.map((loc) => loc.id);

      const toRemove = existingLocations.filter((id) => !nextIds.includes(id));
      const toAdd = nextLocations.filter((loc) => !existingLocations.includes(loc.id));

      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('google_business_scheduled_post_results')
          .delete()
          .eq('scheduled_post_id', params.id)
          .in('location_id', toRemove);

        if (deleteError) {
          console.error('[Schedule] result delete error:', deleteError);
        }
      }

      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('google_business_scheduled_post_results')
          .insert(
            toAdd.map((loc) => ({
              scheduled_post_id: params.id,
              location_id: loc.id,
              location_name: loc.name ?? null,
              status: 'pending',
            }))
          );

        if (insertError) {
          console.error('[Schedule] result insert error:', insertError);
        }
      }
    }

    const refreshed = await fetchScheduledPost(supabase, params.id);
    if (!refreshed) {
      return NextResponse.json({ success: false, error: 'Failed to load updated schedule.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: mapRecordToScheduledPost(refreshed) });
  } catch (error) {
    console.error('[Schedule] update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scheduled item.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ success: false, error: 'Account context unavailable' }, { status: 400 });
    }

    const record = await fetchScheduledPost(supabase, params.id);
    if (!record || record.account_id !== accountId) {
      return NextResponse.json({ success: false, error: 'Scheduled item not found' }, { status: 404 });
    }

    if (record.status === 'completed' || record.status === 'processing') {
      return NextResponse.json(
        { success: false, error: 'Completed or processing jobs cannot be cancelled.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('google_business_scheduled_posts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (updateError) {
      console.error('[Schedule] cancel error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to cancel scheduled item.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Schedule] cancel error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel scheduled item.' },
      { status: 500 }
    );
  }
}
