/**
 * Survey Response Packs API - List available packs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: packs, error } = await supabase
      .from('survey_response_packs')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[SURVEYS] Response packs error:', error);
      return NextResponse.json({ error: 'Failed to fetch packs' }, { status: 500 });
    }

    return NextResponse.json({ packs: packs || [] });
  } catch (error) {
    console.error('[SURVEYS] Response packs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
