/**
 * Cron Job: Calculate Daily Platform Stats
 *
 * Runs daily to calculate and store:
 * - Account metrics (created, deleted, active, trial, paid)
 * - Review metrics (captured, deleted, active)
 * - Engagement metrics (active users)
 * - Feature usage (widgets, prompt pages, AI)
 * - Google Business Profile metrics
 * - Revenue metrics (MRR, paying accounts)
 *
 * This endpoint is called by Vercel's cron service daily.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase admin client
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

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    console.log(`Calculating daily stats for ${today}`);

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

    // Calculate review metrics
    const { count: reviewsTotal } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true });

    const { count: reviewsCapturedToday } = await supabaseAdmin
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    // Get reviews by platform
    const { data: platformReviews } = await supabaseAdmin
      .from('review_submissions')
      .select('platform');

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

    // Calculate Google Business Profile metrics
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
    } catch (error) {
      console.log('GBP tables not found, skipping GBP metrics');
    }

    // Insert or update daily stats
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
      return NextResponse.json({ error: 'Failed to save daily stats' }, { status: 500 });
    }

    console.log('✅ Daily stats calculated successfully');

    return NextResponse.json({
      success: true,
      date: today,
      stats: {
        accounts_total: accountsTotal || 0,
        accounts_created_today: accountsCreatedToday || 0,
        reviews_total: reviewsTotal || 0,
        reviews_captured_today: reviewsCapturedToday || 0,
        gbp_locations_connected: gbpLocationsConnected
      }
    });

  } catch (error) {
    console.error('Error in calculate-daily-stats cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
