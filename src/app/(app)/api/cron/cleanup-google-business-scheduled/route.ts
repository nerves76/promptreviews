import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import type { GoogleBusinessScheduledMediaDescriptor } from '@/features/social-posting';

const RETENTION_DAYS = Number(process.env.GBP_SCHEDULED_RETENTION_DAYS ?? 7);
const MAX_POSTS_PER_RUN = Number(process.env.GBP_SCHEDULED_CLEANUP_LIMIT ?? 50);

function millis(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('cleanup-google-business-scheduled', async () => {
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
      return {
        success: false,
        error: 'Failed to load posts for cleanup',
      };
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

    return {
      success: true,
      summary: {
        postsProcessed: posts?.length ?? 0,
        filesDeleted,
      },
    };
  });
}
