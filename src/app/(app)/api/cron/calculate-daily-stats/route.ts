/**
 * Cron Job: Calculate Daily Platform Stats
 *
 * Runs daily to calculate and store platform-wide metrics.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('calculate-daily-stats', async () => {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const today = new Date().toISOString().split('T')[0];

    // Calculate account metrics
    const { count: accountsTotal } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true });

    const { count: accountsCreatedToday } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    const { count: accountsActive } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: accountsTrial } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'trial');

    const { count: accountsPaid } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .in('plan', ['grower', 'builder', 'maven']);

    // Calculate review metrics (excluding imported)
    const { count: reviewsTotal } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .or("imported_from_google.is.null,imported_from_google.eq.false");

    const { count: reviewsCapturedToday } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)
      .or("imported_from_google.is.null,imported_from_google.eq.false");

    const { data: platformReviews } = await supabaseAdmin
      .from('review_submissions')
      .select('platform')
      .or("imported_from_google.is.null,imported_from_google.eq.false");

    const reviewsByPlatform: Record<string, number> = {};
    platformReviews?.forEach(r => {
      if (r.platform) {
        reviewsByPlatform[r.platform] = (reviewsByPlatform[r.platform] || 0) + 1;
      }
    });

    // Calculate feature usage
    const { count: widgetsTotal } = await supabaseAdmin
      .from('widgets')
      .select('id', { count: 'exact', head: true });

    const { count: widgetsCreatedToday } = await supabaseAdmin
      .from('widgets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    const { count: promptPagesTotal } = await supabaseAdmin
      .from('prompt_pages')
      .select('id', { count: 'exact', head: true });

    const { count: promptPagesCreatedToday } = await supabaseAdmin
      .from('prompt_pages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    // GBP metrics
    let gbpLocationsConnected = 0;
    let gbpPostsTotal = 0;
    let gbpPostsPublishedToday = 0;

    try {
      const { count: gbpLocs } = await supabaseAdmin
        .from('google_business_locations')
        .select('location_id', { count: 'exact', head: true })
        .not('location_id', 'is', null);
      gbpLocationsConnected = gbpLocs || 0;

      const { count: gbpTotal } = await supabaseAdmin
        .from('google_business_scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');
      gbpPostsTotal = gbpTotal || 0;

      const { count: gbpToday } = await supabaseAdmin
        .from('google_business_scheduled_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', `${today}T00:00:00Z`)
        .lt('published_at', `${today}T23:59:59Z`);
      gbpPostsPublishedToday = gbpToday || 0;
    } catch {
      console.log('GBP tables not found, skipping GBP metrics');
    }

    const { error: upsertError } = await supabaseAdmin
      .from('daily_stats')
      .upsert({
        date: today,
        accounts_created_today: accountsCreatedToday || 0,
        accounts_total: accountsTotal || 0,
        accounts_active: accountsActive || 0,
        accounts_trial: accountsTrial || 0,
        accounts_paid: accountsPaid || 0,
        reviews_captured_today: reviewsCapturedToday || 0,
        reviews_total: reviewsTotal || 0,
        reviews_by_platform: reviewsByPlatform,
        widgets_created_today: widgetsCreatedToday || 0,
        widgets_total: widgetsTotal || 0,
        prompt_pages_created_today: promptPagesCreatedToday || 0,
        prompt_pages_total: promptPagesTotal || 0,
        gbp_locations_connected: gbpLocationsConnected,
        gbp_posts_total: gbpPostsTotal,
        gbp_posts_published_today: gbpPostsPublishedToday,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error upserting daily stats:', upsertError);
      return { success: false, error: 'Failed to save daily stats' };
    }

    return {
      success: true,
      summary: {
        date: today,
        accounts_total: accountsTotal || 0,
        accounts_created_today: accountsCreatedToday || 0,
        reviews_total: reviewsTotal || 0,
        reviews_captured_today: reviewsCapturedToday || 0
      }
    };
  });
}
