/**
 * Debug endpoint to check the GBP trigger status
 * GET /api/rss-feeds/debug-trigger
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to query system tables
    const serviceSupabase = createServiceRoleClient();

    // Check the trigger function source
    const { data: functionData, error: funcError } = await serviceSupabase
      .rpc('get_trigger_function_source', { func_name: 'trigger_gbp_post_published' });

    // Check enum values
    const { data: enumData, error: enumError } = await serviceSupabase
      .rpc('get_enum_values', { enum_name: 'google_business_scheduled_post_status' });

    return NextResponse.json({
      success: true,
      trigger: {
        source: functionData,
        error: funcError?.message,
      },
      enum: {
        values: enumData,
        error: enumError?.message,
      },
    });
  } catch (error) {
    console.error('[Debug Trigger] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
