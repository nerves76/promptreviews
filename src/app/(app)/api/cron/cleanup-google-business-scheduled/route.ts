import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import type { GoogleBusinessScheduledMediaDescriptor } from '@/features/social-posting';

const RETENTION_DAYS = Number(process.env.GBP_SCHEDULED_RETENTION_DAYS ?? 7);
const MAX_POSTS_PER_RUN = Number(process.env.GBP_SCHEDULED_CLEANUP_LIMIT ?? 50);

function millis(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  try {
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    if (!expectedToken) {
      return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const cutoffIso = new Date(Date.now() - millis(RETENTION_DAYS)).toISOString();

    const { data: posts, error } = await supabaseAdmin
      .from('google_business_scheduled_posts')
      .select('id, media_paths, status')
      .in('status', ['completed', 'cancelled', 'failed'])
      .lte('updated_at', cutoffIso)
      .order('updated_at', { ascending: true })
      .limit(MAX_POSTS_PER_RUN);

    if (error) {
      console.error('[Cleanup] Failed to load posts for cleanup', error);
      return NextResponse.json({ success: false, error: 'Failed to load posts for cleanup' }, { status: 500 });
    }

    let filesDeleted = 0;

    for (const post of posts ?? []) {
      const mediaItems = (post.media_paths as GoogleBusinessScheduledMediaDescriptor[] | null) ?? [];
      for (const media of mediaItems) {
        const { error: deleteError } = await supabaseAdmin.storage
          .from(media.bucket)
          .remove([media.path]);

        if (deleteError) {
          console.warn('[Cleanup] Failed to delete media', media.path, deleteError.message);
          continue;
        }
        filesDeleted += 1;
      }

      if (mediaItems.length > 0) {
        await supabaseAdmin
          .from('google_business_scheduled_posts')
          .update({ media_paths: [], updated_at: new Date().toISOString() })
          .eq('id', post.id);
      }
    }

    return NextResponse.json({
      success: true,
      postsProcessed: posts?.length ?? 0,
      filesDeleted,
    });
  } catch (error) {
    console.error('[Cleanup] Unexpected error', error);
    return NextResponse.json({ success: false, error: 'Unexpected cleanup error' }, { status: 500 });
  }
}
