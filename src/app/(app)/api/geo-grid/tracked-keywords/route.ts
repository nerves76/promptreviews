import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformTrackedKeywordToResponse } from '@/features/geo-grid/utils/transforms';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/tracked-keywords
 * List all tracked keywords for the account's geo grid config.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get config for this account
    const { data: config } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (!config) {
      return NextResponse.json({
        trackedKeywords: [],
        message: 'No geo grid configuration found. Set up your config first.',
      });
    }

    // Get tracked keywords with keyword details
    const { data: trackedKeywords, error: keywordsError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select(`
        id,
        config_id,
        keyword_id,
        account_id,
        is_enabled,
        created_at,
        keywords (
          id,
          phrase,
          normalized_phrase,
          review_usage_count,
          status
        )
      `)
      .eq('config_id', config.id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (keywordsError) {
      console.error('❌ [GeoGrid] Failed to fetch tracked keywords:', keywordsError);
      return NextResponse.json(
        { error: 'Failed to fetch tracked keywords' },
        { status: 500 }
      );
    }

    const transformed = (trackedKeywords || []).map((row) =>
      transformTrackedKeywordToResponse(row as any)
    );

    return NextResponse.json({ trackedKeywords: transformed });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo-grid/tracked-keywords
 * Add keywords to track.
 *
 * Body:
 * - keywordIds: string[] (required) - IDs of keywords to track
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array is required' },
        { status: 400 }
      );
    }

    // Get config for this account
    const { data: config } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: 'No geo grid configuration found. Set up your config first.' },
        { status: 400 }
      );
    }

    // Verify keywords belong to this account
    const { data: validKeywords, error: verifyError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('account_id', accountId)
      .in('id', keywordIds);

    if (verifyError) {
      console.error('❌ [GeoGrid] Failed to verify keywords:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify keywords' },
        { status: 500 }
      );
    }

    const validKeywordIds = new Set((validKeywords || []).map((k) => k.id));
    const invalidIds = keywordIds.filter((id: string) => !validKeywordIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid keyword IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert tracked keywords (upsert to handle duplicates)
    const toInsert = keywordIds.map((keywordId: string) => ({
      config_id: config.id,
      keyword_id: keywordId,
      account_id: accountId,
      is_enabled: true,
    }));

    const { data: inserted, error: insertError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .upsert(toInsert, {
        onConflict: 'config_id,keyword_id',
        ignoreDuplicates: false,
      })
      .select(`
        id,
        config_id,
        keyword_id,
        account_id,
        is_enabled,
        created_at,
        keywords (
          id,
          phrase,
          normalized_phrase
        )
      `);

    if (insertError) {
      console.error('❌ [GeoGrid] Failed to add tracked keywords:', insertError);
      return NextResponse.json(
        { error: 'Failed to add tracked keywords' },
        { status: 500 }
      );
    }

    const transformed = (inserted || []).map((row) =>
      transformTrackedKeywordToResponse(row as any)
    );

    return NextResponse.json({
      trackedKeywords: transformed,
      added: transformed.length,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/geo-grid/tracked-keywords
 * Remove keywords from tracking.
 *
 * Query params:
 * - id: string (required) - ID of the tracked keyword entry to remove
 *
 * OR Body:
 * - keywordIds: string[] (required) - IDs of keywords to stop tracking
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check for query param (single tracked keyword ID)
    const url = new URL(request.url);
    const trackedKeywordId = url.searchParams.get('id');

    // Get config for this account
    const { data: config } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: 'No geo grid configuration found.' },
        { status: 400 }
      );
    }

    // Handle single tracked keyword ID from query param
    if (trackedKeywordId) {
      const { error: deleteError } = await serviceSupabase
        .from('gg_tracked_keywords')
        .delete()
        .eq('id', trackedKeywordId)
        .eq('config_id', config.id)
        .eq('account_id', accountId);

      if (deleteError) {
        console.error('❌ [GeoGrid] Failed to remove tracked keyword:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove tracked keyword' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        removed: 1,
        success: true,
      });
    }

    // Handle array of keyword IDs from body
    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array or id query param is required' },
        { status: 400 }
      );
    }

    // Delete tracked keywords
    const { error: deleteError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .delete()
      .eq('config_id', config.id)
      .eq('account_id', accountId)
      .in('keyword_id', keywordIds);

    if (deleteError) {
      console.error('❌ [GeoGrid] Failed to remove tracked keywords:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove tracked keywords' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      removed: keywordIds.length,
      success: true,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
